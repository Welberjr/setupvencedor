import { useState } from 'react'

export function FavoriteButton({ title }: { title: string }) {
  const [isFavorite, setIsFavorite] = useState(false)
  const label = isFavorite ? `Remover ${title} dos favoritos` : `Favoritar ${title}`
  return (
    <button aria-label={label} className={isFavorite ? 'favorite active' : 'favorite'} onClick={() => setIsFavorite((value) => !value)} type="button">
      {isFavorite ? '★ Salvo' : '☆ Favoritar'}
    </button>
  )
}
