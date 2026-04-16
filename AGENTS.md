When working in this repository, treat VSIX packaging as a release step.

- If asked to create, build, or package a VSIX for this extension, always bump the extension version first before packaging.
- Update every repository version source that must stay aligned, including `package.json` and `package-lock.json` when both exist.
- After the version bump, build the project, then create the VSIX artifact for the new version.
- Never overwrite, replace, rename, or delete an existing `.vsix` artifact in `artifacts/` as part of packaging. Always create a new versioned VSIX file alongside the existing ones.
- If the user explicitly asks for a package without mentioning versioning, still perform the version bump before packaging unless they explicitly forbid changing the version.
- For Marketplace publishing, prefer the persisted PAT from `.env` (`VSCE_PAT`) and keep the GitHub Actions secrets `VSCE_PAT` and `VS_MARKETPLACE_TOKEN` in sync so the user is not prompted again.
