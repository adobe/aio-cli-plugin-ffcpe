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

import { Flags } from '@oclif/core'
import { DEFAULT_CATALOG_BASE_URL } from './catalog-client.js'

/** Shared flags for `aio ffcpe catalog *` commands. */
export const catalogBaseFlags = {
  'base-url': Flags.string({
    char: 'u',
    description: `Catalog API base URL (default: ${DEFAULT_CATALOG_BASE_URL})`,
    env: 'AIO_FFCPE_CATALOG_BASE_URL'
  }),
  'org-id': Flags.string({
    description:
      'Override x-gw-ims-org-id (default: org from `aio console org select`)'
  }),
  'api-key': Flags.string({
    description:
      'Override x-api-key (default: aio-cli-console-auth / stage per CLI env)'
  }),
  json: Flags.boolean({
    description: 'Print raw JSON response',
    default: false
  })
}
