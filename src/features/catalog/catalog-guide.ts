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
  sourceCheckedAt: string
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
