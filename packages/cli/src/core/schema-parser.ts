import PrismaInternals from '@prisma/internals'
// @ts-ignore
const { getDMMF } = PrismaInternals
import { detectPrismaProject } from './prisma-detector'

export async function parseSchema(cwd: string) {
    const project = await detectPrismaProject(cwd)
    if (!project) return null
    
    try {
        const dmmf = await getDMMF({ datamodel: project.schemaContent })
        return dmmf.datamodel
    } catch (e) {
        console.error('Schema parse error:', e)
        return null
    }
}
