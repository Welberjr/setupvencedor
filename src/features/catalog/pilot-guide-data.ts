import pilotDocument from '../../../docs/catalog-import/pilot-guides-2026-08.json'
import type { CatalogGuide, CatalogGuideLevel } from './catalog-guide'

type PilotGuideRecord = typeof pilotDocument.guides[number]

function toGuide(record: PilotGuideRecord, catalogItemId: string): CatalogGuide {
  return {
    catalogItemId,
    plainLanguage: record.plainLanguage,
    solves: record.solves,
    whenToUse: record.whenToUse,
    whenNotToUse: record.whenNotToUse,
    firstSteps: record.firstSteps,
    level: record.level as CatalogGuideLevel,
    prerequisites: record.prerequisites,
    estimatedMinutes: record.estimatedMinutes,
    sourceCheckedAt: record.sourceCheckedAt,
    sourceNote: record.sourceNote,
  }
}

export function pilotGuideForItem(slug: string, catalogItemId: string): CatalogGuide | undefined {
  const record = pilotDocument.guides.find((guide) => guide.slug === slug)
  return record ? toGuide(record, catalogItemId) : undefined
}
