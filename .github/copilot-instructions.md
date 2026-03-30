When working in this repository, treat VSIX packaging as a release step.

- If asked to create, build, or package a VSIX for this extension, always bump the extension version first before packaging.
- Update every repository version source that must stay aligned, including `package.json` and `package-lock.json` when both exist.
- After the version bump, build the project, then create the VSIX artifact for the new version.
- Never overwrite, replace, rename, or delete an existing `.vsix` artifact in `artifacts/` as part of packaging. Always create a new versioned VSIX file alongside the existing ones.
- If the user explicitly asks for a package without mentioning versioning, still perform the version bump before packaging unless they explicitly forbid changing the version.

## Publishing and Updating on the Marketplace

When asked to publish or update the extension on the Marketplace, follow this workflow:

1. **Sync & Version Bump**: Ensure local repo is up-to-date (`git pull origin master`) and bump the version (`npm version patch` or `minor`/`major`). This automatically updates package files and creates a git tag.
2. **Update Documentation**: Update any version-specific links or installation instructions in `README.md`.
3. **Build & Package**:
   - Re-bundle the assets: `npx foy build`
   - Generate the VSIX artifact: `npx vsce package --out artifacts/markdown-editor-extended-settings-[version].vsix`
4. **Publish**: Deploy the new version using the Personal Access Token (PAT).
   - Command: `npx @vscode/vsce publish -p <PAT>`
   - Ask the user for the PAT if they haven't provided it, or use `npx @vscode/vsce publish` if a PAT is set via the `VSCE_PAT` environment variable or successful `vsce login oleksiiko`.
5. **Finalize Git**: Push the version bump, changes, and the new tag to GitHub: `git push origin master --tags`.