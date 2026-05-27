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
import Logger from '@adobe/aio-lib-core-logging'

import { CONSOLE_API_KEYS } from './console-api-keys.js'
import LibConsoleCLI from '@adobe/aio-cli-lib-console'

const aioLogger = Logger('ffcpe:org')

/**
 * True when aio config already has a Console org (same shape as `aio console org select`).
 * @returns {boolean} Whether `console.org` (or legacy keys) includes an id or code.
 */
export function hasConsoleOrgInConfig () {
  const org = config.get('console.org')
  if (org && typeof org === 'object') {
    return Boolean(org.code || org.id)
  }
  return Boolean(config.get('console.org.code') || config.get('console.org.id'))
}

/**
 * Log the org already stored in aio config. This matches what `aio console where` uses for
 * the Org line (`console.org` / `console.org.name`) — it does not call the Console API.
 * `LibConsoleCLI` has no equivalent; the `where` command only reads config via the console plugin.
 */
export function logCurrentConsoleOrgFromConfig () {
  const org = config.get('console.org')
  let name
  let code
  if (org && typeof org === 'object') {
    name = org.name
    code = org.code
  }
  name = name ?? config.get('console.org.name')
  code = code ?? config.get('console.org.code')

  aioLogger.info(
    'Current Selected org: `%s` (%s)',
    name, code
  )
}

/**
 * After login, `console.org` may be unset. Fetch orgs from Adobe Developer Console and
 * persist selection like `aio console org select`: single entp org is auto-selected;
 * multiple entp orgs prompt when interactive; otherwise throw with guidance.
 *
 * @param {{
 *   accessToken: string,
 *   env: string,
 *   interactive?: boolean
 * }} params IMS token, CLI env (`prod`/`stage`), and whether to prompt when multiple orgs exist.
 * @returns {Promise<void>} Resolves after persisting `console.org` when selection succeeds.
 */
export async function ensureConsoleOrg ({ accessToken, env, interactive = process.stdin.isTTY }) {
  if (hasConsoleOrgInConfig()) {
    logCurrentConsoleOrgFromConfig()
    return
  }

  const apiKey = CONSOLE_API_KEYS[env] || CONSOLE_API_KEYS.prod

  let cli
  try {
    cli = await LibConsoleCLI.init({
      accessToken,
      apiKey,
      env
    })

    const organizations = await cli.getOrganizations()
    const entpOrgs = Array.isArray(organizations)
      ? organizations.filter((o) => o && o.type === 'entp')
      : []

    if (entpOrgs.length === 0) {
      throw new Error(
        'No enterprise organizations found for this account. Run `aio console org select` after creating one, or pass --org-id.'
      )
    }

    const orgSummary = entpOrgs
      .map((o) => `"${o.name}" (${o.code})`)
      .join('; ')
    aioLogger.info(
      'Found %d enterprise organization(s): %s',
      entpOrgs.length,
      orgSummary
    )

    let selected
    if (entpOrgs.length === 1) {
      ;[selected] = entpOrgs
      aioLogger.info(
        'Only one enterprise org available; using "%s" (%s).',
        selected.name,
        selected.code
      )
    } else if (interactive) {
      aioLogger.info(
        'Choose an organization below. To switch the active org later, run `aio console org select`, or pass --org-id to FFCPE catalog commands.'
      )
      selected = await cli.promptForSelectOrganization(entpOrgs)
    } else {
      throw new Error(
        'Multiple organizations are available but none is selected. Run `aio console org select` or pass --org-id.'
      )
    }

    config.set('console.org', {
      id: selected.id,
      code: selected.code,
      name: selected.name
    })

    aioLogger.info(
      'Saved Console organization "%s" (code %s, id %s) to aio config.',
      selected.name,
      selected.code,
      selected.id
    )
    if (entpOrgs.length > 1) {
      aioLogger.info(
        'You have multiple orgs; switch anytime with `aio console org select` or --org-id.'
      )
    }
  } finally {
    LibConsoleCLI.cleanStdOut()
  }
}
