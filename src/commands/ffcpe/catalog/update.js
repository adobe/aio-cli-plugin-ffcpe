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

import { readFile } from 'node:fs/promises'
import { Args, Command, Flags } from '@oclif/core'
import {
  assertSafeActionType,
  catalogFetch,
  formatCatalogError
} from '../../../lib/catalog-client.js'
import { validateCatalogEntry } from '../../../lib/validate-catalog-entry.js'
import { catalogBaseFlags } from '../../../lib/catalog-cli-flags.js'
import { getCatalogRequestContext } from '../../../lib/catalog-request-context.js'
import { withCatalogSpinner } from '../../../lib/with-catalog-spinner.js'

export default class CatalogUpdate extends Command {
  async run () {
    const { args, flags } = await this.parse(CatalogUpdate)
    const actionType = assertSafeActionType(args.actionType)
    const raw = await readFile(flags.file, 'utf8')
    let body
    try {
      body = JSON.parse(raw)
    } catch {
      this.error(`Invalid JSON in file: ${flags.file}`)
    }

    const errors = validateCatalogEntry(body)
    if (errors.length) {
      if (flags.strict) {
        this.error(`Validation failed:\n${errors.join('\n')}`)
      }
      this.warn(
        `Validation warnings (${errors.length}):\n${errors.join('\n')}`
      )
    }

    const { baseUrl, headers } = await getCatalogRequestContext(flags)

    const query =
      flags.version !== undefined ? { version: flags.version } : undefined

    const res = await withCatalogSpinner('Updating catalog action', () =>
      catalogFetch({
        baseUrl,
        path: `catalog/actions/${encodeURIComponent(actionType)}`,
        headers,
        method: 'PUT',
        body,
        query
      })
    )

    if (!res.ok) {
      this.error(await formatCatalogError(res))
    }

    const data = await res.json()
    this.log(JSON.stringify(data, null, 2))
  }
}

CatalogUpdate.description =
  'Replace an existing custom catalog action (full PUT)'

CatalogUpdate.examples = [
  '$ aio ffcpe catalog update my-action --file ./catalog-entry.json'
]

CatalogUpdate.args = {
  actionType: Args.string({
    required: true,
    description: 'Action type to update'
  })
}

CatalogUpdate.flags = {
  ...catalogBaseFlags,
  file: Flags.string({
    char: 'f',
    description: 'Path to catalog-entry.json',
    required: true
  }),
  version: Flags.string({ description: 'Target semver version' }),
  strict: Flags.boolean({
    description: 'Fail if local validation errors exist',
    default: false
  })
}
