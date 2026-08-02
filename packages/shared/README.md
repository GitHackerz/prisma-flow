# @prisma-flow/shared

Shared PrismaFlow schemas, TypeScript types, and error classes used by the CLI,
local API, and dashboard.

This package is published for PrismaFlow internals and integration authors. Most
users should install the CLI package instead:

```bash
npm install -D prisma-flow
```

## Usage

```ts
import { MigrationSchema, PrismaFlowError } from "@prisma-flow/shared";
```

The public exports are generated from `src/index.ts` and include Zod schemas,
domain types, and typed errors shared across PrismaFlow packages.

Full documentation is available in the main repository:
https://github.com/prisma-flow/prisma-flow
