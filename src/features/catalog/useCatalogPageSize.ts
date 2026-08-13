import { useEffect, useState } from 'react'

export function getCatalogPageSize(width: number): number {
  if (width >= 1500) return 20
  if (width >= 1180) return 16
  if (width >= 880) return 12
  if (width >= 560) return 8
  return 6
}

function readCatalogPageSize() {
  return typeof window === 'undefined' ? 20 : getCatalogPageSize(window.innerWidth)
}

export function useCatalogPageSize() {
  const [pageSize, setPageSize] = useState(readCatalogPageSize)

  useEffect(() => {
    const updatePageSize = () => setPageSize(readCatalogPageSize())
    window.addEventListener('resize', updatePageSize)
    return () => window.removeEventListener('resize', updatePageSize)
  }, [])

  return pageSize
}
