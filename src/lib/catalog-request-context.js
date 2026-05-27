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

import { DEFAULT_CATALOG_BASE_URL } from './catalog-client.js'
import { resolveCatalogHeaders } from './resolve-catalog-headers.js'

/**
 * Resolve base URL and authenticated headers for Catalog API commands.
 * @param {Record<string, unknown>} flags Parsed oclif flags (includes catalogBaseFlags).
 * @returns {Promise<{ baseUrl: string, headers: Record<string, string> }>} Target URL and headers for `catalogFetch`.
 */
export async function getCatalogRequestContext (flags) {
  const baseUrl =
    /** @type {string|undefined} */ (flags['base-url']) ||
    process.env.AIO_FFCPE_CATALOG_BASE_URL ||
    DEFAULT_CATALOG_BASE_URL

  const headers = await resolveCatalogHeaders({
    orgId: /** @type {string|undefined} */ (flags['org-id']),
    apiKey: /** @type {string|undefined} */ (flags['api-key'])
  })

  return { baseUrl, headers }
}
