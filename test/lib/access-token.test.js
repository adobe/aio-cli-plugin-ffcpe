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
const accessTokenModule = path.join(__dirname, '../../src/lib/access-token.js')

let getAccessToken
/** @type {jest.Mock} */
let mockGetToken
/** @type {jest.Mock} */
let mockContextGet
/** @type {jest.Mock} */
let mockContextGetCurrent
/** @type {jest.Mock} */
let mockContextSetCli

beforeEach(async () => {
  jest.resetModules()
  mockGetToken = jest.fn().mockResolvedValue('fresh-token')
  mockContextGet = jest.fn().mockResolvedValue({
    data: { access_token: { token: 'cached-token' } }
  })
  mockContextGetCurrent = jest.fn().mockResolvedValue(undefined)
  mockContextSetCli = jest.fn().mockResolvedValue(undefined)

  await jest.unstable_mockModule('@adobe/aio-lib-env', () => ({
    getCliEnv: () => 'prod'
  }))
  await jest.unstable_mockModule('@adobe/aio-lib-ims', () => ({
    default: {
      context: {
        getCurrent: mockContextGetCurrent,
        setCli: mockContextSetCli,
        get: mockContextGet
      },
      getToken: mockGetToken
    }
  }))

  ;({ getAccessToken } = await import(accessTokenModule))
})

describe('getAccessToken', () => {
  test('fetches fresh token on default path', async () => {
    const result = await getAccessToken()
    expect(result).toEqual({ accessToken: 'fresh-token', env: 'prod' })
    expect(mockGetToken).toHaveBeenCalledWith(expect.any(String))
    expect(mockContextSetCli).toHaveBeenCalled()
  })

  test('uses cached token when requested', async () => {
    const result = await getAccessToken({ useCachedToken: true })
    expect(result.accessToken).toBe('cached-token')
    expect(mockGetToken).not.toHaveBeenCalled()
  })

  test('uses non-CLI IMS context when set', async () => {
    mockContextGetCurrent.mockResolvedValue('other-context')
    await getAccessToken()
    expect(mockContextSetCli).not.toHaveBeenCalled()
    expect(mockGetToken).toHaveBeenCalledWith('other-context')
  })
})
