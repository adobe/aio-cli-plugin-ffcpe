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

import config from '@adobe/aio-lib-core-config'
import aioIms from '@adobe/aio-lib-ims'
import { getAccessToken } from './access-token.js'
import { ensureConsoleOrg, logCurrentConsoleOrgFromConfig } from './ensure-console-org.js'
import { CONSOLE_API_KEYS } from './console-api-keys.js'

import Logger from '@adobe/aio-lib-core-logging'

const aioLogger = Logger('@adobe/aio-cli-plugin-ffcpe:resolve-catalog-headers')

const { getTokenData } = aioIms

/** Persisted IMS principal when org was chosen; cleared when login identity changes. */
export const FFCPE_CATALOG_LAST_IMS_SUBJECT_KEY = 'ffcpe.catalog.lastImsSubject'

/**
 * IMS / gateway org identifier from aio config (`console.org` object or legacy keys).
 * Prefers `code` (…@AdobeOrg) when present.
 * @returns {string|undefined} Org code or id suitable for `x-gw-ims-org-id`, if configured.
 */
function readOrgGatewayIdFromConfig () {
  const org = config.get('console.org')
  if (org && typeof org === 'object') {
    const id = org.code || org.id
    if (id) {
      return String(id)
    }
  }
  const legacyCode = config.get('console.org.code')
  const legacyId = config.get('console.org.id')
  return legacyCode || legacyId ? String(legacyCode || legacyId) : undefined
}

/**
 * Best-effort user id for x-gw-ims-user-id from JWT payload (never throws).
 * @param {string} accessToken IMS OAuth access token (JWT string).
 * @returns {string|undefined} User identifier when present in token claims; otherwise undefined.
 */
export function resolveImsUserId (accessToken) {
  if (!accessToken || typeof accessToken !== 'string') {
    return undefined
  }
  try {
    const data = getTokenData(accessToken)
    return (
      data.user_id ||
      data.userId ||
      data.sub ||
      data.id ||
      undefined
    )
  } catch {
    return undefined
  }
}

/**
 * Stable IMS identity for session checks (OAuth `sub`, else same fallback order as user id).
 * Used to drop stale `console.org` after logout / login as another user.
 * @param {string} accessToken IMS access token (JWT).
 * @returns {string|undefined} Comparable principal string when derivable from the token.
 */
export function resolveImsSubject (accessToken) {
  if (!accessToken || typeof accessToken !== 'string') {
    return undefined
  }
  try {
    const data = getTokenData(accessToken)
    if (data.sub != null && String(data.sub).length > 0) {
      return String(data.sub)
    }
    const fallback = resolveImsUserId(accessToken)
    return fallback != null ? String(fallback) : undefined
  } catch {
    return undefined
  }
}

/**
 * If aio config still holds `console.org` from a previous IMS login, clear it so org selection
 * runs again for the current token (fixes stale org after logout + login as someone else).
 * @param {string} accessToken Current IMS access token.
 */
function invalidateStaleConsoleOrgSession (accessToken) {
  const current = resolveImsSubject(accessToken)
  const previous = config.get(FFCPE_CATALOG_LAST_IMS_SUBJECT_KEY)
  if (!readOrgGatewayIdFromConfig()) {
    return
  }
  if (!current || !previous) {
    return
  }
  if (current === previous) {
    return
  }
  aioLogger.info(
    'IMS login identity changed; clearing stored Adobe Developer Console org selection.'
  )
  config.delete('console.org')
  config.delete(FFCPE_CATALOG_LAST_IMS_SUBJECT_KEY)
}

/**
 * Build HTTP headers for Catalog API requests using aio IMS + console org context.
 * @param {{
 *   orgId?: string,
 *   apiKey?: string,
 *   userId?: string,
 *   useCachedToken?: boolean,
 *   interactiveOrgPrompt?: boolean
 * }} [options] Optional overrides; org defaults from `console.org` in aio config.
 * @returns {Promise<Record<string, string>>} Headers including Authorization and gateway metadata.
 */
export async function resolveCatalogHeaders (options = {}) {
  const { accessToken, env } = await getAccessToken({
    useCachedToken: options.useCachedToken === true
  })

  if (!accessToken) {
    throw new Error(
      'Could not obtain an IMS access token. Run `aio login` and retry.'
    )
  }

  invalidateStaleConsoleOrgSession(accessToken)

  let orgId
  if (options.orgId) {
    aioLogger.info('using override org id from flags: ', options.orgId)
    orgId = options.orgId
  } else {
    orgId = readOrgGatewayIdFromConfig()
    if (!orgId) {
      await ensureConsoleOrg({
        accessToken,
        env,
        interactive:
          typeof options.interactiveOrgPrompt === 'boolean'
            ? options.interactiveOrgPrompt
            : process.stdin.isTTY
      })
      orgId = readOrgGatewayIdFromConfig()
    }
    logCurrentConsoleOrgFromConfig()
  }

  if (!orgId) {
    throw new Error(
      'Missing organization context. Run `aio console org select` or pass --org-id.'
    )
  }

  const apiKey =
    options.apiKey ||
    CONSOLE_API_KEYS[env] ||
    CONSOLE_API_KEYS.prod

  const userId = options.userId || resolveImsUserId(accessToken)

  const headers = {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
    'x-api-key': apiKey,
    'x-gw-ims-org-id': orgId
  }

  if (userId) {
    headers['x-gw-ims-user-id'] = String(userId)
  }

  const imsSubject = resolveImsSubject(accessToken)
  if (imsSubject) {
    config.set(FFCPE_CATALOG_LAST_IMS_SUBJECT_KEY, imsSubject)
  }

  return headers
}
