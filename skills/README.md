# Agent skills (FFCPE)

Bundled **[Agent Skills](https://github.com/vercel-labs/skills)** for **FFCPE** (**Firefly Creative Production for Enterprise**) — the Adobe I/O CLI topic **`ffcpe`** (`aio ffcpe catalog`) and **`catalog-entry.json`** authoring. Some teams still say **Workflow Builder** for the same area; these skills apply either way.

Each skill is a directory with **`SKILL.md`** and YAML frontmatter (`name`, `description`) per the [open agent skills](https://github.com/vercel-labs/skills) format.

| Skill | Path |
|-------|------|
| **`aio-ffcpe-cli`** | [`aio-ffcpe-cli/SKILL.md`](./aio-ffcpe-cli/SKILL.md) |
| **`ffcpe-catalog-entry-json`** | [`ffcpe-catalog-entry-json/SKILL.md`](./ffcpe-catalog-entry-json/SKILL.md) |

Main plugin documentation (CLI usage, commands): **[`../README.md`](../README.md)**.

---

## Install with `npx skills`

Use the [Skills CLI](https://github.com/vercel-labs/skills) ([skills.sh](https://skills.sh/)) to install into Cursor, Claude Code, Codex, and other supported agents.

```sh-session
# List skills in this repository
npx skills add adobe/aio-cli-plugin-ffcpe --list

# Install both skills for Cursor (project scope)
npx skills add adobe/aio-cli-plugin-ffcpe -a cursor -y

# Install both skills globally for Claude Code
npx skills add adobe/aio-cli-plugin-ffcpe -g -a claude-code -y

# Install one skill
npx skills add adobe/aio-cli-plugin-ffcpe --skill aio-ffcpe-cli -a cursor -y

# Install all skills to all detected agents (non-interactive)
npx skills add adobe/aio-cli-plugin-ffcpe --all -y
```

From a local clone:

```sh-session
npx skills add /path/to/aio-cli-plugin-ffcpe --list
npx skills add . -a cursor -y
```

Other useful commands: **`npx skills list`**, **`npx skills update`**, **`npx skills find ffcpe`**.

---

## Cursor — project vs global

| Scope | Path | When it applies |
|--------|------|-----------------|
| **Project** | **`<project>/.cursor/skills/<skill-name>/SKILL.md`** (or **`.agents/skills/`** per agent) | Only when that project folder is the open workspace. |
| **Global** | **`~/.cursor/skills/<skill-name>/SKILL.md`** | All projects (Windows: **`%USERPROFILE%\.cursor\skills\`**). |

**In chat:** type **`/`** and pick **`/aio-ffcpe-cli`** or **`/ffcpe-catalog-entry-json`**, or describe the task so the agent matches the skill **`description`**.

---

## Claude Code — slash commands

If this repo is published as a Claude Code plugin, skills may be namespaced as **`/<plugin-id>:<skill-name>`** (e.g. **`/aio-ffcpe-skills:aio-ffcpe-cli`**). Personal copies under **`~/.claude/skills/`** use **`/<skill-name>`** only.

After upgrading a plugin, run **`/reload-plugins`** so skills pick up changes.
