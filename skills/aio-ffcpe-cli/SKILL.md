---
name: aio-ffcpe-cli
description: >-
  Use when working with the Adobe I/O CLI plugin @adobe/aio-cli-plugin-ffcpe (FFCPE — Firefly Creative Production for Enterprise).
  Covers installation, authentication, env overrides, and all `aio ffcpe catalog` commands. Use for terminal workflows, scripting catalog changes, or explaining how developers should invoke this plugin. Some users still say **Workflow Builder**; that name referred to the same product area — the CLI topic is **`ffcpe`** (`aio ffcpe`).
---

# aio-cli-plugin-ffcpe (FFCPE CLI)

This repository is an **oclif plugin** for Adobe I/O CLI. **Topic: `ffcpe`** — **Firefly Creative Production for Enterprise (FFCPE)** — focused on the **run-workflow Catalog API** for custom actions.

**Legacy language:** internal and older docs sometimes say **Workflow Builder** or used older topic naming in screenshots. That is the same capability; current branding and the **`aio`** topic are **`ffcpe`**.

## When to use this skill

- Installing or troubleshooting the plugin
- Choosing the right `aio ffcpe catalog …` command
- Explaining flags (`--base-url`, `--org-id`, `--api-key`, `--json`, etc.)
- How auth and org context are resolved

## Setup

### 1. Install Adobe I/O CLI (`aio`)

Requires **Node.js 18+**.

```sh-session
npm install -g @adobe/aio-cli
aio --version
```

### 2. Install this plugin (`@adobe/aio-cli-plugin-ffcpe`)

```sh-session
aio plugins:install @adobe/aio-cli-plugin-ffcpe
```

Or from Git (fork or internal repo):

```sh-session
aio plugins:install https://github.com/adobe/aio-cli-plugin-ffcpe
```

### 3. Verify and authenticate

```sh-session
aio ffcpe catalog --help
aio login
aio console org select
```

If **`aio ffcpe`** is missing, run **`aio plugins`** and confirm this package is installed.

## Base URL

- **Default:** `https://run-workflow.adobe.io`
- **Override:** environment variable **`AIO_FFCPE_CATALOG_BASE_URL`** or flag **`--base-url`** (`-u`) on catalog commands.

## Commands (catalog)

| Command | Purpose |
|--------|---------|
| **`aio ffcpe catalog validate`** | Local validation of a `catalog-entry.json` (no network). Use `--file` / `-f`. |
| **`aio ffcpe catalog register`** | POST a new catalog entry from a JSON file. Validates first; optional **`--strict`** to fail on validation warnings. |
| **`aio ffcpe catalog inspect ACTIONTYPE`** | GET one action; optional **`--version`** for a specific semver. |
| **`aio ffcpe catalog list`** | GET catalog actions (supports filters per command help). |
| **`aio ffcpe catalog update ACTIONTYPE`** | PUT a full replacement definition. |
| **`aio ffcpe catalog disable ACTIONTYPE`** | Disable (and typically hide from the FFCPE workflow UI). |
| **`aio ffcpe catalog enable ACTIONTYPE`** | Re-enable a disabled action. |
| **`aio ffcpe catalog delete ACTIONTYPE`** | DELETE; use **`--version`** to delete one semver only. |

Run **`aio ffcpe catalog --help`** or **`aio ffcpe catalog <command> --help`** for exact flags and examples.

## Common flags

- **`--org-id`** — override `x-gw-ims-org-id` (default from `aio console org select`).
- **`--api-key`** — override `x-api-key` when needed.
- **`--json`** — print raw API JSON where supported.

## Authoring `catalog-entry.json`

The CLI does not scaffold entries interactively. Use the **`ffcpe-catalog-entry-json`** skill (or **`/aio-ffcpe-skills:ffcpe-catalog-entry-json`** when the plugin is installed), then **`aio ffcpe catalog validate -f ./catalog-entry.json`** and **`aio ffcpe catalog register`**.

## Deeper docs

- **`skills/README.md`** — agent skills (Claude **`/`** commands, Cursor paths, **`npx skills`** install).
- **`.cursor/ffcpe-catalog/SKILL.md`** — catalog operations via **`aio ffcpe catalog`** (same HTTP API under the hood; do not hand-craft curl).
