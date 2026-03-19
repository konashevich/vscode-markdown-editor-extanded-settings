const fs = require('fs');
const file = '/mnt/merged_ssd/IDE Extensions/vscode-markdown-editor-extanded-settings/src/extension.ts';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
/theme:\s*vscode\.window\.activeColorTheme\.kind ===\s*vscode\.ColorThemeKind\.Dark\s*\?\s*'dark'\s*:\s*'light',/g,
\`theme: (vscode.window.activeColorTheme.kind === vscode.ColorThemeKind.Dark || vscode.window.activeColorTheme.kind === vscode.ColorThemeKind.HighContrast) ? 'dark' : 'light',\`
);

fs.writeFileSync(file, content);
