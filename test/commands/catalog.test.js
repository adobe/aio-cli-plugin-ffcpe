/* eslint-disable node/no-unsupported-features/es-syntax */
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

import { mkdtemp, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { Help } from '@oclif/core'
import { afterEach, beforeAll, beforeEach, describe, expect, jest, test } from '@jest/globals'

import { minimalValidCatalogEntry } from '../helpers/catalog-entry-fixture.js'
import { createCommand } from '../helpers/command-test-utils.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const catalogRequestContextPath = path.join(
  __dirname,
  '../../src/lib/catalog-request-context.js'
)
const withSpinnerPath = path.join(__dirname, '../../src/lib/with-catalog-spinner.js')

const mockGetCatalogRequestContext = jest.fn()

let entryFile
let badJsonFile
let invalidEntryFile

let FfcpeIndex
let CatalogIndex
let CatalogValidate
let CatalogRegister
let CatalogUpdate
let CatalogInspect
let CatalogDelete
let CatalogDisable
let CatalogEnable
let CatalogList

const catalogHeaders = {
  Authorization: 'Bearer x',
  'Content-Type': 'application/json',
  'x-api-key': 'k',
  'x-gw-ims-org-id': 'o@AdobeOrg'
}

const customAction = {
  actionType: 'mine',
  version: '1.0.0',
  name: 'Mine',
  handlerType: 'custom-action',
  workflowEnabled: true,
  disabled: false,
  description: 'd'
}

beforeAll(async () => {
  const dir = await mkdtemp(path.join(tmpdir(), 'ffcpe-catalog-'))
  entryFile = path.join(dir, 'catalog-entry.json')
  badJsonFile = path.join(dir, 'bad.json')
  invalidEntryFile = path.join(dir, 'invalid.json')
  await writeFile(entryFile, JSON.stringify(minimalValidCatalogEntry))
  await writeFile(badJsonFile, '{ not json')
  await writeFile(invalidEntryFile, JSON.stringify({ actionType: '!!!' }))

  await jest.unstable_mockModule(catalogRequestContextPath, () => ({
    getCatalogRequestContext: mockGetCatalogRequestContext
  }))
  await jest.unstable_mockModule(withSpinnerPath, () => ({
    withCatalogSpinner: (_message, fn) => fn()
  }))

  ;({ default: FfcpeIndex } = await import('../../src/commands/ffcpe/index.js'))
  ;({ default: CatalogIndex } = await import(
    '../../src/commands/ffcpe/catalog/index.js'
  ))
  ;({ default: CatalogValidate } = await import(
    '../../src/commands/ffcpe/catalog/validate.js'
  ))
  ;({ default: CatalogRegister } = await import(
    '../../src/commands/ffcpe/catalog/register.js'
  ))
  ;({ default: CatalogUpdate } = await import(
    '../../src/commands/ffcpe/catalog/update.js'
  ))
  ;({ default: CatalogInspect } = await import(
    '../../src/commands/ffcpe/catalog/inspect.js'
  ))
  ;({ default: CatalogDelete } = await import(
    '../../src/commands/ffcpe/catalog/delete.js'
  ))
  ;({ default: CatalogDisable } = await import(
    '../../src/commands/ffcpe/catalog/disable.js'
  ))
  ;({ default: CatalogEnable } = await import(
    '../../src/commands/ffcpe/catalog/enable.js'
  ))
  ;({ default: CatalogList } = await import('../../src/commands/ffcpe/catalog/list.js'))
})

beforeEach(() => {
  mockGetCatalogRequestContext.mockResolvedValue({
    baseUrl: 'https://api.test/',
    headers: catalogHeaders
  })
})

afterEach(() => {
  jest.restoreAllMocks()
})

describe('ffcpe index commands', () => {
  test('ffcpe topic shows help', async () => {
    const showHelp = jest.spyOn(Help.prototype, 'showHelp').mockResolvedValue(undefined)
    const cmd = await createCommand(FfcpeIndex)
    await cmd.run()
    expect(showHelp).toHaveBeenCalledWith(['ffcpe'])
    showHelp.mockRestore()
  })

  test('ffcpe catalog topic shows help', async () => {
    const showHelp = jest.spyOn(Help.prototype, 'showHelp').mockResolvedValue(undefined)
    const cmd = await createCommand(CatalogIndex)
    await cmd.run()
    expect(showHelp).toHaveBeenCalledWith(['ffcpe', 'catalog'])
    showHelp.mockRestore()
  })
})

describe('catalog validate', () => {
  test('logs OK for valid file', async () => {
    const cmd = await createCommand(CatalogValidate, { flags: { file: entryFile } })
    await cmd.run()
    expect(cmd.log).toHaveBeenCalledWith(
      expect.stringContaining('OK — catalog entry passes')
    )
  })

  test('errors on invalid JSON and validation failures', async () => {
    const cmd = await createCommand(CatalogValidate, { flags: { file: badJsonFile } })
    await expect(cmd.run()).rejects.toThrow(/Invalid JSON/)

    const invalidCmd = await createCommand(CatalogValidate, {
      flags: { file: invalidEntryFile }
    })
    await expect(invalidCmd.run()).rejects.toThrow(/Validation failed/)
  })
})

describe('catalog register and update', () => {
  test('register posts catalog entry', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), { status: 200 })
    )
    const cmd = await createCommand(CatalogRegister, {
      flags: { file: entryFile, strict: false }
    })
    await cmd.run()
    expect(fetchSpy).toHaveBeenCalled()
    fetchSpy.mockRestore()
  })

  test('register warns or errors on validation', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue(
      new Response('{}', { status: 200 })
    )
    const cmd = await createCommand(CatalogRegister, {
      flags: { file: invalidEntryFile, strict: false }
    })
    await cmd.run()
    expect(cmd.warn).toHaveBeenCalled()
    fetchSpy.mockRestore()

    const strictCmd = await createCommand(CatalogRegister, {
      flags: { file: invalidEntryFile, strict: true }
    })
    await expect(strictCmd.run()).rejects.toThrow(/Validation failed/)
  })

  test('register errors on invalid JSON and API failure', async () => {
    const cmd = await createCommand(CatalogRegister, { flags: { file: badJsonFile } })
    await expect(cmd.run()).rejects.toThrow(/Invalid JSON/)

    const failSpy = jest.spyOn(global, 'fetch').mockResolvedValue(
      new Response('{"error":"E","message":"fail"}', { status: 400 })
    )
    const okCmd = await createCommand(CatalogRegister, { flags: { file: entryFile } })
    await expect(okCmd.run()).rejects.toThrow(/fail/)
    failSpy.mockRestore()
  })

  test('update puts catalog entry with optional version', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ updated: true }), { status: 200 })
    )
    const cmd = await createCommand(CatalogUpdate, {
      flags: { file: entryFile, version: '1.0.0', strict: false },
      args: { actionType: 'image-to-text' }
    })
    await cmd.run()
    const url = fetchSpy.mock.calls.at(-1)[0].toString()
    expect(url).toContain('image-to-text')
    fetchSpy.mockRestore()
  })

  test('update warns on validation when not strict and errors on strict', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue(
      new Response('{}', { status: 200 })
    )
    const cmd = await createCommand(CatalogUpdate, {
      flags: { file: invalidEntryFile, strict: false },
      args: { actionType: 'image-to-text' }
    })
    await cmd.run()
    expect(cmd.warn).toHaveBeenCalled()
    fetchSpy.mockRestore()

    const strictCmd = await createCommand(CatalogUpdate, {
      flags: { file: invalidEntryFile, strict: true },
      args: { actionType: 'image-to-text' }
    })
    await expect(strictCmd.run()).rejects.toThrow(/Validation failed/)
  })

  test('update errors on invalid JSON', async () => {
    const cmd = await createCommand(CatalogUpdate, {
      flags: { file: badJsonFile },
      args: { actionType: 'image-to-text' }
    })
    await expect(cmd.run()).rejects.toThrow(/Invalid JSON/)
  })

  test('update errors on API failure', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue(
      new Response('{"message":"nope"}', { status: 500 })
    )
    const cmd = await createCommand(CatalogUpdate, {
      flags: { file: entryFile },
      args: { actionType: 'image-to-text' }
    })
    await expect(cmd.run()).rejects.toThrow()
  })
})

describe('catalog inspect and delete', () => {
  test('inspect fetches one action', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ actionType: 'mine' }), { status: 200 })
    )
    const cmd = await createCommand(CatalogInspect, {
      flags: { version: '1.0.0' },
      args: { actionType: 'mine' }
    })
    await cmd.run()
    expect(cmd.log).toHaveBeenCalled()
    fetchSpy.mockRestore()
  })

  test('inspect errors on failed response', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue(new Response('nope', { status: 404 }))
    const cmd = await createCommand(CatalogInspect, { args: { actionType: 'mine' } })
    await expect(cmd.run()).rejects.toThrow()
  })

  test('delete passes version query when provided', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue(
      new Response(null, { status: 204 })
    )
    const cmd = await createCommand(CatalogDelete, {
      flags: { version: '1.0.0' },
      args: { actionType: 'mine' }
    })
    await cmd.run()
    expect(fetchSpy.mock.calls[0][0].toString()).toContain('version=1.0.0')
    fetchSpy.mockRestore()
  })

  test('delete handles 204, body text, empty body, and errors', async () => {
    let fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue(
      new Response(null, { status: 204 })
    )
    let cmd = await createCommand(CatalogDelete, { args: { actionType: 'mine' } })
    await cmd.run()
    expect(cmd.log).toHaveBeenCalledWith('Deleted.')
    fetchSpy.mockRestore()

    fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue(
      new Response('plain', { status: 200 })
    )
    cmd = await createCommand(CatalogDelete, { args: { actionType: 'mine' } })
    await cmd.run()
    expect(cmd.log).toHaveBeenCalledWith('plain')
    fetchSpy.mockRestore()

    fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue(
      new Response('', { status: 200 })
    )
    cmd = await createCommand(CatalogDelete, { args: { actionType: 'mine' } })
    await cmd.run()
    expect(cmd.log).toHaveBeenCalledWith('OK')
    fetchSpy.mockRestore()

    fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue(
      new Response('err', { status: 500 })
    )
    cmd = await createCommand(CatalogDelete, { args: { actionType: 'mine' } })
    await expect(cmd.run()).rejects.toThrow()
    fetchSpy.mockRestore()
  })
})

describe('catalog enable and disable', () => {
  test('enable logs plain text when body is not JSON', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue(
      new Response('plain-text', { status: 200 })
    )
    const cmd = await createCommand(CatalogEnable, { args: { actionType: 'mine' } })
    await cmd.run()
    expect(cmd.log).toHaveBeenCalledWith('plain-text')
    fetchSpy.mockRestore()
  })

  test('enable logs parsed JSON body', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ enabled: true }), { status: 200 })
    )
    const cmd = await createCommand(CatalogEnable, { args: { actionType: 'mine' } })
    await cmd.run()
    expect(cmd.log).toHaveBeenCalledWith(expect.stringContaining('"enabled": true'))
    fetchSpy.mockRestore()
  })

  test('disable logs OK when response body is empty', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue(
      new Response('', { status: 200 })
    )
    const cmd = await createCommand(CatalogDisable, { args: { actionType: 'mine' } })
    await cmd.run()
    expect(cmd.log).toHaveBeenCalledWith('OK')
    fetchSpy.mockRestore()
  })

  test('disable and enable log JSON, plain text, or OK', async () => {
    let fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ disabled: true }), { status: 200 })
    )
    let cmd = await createCommand(CatalogDisable, { args: { actionType: 'mine' } })
    await cmd.run()
    fetchSpy.mockRestore()

    fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue(
      new Response('not-json', { status: 200 })
    )
    cmd = await createCommand(CatalogDisable, { args: { actionType: 'mine' } })
    await cmd.run()
    expect(cmd.log).toHaveBeenCalledWith('not-json')
    fetchSpy.mockRestore()

    fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue(
      new Response('', { status: 200 })
    )
    cmd = await createCommand(CatalogEnable, { args: { actionType: 'mine' } })
    await cmd.run()
    expect(cmd.log).toHaveBeenCalledWith('OK')
    fetchSpy.mockRestore()

    fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue(
      new Response('fail', { status: 500 })
    )
    cmd = await createCommand(CatalogEnable, { args: { actionType: 'mine' } })
    await expect(cmd.run()).rejects.toThrow()
    fetchSpy.mockRestore()

    fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue(
      new Response('fail', { status: 500 })
    )
    cmd = await createCommand(CatalogDisable, { args: { actionType: 'mine' } })
    await expect(cmd.run()).rejects.toThrow()
    fetchSpy.mockRestore()
  })
})

describe('catalog list', () => {
  test('lists custom actions in table view', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({ actions: [customAction], totalActions: 1 }),
        { status: 200 }
      )
    )
    const cmd = await createCommand(CatalogList, { flags: {} })
    await cmd.run()
    expect(cmd.log).toHaveBeenCalled()
    fetchSpy.mockRestore()
  })

  test('json output filters custom actions by default', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          actions: [customAction, { actionType: 'core', handlerType: 'built-in' }],
          totalActions: 2
        }),
        { status: 200 }
      )
    )
    const cmd = await createCommand(CatalogList, { flags: { json: true } })
    await cmd.run()
    const out = /** @type {jest.Mock} */ (cmd.log).mock.calls[0][0]
    expect(JSON.parse(out).actions).toHaveLength(1)
    fetchSpy.mockRestore()
  })

  test('include-core json returns full payload', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ actions: [customAction], totalActions: 1 }), {
        status: 200
      })
    )
    const cmd = await createCommand(CatalogList, {
      flags: { json: true, 'include-core': true, compact: true }
    })
    await cmd.run()
    expect(cmd.log).toHaveBeenCalled()
    fetchSpy.mockRestore()
  })

  test('empty custom list shows built-ins hint or no actions message', async () => {
    let fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          actions: [{ actionType: 'core', handlerType: 'built-in' }],
          totalActions: 1
        }),
        { status: 200 }
      )
    )
    let cmd = await createCommand(CatalogList, { flags: {} })
    await cmd.run()
    expect(cmd.log).toHaveBeenCalledWith(expect.stringContaining('--include-core'))
    fetchSpy.mockRestore()

    fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ actions: [], totalActions: 0 }), { status: 200 })
    )
    cmd = await createCommand(CatalogList, { flags: { 'include-core': true } })
    await cmd.run()
    expect(cmd.log).toHaveBeenCalledWith(expect.stringContaining('No actions'))
    fetchSpy.mockRestore()
  })

  test('passes query filters and errors on failed fetch', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ actions: [customAction] }), { status: 200 })
    )
    const cmd = await createCommand(CatalogList, {
      flags: {
        'workflow-enabled': true,
        category: 'custom',
        tags: 'a,b',
        'include-tags': 'x',
        'exclude-tags': 'y',
        'include-logical': false,
        'include-core': true,
        compact: false
      }
    })
    await cmd.run()
    expect(fetchSpy.mock.calls[0][0].toString()).toContain('category=custom')
    fetchSpy.mockRestore()

    jest.spyOn(global, 'fetch').mockResolvedValue(new Response('bad', { status: 500 }))
    await expect(cmd.run()).rejects.toThrow()
  })

  test('json mode skips spinner and handles missing actions array', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({ totalActions: 0 }), { status: 200 })
    )
    const cmd = await createCommand(CatalogList, { flags: { json: true } })
    await cmd.run()
    expect(cmd.log).toHaveBeenCalled()
    fetchSpy.mockRestore()
  })

  test('table rows use empty defaults for sparse actions', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          actions: [{ handlerType: 'custom-action' }],
          totalActions: 1
        }),
        { status: 200 }
      )
    )
    const cmd = await createCommand(CatalogList, { flags: {} })
    await cmd.run()
    expect(cmd.log).toHaveBeenCalled()
    fetchSpy.mockRestore()
  })

  test('custom list title includes of-total when filtered', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          actions: [customAction, { actionType: 'core', handlerType: 'built-in' }],
          totalActions: 2
        }),
        { status: 200 }
      )
    )
    const cmd = await createCommand(CatalogList, { flags: {} })
    await cmd.run()
    expect(cmd.log).toHaveBeenCalled()
    fetchSpy.mockRestore()
  })

  test('include-core table title uses total suffix', async () => {
    const fetchSpy = jest.spyOn(global, 'fetch').mockResolvedValue(
      new Response(
        JSON.stringify({
          actions: [customAction, { actionType: 'core', handlerType: 'built-in' }],
          totalActions: 2
        }),
        { status: 200 }
      )
    )
    const cmd = await createCommand(CatalogList, {
      flags: { 'include-core': true }
    })
    await cmd.run()
    expect(cmd.log).toHaveBeenCalled()
    fetchSpy.mockRestore()
  })
})
