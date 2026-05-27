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
import os from 'node:os'
import path from 'node:path'
import { afterEach, describe, expect, it } from '@jest/globals'
import {
  argvWithImplicitProjectPath,
  assertProjectDirectory,
  copySkillsInto,
  installSkillsToProjectDirs,
  installSkillsToUserDirs,
  listSkillDirNames,
  resolvePluginPackageRoot,
  syncProjectCursorSkills
} from '../../src/lib/ffcpe-skills-copy.js'

describe('ffcpe-skills-copy', () => {
  const tmpRoots = []

  afterEach(() => {
    for (const r of tmpRoots) {
      fs.rmSync(r, { recursive: true, force: true })
    }
    tmpRoots.length = 0
  })

  /**
   * Build a temp plugin root with claude-ffcpe/skills/demo-skill/SKILL.md
   * @returns {string} absolute temp root tracked for cleanup
   */
  function makePluginRoot () {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ffcpe-plugin-'))
    tmpRoots.push(root)
    const skills = path.join(root, 'claude-ffcpe', 'skills', 'demo-skill')
    fs.mkdirSync(skills, { recursive: true })
    fs.writeFileSync(path.join(skills, 'SKILL.md'), '---\nname: demo\n---\n', 'utf8')
    return root
  }

  it('syncProjectCursorSkills copies into .cursor/skills', () => {
    const root = makePluginRoot()
    const { dest } = syncProjectCursorSkills(root)
    expect(fs.existsSync(path.join(dest, 'demo-skill', 'SKILL.md'))).toBe(true)
  })

  it('listSkillDirNames lists only directories', () => {
    const root = makePluginRoot()
    const src = path.join(root, 'claude-ffcpe', 'skills')
    fs.writeFileSync(path.join(src, 'readme.txt'), 'x', 'utf8')
    const names = listSkillDirNames(src)
    expect(names).toContain('demo-skill')
    expect(names).not.toContain('readme.txt')
  })

  it('copySkillsInto overwrites existing folder', () => {
    const root = makePluginRoot()
    const src = path.join(root, 'claude-ffcpe', 'skills')
    const destRoot = path.join(root, 'out-skills')
    fs.mkdirSync(path.join(destRoot, 'demo-skill'), { recursive: true })
    fs.writeFileSync(path.join(destRoot, 'demo-skill', 'SKILL.md'), 'old', 'utf8')
    copySkillsInto(src, destRoot)
    expect(fs.readFileSync(path.join(destRoot, 'demo-skill', 'SKILL.md'), 'utf8')).toContain(
      'name: demo'
    )
  })

  it('installSkillsToProjectDirs writes under project .cursor/skills', () => {
    const pluginRoot = makePluginRoot()
    const projectRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'ffcpe-app-'))
    tmpRoots.push(projectRoot)
    const written = installSkillsToProjectDirs(pluginRoot, projectRoot, {
      claude: false,
      cursor: true
    })
    expect(written).toHaveLength(1)
    expect(
      fs.existsSync(path.join(projectRoot, '.cursor', 'skills', 'demo-skill', 'SKILL.md'))
    ).toBe(true)
  })

  it('assertProjectDirectory throws when path is missing', () => {
    const bad = path.join(os.tmpdir(), 'ffcpe-missing-dir-' + Date.now())
    expect(() => assertProjectDirectory(bad)).toThrow(/not an existing directory/)
  })

  it('installSkillsToUserDirs copies to ~/.claude/skills when HOME set', () => {
    const root = makePluginRoot()
    const fakeHome = fs.mkdtempSync(path.join(os.tmpdir(), 'ffcpe-home-'))
    tmpRoots.push(fakeHome)
    const prevHome = process.env.HOME
    process.env.HOME = fakeHome
    try {
      const written = installSkillsToUserDirs(root, { claude: true, cursor: false })
      expect(written).toHaveLength(1)
      expect(
        fs.existsSync(path.join(fakeHome, '.claude', 'skills', 'demo-skill', 'SKILL.md'))
      ).toBe(true)
    } finally {
      process.env.HOME = prevHome
    }
  })

  it('resolvePluginPackageRoot points at this repo (has package.json and claude-ffcpe/skills)', () => {
    const root = resolvePluginPackageRoot()
    expect(fs.existsSync(path.join(root, 'package.json'))).toBe(true)
    expect(fs.existsSync(path.join(root, 'claude-ffcpe', 'skills'))).toBe(true)
  })

  it('argvWithImplicitProjectPath inserts . after bare --project before another flag', () => {
    expect(argvWithImplicitProjectPath(['ffcpe', 'install-skills', '--project', '-t', 'cursor'])).toEqual([
      'ffcpe',
      'install-skills',
      '--project',
      '.',
      '-t',
      'cursor'
    ])
  })

  it('argvWithImplicitProjectPath inserts . after bare -p at end', () => {
    expect(argvWithImplicitProjectPath(['install-skills', '-p'])).toEqual(['install-skills', '-p', '.'])
  })

  it('argvWithImplicitProjectPath does not insert when path is explicit', () => {
    expect(argvWithImplicitProjectPath(['x', '--project', '../foo', '-t', 'both'])).toEqual([
      'x',
      '--project',
      '../foo',
      '-t',
      'both'
    ])
  })

  it('argvWithImplicitProjectPath does not insert for path shaped like a negative number', () => {
    expect(argvWithImplicitProjectPath(['x', '-p', '-9', 'y'])).toEqual(['x', '-p', '-9', 'y'])
  })
})
