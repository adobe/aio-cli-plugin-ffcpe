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

import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { beforeEach, describe, expect, jest, test } from '@jest/globals'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ensureConsoleOrgModule = path.join(__dirname, '../../src/lib/ensure-console-org.js')

let hasConsoleOrgInConfig
let logCurrentConsoleOrgFromConfig
let ensureConsoleOrg
/** @type {jest.Mock} */
let mockConfigGet
/** @type {jest.Mock} */
let mockConfigSet
/** @type {jest.Mock} */
let mockInit
/** @type {jest.Mock} */
let mockGetOrganizations
/** @type {jest.Mock} */
let mockPromptForSelectOrganization
/** @type {jest.Mock} */
let mockCleanStdOut

beforeEach(async () => {
  jest.resetModules()
  mockConfigGet = jest.fn()
  mockConfigSet = jest.fn()
  mockGetOrganizations = jest.fn()
  mockPromptForSelectOrganization = jest.fn()
  mockCleanStdOut = jest.fn()
  mockInit = jest.fn().mockResolvedValue({
    getOrganizations: mockGetOrganizations,
    promptForSelectOrganization: mockPromptForSelectOrganization
  })

  await jest.unstable_mockModule('@adobe/aio-lib-core-config', () => ({
    default: {
      get: mockConfigGet,
      set: mockConfigSet
    }
  }))
  await jest.unstable_mockModule('@adobe/aio-cli-lib-console', () => ({
    default: {
      init: mockInit,
      cleanStdOut: mockCleanStdOut
    }
  }))

  ;({ hasConsoleOrgInConfig, logCurrentConsoleOrgFromConfig, ensureConsoleOrg } =
    await import(ensureConsoleOrgModule))
})

describe('ensure-console-org', () => {
  test('hasConsoleOrgInConfig detects object and legacy keys', () => {
    mockConfigGet.mockReturnValue({ code: 'a@AdobeOrg' })
    expect(hasConsoleOrgInConfig()).toBe(true)

    mockConfigGet.mockReturnValue({ id: 'only-id' })
    expect(hasConsoleOrgInConfig()).toBe(true)

    mockConfigGet.mockImplementation((key) => {
      if (key === 'console.org') return undefined
      if (key === 'console.org.id') return 'legacy-id'
      return undefined
    })
    expect(hasConsoleOrgInConfig()).toBe(true)

    mockConfigGet.mockReturnValue(undefined)
    expect(hasConsoleOrgInConfig()).toBe(false)
  })

  test('logCurrentConsoleOrgFromConfig reads object and legacy fields', () => {
    mockConfigGet.mockImplementation((key) => {
      if (key === 'console.org') return { name: 'Org', code: 'c@AdobeOrg' }
      return undefined
    })
    expect(() => logCurrentConsoleOrgFromConfig()).not.toThrow()

    mockConfigGet.mockImplementation((key) => {
      if (key === 'console.org.name') return 'Legacy Name'
      if (key === 'console.org.code') return 'legacy@AdobeOrg'
      return undefined
    })
    expect(() => logCurrentConsoleOrgFromConfig()).not.toThrow()
  })

  test('returns early when org already configured', async () => {
    mockConfigGet.mockReturnValue({ code: 'exists@AdobeOrg', id: '1', name: 'E' })
    await ensureConsoleOrg({ accessToken: 't', env: 'prod', interactive: false })
    expect(mockInit).not.toHaveBeenCalled()
  })

  test('auto-selects single enterprise org', async () => {
    mockConfigGet.mockReturnValue(undefined)
    mockGetOrganizations.mockResolvedValue([
      { type: 'entp', id: '1', code: 'one@AdobeOrg', name: 'One' }
    ])

    await ensureConsoleOrg({ accessToken: 't', env: 'stage', interactive: false })

    expect(mockConfigSet).toHaveBeenCalledWith('console.org', {
      id: '1',
      code: 'one@AdobeOrg',
      name: 'One'
    })
    expect(mockCleanStdOut).toHaveBeenCalled()
  })

  test('prompts when multiple orgs and interactive', async () => {
    mockConfigGet.mockReturnValue(undefined)
    const orgs = [
      { type: 'entp', id: '1', code: 'a@AdobeOrg', name: 'A' },
      { type: 'entp', id: '2', code: 'b@AdobeOrg', name: 'B' }
    ]
    mockGetOrganizations.mockResolvedValue(orgs)
    mockPromptForSelectOrganization.mockResolvedValue(orgs[1])

    await ensureConsoleOrg({ accessToken: 't', env: 'prod', interactive: true })

    expect(mockPromptForSelectOrganization).toHaveBeenCalledWith(orgs)
    expect(mockConfigSet).toHaveBeenCalledWith('console.org', {
      id: '2',
      code: 'b@AdobeOrg',
      name: 'B'
    })
  })

  test('throws when no enterprise orgs', async () => {
    mockConfigGet.mockReturnValue(undefined)
    mockGetOrganizations.mockResolvedValue([{ type: 'personal', id: 'x' }])

    await expect(
      ensureConsoleOrg({ accessToken: 't', env: 'prod', interactive: false })
    ).rejects.toThrow(/No enterprise organizations/)
    expect(mockCleanStdOut).toHaveBeenCalled()
  })

  test('throws when multiple orgs and not interactive', async () => {
    mockConfigGet.mockReturnValue(undefined)
    mockGetOrganizations.mockResolvedValue([
      { type: 'entp', id: '1', code: 'a@AdobeOrg', name: 'A' },
      { type: 'entp', id: '2', code: 'b@AdobeOrg', name: 'B' }
    ])

    await expect(
      ensureConsoleOrg({ accessToken: 't', env: 'prod', interactive: false })
    ).rejects.toThrow(/Multiple organizations/)
  })

  test('uses default interactive when property omitted and multiple orgs exist', async () => {
    const stdinDesc = Object.getOwnPropertyDescriptor(process.stdin, 'isTTY')
    Object.defineProperty(process.stdin, 'isTTY', { value: true, configurable: true })
    try {
      mockConfigGet.mockReturnValue(undefined)
      const orgs = [
        { type: 'entp', id: '1', code: 'a@AdobeOrg', name: 'A' },
        { type: 'entp', id: '2', code: 'b@AdobeOrg', name: 'B' }
      ]
      mockGetOrganizations.mockResolvedValue(orgs)
      mockPromptForSelectOrganization.mockResolvedValue(orgs[0])

      await ensureConsoleOrg({ accessToken: 't', env: 'prod' })

      expect(mockPromptForSelectOrganization).toHaveBeenCalled()
    } finally {
      if (stdinDesc) {
        Object.defineProperty(process.stdin, 'isTTY', stdinDesc)
      } else {
        delete process.stdin.isTTY
      }
    }
  })

  test('uses prod api key fallback for unknown env', async () => {
    mockConfigGet.mockReturnValue(undefined)
    mockGetOrganizations.mockResolvedValue([
      { type: 'entp', id: '1', code: 'one@AdobeOrg', name: 'One' }
    ])

    await ensureConsoleOrg({ accessToken: 't', env: 'unknown', interactive: false })

    expect(mockInit).toHaveBeenCalledWith(
      expect.objectContaining({ apiKey: 'aio-cli-console-auth' })
    )
  })

  test('handles non-array organizations response', async () => {
    mockConfigGet.mockReturnValue(undefined)
    mockGetOrganizations.mockResolvedValue(null)

    await expect(
      ensureConsoleOrg({ accessToken: 't', env: 'prod', interactive: false })
    ).rejects.toThrow(/No enterprise organizations/)
  })
})
