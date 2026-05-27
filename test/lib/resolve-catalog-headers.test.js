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

const LAST_IMS_SUBJECT_KEY = 'ffcpe.catalog.lastImsSubject'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const accessTokenModule = path.join(__dirname, '../../src/lib/access-token.js')
const ensureConsoleOrgModule = path.join(__dirname, '../../src/lib/ensure-console-org.js')
const resolveCatalogHeadersModule = path.join(
  __dirname,
  '../../src/lib/resolve-catalog-headers.js'
)

let resolveCatalogHeaders
let resolveImsUserId
let resolveImsSubject
/** @type {jest.Mock} */
let mockGetAccessToken
/** @type {jest.Mock} */
let mockEnsureConsoleOrg
/** @type {jest.Mock} */
let mockConfigGet
/** @type {jest.Mock} */
let mockConfigSet
/** @type {jest.Mock} */
let mockConfigDelete
/** @type {jest.Mock} */
let mockGetTokenData

beforeEach(async () => {
  jest.resetModules()
  mockGetAccessToken = jest.fn().mockResolvedValue({ accessToken: 'tok', env: 'prod' })
  mockEnsureConsoleOrg = jest.fn().mockResolvedValue(undefined)
  mockConfigGet = jest.fn()
  mockConfigSet = jest.fn()
  mockConfigDelete = jest.fn()
  mockGetTokenData = jest.fn(() => ({}))

  await jest.unstable_mockModule(accessTokenModule, () => ({
    getAccessToken: mockGetAccessToken
  }))
  await jest.unstable_mockModule(ensureConsoleOrgModule, () => ({
    ensureConsoleOrg: mockEnsureConsoleOrg,
    logCurrentConsoleOrgFromConfig: jest.fn()
  }))
  await jest.unstable_mockModule('@adobe/aio-lib-core-config', () => ({
    default: {
      get: mockConfigGet,
      set: mockConfigSet,
      delete: mockConfigDelete
    }
  }))
  await jest.unstable_mockModule('@adobe/aio-lib-ims', () => ({
    default: {
      getTokenData: mockGetTokenData
    }
  }))

  // dynamic import so mocked dependencies apply (Jest ESM)
  // eslint-disable-next-line node/no-unsupported-features/es-syntax
  ;({ resolveCatalogHeaders, resolveImsUserId, resolveImsSubject } = await import(
    resolveCatalogHeadersModule
  ))
})

describe('resolve-catalog-headers', () => {
  test('uses org-id override and does not call ensureConsoleOrg', async () => {
    mockConfigGet.mockReturnValue(undefined)

    const h = await resolveCatalogHeaders({
      orgId: 'override@AdobeOrg',
      interactiveOrgPrompt: false
    })

    expect(mockEnsureConsoleOrg).not.toHaveBeenCalled()
    expect(h['x-gw-ims-org-id']).toBe('override@AdobeOrg')
  })

  test('reads console.org from config and skips ensureConsoleOrg', async () => {
    mockConfigGet.mockImplementation((key) => {
      if (key === 'console.org') {
        return { code: 'cfg@AdobeOrg', id: '1', name: 'N' }
      }
      return undefined
    })

    const h = await resolveCatalogHeaders({ interactiveOrgPrompt: false })

    expect(mockEnsureConsoleOrg).not.toHaveBeenCalled()
    expect(h['x-gw-ims-org-id']).toBe('cfg@AdobeOrg')
  })

  test('calls ensureConsoleOrg when org missing, then uses persisted org', async () => {
    mockConfigGet
      .mockReturnValueOnce(undefined)
      .mockReturnValueOnce(undefined)
      .mockReturnValueOnce(undefined)
      .mockReturnValueOnce(undefined)
      .mockReturnValueOnce(undefined)
      .mockReturnValueOnce(undefined)
      .mockReturnValueOnce(undefined)
      .mockReturnValueOnce({ code: 'after@AdobeOrg', id: '2', name: 'X' })

    const h = await resolveCatalogHeaders({ interactiveOrgPrompt: false })

    expect(mockEnsureConsoleOrg).toHaveBeenCalledWith({
      accessToken: 'tok',
      env: 'prod',
      interactive: false
    })
    expect(h['x-gw-ims-org-id']).toBe('after@AdobeOrg')
  })

  test('clears stale console.org when IMS subject differs from last login', async () => {
    mockGetTokenData.mockReturnValue({ sub: 'new-user' })

    let consoleOrg = { code: 'stale@AdobeOrg', id: '9', name: 'Stale' }
    let lastSubject = 'previous-user'

    mockConfigGet.mockImplementation((key) => {
      if (key === 'ffcpe.catalog.lastImsSubject') return lastSubject
      if (key === 'console.org') return consoleOrg
      return undefined
    })
    mockConfigDelete.mockImplementation((key) => {
      if (key === 'console.org') {
        consoleOrg = undefined
      }
      if (key === 'ffcpe.catalog.lastImsSubject') {
        lastSubject = undefined
      }
    })
    mockEnsureConsoleOrg.mockImplementation(async () => {
      consoleOrg = { code: 'fresh@AdobeOrg', id: '3', name: 'Fresh' }
    })

    const h = await resolveCatalogHeaders({ interactiveOrgPrompt: false })

    expect(mockConfigDelete).toHaveBeenCalledWith('console.org')
    expect(mockEnsureConsoleOrg).toHaveBeenCalled()
    expect(h['x-gw-ims-org-id']).toBe('fresh@AdobeOrg')
    expect(mockConfigSet).toHaveBeenCalledWith(
      LAST_IMS_SUBJECT_KEY,
      'new-user'
    )
  })

  test('resolveImsUserId and resolveImsSubject handle missing token and errors', () => {
    expect(resolveImsUserId('')).toBeUndefined()
    expect(resolveImsSubject(null)).toBeUndefined()

    mockGetTokenData.mockImplementation(() => {
      throw new Error('bad jwt')
    })
    expect(resolveImsUserId('tok')).toBeUndefined()
    expect(resolveImsSubject('tok')).toBeUndefined()
  })

  test('resolveImsUserId reads user_id; resolveImsSubject prefers sub', () => {
    mockGetTokenData.mockReturnValue({ user_id: 'uid-1' })
    expect(resolveImsUserId('tok')).toBe('uid-1')

    mockGetTokenData.mockReturnValue({ sub: 'sub-1' })
    expect(resolveImsSubject('tok')).toBe('sub-1')

    mockGetTokenData.mockReturnValue({ userId: 'uid-2' })
    expect(resolveImsSubject('tok')).toBe('uid-2')
  })

  test('does not clear console.org when IMS subject unchanged', async () => {
    mockGetTokenData.mockReturnValue({ sub: 'same-user' })
    mockConfigGet.mockImplementation((key) => {
      if (key === LAST_IMS_SUBJECT_KEY) return 'same-user'
      if (key === 'console.org') return { code: 'keep@AdobeOrg', id: '1', name: 'K' }
      return undefined
    })

    const h = await resolveCatalogHeaders({ interactiveOrgPrompt: false })

    expect(mockConfigDelete).not.toHaveBeenCalled()
    expect(h['x-gw-ims-org-id']).toBe('keep@AdobeOrg')
  })

  test('reads legacy console.org.code when object missing', async () => {
    mockConfigGet.mockImplementation((key) => {
      if (key === 'console.org.code') return 'legacy@AdobeOrg'
      return undefined
    })

    const h = await resolveCatalogHeaders({ interactiveOrgPrompt: false })
    expect(h['x-gw-ims-org-id']).toBe('legacy@AdobeOrg')
  })

  test('throws when access token missing', async () => {
    mockGetAccessToken.mockResolvedValue({ accessToken: null, env: 'prod' })
    await expect(resolveCatalogHeaders({})).rejects.toThrow(/IMS access token/)
  })

  test('throws when org still missing after ensureConsoleOrg', async () => {
    mockConfigGet.mockReturnValue(undefined)
    mockEnsureConsoleOrg.mockResolvedValue(undefined)
    await expect(resolveCatalogHeaders({ interactiveOrgPrompt: false })).rejects.toThrow(
      /organization context/
    )
  })

  test('passes apiKey, userId overrides and useCachedToken', async () => {
    mockConfigGet.mockReturnValue({ code: 'o@AdobeOrg', id: '1', name: 'O' })
    mockGetTokenData.mockReturnValue({ sub: 's' })

    const h = await resolveCatalogHeaders({
      apiKey: 'custom-key',
      userId: 'explicit-user',
      useCachedToken: true
    })

    expect(mockGetAccessToken).toHaveBeenCalledWith({ useCachedToken: true })
    expect(h['x-api-key']).toBe('custom-key')
    expect(h['x-gw-ims-user-id']).toBe('explicit-user')
  })

  test('returns undefined when console.org object has no id or code', async () => {
    mockConfigGet.mockImplementation((key) => {
      if (key === 'console.org') return { name: 'NoId' }
      return undefined
    })
    mockEnsureConsoleOrg.mockImplementation(async () => {
      mockConfigGet.mockReturnValue({ code: 'picked@AdobeOrg', id: '1', name: 'P' })
    })
    mockGetTokenData.mockReturnValue({ sub: 's' })

    const h = await resolveCatalogHeaders({ interactiveOrgPrompt: false })
    expect(h['x-gw-ims-org-id']).toBe('picked@AdobeOrg')
  })

  test('reads org code from console.org object when present', async () => {
    mockConfigGet.mockReturnValue({ code: 'code@AdobeOrg', id: '1', name: 'N' })
    mockGetTokenData.mockReturnValue({ sub: 's' })

    const h = await resolveCatalogHeaders({ interactiveOrgPrompt: false })
    expect(h['x-gw-ims-org-id']).toBe('code@AdobeOrg')
  })

  test('reads org id from console.org object when code missing', async () => {
    mockConfigGet.mockReturnValue({ id: 'id-only@AdobeOrg', name: 'N' })
    mockGetTokenData.mockReturnValue({ sub: 's' })

    const h = await resolveCatalogHeaders({ interactiveOrgPrompt: false })
    expect(h['x-gw-ims-org-id']).toBe('id-only@AdobeOrg')
  })

  test('resolveImsUserId falls back through token claims', () => {
    mockGetTokenData.mockReturnValue({ userId: 'u2', id: 'u3' })
    expect(resolveImsUserId('tok')).toBe('u2')
  })

  test('invalidateStaleConsoleOrg skips when no previous subject', async () => {
    mockGetTokenData.mockReturnValue({ sub: 'only' })
    mockConfigGet.mockImplementation((key) => {
      if (key === 'console.org') return { code: 'o@AdobeOrg', id: '1', name: 'O' }
      return undefined
    })

    await resolveCatalogHeaders({ interactiveOrgPrompt: false })
    expect(mockConfigDelete).not.toHaveBeenCalled()
  })

  test('reads legacy console.org.id when code keys absent', async () => {
    mockConfigGet.mockImplementation((key) => {
      if (key === 'console.org') return undefined
      if (key === 'console.org.id') return 'legacy-id-only'
      return undefined
    })
    mockGetTokenData.mockReturnValue({ sub: 's' })

    const h = await resolveCatalogHeaders({ interactiveOrgPrompt: false })
    expect(h['x-gw-ims-org-id']).toBe('legacy-id-only')
  })

  test('defaults interactive org prompt from TTY when flag omitted', async () => {
    mockConfigGet.mockReturnValue(undefined)
    mockEnsureConsoleOrg.mockImplementation(async () => {
      mockConfigGet.mockReturnValue({ code: 'tty@AdobeOrg', id: '1', name: 'T' })
    })

    await resolveCatalogHeaders({})

    expect(mockEnsureConsoleOrg).toHaveBeenCalledWith(
      expect.objectContaining({ interactive: process.stdin.isTTY })
    )
  })

  test('resolveCatalogHeaders accepts empty options', async () => {
    mockConfigGet.mockReturnValue({ code: 'o@AdobeOrg', id: '1', name: 'O' })
    mockGetTokenData.mockReturnValue({ sub: 's' })
    await expect(resolveCatalogHeaders()).resolves.toMatchObject({
      'x-gw-ims-org-id': 'o@AdobeOrg'
    })
  })

  test('falls back to prod api key for unknown env', async () => {
    mockGetAccessToken.mockResolvedValue({ accessToken: 'tok', env: 'dev' })
    mockConfigGet.mockReturnValue({ code: 'o@AdobeOrg', id: '1', name: 'O' })
    mockGetTokenData.mockReturnValue({ sub: 's' })

    const h = await resolveCatalogHeaders({ interactiveOrgPrompt: false })
    expect(h['x-api-key']).toBe('aio-cli-console-auth')
  })

  test('uses prod api key for prod env without override', async () => {
    mockGetAccessToken.mockResolvedValue({ accessToken: 'tok', env: 'prod' })
    mockConfigGet.mockReturnValue({ code: 'o@AdobeOrg', id: '1', name: 'O' })
    mockGetTokenData.mockReturnValue({ sub: 's' })

    const h = await resolveCatalogHeaders({ interactiveOrgPrompt: false })
    expect(h['x-api-key']).toBe('aio-cli-console-auth')
  })

  test('uses stage api key for non-prod env', async () => {
    mockGetAccessToken.mockResolvedValue({ accessToken: 'tok', env: 'stage' })
    mockConfigGet.mockReturnValue({ code: 'o@AdobeOrg', id: '1', name: 'O' })
    mockGetTokenData.mockReturnValue({ sub: 's' })

    const h = await resolveCatalogHeaders({ interactiveOrgPrompt: false })
    expect(h['x-api-key']).toBe('aio-cli-console-auth-stage')
  })
})
