export type CatalogItemStatus = 'draft' | 'published' | 'archived'
export type CatalogItemVisibility = 'team' | 'restricted'

export type CatalogItem = {
  id: string
  slug: string
  title: string
  type: string
  summary: string
  ownContent: string
  officialUrl: string
  sourceUrls: string[]
  instructions: string
  status: CatalogItemStatus
  visibility: CatalogItemVisibility
  category: string
  topics: string[]
  tags: string[]
}

export type CatalogFilters = {
  type?: string
  topic?: string
  tag?: string
  sort?: 'relevance' | 'recent' | 'title'
}

export type SearchResult = CatalogItem & {
  reasons: string[]
  score: number
}
