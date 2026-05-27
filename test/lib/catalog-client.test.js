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
import {
  assertSafeActionType,
  catalogFetch,
  filterCatalogListActions,
  formatCatalogError,
  isCustomCatalogAction
} from '../../src/lib/catalog-client.js'
import { describe, expect, jest, test } from '@jest/globals'

describe('catalog-client', () => {
  test('assertSafeActionType accepts kebab-case', () => {
    expect(assertSafeActionType('my-action')).toBe('my-action')
  })

  test('assertSafeActionType rejects unsafe or invalid values', () => {
    expect(() => assertSafeActionType('')).toThrow('required')
    expect(() => assertSafeActionType(/** @type {any} */ (null))).toThrow(
      'required'
    )
    expect(() => assertSafeActionType('a/b')).toThrow('Invalid')
    expect(() => assertSafeActionType('a..b')).toThrow('Invalid')
    expect(() => assertSafeActionType('bad id')).toThrow('invalid characters')
    expect(assertSafeActionType('  spaced  ')).toBe('spaced')
  })

  test('catalogFetch builds URL with query', async () => {
    const fetchSpy = jest
      .spyOn(global, 'fetch')
      .mockResolvedValue(new Response('{}', { status: 200 }))

    await catalogFetch({
      baseUrl: 'http://example.test/',
      path: 'catalog/actions',
      headers: { Authorization: 'Bearer x' },
      query: { compact: true, workflowEnabled: false }
    })

    expect(fetchSpy).toHaveBeenCalled()
    const url = fetchSpy.mock.calls[0][0].toString()
    expect(url).toContain('compact=true')
    expect(url).toContain('workflowEnabled=false')

    fetchSpy.mockRestore()
  })

  test('catalogFetch omits null query keys, strips path slashes, adds base slash', async () => {
    const fetchSpy = jest
      .spyOn(global, 'fetch')
      .mockResolvedValue(new Response('', { status: 200 }))

    await catalogFetch({
      baseUrl: 'http://h.example',
      path: '/catalog/x',
      headers: { a: '1' },
      query: { skip: undefined, n: null, s: 'v', n2: 2 }
    })

    const url = fetchSpy.mock.calls[0][0].toString()
    expect(url).toMatch(/^http:\/\/h\.example\/catalog\/x/)
    expect(url).toContain('s=v')
    expect(url).toContain('n2=2')
    expect(url).not.toContain('skip')
    fetchSpy.mockRestore()
  })

  test('catalogFetch sets body for POST and strips Content-Type for DELETE', async () => {
    const fetchSpy = jest
      .spyOn(global, 'fetch')
      .mockResolvedValue(new Response('', { status: 200 }))

    await catalogFetch({
      baseUrl: 'http://x/',
      path: 'catalog/actions',
      headers: { Authorization: 'b', 'Content-Type': 'application/json' },
      method: 'POST',
      body: { foo: 1 }
    })
    let init = fetchSpy.mock.calls[0][1]
    expect(init.body).toBe(JSON.stringify({ foo: 1 }))

    await catalogFetch({
      baseUrl: 'http://x/',
      path: 'a',
      headers: { Authorization: 'b', 'Content-Type': 'application/json' },
      method: 'DELETE'
    })
    init = fetchSpy.mock.calls[1][1]
    expect(init.headers['Content-Type']).toBeUndefined()

    fetchSpy.mockRestore()
  })

  test('catalogFetch passes string body and skips body on GET', async () => {
    const fetchSpy = jest
      .spyOn(global, 'fetch')
      .mockResolvedValue(new Response('', { status: 200 }))

    await catalogFetch({
      baseUrl: 'http://x/',
      path: 'p',
      headers: {},
      method: 'PUT',
      body: '{"raw":true}'
    })
    expect(fetchSpy.mock.calls[0][1].body).toBe('{"raw":true}')

    await catalogFetch({
      baseUrl: 'http://x/',
      path: 'p',
      headers: {},
      method: 'GET',
      body: { ignored: true }
    })
    expect(fetchSpy.mock.calls[1][1].body).toBeUndefined()

    fetchSpy.mockRestore()
  })

  test('formatCatalogError handles JSON, code alias, and plain text', async () => {
    const mk = (text, status = 400) => ({
      status,
      text: async () => text
    })

    expect(
      await formatCatalogError(
        mk('{"error":"E","message":"msg","requestId":"rid"}')
      )
    ).toBe('E: msg (requestId: rid)')

    expect(await formatCatalogError(mk('{"error":"E","message":"m"}'))).toBe(
      'E: m'
    )

    expect(await formatCatalogError(mk('{"message":"only"}'))).toBe('only')

    expect(await formatCatalogError(mk('{"error":"E"}'))).toBe(
      'E: {"error":"E"}'
    )

    expect(await formatCatalogError(mk('{"code":"C","message":"m"}'))).toBe(
      'C: m'
    )

    expect(await formatCatalogError(mk('not json', 502))).toBe('not json')

    expect(await formatCatalogError(mk('', 503))).toBe('HTTP 503')
  })

  test('isCustomCatalogAction and filterCatalogListActions', () => {
    const custom = { handlerType: 'custom-action', actionType: 'mine' }
    const core = { handlerType: 'built-in', actionType: 'core' }
    const legacy = { actionType: 'no-handler' }

    expect(isCustomCatalogAction(custom)).toBe(true)
    expect(isCustomCatalogAction(core)).toBe(false)
    expect(isCustomCatalogAction(legacy)).toBe(false)

    const mixed = [custom, core, legacy]
    expect(filterCatalogListActions(mixed, { includeCore: false })).toEqual([
      custom
    ])
    expect(filterCatalogListActions(mixed, { includeCore: true })).toEqual(
      mixed
    )
    expect(filterCatalogListActions(undefined, { includeCore: false })).toEqual(
      []
    )
  })
})
