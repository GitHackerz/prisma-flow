import { logger } from '../logger.js'
// @prisma/internals does not ship official type declarations — we use a dynamic
// import with a cast to avoid brittle @ts-ignore comments while still benefiting
// from the functionality the package provides.
import { detectPrismaProject } from './prisma-detector.js'

type GetDMMFFn = (options: { datamodel: string }) => Promise<{ datamodel: unknown }>

async function loadGetDMMF(): Promise<GetDMMFFn> {
  const mod = await import('@prisma/internals')
  // The package may export as default or as a named export depending on version
  const fn =
    (mod as { getDMMF?: GetDMMFFn }).getDMMF ?? (mod.default as { getDMMF?: GetDMMFFn })?.getDMMF
  if (typeof fn !== 'function') {
    throw new Error('@prisma/internals did not export getDMMF — check the installed Prisma version')
  }
  return fn
}

export async function parseSchema(cwd: string): Promise<unknown | null> {
  const project = await detectPrismaProject(cwd)
  if (!project) return null

  try {
    const getDMMF = await loadGetDMMF()
    const dmmf = await getDMMF({ datamodel: project.schemaContent })
    return dmmf.datamodel
  } catch (err: unknown) {
    logger.error({ err }, 'Schema parse error')
    throw err
  }
}
