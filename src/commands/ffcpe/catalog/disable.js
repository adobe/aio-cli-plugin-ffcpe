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

import { Args, Command } from '@oclif/core'
import {
  assertSafeActionType,
  catalogFetch,
  formatCatalogError
} from '../../../lib/catalog-client.js'
import { catalogBaseFlags } from '../../../lib/catalog-cli-flags.js'
import { getCatalogRequestContext } from '../../../lib/catalog-request-context.js'
import { withCatalogSpinner } from '../../../lib/with-catalog-spinner.js'

export default class CatalogDisable extends Command {
  async run () {
    const { args, flags } = await this.parse(CatalogDisable)
    const actionType = assertSafeActionType(args.actionType)
    const { baseUrl, headers } = await getCatalogRequestContext(flags)

    const body = { disabled: true, workflowEnabled: false }

    const res = await withCatalogSpinner('Disabling catalog action', () =>
      catalogFetch({
        baseUrl,
        path: `catalog/actions/${encodeURIComponent(actionType)}`,
        headers,
        method: 'PUT',
        body
      })
    )

    if (!res.ok) {
      this.error(await formatCatalogError(res))
    }

    const text = await res.text()
    if (text) {
      try {
        this.log(JSON.stringify(JSON.parse(text), null, 2))
      } catch {
        this.log(text)
      }
    } else {
      this.log('OK')
    }
  }
}

CatalogDisable.description =
  'Disable a catalog action (and hide from workflow UI by default)'

CatalogDisable.examples = ['$ aio ffcpe catalog disable my-action']

CatalogDisable.args = {
  actionType: Args.string({
    required: true,
    description: 'Action type'
  })
}

CatalogDisable.flags = {
  ...catalogBaseFlags
}
