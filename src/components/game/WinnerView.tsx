'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Game, Player, supabase } from '@/lib/supabase'
import { buildInitialPlayerOrder } from '@/lib/game-logic'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

interface Props {
  game: Game
  players: Player[]
  myPlayer: Player
  events: { actor_id: string | null; type: string; payload: Record<string, unknown>; created_at: string }[]
}

export function WinnerView({ game, players, myPlayer, events }: Props) {
  const router = useRouter()
  const [restarting, setRestarting] = useState(false)
  const winner = players.find((p) => p.id === game.winner_id)
  const isWinner = myPlayer.id === game.winner_id
  const isHost = myPlayer.id === game.host_player_id

  // Rank by elimination order: actor_id in a 'response'+'correct' event is the eliminated player
  // Earlier correct responses = eliminated first = lower rank
  const correctResponses = events
    .filter((e) => e.type === 'response' && (e.payload as { response: string }).response === 'correct')
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())

  // eliminationOrder[0] = first out (last place), last entry = second-to-last out (2nd place)
  const eliminationOrder = correctResponses.map((e) => e.actor_id)

  const rankedPlayers = [...players].sort((a, b) => {
    if (a.id === game.winner_id) return -1
    if (b.id === game.winner_id) return 1
    const aIdx = eliminationOrder.indexOf(a.id)
    const bIdx = eliminationOrder.indexOf(b.id)
    // Later eliminated = better rank (higher index = eliminated later = closer to winning)
    return bIdx - aIdx
  })

  const MEDALS = ['🥇', '🥈', '🥉']

  async function handlePlayAgain() {
    if (!isHost) return
    setRestarting(true)
    try {
      // Reset all players — clear secret numbers, un-eliminate everyone
      await supabase
        .from('players')
        .update({ is_eliminated: false, secret_number: null })
        .eq('game_id', game.id)

      // Delete old events
      await supabase.from('game_events').delete().eq('game_id', game.id)

      // New shuffled order
      const order = buildInitialPlayerOrder(players)

      await supabase.from('games').update({
        status: 'playing',
        winner_id: null,
        player_order: order,
        current_guesser_id: order[0],
        current_target_id: order[1],
        audio_pack: game.audio_pack,
        difficulty: game.difficulty,
        round: 1,
      }).eq('id', game.id)
    } catch (e) {
      toast.error('Failed to restart game.')
      console.error(e)
      setRestarting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="w-full max-w-sm text-center space-y-6"
      >
        {/* Confetti-like orbs */}
        {isWinner && (
          <div className="fixed inset-0 pointer-events-none overflow-hidden">
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-3 h-3 rounded-full"
                style={{
                  backgroundColor: ['#f59e0b', '#d97706', '#a3a3a3', '#22c55e', '#fbbf24'][i % 5],
                  left: `${10 + (i * 8) % 80}%`,
                  top: '-10px',
                }}
                animate={{ y: '110vh', rotate: 360, opacity: [1, 1, 0] }}
                transition={{ duration: 2.5 + i * 0.2, delay: i * 0.1, ease: 'easeIn' }}
              />
            ))}
          </div>
        )}

        <motion.div
          animate={{ rotate: [0, -10, 10, -10, 10, 0], scale: [1, 1.15, 1] }}
          transition={{ delay: 0.3, duration: 0.8 }}
          className="text-7xl"
        >
          {isWinner ? '🏆' : '💀'}
        </motion.div>

        <div>
          <h1 className="text-3xl font-bold mb-2">
            {isWinner ? 'You Won!' : `${winner?.username ?? '?'} Wins!`}
          </h1>
          <p className="text-muted-foreground text-sm">
            {isWinner
              ? 'Nobody guessed your number. You are the last cipher standing!'
              : `${winner?.username} defended their number to the end.`}
          </p>
        </div>

        {/* Player results */}
        <Card className="glass border-white/10 text-left">
          <CardContent className="p-4 space-y-2">
            {rankedPlayers.map((p, i) => (
              <div key={p.id} className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-lg flex-shrink-0"
                  style={{ backgroundColor: p.avatar_color + '33', border: `2px solid ${p.avatar_color}55` }}
                >
                  {p.avatar}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">{p.username}{p.id === myPlayer.id && ' (you)'}</p>
                  <p className="text-xs text-muted-foreground">
                    Secret: {p.secret_number ?? '?'}
                  </p>
                </div>
                <span className="text-lg">
                  {MEDALS[i] ?? '💀'}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        {isHost ? (
          <Button
            className="w-full h-12 font-semibold bg-linear-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-stone-900 border-0"
            onClick={handlePlayAgain}
            disabled={restarting}
          >
            {restarting ? (
              <span className="flex items-center gap-2">
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Restarting…
              </span>
            ) : 'Play Again'}
          </Button>
        ) : (
          <p className="text-sm text-muted-foreground text-center">
            Waiting for host to start a new game…
          </p>
        )}

        <Button
          variant="ghost"
          className="w-full text-muted-foreground hover:text-foreground"
          onClick={() => router.push('/')}
        >
          Leave Game
        </Button>
      </motion.div>
    </div>
  )
}
