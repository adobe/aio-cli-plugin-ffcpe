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
import { Command, Flags } from '@oclif/core'
import { validateCatalogEntry } from '../../../lib/validate-catalog-entry.js'

export default class CatalogValidate extends Command {
  async run () {
    const { flags } = await this.parse(CatalogValidate)
    const raw = await readFile(flags.file, 'utf8')
    let body
    try {
      body = JSON.parse(raw)
    } catch {
      this.error(`Invalid JSON in file: ${flags.file}`)
    }

    const errors = validateCatalogEntry(body)
    if (errors.length) {
      this.error(`Validation failed:\n${errors.join('\n')}`)
    }

    this.log('OK — catalog entry passes local validation.')
  }
}

CatalogValidate.description =
  'Validate a catalog-entry.json file locally (no API call)'

CatalogValidate.examples = [
  '$ aio ffcpe catalog validate --file ./catalog-entry.json'
]

CatalogValidate.flags = {
  file: Flags.string({
    char: 'f',
    description: 'Path to catalog-entry.json',
    required: true
  })
}
