export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ')
}

export function formatPrice(price: number | null | undefined): string {
  if (price == null) return '—'
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(price)
}

export function debounce<T extends (...args: Parameters<T>) => void>(fn: T, delay: number) {
  let timer: ReturnType<typeof setTimeout>
  return (...args: Parameters<T>) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }
}

// Enfriamiento del botón "actualizar precio": evita abuso y doble-clics.
// Guarda por carta cuándo se refrescó por última vez (60 min entre usos).
const PRICE_REFRESH_COOLDOWN_MS = 60 * 60 * 1000
const priceRefreshKey = (cardId: string) => `priceRefresh:${cardId}`

/** Minutos restantes de espera. 0 = puede refrescar. */
export function priceRefreshWaitMin(cardId: string): number {
  try {
    const raw = localStorage.getItem(priceRefreshKey(cardId))
    if (!raw) return 0
    const waitMs = Number(raw) + PRICE_REFRESH_COOLDOWN_MS - Date.now()
    return waitMs > 0 ? Math.ceil(waitMs / 60000) : 0
  } catch {
    return 0
  }
}

export function markPriceRefreshed(cardId: string): void {
  try {
    localStorage.setItem(priceRefreshKey(cardId), String(Date.now()))
  } catch {
    // sin almacenamiento: sin enfriamiento
  }
}
