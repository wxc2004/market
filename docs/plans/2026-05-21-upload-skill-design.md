# GUI Upload Skill Feature Design

## Summary
Add an "Upload" view to the SkillMarket GUI that allows users to upload a skill zip archive, then choose to publish it to npm, install it locally, or both.

## Architecture

### New UI View
- Navigation tab: "Upload 📤"
- Three-phase flow: Upload → Preview → Action
- Phase 1: File picker for .zip, optional skill name, "Upload & Parse" button
- Phase 2: Parsed skill info card (name/version/description/platforms), action buttons (Publish/Install/Both/Discard)
- Phase 3: Toast result notification

### Backend API
- `POST /api/upload` — receives base64 zip, extracts to `skills/<name>/`, validates, returns skill info
- `POST /api/upload/action` — executes publish and/or install on uploaded skill

### Data Flow
```
zip file → base64 → POST /api/upload → extract + validate → return info
→ user picks action → POST /api/upload/action → publish/install → result toast
```

### Files Changed
- `gui/index.html` — Upload view HTML
- `gui/style.css` — Upload styles
- `gui/app.js` — Upload logic, i18n
- `src/commands/ui.ts` — API routes for upload
- `package.json` — add adm-zip dependency
