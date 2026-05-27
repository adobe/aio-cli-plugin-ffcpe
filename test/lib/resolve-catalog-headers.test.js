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
const accessTokenModule = path.join(__dirname, '../../src/lib/access-token.js')
const ensureConsoleOrgModule = path.join(__dirname, '../../src/lib/ensure-console-org.js')
const resolveCatalogHeadersModule = path.join(
  __dirname,
  '../../src/lib/resolve-catalog-headers.js'
)

let resolveCatalogHeaders
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
  ;({ resolveCatalogHeaders } = await import(resolveCatalogHeadersModule))
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
      'ffcpe.catalog.lastImsSubject',
      'new-user'
    )
  })
})
