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

export default class CatalogDelete extends Command {
  async run () {
    const { args, flags } = await this.parse(CatalogDelete)
    const actionType = assertSafeActionType(args.actionType)
    const { baseUrl, headers } = await getCatalogRequestContext(flags)

    const query =
      flags.version !== undefined ? { version: flags.version } : undefined

    const res = await withCatalogSpinner('Deleting catalog action', () =>
      catalogFetch({
        baseUrl,
        path: `catalog/actions/${encodeURIComponent(actionType)}`,
        headers,
        method: 'DELETE',
        query
      })
    )

    if (!res.ok) {
      this.error(await formatCatalogError(res))
    }

    if (res.status === 204) {
      this.log('Deleted.')
      return
    }

    const text = await res.text()
    if (text) {
      this.log(text)
    } else {
      this.log('OK')
    }
  }
}

CatalogDelete.description = 'Delete a custom catalog action'

CatalogDelete.examples = [
  '$ aio ffcpe catalog delete my-action',
  '$ aio ffcpe catalog delete my-action --version 1.0.0'
]

CatalogDelete.args = {
  actionType: Args.string({
    required: true,
    description: 'Action type'
  })
}

CatalogDelete.flags = {
  ...catalogBaseFlags,
  version: Flags.string({ description: 'Delete a specific semver only' })
}
