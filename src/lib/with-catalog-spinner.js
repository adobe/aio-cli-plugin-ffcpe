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

import { ux } from '@oclif/core'

/**
 * Run work while showing {@link ux.action} (spinner in TTY, plain progress in CI).
 *
 * @template T
 * @param {string} message Status line label (e.g. "Fetching catalog actions").
 * @param {() => Promise<T>} fn Async work that performs the HTTP call(s).
 * @returns {Promise<T>} The resolved result of `fn`.
 */
export async function withCatalogSpinner (message, fn) {
  ux.action.start(message)
  try {
    return await fn()
  } finally {
    ux.action.stop()
  }
}
