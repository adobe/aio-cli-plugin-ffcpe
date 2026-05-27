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

/** Default matches .cursor/ffcpe-catalog documentation (override with --base-url / env). */
export const DEFAULT_CATALOG_BASE_URL = 'https://run-workflow.adobe.io'

const PATH_SEGMENT = /^[a-zA-Z0-9._-]+$/

/**
 * Validate and normalize an action type for safe use in URL path segments.
 * @param {string} actionType Catalog action identifier from CLI arguments.
 * @returns {string} Trimmed action type safe to embed in a URL path.
 */
export function assertSafeActionType (actionType) {
  if (!actionType || typeof actionType !== 'string') {
    throw new Error('actionType is required.')
  }
  const trimmed = actionType.trim()
  if (!trimmed || trimmed.includes('/') || trimmed.includes('..')) {
    throw new Error('Invalid actionType.')
  }
  if (!PATH_SEGMENT.test(trimmed)) {
    throw new Error(
      'actionType contains invalid characters. Use kebab-case identifiers only.'
    )
  }
  return trimmed
}

/**
 * Perform an HTTP request to the run-workflow Catalog API.
 * @param {object} params Request parameters.
 * @param {string} params.baseUrl API origin (scheme + host, optional port).
 * @param {string} params.path Path relative to origin (e.g. `catalog/actions` or `catalog/actions/foo`).
 * @param {Record<string, string>} params.headers Request headers including auth.
 * @param {string} [params.method] HTTP method (default GET).
 * @param {unknown} [params.body] JSON-serializable body for mutating requests.
 * @param {Record<string, string|boolean|number|undefined>} [params.query] Query string parameters; undefined values are omitted.
 * @returns {Promise<Response>} Fetch Response object.
 */
export async function catalogFetch ({
  baseUrl,
  path,
  headers,
  method = 'GET',
  body,
  query
}) {
  const url = new URL(path.replace(/^\/+/, ''), ensureTrailingSlash(baseUrl))

  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v === undefined || v === null) {
        continue
      }
      if (typeof v === 'boolean') {
        url.searchParams.set(k, v ? 'true' : 'false')
      } else {
        url.searchParams.set(k, String(v))
      }
    }
  }

  /** @type {{ method: string, headers: Record<string, string>, body?: string }} */
  const init = {
    method,
    headers: { ...headers }
  }

  if (method === 'GET' || method === 'HEAD' || method === 'DELETE') {
    delete init.headers['Content-Type']
  }

  if (body !== undefined && method !== 'GET' && method !== 'HEAD') {
    init.body = typeof body === 'string' ? body : JSON.stringify(body)
  }

  return fetch(url, init)
}

/**
 * True when a catalog list item is an org-registered custom action (not a built-in / core node).
 * Custom nodes are identified by `"handlerType": "custom-action"` on each catalog entry.
 * @param {unknown} action One entry from `GET /catalog/actions` `actions` array.
 * @returns {boolean} Whether `handlerType` is `custom-action`.
 */
export function isCustomCatalogAction (action) {
  return (
    typeof action === 'object' &&
    action !== null &&
    /** @type {{ handlerType?: string }} */ (action).handlerType ===
      'custom-action'
  )
}

/**
 * Default list view: only entries with `"handlerType": "custom-action"`. Set `includeCore: true`
 * to keep built-in Adobe nodes (any other `handlerType`).
 * @param {unknown[]|undefined} actions `actions` from catalog list response.
 * @param {{ includeCore?: boolean }} [options] When `includeCore` is true, return all items unchanged.
 * @returns {unknown[]} Filtered or full array (never undefined).
 */
export function filterCatalogListActions (actions, options = {}) {
  const { includeCore = false } = options
  if (!Array.isArray(actions)) {
    return []
  }
  if (includeCore) {
    return actions
  }
  return actions.filter(isCustomCatalogAction)
}

/**
 * Normalize a base URL so relative paths resolve as subpaths (not replace path).
 * @param {string} base Catalog API base URL from config or flags.
 * @returns {string} Base URL ending with `/`.
 */
function ensureTrailingSlash (base) {
  return base.endsWith('/') ? base : `${base}/`
}

/**
 * Parse error response body for CLI messaging (no secrets).
 * @param {Response} res Failed fetch response whose body may contain JSON error details.
 * @returns {Promise<string>} Single-line message suitable for `this.error()` or logging.
 */
export async function formatCatalogError (res) {
  const text = await res.text()
  try {
    const j = JSON.parse(text)
    const code = j.error || j.code || ''
    const msg = j.message || text
    const req = j.requestId ? ` (requestId: ${j.requestId})` : ''
    return `${code ? `${code}: ` : ''}${msg}${req}`.trim()
  } catch {
    return text || `HTTP ${res.status}`
  }
}
