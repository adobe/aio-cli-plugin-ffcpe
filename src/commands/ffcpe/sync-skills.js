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

import { Command } from '@oclif/core'
import { resolvePluginPackageRoot, syncProjectCursorSkills } from '../../lib/ffcpe-skills-copy.js'

export default class FfcpeSyncSkills extends Command {
  async run () {
    await this.parse(FfcpeSyncSkills)
    const { dest } = syncProjectCursorSkills(resolvePluginPackageRoot())
    this.log(`Synced skills to ${dest}`)
  }
}

FfcpeSyncSkills.description =
  'Copy bundled agent skills into this package\'s .cursor/skills (for repo dev and npm prepack)'

FfcpeSyncSkills.examples = ['$ aio ffcpe sync-skills']
