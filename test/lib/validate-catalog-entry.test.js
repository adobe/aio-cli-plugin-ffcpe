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
import { validateCatalogEntry } from '../../src/lib/validate-catalog-entry.js'
import { describe, expect, test } from '@jest/globals'

const minimalValid = {
  actionType: 'image-to-text',
  version: '1.0.0',
  name: 'Image to Text',
  description: 'Test.',
  category: 'custom',
  disabled: false,
  workflowEnabled: true,
  aliases: [],
  tags: ['t'],
  inputs: [
    {
      name: 'image',
      type: 'image',
      required: true,
      mimeTypes: ['image/jpeg']
    }
  ],
  outputs: [
    {
      name: 'text',
      type: 'text',
      mimeTypes: ['text/plain']
    }
  ],
  parameters: [],
  relatedActions: ['input-images'],
  usage: {
    commonPatterns: ['p'],
    bestPractices: ['b']
  },
  handlerType: 'custom-action',
  customActionConfig: {
    submitEndpoint: 'https://example.com/submit',
    statusEndpoint: 'https://example.com/status',
    authentication: { type: 'none' }
  }
}

describe('validateCatalogEntry', () => {
  test('accepts minimal valid entry', () => {
    expect(validateCatalogEntry(minimalValid)).toEqual([])
  })

  test('rejects bad actionType', () => {
    const errors = validateCatalogEntry({
      ...minimalValid,
      actionType: 'Bad_Name'
    })
    expect(errors.some((e) => e.includes('actionType'))).toBe(true)
  })

  test('rejects orgId', () => {
    const errors = validateCatalogEntry({
      ...minimalValid,
      orgId: 'x'
    })
    expect(errors.some((e) => e.includes('orgId'))).toBe(true)
  })

  test('rejects http endpoints', () => {
    const errors = validateCatalogEntry({
      ...minimalValid,
      customActionConfig: {
        ...minimalValid.customActionConfig,
        submitEndpoint: 'http://example.com/x'
      }
    })
    expect(errors.some((e) => e.includes('submitEndpoint'))).toBe(true)
  })
})
