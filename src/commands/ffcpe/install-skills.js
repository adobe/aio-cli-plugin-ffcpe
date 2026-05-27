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

import path from 'node:path'
import { Command, Flags } from '@oclif/core'
import {
  argvWithImplicitProjectPath,
  installSkillsToProjectDirs,
  installSkillsToUserDirs,
  resolvePluginPackageRoot
} from '../../lib/ffcpe-skills-copy.js'

export default class FfcpeInstallSkills extends Command {
  async run () {
    const { flags } = await this.parse(FfcpeInstallSkills, argvWithImplicitProjectPath(this.argv))
    const target = flags.target
    const claude = target === 'claude' || target === 'both'
    const cursor = target === 'cursor' || target === 'both'
    const pluginRoot = resolvePluginPackageRoot()
    let written
    if (flags.project != null && flags.project !== '') {
      written = installSkillsToProjectDirs(
        pluginRoot,
        path.resolve(process.cwd(), flags.project),
        { claude, cursor }
      )
    } else {
      written = installSkillsToUserDirs(pluginRoot, { claude, cursor })
    }
    for (const d of written) {
      this.log(`Installed skills to ${d}`)
    }
  }
}

FfcpeInstallSkills.description =
  'Copy bundled agent skills (claude-ffcpe/skills) into user home or a project (.claude/skills, .cursor/skills)'

FfcpeInstallSkills.examples = [
  '$ aio ffcpe install-skills',
  '$ aio ffcpe install-skills --target claude',
  '$ aio ffcpe install-skills -t cursor',
  '$ aio ffcpe install-skills -t both',
  '$ aio ffcpe install-skills --project',
  '$ aio ffcpe install-skills -p -t cursor',
  '$ aio ffcpe install-skills -p .',
  '$ aio ffcpe install-skills --project /path/to/repo -t cursor'
]

FfcpeInstallSkills.flags = {
  target: Flags.string({
    char: 't',
    description: 'Install destination: claude, cursor, or both',
    options: ['claude', 'cursor', 'both'],
    default: 'both'
  }),
  project: Flags.string({
    char: 'p',
    description:
      'Repo or app root (must exist). Defaults to the current directory when given without a path (--project or -p alone). Skills go under <project>/.claude/skills and/or <project>/.cursor/skills. Omit this flag for ~/.claude/skills and ~/.cursor/skills.',
    helpValue: '[<path>]',
    parse: async (input) => (input === '' ? '.' : input)
  })
}
