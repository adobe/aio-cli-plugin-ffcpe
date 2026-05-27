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
import { fileURLToPath } from 'node:url'

import { jest } from '@jest/globals'

const pluginRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')

/**
 * Minimal oclif config stub (avoids slow Config.load in unit tests).
 * @returns {import('@oclif/core').Config}
 */
function stubConfig () {
  return /** @type {import('@oclif/core').Config} */ ({
    root: pluginRoot,
    name: '@adobe/aio-cli-plugin-ffcpe',
    version: '0.0.0',
    bin: 'aio',
    commandIDs: [],
    commands: [],
    topics: {},
    runHook: async () => {},
    findCommand: () => undefined
  })
}

/**
 * @param {import('@oclif/core').Command} CommandClass
 * @param {{ flags?: Record<string, unknown>, args?: Record<string, unknown> }} [overrides]
 * @returns {Promise<import('@oclif/core').Command>}
 */
export async function createCommand (CommandClass, overrides = {}) {
  const cmd = new CommandClass([], stubConfig())
  const flags = overrides.flags ?? {}
  const args = overrides.args ?? {}
  cmd.parse = async () => ({ flags, args })
  cmd.log = jest.fn()
  cmd.warn = jest.fn()
  cmd.error = jest.fn((msg) => {
    throw Object.assign(new Error(String(msg)), { oclif: { exit: 1 } })
  })
  return cmd
}
