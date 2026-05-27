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
const withCatalogSpinnerModule = path.join(__dirname, '../../src/lib/with-catalog-spinner.js')

let withCatalogSpinner
const mockStart = jest.fn()
const mockStop = jest.fn()

beforeEach(async () => {
  jest.resetModules()
  mockStart.mockClear()
  mockStop.mockClear()

  await jest.unstable_mockModule('@oclif/core', () => ({
    ux: {
      action: {
        start: mockStart,
        stop: mockStop
      }
    }
  }))

  ;({ withCatalogSpinner } = await import(withCatalogSpinnerModule))
})

describe('withCatalogSpinner', () => {
  test('starts spinner, runs fn, stops in finally', async () => {
    const result = await withCatalogSpinner('Working', async () => 'done')
    expect(result).toBe('done')
    expect(mockStart).toHaveBeenCalledWith('Working')
    expect(mockStop).toHaveBeenCalled()
  })

  test('stops spinner when fn throws', async () => {
    await expect(
      withCatalogSpinner('Fail', async () => {
        throw new Error('boom')
      })
    ).rejects.toThrow('boom')
    expect(mockStop).toHaveBeenCalled()
  })
})
