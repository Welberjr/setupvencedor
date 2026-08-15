import { createCatalogNarrative } from './catalog-narrative'
import type { CatalogItem } from './types'

export type CatalogGuideLevel = 'iniciante' | 'intermediario' | 'avancado'

export type CatalogGuideRow = {
  catalog_item_id: string
  plain_language: string
  solves: string
  when_to_use: string
  when_not_to_use: string
  first_steps: string[]
  level: CatalogGuideLevel
  prerequisites: string[]
  estimated_minutes: number
  source_checked_at: string
  source_note: string
}

export type CatalogGuide = {
  catalogItemId: string
  plainLanguage: string
  solves: string
  whenToUse: string
  whenNotToUse: string
  firstSteps: string[]
  level: CatalogGuideLevel
  prerequisites: string[]
  estimatedMinutes: number
  sourceCheckedAt: string | null
  sourceNote: string
}

export function guideFromRow(row: CatalogGuideRow): CatalogGuide {
  return {
    catalogItemId: row.catalog_item_id,
    plainLanguage: row.plain_language,
    solves: row.solves,
    whenToUse: row.when_to_use,
    whenNotToUse: row.when_not_to_use,
    firstSteps: row.first_steps,
    level: row.level,
    prerequisites: row.prerequisites,
    estimatedMinutes: row.estimated_minutes,
    sourceCheckedAt: row.source_checked_at,
    sourceNote: row.source_note,
  }
}

export function createFallbackCatalogGuide(item: CatalogItem): CatalogGuide {
  const narrative = createCatalogNarrative(item)

  return {
    catalogItemId: item.id,
    plainLanguage: narrative.whatItIs,
    solves: narrative.impact,
    whenToUse: narrative.whenToUse,
    whenNotToUse: `Deixe ${item.title} para outra hora quando a fonte oficial não se aplicar ao contexto atual ou quando o primeiro teste ainda não puder ser validado com segurança.`,
    firstSteps: narrative.firstSteps,
    level: 'intermediario',
    prerequisites: [],
    estimatedMinutes: 15,
    sourceCheckedAt: null,
    sourceNote: `Conteúdo editorial montado a partir da fonte pública cadastrada para ${item.title}. Confirme a documentação oficial antes de executar comandos ou alterar o projeto.`,
  }
}
