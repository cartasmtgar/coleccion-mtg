import { useCallback, useEffect, useState } from 'react'
import * as cardsService from '../services/cards.service'
import type { Card } from '../types/card'

export function useCards() {
  const [cards, setCards] = useState<Card[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await cardsService.getCards()
      setCards(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error cargando cartas')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  return { cards, loading, error, refresh, setCards }
}
