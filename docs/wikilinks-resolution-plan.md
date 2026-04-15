# Wikilinks Resolution Plan

## Goal

Add support for wiki-style links written as `[[page-name]]` in the Markdown extension so they resolve to matching Markdown files in the workspace and become clickable in preview.

## Target Behavior

- `[[related-concept-1]]` should resolve to `related-concept-1.md`.
- `[[wiki-links]]` should resolve to `wiki-links.md`.
- Link text should remain the page name unless an explicit display label is added later.
- Missing targets should be shown clearly instead of failing silently.

## Assumptions

- Wiki pages use lowercase, hyphenated filenames.
- The extension owns link rendering in preview, not the native Markdown renderer alone.
- The primary content set is a folder of `.md` files that can be indexed in the workspace.

## Implementation Plan

### 1. Define the wikilink syntax

- Support the basic form `[[page-name]]`.
- Normalize page identifiers before resolution.
- Decide whether case-insensitive matching is allowed, and keep the rule consistent across preview and navigation.
- Document any unsupported forms, such as external URLs or deeply nested aliases, until they are intentionally added.

### 2. Build a workspace wiki index

- Scan the relevant Markdown folders for `.md` files.
- Map each file to a canonical wiki key derived from its filename.
- Keep the index fresh when files are added, renamed, or deleted.
- Detect duplicate wiki keys and surface them as a conflict instead of picking a random file.

### 3. Add a wikilink resolver

- Resolve `[[name]]` to the indexed file path.
- Return a missing-link state when no target exists.
- Return an ambiguous-link state when multiple files match the same wiki key.
- Keep the resolver isolated so it can be reused by preview rendering, hover behavior, and future rename tools.

### 4. Render wikilinks in preview

- Extend the Markdown rendering pipeline with a plugin or transform that rewrites wikilinks into clickable preview links.
- Use the resolver result to build the target URL.
- Render missing links with a visible warning style so users can fix them quickly.
- Keep ordinary Markdown links unchanged.

### 5. Support navigation actions

- Clicking a resolved wikilink should open the target Markdown file.
- If a link is missing or ambiguous, the click should surface a useful message instead of doing nothing.
- Optional later step: add Ctrl/Cmd-click behavior that jumps to the target in the editor.

### 6. Add diagnostics and feedback

- Flag unresolved wikilinks in the UI or a diagnostics surface.
- Show the resolved target path in hover text when available.
- Provide a quick way to create the missing page if that fits the extension workflow.

### 7. Add tests

- Test resolution of a normal `[[page-name]]` link.
- Test missing-link behavior.
- Test duplicate-name conflicts.
- Test that normal Markdown links still work.
- Test preview rendering for a page with multiple internal links.

## Suggested Delivery Order

1. Parse and index wiki pages.
2. Implement link resolution.
3. Wire preview rendering.
4. Add diagnostics and navigation polish.
5. Add tests and verify edge cases.

## Acceptance Criteria

- Markdown preview shows `[[page-name]]` as clickable links.
- Clicking a resolved link opens the correct `.md` file.
- Missing links are visible and actionable.
- Duplicate targets are handled deterministically.
- Existing Markdown behavior is not broken.

## Open Questions

- Should links resolve only inside a dedicated wiki folder, or across the whole workspace?
- Should aliases like `[[Page Title|page-name]]` be supported now or later?
- Should link targets be created automatically when missing, or only surfaced as diagnostics?
