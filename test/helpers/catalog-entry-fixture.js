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

/** Minimal valid catalog entry for tests. */
export const minimalValidCatalogEntry = {
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
