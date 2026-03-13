import { t } from "./lang"
import { confirm } from "./utils"

function getEditorRange(): Range | undefined {
	const mode = vditor.getCurrentMode()
	const editor = vditor.vditor?.[mode]?.element as HTMLElement | undefined
	const selection = window.getSelection()

	if (selection && selection.rangeCount > 0) {
		const range = selection.getRangeAt(0)
		if (editor?.contains(range.commonAncestorContainer) || editor?.isEqualNode(range.commonAncestorContainer as Node)) {
			return range.cloneRange()
		}
	}

	const storedRange = vditor.vditor?.[mode]?.range as Range | undefined
	return storedRange?.cloneRange()
}

function getCharBeforeRange(range: Range): string {
	const mode = vditor.getCurrentMode()
	const editor = vditor.vditor?.[mode]?.element as HTMLElement | undefined
	if (!editor) return ''

	const beforeRange = range.cloneRange()
	beforeRange.selectNodeContents(editor)
	beforeRange.setEnd(range.startContainer, range.startOffset)
	return beforeRange.toString().slice(-1)
}

function restoreEditorRange(range: Range | undefined) {
	if (!range) return
	const selection = window.getSelection()
	selection?.removeAllRanges()
	selection?.addRange(range)
	const mode = vditor.getCurrentMode()
	vditor.vditor[mode].range = range.cloneRange()
}

function insertMarkdownLink() {
	const range = getEditorRange()
	const selectedText = (range?.toString() || '').trim()
	const beforeChar = range ? getCharBeforeRange(range) : ''
	const needsLeadingSpace = Boolean(beforeChar) && !/\s/.test(beforeChar)
	const leadingSpace = needsLeadingSpace ? ' ' : ''

	vditor.focus()
	restoreEditorRange(range)

	if (selectedText) {
		vditor.updateValue(`${leadingSpace}[${selectedText}]()`)
		return
	}

	vditor.insertValue(`${leadingSpace}[]()`)
}

const editInVsCodeIcon =
	'<svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" width="32" height="32"><path d="m388.7 968.2-228.2-112c-29.3-19.9-25.2-44.7-25.2-44.7V140.4c0-29.6 30.4-39.8 30.4-39.8l197.9-95.2c43.2-26.6 71.5 4.9 71.5 4.9L824.8 364 388.7 968.2z" fill="#2489ca"/><path d="m697.1 976.2c17 17.4 37.6 11.7 37.6 11.7l228.1-112.4c29.2-19.9 25.1-44.6 25.1-44.6V159.7c0-29.5-30.2-39.7-30.2-39.7L760 24.7c-43.2-26.7-71.5 4.8-71.5 4.8s36.4-26.2 54.2 23.4v887.5c0 6.1-1.3 12.1-3.9 17.5-5.2 10.5-16.5 20.3-43.6 16.2z" fill="#1070b3"/><path d="M363.6 730.5 229 627.9l-94.5 61.5 182.3 89.6 46.8-48.5zm24.8-24 298.4-284.4-298.4-284.4L560.2 31.8l329.2 159.9v461L560.2 812.4 388.4 706.5z" fill="#0877b9"/></svg>'

export const toolbar = [
	{
	  hotkey: '⌘s',
	  name: 'save',
	  tipPosition: 's',
	  tip: t('save'),
	  className: 'save',
	  icon:
		'<svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" width="32" height="32"><path d="M810.667 938.667H213.333a128 128 0 01-128-128V213.333a128 128 0 01128-128h469.334a42.667 42.667 0 0130.293 12.374L926.293 311.04a42.667 42.667 0 0112.374 30.293v469.334a128 128 0 01-128 128zm-597.334-768a42.667 42.667 0 00-42.666 42.666v597.334a42.667 42.667 0 0042.666 42.666h597.334a42.667 42.667 0 0042.666-42.666v-451.84l-188.16-188.16z"/><path d="M725.333 938.667A42.667 42.667 0 01682.667 896V597.333H341.333V896A42.667 42.667 0 01256 896V554.667A42.667 42.667 0 01298.667 512h426.666A42.667 42.667 0 01768 554.667V896a42.667 42.667 0 01-42.667 42.667zM640 384H298.667A42.667 42.667 0 01256 341.333V128a42.667 42.667 0 0185.333 0v170.667H640A42.667 42.667 0 01640 384z"/></svg>',
	  click() {
		vscode.postMessage({
		  command: 'save',
		  content: vditor.getValue(),
		})
	  },
	},

	'emoji',
	'headings',
	'bold',
	'italic',
	'strike',
	{
	  hotkey: '⌘K',
	  icon: '<svg><use xlink:href="#vditor-icon-link"></use></svg>',
	  name: 'link',
	  click() {
		insertMarkdownLink()
	  },
	  tipPosition: 'n',
	},
	'|',
	'list',
	'ordered-list',
	'check',
	'outdent',
	'indent',
	'|',
	'quote',
	'line',
	'code',
	'inline-code',
	'insert-before',
	'insert-after',
	'|',
	'upload',
	'table',
	'|',
	'undo',
	'redo',
	'|',
	{
	  name: 'edit-in-vscode',
	  tipPosition: 's',
	  tip: t('editInVsCode'),
	  className: 'right',
	  icon: editInVsCodeIcon,
	  click() {
		vscode.postMessage({
		  command: 'edit-in-vscode',
		})
	  },
	},
	{name:'edit-mode', tipPosition: 'e',},
	{
	  name: 'more',
	  tipPosition: 'e',
	  toolbar: [
		'both',
		'code-theme',
		'content-theme',
		'outline',
		'preview',
		{
		  name: 'copy-markdown',
		  icon: t('copyMarkdown'),
		  async click() {
			try {
			  await navigator.clipboard.writeText(vditor.getValue())
			  vscode.postMessage({
				command: 'info',
				content: 'Copy Markdown successfully!',
			  })
			} catch (error) {
			  vscode.postMessage({
				command: 'error',
				content: `Copy Markdown failed! ${error.message}`,
			  })
			}
		  },
		},
		{
		  name: 'copy-html',
		  icon: t('copyHtml'),
		  async click() {
			try {
			  await navigator.clipboard.writeText(vditor.getHTML())
			  vscode.postMessage({
				command: 'info',
				content: 'Copy HTML successfully!',
			  })
			} catch (error) {
			  vscode.postMessage({
				command: 'error',
				content: `Copy HTML failed! ${error.message}`,
			  })
			}
		  },
		},
		{
		  name: 'reset-config',
		  icon: t('resetConfig'),
		  async click() {
			confirm(t('resetConfirm'), async () => {
			  try {
				await vscode.postMessage({
				  command: 'reset-config',
				})
				await vscode.postMessage({
				  command: 'ready',
				})
				vscode.postMessage({
				  command: 'info',
				  content: 'Reset config successfully!',
				})
			  } catch (error) {
				vscode.postMessage({
				  command: 'error',
				  content: 'Reset config failed!',
				})
			  }
			})
		  },
		},
		'devtools',
		'info',
		'help',
	  ],
	},
  ].map((it: any) => {
	if (typeof it === 'string') {
	  it = { name: it }
	}
	it.tipPosition = it.tipPosition || 's'
	return it
  })
