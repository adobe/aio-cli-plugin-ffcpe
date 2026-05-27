# Agent skills — `aio-ffcpe-skills` (Claude Code & Cursor)

Bundled **Agent Skills** for **FFCPE** (**Firefly Creative Production for Enterprise**) — the Adobe I/O CLI topic **`ffcpe`** (`aio ffcpe catalog`) and **`catalog-entry.json`** authoring. Some teams still say **Workflow Builder** for the same area; these skills apply either way.

**Canonical sources:** [`skills/aio-ffcpe-cli/SKILL.md`](./skills/aio-ffcpe-cli/SKILL.md) and [`skills/ffcpe-catalog-entry-json/SKILL.md`](./skills/ffcpe-catalog-entry-json/SKILL.md). With this plugin installed in **aio**, run **`aio ffcpe sync-skills`** from the **repository root** to copy them into **`.cursor/skills/`** for Cursor (maintainers: **`npm pack`** runs the same sync during **prepack**).

Main plugin documentation (CLI usage, commands): **[`../README.md`](../README.md)**.

---

## 1. Claude Code — use slash commands (`/`)

After the plugin is installed, **invoke skills from chat with `/` commands**. Plugin skills are **namespaced**: **`/<plugin-id>:<skill-folder>`** (the plugin id is in **[`.claude-plugin/plugin.json`](./.claude-plugin/plugin.json)** → **`name`**: `aio-ffcpe-skills`; each skill is a subfolder under **`skills/`**).

| What to type | Purpose |
|----------------|---------|
| **`/aio-ffcpe-skills:aio-ffcpe-cli`** | CLI install, auth, `aio ffcpe catalog` commands |
| **`/aio-ffcpe-skills:ffcpe-catalog-entry-json`** | `catalog-entry.json` authoring and validation |

**Install the plugin once** (replace the Git URL if you use a fork):

```text
/plugin marketplace add https://github.com/Adobe-FFS-FDE/aio-cli-plugin-ffcpe
/plugin install aio-ffcpe-skills@ffcpe-cli-tools
```

- Open the **`/`** menu in Claude Code to search or autocomplete skills.
- After upgrading the plugin, run **`/reload-plugins`** so skills pick up changes.

**Personal skills** (copied to `~/.claude/skills/<name>/` without a plugin) use the short form **`/<name>`** only—no **`plugin:`** prefix.

**Copy skills into your home config** (Claude and/or Cursor user folders) with **aio** and this plugin installed:

```sh-session
$ aio ffcpe install-skills
$ aio ffcpe install-skills --target claude
$ aio ffcpe install-skills -t cursor
$ aio ffcpe install-skills -t both
$ aio ffcpe install-skills -p /path/to/your/repo
$ aio ffcpe install-skills --project
$ aio ffcpe install-skills -p -t cursor
$ aio ffcpe install-skills -p . -t cursor
```

**`--target`** (or **`-t`**) is **`claude`**, **`cursor`**, or **`both`** (default **`both`**).

**`--project`** (or **`-p`**) installs under that directory’s **`.claude/skills/`** and/or **`.cursor/skills/`** instead of your home folder. With **no path**, it uses the **current working directory** (same as **`-p .`**). Otherwise the path must already exist and is resolved relative to the shell’s current directory.

---

## 2. Cursor — project vs global (where to copy skills)

Cursor loads each skill from a directory that contains **`SKILL.md`**. You choose **project** (one repo) or **global** (every workspace).

| Scope | Path on disk | When it applies |
|--------|----------------|-----------------|
| **Project** | **`<your-project>/.cursor/skills/<skill-name>/SKILL.md`** | Only when that project folder is the open workspace in Cursor. |
| **Global (user)** | **`~/.cursor/skills/<skill-name>/SKILL.md`** | All projects on your machine. On Windows: **`%USERPROFILE%\.cursor\skills\<skill-name>\SKILL.md`**. |

**Using skills in chat:** type **`/`** in Cursor chat and choose the skill (e.g. **`/aio-ffcpe-cli`**, **`/ffcpe-catalog-entry-json`**) or describe the task; the agent can also match the skill from its YAML **`description`**.

### Install from this repo’s Git URL (project scope)

**A. Open this repository in Cursor (project skills in the clone)**

1. Clone (HTTPS URL; swap for your fork if needed):

   ```sh-session
   git clone https://github.com/adobe/aio-cli-plugin-ffcpe.git
   cd aio-cli-plugin-ffcpe
   ```

2. Install dependencies, install or link this plugin into **aio**, then populate **`.cursor/skills/`**:

   ```sh-session
   npm install
   aio ffcpe sync-skills
   ```

3. **Cursor → File → Open Folder…** → select the cloned folder.

You can also use **Clone Repository** from the Command Palette with the same URL, then run **`aio ffcpe sync-skills`** from the repo root before opening the folder.

**B. Copy into a different project (still project scope)**

With **aio** and this plugin installed, from any directory:

```sh-session
$ aio ffcpe install-skills -p /path/to/your/app -t cursor
```

Use **`-t both`** or **`-t claude`** if you want **`.claude/skills`** as well. Run from your app’s root and use **`aio ffcpe install-skills -p`** (or **`--project`**) with no path to install into the current directory, or **`aio ffcpe install-skills -p .`** explicitly; otherwise pass **`aio ffcpe install-skills -p /path/to/your/app`**. Paths are relative to the shell’s current directory.

Alternatively, create **`.cursor/skills/`** in your app if it does not exist, then copy the two folders **`aio-ffcpe-cli`** and **`ffcpe-catalog-entry-json`** from this repo’s **`claude-ffcpe/skills/`** into **your** **`.cursor/skills/`**, so you have **`.cursor/skills/aio-ffcpe-cli/SKILL.md`** and **`.cursor/skills/ffcpe-catalog-entry-json/SKILL.md`**. Use Finder, File Explorer, or your editor’s file tree—no shell required. Reload the Cursor window if new skill folders are not detected.

**C. Global install (all workspaces)**

Copy those same two folders into your **user** Cursor skills directory so they apply to every workspace: **`~/.cursor/skills/`** on macOS/Linux, or **`%USERPROFILE%\.cursor\skills`** on Windows—each skill stays its own subfolder with **`SKILL.md`** inside.

Alternatively, with **aio** and this plugin installed, run **`aio ffcpe install-skills --target cursor`** to copy them into **`~/.cursor/skills`** for you.

---

## Local development (`--plugin-dir`)

```bash
claude --plugin-dir ./claude-ffcpe
```

Then try **`/aio-ffcpe-skills:aio-ffcpe-cli`**.

---

## Official marketplace

To reach users who only use Anthropic’s catalog, publish this plugin through [Claude plugin submission](https://code.claude.com/docs/en/plugins#submit-your-plugin-to-the-official-marketplace) and point them at **`/plugin install <listed-name>@claude-plugins-official`** once listed.
