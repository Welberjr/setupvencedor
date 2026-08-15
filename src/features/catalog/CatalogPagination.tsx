import { CommandIcon } from '../brand/CommandIcon'

type CatalogPaginationProps = {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

type PaginationToken = number | 'ellipsis-start' | 'ellipsis-end'

function getPaginationTokens(currentPage: number, totalPages: number): PaginationToken[] {
  if (totalPages <= 7) return Array.from({ length: totalPages }, (_, index) => index + 1)
  if (currentPage <= 3) return [1, 2, 3, 'ellipsis-end', totalPages]
  if (currentPage >= totalPages - 2) return [1, 'ellipsis-start', totalPages - 2, totalPages - 1, totalPages]
  return [1, 'ellipsis-start', currentPage - 1, currentPage, currentPage + 1, 'ellipsis-end', totalPages]
}

export function CatalogPagination({ currentPage, totalPages, onPageChange }: CatalogPaginationProps) {
  const tokens = getPaginationTokens(currentPage, totalPages)

  return <nav aria-label="Paginação do acervo" className="catalog-pagination">
    <button aria-label="Página anterior" disabled={currentPage === 1} onClick={() => onPageChange(currentPage - 1)} type="button"><CommandIcon name="previous" size={16} /> Anterior</button>
    <div className="page-numbers">{tokens.map((token) => typeof token === 'number'
      ? <button aria-current={token === currentPage ? 'page' : undefined} aria-label={`Página ${token}`} className={token === currentPage ? 'active' : ''} key={token} onClick={() => onPageChange(token)} type="button">{token}</button>
      : <span aria-hidden="true" className="page-ellipsis" key={token}>…</span>)}</div>
    <span>Página {currentPage} de {totalPages}</span>
    <button aria-label="Próxima página" disabled={currentPage === totalPages} onClick={() => onPageChange(currentPage + 1)} type="button">Próxima <CommandIcon name="next" size={16} /></button>
  </nav>
}
