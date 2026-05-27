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

import aioIms from '@adobe/aio-lib-ims'
import { CLI } from '@adobe/aio-lib-ims/src/context.js'
import { getCliEnv } from '@adobe/aio-lib-env'
import Logger from '@adobe/aio-lib-core-logging'

const aioLogger = Logger('@adobe/aio-cli-plugin-ffcpe:access-token', { provider: 'debug' })

const { context, getToken } = aioIms

/**
 * Retrieves an access token using the same strategy as @adobe/aio-cli-plugin-app auth-helper.
 *
 * @param {{ useCachedToken?: boolean }} [options] When useCachedToken is true, read cached token from IMS context without refreshing.
 * @returns {Promise<{ accessToken: string|null, env: string }>} OAuth access token (or null) and CLI environment key (prod/stage).
 */
export async function getAccessToken ({ useCachedToken = false } = {}) {
  const env = getCliEnv()
  aioLogger.debug('Retrieving CLI token env=%s', env)

  let contextName = CLI
  const currentContext = await context.getCurrent()
  if (currentContext && currentContext !== CLI) {
    contextName = currentContext
  } else {
    await context.setCli({ 'cli.bare-output': true }, false)
  }

  let accessToken = null
  if (useCachedToken) {
    const { data } = await context.get(contextName)
    accessToken = data?.access_token?.token
  } else {
    accessToken = await getToken(contextName)
  }

  return { accessToken, env }
}
