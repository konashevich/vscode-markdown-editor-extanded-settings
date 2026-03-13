import * as vscode from 'vscode'
import * as NodePath from 'path'

const KeyVditorOptions = 'vditor.options'
const MarkdownEditorViewType = 'markdown-editor.editor'

function debug(...args: any[]) {
  console.log(...args)
}

function showError(msg: string) {
  vscode.window.showErrorMessage(`[markdown-editor] ${msg}`)
}

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand(
      'markdown-editor.openEditor',
      async (uri?: vscode.Uri, ...args) => {
        debug('command', uri, args)
        const target = uri || vscode.window.activeTextEditor?.document.uri
        if (!target) {
          showError(`Cannot find markdown file!`)
          return
        }
        await vscode.commands.executeCommand(
          'vscode.openWith',
          target,
          MarkdownEditorViewType
        )
      }
    ),
    vscode.commands.registerCommand(
      'markdown-editor.openTextEditor',
      async (uri?: vscode.Uri, ...args) => {
        debug('command', uri, args)
        const target = uri || vscode.window.activeTextEditor?.document.uri
        if (!target) {
          showError(`Cannot find markdown file!`)
          return
        }
        await vscode.commands.executeCommand('vscode.openWith', target, 'default')
      }
    ),
    vscode.window.registerCustomEditorProvider(
      MarkdownEditorViewType,
      new MarkdownEditorProvider(context),
      {
        webviewOptions: {
          retainContextWhenHidden: true,
          enableFindWidget: true,
        },
      }
    )
  )

  context.globalState.setKeysForSync([KeyVditorOptions])
}

class MarkdownEditorProvider implements vscode.CustomTextEditorProvider {
  private static getFolders(): vscode.Uri[] {
    const data = []
    for (let i = 65; i <= 90; i++) {
      data.push(vscode.Uri.file(`${String.fromCharCode(i)}:/`))
    }
    return data
  }

  static getWebviewOptions(
    uri?: vscode.Uri
  ): vscode.WebviewOptions & vscode.WebviewPanelOptions {
    return {
      // Enable javascript in the webview
      enableScripts: true,

      localResourceRoots: [vscode.Uri.file("/"), ...this.getFolders()],
      retainContextWhenHidden: true,
      enableCommandUris: true,
    }
  }

  static get config() {
    return vscode.workspace.getConfiguration('markdown-editor')
  }

  constructor(private readonly _context: vscode.ExtensionContext) {}

  public resolveCustomTextEditor(
    document: vscode.TextDocument,
    webviewPanel: vscode.WebviewPanel
  ) {
    const disposables: vscode.Disposable[] = []
    const fsPath = document.uri.fsPath
    let textEditTimer: NodeJS.Timeout | undefined
    let updatingFromWebview = false

    webviewPanel.title = NodePath.basename(fsPath)
    webviewPanel.webview.options = MarkdownEditorProvider.getWebviewOptions(
      document.uri
    )
    webviewPanel.webview.html = this._getHtmlForWebview(
      webviewPanel.webview,
      document.uri
    )

    const syncToEditor = async (content: string) => {
      updatingFromWebview = true
      try {
        const edit = new vscode.WorkspaceEdit()
        edit.replace(document.uri, this._documentRange(document), content)
        await vscode.workspace.applyEdit(edit)
      } finally {
        updatingFromWebview = false
      }
    }

    const postUpdate = async (
      props: {
        type?: 'init' | 'update'
        options?: any
        theme?: 'dark' | 'light'
      } = { options: void 0 }
    ) => {
      webviewPanel.webview.postMessage({
        command: 'update',
        content: document.getText(),
        ...props,
      })
    }

    disposables.push(
      vscode.workspace.onDidChangeTextDocument((event) => {
        if (event.document.uri.toString() !== document.uri.toString()) {
          return
        }
        if (updatingFromWebview) {
          return
        }
        if (textEditTimer) {
          clearTimeout(textEditTimer)
        }
        textEditTimer = setTimeout(() => {
          postUpdate()
        }, 150)
      }),
      webviewPanel.webview.onDidReceiveMessage(async (message) => {
        debug('msg from webview review', message, webviewPanel.active)

        switch (message.command) {
          case 'ready':
            await postUpdate({
              type: 'init',
              options: {
                useVscodeThemeColor: MarkdownEditorProvider.config.get<boolean>(
                  'useVscodeThemeColor'
                ),
                enableFullWidth: MarkdownEditorProvider.config.get<boolean>(
                  'enableFullWidth'
                ),
                ...this._context.globalState.get(KeyVditorOptions),
              },
              theme:
                vscode.window.activeColorTheme.kind ===
                vscode.ColorThemeKind.Dark
                  ? 'dark'
                  : 'light',
            })
            break
          case 'save-options':
            await this._context.globalState.update(KeyVditorOptions, message.options)
            break
          case 'info':
            vscode.window.showInformationMessage(message.content)
            break
          case 'error':
            showError(message.content)
            break
          case 'edit':
            await syncToEditor(message.content)
            break
          case 'reset-config':
            await this._context.globalState.update(KeyVditorOptions, {})
            break
          case 'save':
            await syncToEditor(message.content)
            await document.save()
            break
          case 'edit-in-vscode':
            await vscode.commands.executeCommand(
              'markdown-editor.openTextEditor',
              document.uri
            )
            break
          case 'upload': {
            const assetsFolder = MarkdownEditorProvider.getAssetsFolder(document.uri)
            try {
              await vscode.workspace.fs.createDirectory(vscode.Uri.file(assetsFolder))
            } catch (error) {
              console.error(error)
              showError(`Invalid image folder: ${assetsFolder}`)
            }
            await Promise.all(
              message.files.map(async (file: any) => {
                const content = Buffer.from(file.base64, 'base64')
                return vscode.workspace.fs.writeFile(
                  vscode.Uri.file(NodePath.join(assetsFolder, file.name)),
                  content
                )
              })
            )
            webviewPanel.webview.postMessage({
              command: 'uploaded',
              files: message.files.map((file: any) =>
                NodePath.relative(
                  NodePath.dirname(fsPath),
                  NodePath.join(assetsFolder, file.name)
                ).replace(/\\/g, '/')
              ),
            })
            break
          }
          case 'open-link': {
            let url = message.href
            if (!/^https?:/i.test(url)) {
              url = NodePath.resolve(NodePath.dirname(fsPath), url)
            }
            await vscode.commands.executeCommand('vscode.open', vscode.Uri.parse(url))
            break
          }
        }
      }),
      webviewPanel.onDidDispose(() => {
        if (textEditTimer) {
          clearTimeout(textEditTimer)
        }
        while (disposables.length) {
          disposables.pop()?.dispose()
        }
      })
    )
  }

  static getAssetsFolder(uri: vscode.Uri) {
    const imageSaveFolder = (
      MarkdownEditorProvider.config.get<string>('imageSaveFolder') || 'assets'
    )
      .replace(
        '${projectRoot}',
        vscode.workspace.getWorkspaceFolder(uri)?.uri.fsPath || ''
      )
      .replace('${file}', uri.fsPath)
      .replace(
        '${fileBasenameNoExtension}',
        NodePath.basename(uri.fsPath, NodePath.extname(uri.fsPath))
      )
      .replace('${dir}', NodePath.dirname(uri.fsPath))
    const assetsFolder = NodePath.resolve(
      NodePath.dirname(uri.fsPath),
      imageSaveFolder
    )
    return assetsFolder
  }

  private _documentRange(document: vscode.TextDocument) {
    const lastLine = document.lineAt(Math.max(document.lineCount - 1, 0))
    return new vscode.Range(0, 0, lastLine.range.end.line, lastLine.range.end.character)
  }

  private _getHtmlForWebview(webview: vscode.Webview, uri: vscode.Uri) {
    const toUri = (f: string) =>
      webview.asWebviewUri(vscode.Uri.joinPath(this._context.extensionUri, f))
    const baseHref =
      NodePath.dirname(
        webview.asWebviewUri(vscode.Uri.file(uri.fsPath)).toString()
      ) + '/'
    const toMediaPath = (f: string) => `media/dist/${f}`
    const JsFiles = ['main.js'].map(toMediaPath).map(toUri)
    const CssFiles = ['main.css'].map(toMediaPath).map(toUri)

    return (
      `<!DOCTYPE html>
			<html lang="en">
			<head>
				<meta charset="UTF-8">

				<meta name="viewport" content="width=device-width, initial-scale=1.0">
				<base href="${baseHref}" />


				${CssFiles.map((f) => `<link href="${f}" rel="stylesheet">`).join('\n')}

				<title>markdown editor</title>
        <style>` +
      MarkdownEditorProvider.config.get<string>('customCss') +
      `</style>
			</head>
			<body>
				<div id="app"></div>


				${JsFiles.map((f) => `<script src="${f}"></script>`).join('\n')}
			</body>
			</html>`
    )
  }
}
