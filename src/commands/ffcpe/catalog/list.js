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

import { Command, Flags } from '@oclif/core'
import { makeTable } from '@oclif/table'
import {
  catalogFetch,
  filterCatalogListActions,
  formatCatalogError
} from '../../../lib/catalog-client.js'
import { catalogBaseFlags } from '../../../lib/catalog-cli-flags.js'
import { getCatalogRequestContext } from '../../../lib/catalog-request-context.js'
import { withCatalogSpinner } from '../../../lib/with-catalog-spinner.js'

export default class CatalogList extends Command {
  async run () {
    const { flags } = await this.parse(CatalogList)
    const { baseUrl, headers } = await getCatalogRequestContext(flags)

    const includeCore = flags['include-core'] === true
    /** Need full items for `handlerType` unless listing everything (compact strips it). */
    const queryCompact =
      includeCore === true
        ? flags.compact === undefined
          ? undefined
          : flags.compact
        : undefined

    const query = {
      workflowEnabled:
        flags['workflow-enabled'] === undefined
          ? undefined
          : flags['workflow-enabled'],
      category: flags.category,
      tags: flags.tags,
      includeTags: flags['include-tags'],
      excludeTags: flags['exclude-tags'],
      includeLogical:
        flags['include-logical'] === undefined
          ? undefined
          : flags['include-logical'],
      compact: queryCompact
    }

    const fetchList = () =>
      catalogFetch({
        baseUrl,
        path: 'catalog/actions',
        headers,
        query
      })

    const res = flags.json
      ? await fetchList()
      : await withCatalogSpinner('Fetching catalog actions', fetchList)

    if (!res.ok) {
      this.error(await formatCatalogError(res))
    }

    const data = await res.json()
    const actionsRaw = data.actions || []
    const actions = filterCatalogListActions(actionsRaw, {
      includeCore
    })

    if (flags.json) {
      const out =
        includeCore === true
          ? data
          : {
              ...data,
              actions,
              totalActions: actions.length
            }
      this.log(JSON.stringify(out, null, 2))
      return
    }
    const rows = actions.map((a) => ({
      actionType: a.actionType ?? '',
      version: a.version != null ? String(a.version) : '',
      name: a.name ?? '',
      workflowEnabled:
        a.workflowEnabled === undefined ? '' : String(a.workflowEnabled),
      disabled: a.disabled === undefined ? '' : String(a.disabled),
      description: typeof a.description === 'string' ? a.description : ''
    }))

    const apiTotal =
      typeof data.totalActions === 'number' ? data.totalActions : actionsRaw.length
    if (rows.length === 0) {
      if (!includeCore && apiTotal > 0) {
        this.log(
          `No custom catalog actions (${apiTotal} total with built-ins). Pass --include-core to list all.`
        )
      } else {
        this.log(`No actions (${apiTotal} reported).`)
      }
      return
    }

    const titleSuffix =
      includeCore === true
        ? `${actions.length} total`
        : `${actions.length} custom${apiTotal !== actions.length ? ` of ${apiTotal}` : ''}`

    this.log(
      makeTable({
        title: `Catalog actions (${titleSuffix})`,
        data: rows,
        columns: [
          { key: 'actionType', name: 'Action type', width: '18%', overflow: 'truncate' },
          { key: 'version', name: 'Version', width: '10%', overflow: 'truncate' },
          { key: 'name', name: 'Name', width: '20%', overflow: 'truncate' },
          {
            key: 'workflowEnabled',
            name: 'Workflow',
            width: '10%',
            horizontalAlignment: 'center',
            overflow: 'truncate'
          },
          {
            key: 'disabled',
            name: 'Disabled',
            width: '10%',
            horizontalAlignment: 'center',
            overflow: 'truncate'
          },
          {
            key: 'description',
            name: 'Description',
            overflow: 'wrap'
          }
        ],
        borderStyle: 'headers-only'
      })
    )
  }
}

CatalogList.description =
  'List workflow catalog actions (custom nodes only by default; use --include-core for Adobe built-ins)'

CatalogList.examples = [
  '$ aio ffcpe catalog list',
  '$ aio ffcpe catalog list --include-core',
  '$ aio ffcpe catalog list --workflow-enabled --compact --json'
]

CatalogList.flags = {
  ...catalogBaseFlags,
  'include-core': Flags.boolean({
    description:
      'Include built-in (Adobe) catalog actions; default is custom actions only (handlerType custom-action)',
    default: false
  }),
  'workflow-enabled': Flags.boolean({
    description: 'Filter to workflow-visible actions',
    allowNo: true
  }),
  category: Flags.string({ description: 'Filter by category' }),
  tags: Flags.string({
    description: 'Comma-separated tags (must match ALL)'
  }),
  'include-tags': Flags.string({
    description: 'Comma-separated tags (match ANY)'
  }),
  'exclude-tags': Flags.string({
    description: 'Comma-separated tags to exclude'
  }),
  'include-logical': Flags.boolean({
    description: 'Include control-flow nodes',
    allowNo: true
  }),
  compact: Flags.boolean({
    description:
      'Minimal fields only from the API (only honored with --include-core; custom-only lists always fetch full entries)',
    allowNo: true
  }),
  json: Flags.boolean({
    description:
      'Print catalog API JSON (custom actions only unless --include-core; totals adjusted when filtered)',
    default: false
  })
}
