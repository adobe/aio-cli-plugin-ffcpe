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

import { afterEach, beforeEach, describe, expect, jest, test } from '@jest/globals'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const catalogRequestContextModule = path.join(
  __dirname,
  '../../src/lib/catalog-request-context.js'
)

let getCatalogRequestContext
/** @type {jest.Mock} */
let mockResolveCatalogHeaders

beforeEach(async () => {
  jest.resetModules()
  mockResolveCatalogHeaders = jest.fn().mockResolvedValue({
    Authorization: 'Bearer t',
    'x-api-key': 'k',
    'x-gw-ims-org-id': 'o@AdobeOrg'
  })

  await jest.unstable_mockModule(
    path.join(__dirname, '../../src/lib/resolve-catalog-headers.js'),
    () => ({
      resolveCatalogHeaders: mockResolveCatalogHeaders
    })
  )

  ;({ getCatalogRequestContext } = await import(catalogRequestContextModule))
})

afterEach(() => {
  delete process.env.AIO_FFCPE_CATALOG_BASE_URL
})

describe('getCatalogRequestContext', () => {
  test('uses flag base-url and passes org/api overrides', async () => {
    const ctx = await getCatalogRequestContext({
      'base-url': 'https://custom.example/',
      'org-id': 'org@AdobeOrg',
      'api-key': 'my-key'
    })

    expect(ctx.baseUrl).toBe('https://custom.example/')
    expect(mockResolveCatalogHeaders).toHaveBeenCalledWith({
      orgId: 'org@AdobeOrg',
      apiKey: 'my-key'
    })
  })

  test('uses env AIO_FFCPE_CATALOG_BASE_URL when flag omitted', async () => {
    process.env.AIO_FFCPE_CATALOG_BASE_URL = 'https://env.example/'
    const ctx = await getCatalogRequestContext({})
    expect(ctx.baseUrl).toBe('https://env.example/')
  })

  test('uses default base URL when flag and env are omitted', async () => {
    const ctx = await getCatalogRequestContext({})
    expect(ctx.baseUrl).toBe('https://run-workflow.adobe.io')
  })
})
