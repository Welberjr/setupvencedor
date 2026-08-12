type FavoriteButtonProps = {
  title: string
  isFavorite: boolean
  onToggle: () => Promise<void> | void
}

export function FavoriteButton({ title, isFavorite, onToggle }: FavoriteButtonProps) {
  const label = isFavorite ? `Remover ${title} dos favoritos` : `Favoritar ${title}`
  return <button aria-label={label} className={isFavorite ? 'favorite active' : 'favorite'} onClick={() => void onToggle()} type="button">
    {isFavorite ? '★ Salvo' : '☆ Favoritar'}
  </button>
}
