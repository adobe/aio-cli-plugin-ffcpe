/*
Copyright 2026 Adobe. All rights reserved.
This file is licensed to you under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License. You may obtain a copy
of the License at http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under
the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
OF ANY KIND, either express or implied. See the License for the specific language
governing permissions and limitations under the License.
*/

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const SKILLS_REL = path.join('claude-ffcpe', 'skills')

const __dirname = path.dirname(fileURLToPath(import.meta.url))

/**
 * Absolute path to the @adobe/aio-cli-plugin-ffcpe package root (directory that contains
 * `package.json` and `claude-ffcpe/`). This file lives at `src/lib/ffcpe-skills-copy.js`.
 *
 * Do not use oclif **`config.root`** for this: when the plugin runs under **aio**, that
 * root is the **@adobe/aio-cli** install, not this plugin.
 *
 * @returns {string} absolute path to the plugin package root
 */
export function resolvePluginPackageRoot () {
  return path.resolve(__dirname, '..', '..')
}

/**
 * Whether the next argv token after `-p` / `--project` is a path value (vs another flag).
 * Aligns with @oclif/core: a leading dash is still a path if it looks like a negative number.
 *
 * @param {string | undefined} next following argv token, if any
 * @returns {boolean} true when `next` should be consumed as the project path
 */
function tokenLooksLikeProjectPath (next) {
  if (next === undefined) return false
  if (!next.startsWith('-')) return true
  return /^-\d/.test(next)
}

/**
 * Copy argv so bare `--project` or `-p` (no path before the next flag or end of argv) uses `.`.
 * Used by **`aio ffcpe install-skills`** before oclif parse (option flags require a value).
 *
 * @param {string[]} argv argv slice for the command (e.g. from `ffcpe install-skills` onward)
 * @returns {string[]} a copy, possibly with `.` inserted after the first `-p` / `--project`
 */
export function argvWithImplicitProjectPath (argv) {
  const out = [...argv]
  for (let i = 0; i < out.length; i++) {
    if (out[i] !== '--project' && out[i] !== '-p') continue
    const next = out[i + 1]
    if (!tokenLooksLikeProjectPath(next)) {
      out.splice(i + 1, 0, '.')
    }
    break
  }
  return out
}

/**
 * @param {string} pluginRoot Absolute path to @adobe/aio-cli-plugin-ffcpe package root
 * @returns {string} Absolute path to claude-ffcpe/skills
 */
export function resolveSkillsSourceDir (pluginRoot) {
  return path.join(pluginRoot, SKILLS_REL)
}

/**
 * @param {string} pluginRoot package root containing claude-ffcpe/skills
 * @returns {string} absolute path to claude-ffcpe/skills
 */
export function assertSkillsSourceExists (pluginRoot) {
  const src = resolveSkillsSourceDir(pluginRoot)
  if (!fs.existsSync(src)) {
    throw new Error(`Missing skill source: ${src}`)
  }
  return src
}

/**
 * @param {string} skillsSourceDir claude-ffcpe/skills
 * @returns {string[]} directory names
 */
export function listSkillDirNames (skillsSourceDir) {
  return fs
    .readdirSync(skillsSourceDir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
}

/**
 * @param {string} skillsSourceDir path to claude-ffcpe/skills
 * @param {string} destRoot destination skills root (e.g. ~/.cursor/skills)
 */
export function copySkillsInto (skillsSourceDir, destRoot) {
  fs.mkdirSync(destRoot, { recursive: true })
  for (const name of listSkillDirNames(skillsSourceDir)) {
    const from = path.join(skillsSourceDir, name)
    const to = path.join(destRoot, name)
    fs.rmSync(to, { recursive: true, force: true })
    fs.cpSync(from, to, { recursive: true })
  }
}

/**
 * Copy bundled skills into <pluginRoot>/.cursor/skills (for this repo / npm tarball).
 * @param {string} pluginRoot package root
 * @returns {{ src: string, dest: string }} source and destination directories
 */
export function syncProjectCursorSkills (pluginRoot) {
  const src = assertSkillsSourceExists(pluginRoot)
  const dest = path.join(pluginRoot, '.cursor', 'skills')
  copySkillsInto(src, dest)
  return { src, dest }
}

/**
 * @returns {string} user home directory path
 */
export function resolveUserHome () {
  const home = process.env.HOME || process.env.USERPROFILE
  if (!home) {
    throw new Error('Could not resolve home directory (HOME / USERPROFILE).')
  }
  return home
}

/**
 * @param {string} projectRoot path passed by user (resolved before call)
 * @returns {string} absolute existing directory
 */
export function assertProjectDirectory (projectRoot) {
  const abs = path.resolve(projectRoot)
  if (!fs.existsSync(abs) || !fs.statSync(abs).isDirectory()) {
    throw new Error(`--project is not an existing directory: ${abs}`)
  }
  return abs
}

/**
 * Copy bundled skills into explicit destination skill roots.
 * @param {string} pluginRoot package root containing claude-ffcpe/skills
 * @param {{ claudeDest: string | null, cursorDest: string | null }} dests full paths to skills dirs
 * @returns {string[]} destinations written
 */
export function installBundledSkillsToDirs (pluginRoot, { claudeDest, cursorDest }) {
  const src = assertSkillsSourceExists(pluginRoot)
  const written = []
  if (claudeDest) {
    fs.mkdirSync(claudeDest, { recursive: true })
    copySkillsInto(src, claudeDest)
    written.push(claudeDest)
  }
  if (cursorDest) {
    fs.mkdirSync(cursorDest, { recursive: true })
    copySkillsInto(src, cursorDest)
    written.push(cursorDest)
  }
  return written
}

/**
 * @param {string} pluginRoot package root
 * @param {{ claude: boolean, cursor: boolean }} targets which home dirs to write
 * @returns {string[]} destination skill roots that were written
 */
export function installSkillsToUserDirs (pluginRoot, { claude, cursor }) {
  const home = resolveUserHome()
  return installBundledSkillsToDirs(pluginRoot, {
    claudeDest: claude ? path.join(home, '.claude', 'skills') : null,
    cursorDest: cursor ? path.join(home, '.cursor', 'skills') : null
  })
}

/**
 * Install into the given repo: .claude/skills and/or .cursor/skills under that root.
 * @param {string} pluginRoot package root (source of bundled skills)
 * @param {string} projectRoot repo or app root (must exist)
 * @param {{ claude: boolean, cursor: boolean }} targets which families to install under the project
 * @returns {string[]} destination skill roots that were written
 */
export function installSkillsToProjectDirs (pluginRoot, projectRoot, { claude, cursor }) {
  const proj = assertProjectDirectory(projectRoot)
  return installBundledSkillsToDirs(pluginRoot, {
    claudeDest: claude ? path.join(proj, '.claude', 'skills') : null,
    cursorDest: cursor ? path.join(proj, '.cursor', 'skills') : null
  })
}
