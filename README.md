# @adobe/aio-cli-plugin-ffcpe

Adobe I/O CLI plugin for **FFCPE** (**Firefly Creative Production for Enterprise**) — manage custom catalog entries against the run-workflow Catalog API (`aio ffcpe catalog` commands).

**Authentication:** uses the same IMS OAuth token as the CLI (`aio login`). Set your org with `aio console org select` so `x-gw-ims-org-id` is available.

<!-- toc -->
* [@adobe/aio-cli-plugin-ffcpe](#adobeaio-cli-plugin-ffcpe)
* [Usage](#usage)
* [Agent skills (Cursor & Claude Code)](#agent-skills-cursor--claude-code)
* [Commands](#commands)
<!-- tocstop -->


# Usage

```sh-session
$ aio plugins:install @adobe/aio-cli-plugin-ffcpe
$ aio login
$ aio console org select
$ aio ffcpe catalog --help
```

# Agent skills (Cursor & Claude Code)

Bundled skills ([`skills/`](./skills/): `aio-ffcpe-cli`, `ffcpe-catalog-entry-json`) use the [open agent skills](https://github.com/vercel-labs/skills) format. Install all of them with the [Skills CLI](https://github.com/vercel-labs/skills) ([skills.sh](https://skills.sh/)):

```sh-session
npx skills add adobe/aio-cli-plugin-ffcpe --all -y
```

More options (agents, global scope, local clone): **[`skills/README.md`](./skills/README.md)**.

# Commands
<!-- commands -->
* [`aio ffcpe`](#aio-ffcpe)
* [`aio ffcpe catalog`](#aio-ffcpe-catalog)
* [`aio ffcpe catalog delete ACTIONTYPE`](#aio-ffcpe-catalog-delete-actiontype)
* [`aio ffcpe catalog disable ACTIONTYPE`](#aio-ffcpe-catalog-disable-actiontype)
* [`aio ffcpe catalog enable ACTIONTYPE`](#aio-ffcpe-catalog-enable-actiontype)
* [`aio ffcpe catalog inspect ACTIONTYPE`](#aio-ffcpe-catalog-inspect-actiontype)
* [`aio ffcpe catalog list`](#aio-ffcpe-catalog-list)
* [`aio ffcpe catalog register`](#aio-ffcpe-catalog-register)
* [`aio ffcpe catalog update ACTIONTYPE`](#aio-ffcpe-catalog-update-actiontype)
* [`aio ffcpe catalog validate`](#aio-ffcpe-catalog-validate)
* [`aio help [COMMAND]`](#aio-help-command)

## `aio ffcpe`

FFCPE (Firefly Creative Production for Enterprise) — aio ffcpe catalog (catalog API)

```
USAGE
  $ aio ffcpe

DESCRIPTION
  FFCPE (Firefly Creative Production for Enterprise) — aio ffcpe catalog (catalog API)
```

_See code: [src/commands/ffcpe/index.js](https://github.com/adobe/aio-cli-plugin-ffcpe/blob/0.0.0/src/commands/ffcpe/index.js)_

## `aio ffcpe catalog`

Manage FFCPE catalog actions (run-workflow service)

```
USAGE
  $ aio ffcpe catalog

DESCRIPTION
  Manage FFCPE catalog actions (run-workflow service)
```

_See code: [src/commands/ffcpe/catalog/index.js](https://github.com/adobe/aio-cli-plugin-ffcpe/blob/0.0.0/src/commands/ffcpe/catalog/index.js)_

## `aio ffcpe catalog delete ACTIONTYPE`

Delete a custom catalog action

```
USAGE
  $ aio ffcpe catalog delete ACTIONTYPE [-u <value>] [--org-id <value>] [--api-key <value>] [--json] [--version <value>]

ARGUMENTS
  ACTIONTYPE  Action type

FLAGS
  -u, --base-url=<value>  [env: AIO_FFCPE_CATALOG_BASE_URL] Catalog API base URL (default:
                          https://run-workflow.adobe.io)
      --api-key=<value>   Override x-api-key (default: aio-cli-console-auth / stage per CLI env)
      --json              Print raw JSON response
      --org-id=<value>    Override x-gw-ims-org-id (default: org from `aio console org select`)
      --version=<value>   Delete a specific semver only

DESCRIPTION
  Delete a custom catalog action

EXAMPLES
  $ aio ffcpe catalog delete my-action

  $ aio ffcpe catalog delete my-action --version 1.0.0
```

_See code: [src/commands/ffcpe/catalog/delete.js](https://github.com/adobe/aio-cli-plugin-ffcpe/blob/0.0.0/src/commands/ffcpe/catalog/delete.js)_

## `aio ffcpe catalog disable ACTIONTYPE`

Disable a catalog action (and hide from workflow UI by default)

```
USAGE
  $ aio ffcpe catalog disable ACTIONTYPE [-u <value>] [--org-id <value>] [--api-key <value>] [--json]

ARGUMENTS
  ACTIONTYPE  Action type

FLAGS
  -u, --base-url=<value>  [env: AIO_FFCPE_CATALOG_BASE_URL] Catalog API base URL (default:
                          https://run-workflow.adobe.io)
      --api-key=<value>   Override x-api-key (default: aio-cli-console-auth / stage per CLI env)
      --json              Print raw JSON response
      --org-id=<value>    Override x-gw-ims-org-id (default: org from `aio console org select`)

DESCRIPTION
  Disable a catalog action (and hide from workflow UI by default)

EXAMPLES
  $ aio ffcpe catalog disable my-action
```

_See code: [src/commands/ffcpe/catalog/disable.js](https://github.com/adobe/aio-cli-plugin-ffcpe/blob/0.0.0/src/commands/ffcpe/catalog/disable.js)_

## `aio ffcpe catalog enable ACTIONTYPE`

Enable a previously disabled catalog action

```
USAGE
  $ aio ffcpe catalog enable ACTIONTYPE [-u <value>] [--org-id <value>] [--api-key <value>] [--json]

ARGUMENTS
  ACTIONTYPE  Action type

FLAGS
  -u, --base-url=<value>  [env: AIO_FFCPE_CATALOG_BASE_URL] Catalog API base URL (default:
                          https://run-workflow.adobe.io)
      --api-key=<value>   Override x-api-key (default: aio-cli-console-auth / stage per CLI env)
      --json              Print raw JSON response
      --org-id=<value>    Override x-gw-ims-org-id (default: org from `aio console org select`)

DESCRIPTION
  Enable a previously disabled catalog action

EXAMPLES
  $ aio ffcpe catalog enable my-action
```

_See code: [src/commands/ffcpe/catalog/enable.js](https://github.com/adobe/aio-cli-plugin-ffcpe/blob/0.0.0/src/commands/ffcpe/catalog/enable.js)_

## `aio ffcpe catalog inspect ACTIONTYPE`

Show one catalog action definition

```
USAGE
  $ aio ffcpe catalog inspect ACTIONTYPE [-u <value>] [--org-id <value>] [--api-key <value>] [--json] [--version
  <value>]

ARGUMENTS
  ACTIONTYPE  Action type or alias

FLAGS
  -u, --base-url=<value>  [env: AIO_FFCPE_CATALOG_BASE_URL] Catalog API base URL (default:
                          https://run-workflow.adobe.io)
      --api-key=<value>   Override x-api-key (default: aio-cli-console-auth / stage per CLI env)
      --json              Print raw JSON response
      --org-id=<value>    Override x-gw-ims-org-id (default: org from `aio console org select`)
      --version=<value>   Specific semver version

DESCRIPTION
  Show one catalog action definition

EXAMPLES
  $ aio ffcpe catalog inspect image-to-text

  $ aio ffcpe catalog inspect image-to-text --version 1.0.0
```

_See code: [src/commands/ffcpe/catalog/inspect.js](https://github.com/adobe/aio-cli-plugin-ffcpe/blob/0.0.0/src/commands/ffcpe/catalog/inspect.js)_

## `aio ffcpe catalog list`

List workflow catalog actions (custom nodes only by default; use --include-core for Adobe built-ins)

```
USAGE
  $ aio ffcpe catalog list [-u <value>] [--org-id <value>] [--api-key <value>] [--json] [--include-core]
    [--workflow-enabled] [--category <value>] [--tags <value>] [--include-tags <value>] [--exclude-tags <value>]
    [--include-logical] [--compact]

FLAGS
  -u, --base-url=<value>       [env: AIO_FFCPE_CATALOG_BASE_URL] Catalog API base URL (default:
                               https://run-workflow.adobe.io)
      --api-key=<value>        Override x-api-key (default: aio-cli-console-auth / stage per CLI env)
      --category=<value>       Filter by category
      --[no-]compact           Minimal fields only from the API (only honored with --include-core; custom-only lists
                               always fetch full entries)
      --exclude-tags=<value>   Comma-separated tags to exclude
      --include-core           Include built-in (Adobe) catalog actions; default is custom actions only (handlerType
                               custom-action)
      --[no-]include-logical   Include control-flow nodes
      --include-tags=<value>   Comma-separated tags (match ANY)
      --json                   Print catalog API JSON (custom actions only unless --include-core; totals adjusted when
                               filtered)
      --org-id=<value>         Override x-gw-ims-org-id (default: org from `aio console org select`)
      --tags=<value>           Comma-separated tags (must match ALL)
      --[no-]workflow-enabled  Filter to workflow-visible actions

DESCRIPTION
  List workflow catalog actions (custom nodes only by default; use --include-core for Adobe built-ins)

EXAMPLES
  $ aio ffcpe catalog list

  $ aio ffcpe catalog list --include-core

  $ aio ffcpe catalog list --workflow-enabled --compact --json
```

_See code: [src/commands/ffcpe/catalog/list.js](https://github.com/adobe/aio-cli-plugin-ffcpe/blob/0.0.0/src/commands/ffcpe/catalog/list.js)_

## `aio ffcpe catalog register`

Register a new custom catalog action from JSON

```
USAGE
  $ aio ffcpe catalog register -f <value> [-u <value>] [--org-id <value>] [--api-key <value>] [--json] [--strict]

FLAGS
  -f, --file=<value>      (required) Path to catalog-entry.json
  -u, --base-url=<value>  [env: AIO_FFCPE_CATALOG_BASE_URL] Catalog API base URL (default:
                          https://run-workflow.adobe.io)
      --api-key=<value>   Override x-api-key (default: aio-cli-console-auth / stage per CLI env)
      --json              Print raw JSON response
      --org-id=<value>    Override x-gw-ims-org-id (default: org from `aio console org select`)
      --strict            Fail if local validation errors exist

DESCRIPTION
  Register a new custom catalog action from JSON

EXAMPLES
  $ aio ffcpe catalog register --file ./catalog-entry.json
```

_See code: [src/commands/ffcpe/catalog/register.js](https://github.com/adobe/aio-cli-plugin-ffcpe/blob/0.0.0/src/commands/ffcpe/catalog/register.js)_

## `aio ffcpe catalog update ACTIONTYPE`

Replace an existing custom catalog action (full PUT)

```
USAGE
  $ aio ffcpe catalog update ACTIONTYPE -f <value> [-u <value>] [--org-id <value>] [--api-key <value>] [--json] [--version
    <value>] [--strict]

ARGUMENTS
  ACTIONTYPE  Action type to update

FLAGS
  -f, --file=<value>      (required) Path to catalog-entry.json
  -u, --base-url=<value>  [env: AIO_FFCPE_CATALOG_BASE_URL] Catalog API base URL (default:
                          https://run-workflow.adobe.io)
      --api-key=<value>   Override x-api-key (default: aio-cli-console-auth / stage per CLI env)
      --json              Print raw JSON response
      --org-id=<value>    Override x-gw-ims-org-id (default: org from `aio console org select`)
      --strict            Fail if local validation errors exist
      --version=<value>   Target semver version

DESCRIPTION
  Replace an existing custom catalog action (full PUT)

EXAMPLES
  $ aio ffcpe catalog update my-action --file ./catalog-entry.json
```

_See code: [src/commands/ffcpe/catalog/update.js](https://github.com/adobe/aio-cli-plugin-ffcpe/blob/0.0.0/src/commands/ffcpe/catalog/update.js)_

## `aio ffcpe catalog validate`

Validate a catalog-entry.json file locally (no API call)

```
USAGE
  $ aio ffcpe catalog validate -f <value>

FLAGS
  -f, --file=<value>  (required) Path to catalog-entry.json

DESCRIPTION
  Validate a catalog-entry.json file locally (no API call)

EXAMPLES
  $ aio ffcpe catalog validate --file ./catalog-entry.json
```

_See code: [src/commands/ffcpe/catalog/validate.js](https://github.com/adobe/aio-cli-plugin-ffcpe/blob/0.0.0/src/commands/ffcpe/catalog/validate.js)_

## `aio help [COMMAND]`

Display help for aio.

```
USAGE
  $ aio help [COMMAND...] [-n]

ARGUMENTS
  [COMMAND...]  Command to show help for.

FLAGS
  -n, --nested-commands  Include all nested commands in the output.

DESCRIPTION
  Display help for aio.
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/6.2.46/src/commands/help.ts)_
<!-- commandsstop -->

## Development

For development, it is useful to use aio plugins:link to link to a local clone of this repository rather than a specific npm module, e.g.

```
$ git clone git@github.com:adobe/aio-cli-plugin-ffcpe.git
$ git checkout -B <your feature branch>
$ npm install
$ aio plugins:link
$ aio ffcpe <some command>
```


## Contributing

Contributions are welcomed! Read the [Contributing Guide](CONTRIBUTING.md) for more information.

## Licensing

This project is licensed under the Apache V2 License. See [LICENSE](LICENSE) for more information.
