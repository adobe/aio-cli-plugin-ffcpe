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

import { Args, Command, Flags } from '@oclif/core'
import {
  assertSafeActionType,
  catalogFetch,
  formatCatalogError
} from '../../../lib/catalog-client.js'
import { catalogBaseFlags } from '../../../lib/catalog-cli-flags.js'
import { getCatalogRequestContext } from '../../../lib/catalog-request-context.js'
import { withCatalogSpinner } from '../../../lib/with-catalog-spinner.js'

export default class CatalogInspect extends Command {
  async run () {
    const { args, flags } = await this.parse(CatalogInspect)
    const actionType = assertSafeActionType(args.actionType)
    const { baseUrl, headers } = await getCatalogRequestContext(flags)

    const query =
      flags.version !== undefined ? { version: flags.version } : undefined

    const res = await withCatalogSpinner('Fetching catalog action', () =>
      catalogFetch({
        baseUrl,
        path: `catalog/actions/${encodeURIComponent(actionType)}`,
        headers,
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

CatalogInspect.description = 'Show one catalog action definition'

CatalogInspect.examples = [
  '$ aio ffcpe catalog inspect image-to-text',
  '$ aio ffcpe catalog inspect image-to-text --version 1.0.0'
]

CatalogInspect.args = {
  actionType: Args.string({
    required: true,
    description: 'Action type or alias'
  })
}

CatalogInspect.flags = {
  ...catalogBaseFlags,
  version: Flags.string({ description: 'Specific semver version' })
}
