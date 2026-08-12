import { ChevronLeft, ChevronRight } from 'lucide-react'

type CatalogPaginationProps = {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
}

export function CatalogPagination({ currentPage, totalPages, onPageChange }: CatalogPaginationProps) {
  return <nav aria-label="Paginação do acervo" className="catalog-pagination">
    <button aria-label="Página anterior" disabled={currentPage === 1} onClick={() => onPageChange(currentPage - 1)} type="button"><ChevronLeft size={16} /> Anterior</button>
    <div className="page-numbers">{Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => <button aria-current={page === currentPage ? 'page' : undefined} aria-label={`Página ${page}`} className={page === currentPage ? 'active' : ''} key={page} onClick={() => onPageChange(page)} type="button">{page}</button>)}</div>
    <span>Página {currentPage} de {totalPages}</span>
    <button aria-label="Próxima página" disabled={currentPage === totalPages} onClick={() => onPageChange(currentPage + 1)} type="button">Próxima <ChevronRight size={16} /></button>
  </nav>
}
