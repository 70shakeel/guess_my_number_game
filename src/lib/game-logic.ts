import { Game, Player } from './supabase'

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
