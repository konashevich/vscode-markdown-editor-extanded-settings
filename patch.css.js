const fs = require('fs');
const file = '/mnt/merged_ssd/IDE Extensions/vscode-markdown-editor-extanded-settings/media-src/src/main.css';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
/body\[data-use-vscode-theme-color="1"\] \.vditor \{([\s\S]*?)\}/,
`body[data-use-vscode-theme-color="1"] .vditor {
  --panel-background-color: var(--vscode-editorWidget-background, var(--vscode-editor-background));
  --toolbar-background-color: var(--vscode-editor-background);
  --toolbar-icon-color: var(--vscode-editor-foreground, #586069);
  --toolbar-icon-hover-color: var(--vscode-textLink-foreground, #4285f4);
  --textarea-background-color: var(--vscode-editor-background);
  --border-color: var(--vscode-panel-border, rgba(128, 128, 128, 0.35));
  --resize-icon-color: var(--vscode-editor-foreground, #586069);
}`
);

content = content.replace(
/body\[data-use-vscode-theme-color="1"\] \.vditor\.vditor--dark \{([\s\S]*?)\}/,
`body[data-use-vscode-theme-color="1"] .vditor.vditor--dark {
  --toolbar-icon-color: var(--vscode-editor-foreground, #b9b9b9);
  --toolbar-icon-hover-color: var(--vscode-textLink-foreground, #fff);
  --resize-icon-color: var(--vscode-editor-foreground, #b9b9b9);
}`
);

fs.writeFileSync(file, content);
