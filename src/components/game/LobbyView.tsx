'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Game, Player, Difficulty, supabase } from '@/lib/supabase'
import { buildInitialPlayerOrder } from '@/lib/game-logic'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PlayerCard } from './PlayerCard'
import { toast } from 'sonner'
import { Copy, Check, Users } from 'lucide-react'

interface Props {
  game: Game
  players: Player[]
  myPlayer: Player
  onRefresh: () => void
}

export function LobbyView({ game, players, myPlayer, onRefresh }: Props) {
  const [copied, setCopied] = useState(false)
  const [starting, setStarting] = useState(false)
  const [difficulty, setDifficulty] = useState<Difficulty>(game.difficulty ?? 'easy')
  const isHost = myPlayer.id === game.host_player_id

  async function copyCode() {
    await navigator.clipboard.writeText(game.code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function startGame() {
    if (players.length < 2) {
      toast.error('Need at least 2 players to start.')
      return
    }
    setStarting(true)
    try {
      const order = buildInitialPlayerOrder(players)
      const firstGuesser = order[0]
      const firstTarget = order[1]

      await supabase.from('games').update({
        status: 'playing',
        difficulty,
        player_order: order,
        current_guesser_id: firstGuesser,
        current_target_id: firstTarget,
        round: 1,
      }).eq('id', game.id)

      onRefresh()
    } catch (e) {
      toast.error('Failed to start game.')
      console.error(e)
    } finally {
      setStarting(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg space-y-4"
      >
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-amber-300 to-yellow-200 bg-clip-text text-transparent">
            Game Lobby
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {isHost ? 'Share the code and start when ready' : 'Waiting for host to start…'}
          </p>
        </div>

        {/* Game code card */}
        <Card className="glass border-white/10">
          <CardContent className="p-5">
            <p className="text-xs text-muted-foreground mb-2 text-center">Share this code</p>
            <div className="flex items-center gap-3">
              <div className="flex-1 text-center font-mono text-3xl font-bold tracking-[0.3em] text-amber-300 bg-white/5 rounded-xl py-3 border border-white/8">
                {game.code}
              </div>
              <Button
                variant="outline"
                size="icon"
                className="border-white/15 hover:bg-white/10 shrink-0 h-12 w-12"
                onClick={copyCode}
              >
                {copied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Players */}
        <Card className="glass border-white/10">
          <CardHeader className="pb-2 pt-4 px-5">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="w-4 h-4" />
              Players ({players.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5 space-y-2">
            {players.map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.07 }}
              >
                <PlayerCard
                  player={p}
                  isMe={p.id === myPlayer.id}
                  isHost={p.id === game.host_player_id}
                />
              </motion.div>
            ))}
            {players.length < 2 && (
              <p className="text-xs text-muted-foreground text-center py-2">
                Waiting for more players…
              </p>
            )}
          </CardContent>
        </Card>

        {/* How to play */}
        <Card className="glass border-white/10">
          <CardContent className="p-5 space-y-2 text-sm text-muted-foreground">
            <p className="font-medium text-foreground">How to play</p>
            <ul className="space-y-1 text-xs">
              <li>1. Each player secretly sets a number (1–100)</li>
              <li>2. Players take turns — the guesser picks a number for the next player</li>
              <li>3. The target player responds: Correct / Higher / Lower</li>
              <li>4. If correct, that player is eliminated</li>
              <li>5. Last player standing wins 🏆</li>
            </ul>
          </CardContent>
        </Card>

        {isHost && (
          <>
            {/* Difficulty picker */}
            <Card className="glass border-white/10">
              <CardContent className="p-4 space-y-3">
                <p className="text-xs text-muted-foreground text-center uppercase tracking-wider">Difficulty</p>
                <div className="grid grid-cols-2 gap-2">
                  {(['easy', 'hard'] as Difficulty[]).map((d) => (
                    <button
                      key={d}
                      onClick={() => setDifficulty(d)}
                      className={`rounded-xl p-3 border text-sm font-semibold transition-all ${
                        difficulty === d
                          ? d === 'easy'
                            ? 'border-amber-500/60 bg-amber-500/15 text-amber-300'
                            : 'border-red-500/60 bg-red-500/15 text-red-300'
                          : 'border-white/10 bg-white/5 text-muted-foreground hover:bg-white/10'
                      }`}
                    >
                      <div className="text-xl mb-1">{d === 'easy' ? '📖' : '🔥'}</div>
                      <div className="capitalize">{d}</div>
                      <div className="text-xs font-normal opacity-70 mt-0.5">
                        {d === 'easy' ? 'Event log visible' : 'No event log'}
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Button
              className="w-full h-12 text-base font-semibold bg-linear-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-stone-900 border-0"
              onClick={startGame}
              disabled={starting || players.length < 2}
            >
              {starting ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Starting…
                </span>
              ) : `Start Game (${players.length} players)`}
            </Button>
          </>
        )}
      </motion.div>
    </div>
  )
}
