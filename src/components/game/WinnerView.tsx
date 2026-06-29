'use client'

import { motion } from 'framer-motion'
import { Game, Player } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useRouter } from 'next/navigation'

interface Props {
  game: Game
  players: Player[]
  myPlayer: Player
}

export function WinnerView({ game, players, myPlayer }: Props) {
  const router = useRouter()
  const winner = players.find((p) => p.id === game.winner_id)
  const isWinner = myPlayer.id === game.winner_id

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
            {players
              .sort((a, b) => (a.id === game.winner_id ? -1 : b.id === game.winner_id ? 1 : 0))
              .map((p, i) => (
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
                      {p.secret_number ? `Secret: ${p.secret_number}` : 'No number set'}
                    </p>
                  </div>
                  <span className="text-lg">
                    {p.id === game.winner_id ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : '💀'}
                  </span>
                </div>
              ))}
          </CardContent>
        </Card>

        <Button
          className="w-full h-12 font-semibold bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-stone-900 border-0"
          onClick={() => router.push('/')}
        >
          Play Again
        </Button>
      </motion.div>
    </div>
  )
}
