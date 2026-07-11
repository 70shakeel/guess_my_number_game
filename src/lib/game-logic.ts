import { Game, Player, GameEvent } from './supabase'

/**
 * Binary-search bot guess for a target player.
 * Reads past response events to narrow the range each turn.
 */
export function getBotGuess(targetPlayerId: string, events: GameEvent[]): number {
  let lo = 1, hi = 100
  const relevantPairs: Array<{ guess: number; response: string }> = []

  const sorted = [...events].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
  let pendingGuess: number | null = null

  for (const e of sorted) {
    if (e.type === 'guess' && e.target_id === targetPlayerId) {
      pendingGuess = (e.payload as { number: number }).number
    } else if (e.type === 'response' && e.actor_id === targetPlayerId && pendingGuess !== null) {
      relevantPairs.push({ guess: pendingGuess, response: (e.payload as { response: string }).response })
      pendingGuess = null
    }
  }

  for (const { guess, response } of relevantPairs) {
    if (response === 'higher') lo = Math.max(lo, guess + 1)
    else if (response === 'lower') hi = Math.min(hi, guess - 1)
    else { lo = guess; hi = guess }
  }

  lo = Math.max(1, lo)
  hi = Math.min(100, hi)
  if (lo > hi) return Math.floor(Math.random() * 100) + 1
  return Math.floor((lo + hi) / 2)
}

export function getNextGuesserAndTarget(
  game: Game,
  players: Player[]
): { guesserId: string; targetId: string } | null {
  const activePlayers = players.filter((p) => !p.is_eliminated)
  if (activePlayers.length < 2) return null

  const order = game.player_order.filter((id) =>
    activePlayers.some((p) => p.id === id)
  )
  if (order.length < 2) return null

  const currentGuesserIndex = order.indexOf(game.current_guesser_id ?? order[0])
  const nextGuesserIndex = (currentGuesserIndex + 1) % order.length
  const nextTargetIndex = (nextGuesserIndex + 1) % order.length

  return {
    guesserId: order[nextGuesserIndex],
    targetId: order[nextTargetIndex],
  }
}

export function buildInitialPlayerOrder(players: Player[]): string[] {
  const shuffled = [...players]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled.map((p) => p.id)
}
