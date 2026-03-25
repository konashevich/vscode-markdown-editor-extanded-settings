# Report: Custom Markdown Editor in Source Control View

This report documents the issue encountered with the Markdown Editor extension in VS Code's Source Control view, the desired user experience (UX), and the technical approaches attempted to resolve it.

## 1. The Problem
When a user opens a Markdown file ([.md](file:///home/pi/.gemini/antigravity/brain/3c8f33bf-c36c-420c-bf43-ef3e2021bbaa/task.md)) from the VS Code **Source Control** pane (e.g., to review changes or view a diff):
- VS Code attempts to use the extension's **Custom Editor** because it is registered as the default editor for [.md](file:///home/pi/.gemini/antigravity/brain/3c8f33bf-c36c-420c-bf43-ef3e2021bbaa/task.md) files.
- The Custom Editor (based on Vditor) renders its full UI within the diff panes.
- This creates a "double window" or "tree" view mess where the user sees the WYSIWYG editor instead of a standard text-based diff.
- Scrolling is typically not synchronized between the two diff panes, and standard diff markers (`+`/`-`) are either missing or incorrectly rendered by the custom webview.

## 2. Desired UX
The user wants a seamless experience where:
- **Normal Files**: Files opened from the Explorer or via standard "Open File" commands should continue to use the **Custom Markdown Editor**.
- **Source Control / Diffs**: Files opened as part of a diff (e.g., clicking a modified file in the Source Control side-bar) should automatically fall back to the **Standard VS Code Text Diff Editor**.
- **Working Tree View**: The current version of the file in a diff (the "Working Tree" side) should also be rendered as text to maintain consistency with the base version.

## 3. Approaches Attempted

### Approach 1: Manual URI Scheme Detection & Fallback
**Method**: In [src/extension.ts](file:///mnt/merged_ssd/IDE%20Extensions/vscode-markdown-editor-extanded-settings/src/extension.ts), a check was added to [resolveCustomTextEditor](file:///mnt/merged_ssd/IDE%20Extensions/vscode-markdown-editor-extanded-settings/src/extension.ts#92-325) to detect non-local schemes (like `git:`).
```typescript
if (document.uri.scheme !== 'file' && document.uri.scheme !== 'untitled') {
    vscode.commands.executeCommand('vscode.openWith', document.uri, 'default');
    webviewPanel.dispose();
    return;
}
```
**Outcome**: **FAILURE**. While it prevented the custom editor from loading, `vscode.openWith(..., 'default')` disrupted the Diff Editor's internal logic. It often caused the file to open in a new standalone tab instead of participating in the side-by-side diff, and in some cases, broke the Source Control view entirely.

### Approach 2: Manifest-Level Scheme Filtering
**Method**: Modified [package.json](file:///mnt/merged_ssd/IDE%20Extensions/vscode-markdown-editor-extanded-settings/package.json) to explicitly list allowed schemes in the `customEditors` selector.
```json
"selector": [
    { "filenamePattern": "*.md", "scheme": "file" },
    { "filenamePattern": "*.md", "scheme": "untitled" }
]
```
**Outcome**: **FAILURE**. According to the user, the extension still hijacked the `git:` URIs in the diff view. This suggests that VS Code might ignore the `scheme` property in the `selector` for certain workbench contexts, or that the schemes being used by the SCM provider were not correctly targeted.

## 4. Technical Analysis
The core difficulty lies in the current VS Code Custom Editor API (v1.47+). There is no stable way for a `CustomTextEditorProvider` to:
1.  **Veto** its own selection as the default editor once the [resolve](file:///mnt/merged_ssd/IDE%20Extensions/vscode-markdown-editor-extanded-settings/src/extension.ts#92-325) method has been triggered.
2.  **Gracefully fallback** to the built-in text editor *within* an existing Diff Editor pane.

The "automatic" fallback only happens if the extension is not registered for the specific file/scheme combination. However, if the extension is registered for the extension (`*.md`), VS Code's "Double-editor" choice for diffs seems to bypass the `scheme` filter in some versions or configurations.

## 5. Potential Next Steps
- **Wait for Stable Diff API**: Use the proposed `resolveCustomDiffEditor` API once it becomes stable, which allows direct control over the diff experience.
- **UI Fallback**: Instead of a full redirect, detect the `git` scheme and render a minimal "Switch to Text Editor" button inside the webview panel.
- **Priority Shift**: Change the extension's default priority to `option` and implement an "Upgrade to Custom Editor" command for local files, though this removes the "automatic" nature the user originally had.
