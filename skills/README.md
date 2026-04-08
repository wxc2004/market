# SkillMarket Skills

This directory contains the skill packages that can be published to npm.

## Adding a New Skill

1. Create a new directory under `skills/<skill-name>/`
2. Add the required files:
   - `package.json` - Package configuration with `skillmarket` metadata
   - `SKILL.md` - Skill documentation
   - `metadata.json` - Skill metadata
   - `index.js` - Main entry point (OpenCode plugin)

3. Update the GitHub Actions workflow to include your skill (if using dropdown options)

## Publishing a Skill

### Option 1: GitHub Actions (Recommended)
1. Go to repository Actions tab
2. Select "Publish Skill" workflow
3. Click "Run workflow"
4. Enter skill name (e.g., `test-skill`)
5. Optionally specify version

### Option 2: Manual Publish
```bash
cd skills/<skill-name>
npm install
npm publish --access=public
```

## Skill Package Requirements

```json
{
  "name": "@wanxuchen/<skill-name>",
  "version": "1.0.0",
  "type": "module",
  "main": "index.js",
  "keywords": ["skillmarket"],
  "skillmarket": {
    "id": "<skill-name>",
    "displayName": "Display Name",
    "description": "Description",
    "platforms": ["opencode", "cursor", "vscode"]
  }
}
```

## Current Skills

- `test-skill` - Test skill for validating the installation flow (@wanxuchen)