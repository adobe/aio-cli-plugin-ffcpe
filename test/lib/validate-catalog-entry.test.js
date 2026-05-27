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

import { describe, expect, test } from '@jest/globals'
import { validateCatalogEntry } from '../../src/lib/validate-catalog-entry.js'
import { minimalValidCatalogEntry } from '../helpers/catalog-entry-fixture.js'

describe('validateCatalogEntry', () => {
  test('accepts minimal valid entry', () => {
    expect(validateCatalogEntry(minimalValidCatalogEntry)).toEqual([])
  })

  test('rejects non-object body', () => {
    expect(validateCatalogEntry(null)).toEqual(['Body must be a JSON object.'])
    expect(validateCatalogEntry('x')).toEqual(['Body must be a JSON object.'])
  })

  test('rejects orgId', () => {
    expect(
      validateCatalogEntry({ ...minimalValidCatalogEntry, orgId: 'x' }).some((e) =>
        e.includes('orgId')
      )
    ).toBe(true)
  })

  test('rejects invalid actionType and version', () => {
    expect(
      validateCatalogEntry({ ...minimalValidCatalogEntry, actionType: 'Bad_Name' }).length
    ).toBeGreaterThan(0)
    expect(
      validateCatalogEntry({ ...minimalValidCatalogEntry, version: 'not-semver' }).some((e) =>
        e.includes('version')
      )
    ).toBe(true)
  })

  test('rejects empty name, description, category', () => {
    for (const field of ['name', 'description', 'category']) {
      const entry = { ...minimalValidCatalogEntry, [field]: '   ' }
      expect(validateCatalogEntry(entry).some((e) => e.includes(field))).toBe(true)
    }
  })

  test('rejects non-boolean disabled and workflowEnabled', () => {
    expect(
      validateCatalogEntry({ ...minimalValidCatalogEntry, disabled: 'yes' }).some((e) =>
        e.includes('disabled')
      )
    ).toBe(true)
    expect(
      validateCatalogEntry({ ...minimalValidCatalogEntry, workflowEnabled: 1 }).some((e) =>
        e.includes('workflowEnabled')
      )
    ).toBe(true)
  })

  test('rejects non-array aliases and tags', () => {
    expect(
      validateCatalogEntry({ ...minimalValidCatalogEntry, aliases: 'x' }).some((e) =>
        e.includes('aliases')
      )
    ).toBe(true)
    expect(
      validateCatalogEntry({ ...minimalValidCatalogEntry, tags: null }).some((e) =>
        e.includes('tags')
      )
    ).toBe(true)
  })

  test('skips port name checks when inputs is not an array', () => {
    const errors = validateCatalogEntry({
      ...minimalValidCatalogEntry,
      inputs: 'not-an-array',
      outputs: [{ name: 'text', type: 'text', mimeTypes: ['text/plain'] }]
    })
    expect(errors.some((e) => e.includes('inputs must be a non-empty array'))).toBe(
      true
    )
    expect(errors.some((e) => e.includes('Each input must be an object'))).toBe(
      false
    )
  })

  test('rejects wrong handlerType and empty inputs/outputs', () => {
    expect(
      validateCatalogEntry({ ...minimalValidCatalogEntry, handlerType: 'built-in' }).some((e) =>
        e.includes('handlerType')
      )
    ).toBe(true)
    expect(
      validateCatalogEntry({ ...minimalValidCatalogEntry, inputs: [] }).some((e) =>
        e.includes('inputs')
      )
    ).toBe(true)
    expect(
      validateCatalogEntry({ ...minimalValidCatalogEntry, outputs: undefined }).some((e) =>
        e.includes('outputs')
      )
    ).toBe(true)
  })

  test('rejects output and parameter ports without names', () => {
    expect(
      validateCatalogEntry({
        ...minimalValidCatalogEntry,
        outputs: [{ name: '   ' }]
      }).some((e) => e.includes('Each output must have a name'))
    ).toBe(true)
    expect(
      validateCatalogEntry({
        ...minimalValidCatalogEntry,
        parameters: [{ name: '' }]
      }).some((e) => e.includes('Each parameter must have a name'))
    ).toBe(true)
  })

  test('validates input and output port objects', () => {
    expect(
      validateCatalogEntry({
        ...minimalValidCatalogEntry,
        inputs: [null, { name: '' }, { name: 'a' }, { name: 'a' }]
      }).length
    ).toBeGreaterThan(0)
    expect(
      validateCatalogEntry({
        ...minimalValidCatalogEntry,
        outputs: [null, { name: 'x' }, { name: 'x' }]
      }).some((e) => e.includes('Duplicate output'))
    ).toBe(true)
  })

  test('validates parameters array', () => {
    expect(
      validateCatalogEntry({ ...minimalValidCatalogEntry, parameters: 'nope' }).some((e) =>
        e.includes('parameters must be an array')
      )
    ).toBe(true)
    expect(
      validateCatalogEntry({
        ...minimalValidCatalogEntry,
        parameters: [null, { name: 'p' }, { name: 'p' }]
      }).length
    ).toBeGreaterThan(0)
  })

  test('rejects missing relatedActions and usage', () => {
    expect(
      validateCatalogEntry({ ...minimalValidCatalogEntry, relatedActions: [] }).some((e) =>
        e.includes('relatedActions')
      )
    ).toBe(true)
    expect(
      validateCatalogEntry({ ...minimalValidCatalogEntry, usage: null }).some((e) =>
        e.includes('usage object')
      )
    ).toBe(true)
    expect(
      validateCatalogEntry({
        ...minimalValidCatalogEntry,
        usage: { commonPatterns: [], bestPractices: [] }
      }).length
    ).toBeGreaterThan(0)
  })

  test('rejects bad customActionConfig endpoints', () => {
    expect(
      validateCatalogEntry({
        ...minimalValidCatalogEntry,
        customActionConfig: null
      }).some((e) => e.includes('customActionConfig'))
    ).toBe(true)
    expect(
      validateCatalogEntry({
        ...minimalValidCatalogEntry,
        customActionConfig: {
          submitEndpoint: 'http://example.com/x',
          statusEndpoint: 'not-a-url'
        }
      }).length
    ).toBeGreaterThan(0)
    expect(
      validateCatalogEntry({
        ...minimalValidCatalogEntry,
        customActionConfig: {
          submitEndpoint: 'https://example.com/submit',
          statusEndpoint: ''
        }
      }).some((e) => e.includes('statusEndpoint'))
    ).toBe(true)
  })
})
