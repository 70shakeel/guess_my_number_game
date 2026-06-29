'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Game, Player, Difficulty, AudioPack, supabase } from '@/lib/supabase'
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

const DIFFICULTY_OPTIONS: { value: Difficulty; icon: string; label: string; desc: string; active: string }[] = [
  { value: 'easy', icon: '📖', label: 'Easy',  desc: 'Event log visible', active: 'border-amber-500/60 bg-amber-500/15 text-amber-300' },
  { value: 'hard', icon: '🔥', label: 'Hard',  desc: 'No event log',      active: 'border-red-500/60 bg-red-500/15 text-red-300' },
]

const AUDIO_OPTIONS: { value: AudioPack; icon: string; label: string; desc: string; active: string }[] = [
  { value: 'normal', icon: '🎺', label: 'Normal', desc: 'Sad trombone & buzzer', active: 'border-amber-500/60 bg-amber-500/15 text-amber-300' },
  { value: 'kids',   icon: '🎈', label: 'Kids',   desc: 'Bouncy & silly',        active: 'border-green-500/60 bg-green-500/15 text-green-300' },
  { value: 'adult',  icon: '🔞', label: '18+',    desc: 'Dramatic crowd sounds',  active: 'border-purple-500/60 bg-purple-500/15 text-purple-300' },
]

export function LobbyView({ game, players, myPlayer, onRefresh }: Props) {
  const [copied, setCopied] = useState(false)
  const [starting, setStarting] = useState(false)
  const [difficulty, setDifficulty] = useState<Difficulty>(game.difficulty ?? 'easy')
  const [audioPack, setAudioPack] = useState<AudioPack>(game.audio_pack ?? 'normal')
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
      await supabase.from('games').update({
        status: 'playing',
        difficulty,
        audio_pack: audioPack,
        player_order: order,
        current_guesser_id: order[0],
        current_target_id: order[1],
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
          <h1 className="text-3xl font-bold bg-linear-to-r from-amber-300 to-yellow-200 bg-clip-text text-transparent">
            Game Lobby
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            {isHost ? 'Share the code and start when ready' : 'Waiting for host to start…'}
          </p>
        </div>

        {/* Game code */}
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
                <PlayerCard player={p} isMe={p.id === myPlayer.id} isHost={p.id === game.host_player_id} />
              </motion.div>
            ))}
            {players.length < 2 && (
              <p className="text-xs text-muted-foreground text-center py-2">Waiting for more players…</p>
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
              <li>3. The target responds: Higher or Lower (Correct is auto-detected)</li>
              <li>4. If correct, that player is eliminated</li>
              <li>5. Last player standing wins 🏆</li>
            </ul>
          </CardContent>
        </Card>

        {isHost && (
          <>
            {/* Difficulty */}
            <Card className="glass border-white/10">
              <CardContent className="p-4 space-y-3">
                <p className="text-xs text-muted-foreground text-center uppercase tracking-wider">Difficulty</p>
                <div className="grid grid-cols-2 gap-2">
                  {DIFFICULTY_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setDifficulty(opt.value)}
                      className={`rounded-xl p-3 border text-sm font-semibold transition-all ${
                        difficulty === opt.value ? opt.active : 'border-white/10 bg-white/5 text-muted-foreground hover:bg-white/10'
                      }`}
                    >
                      <div className="text-xl mb-1">{opt.icon}</div>
                      <div>{opt.label}</div>
                      <div className="text-xs font-normal opacity-70 mt-0.5">{opt.desc}</div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Audio pack */}
            <Card className="glass border-white/10">
              <CardContent className="p-4 space-y-3">
                <p className="text-xs text-muted-foreground text-center uppercase tracking-wider">Audio Pack</p>
                <div className="grid grid-cols-3 gap-2">
                  {AUDIO_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setAudioPack(opt.value)}
                      className={`rounded-xl p-3 border text-sm font-semibold transition-all ${
                        audioPack === opt.value ? opt.active : 'border-white/10 bg-white/5 text-muted-foreground hover:bg-white/10'
                      }`}
                    >
                      <div className="text-xl mb-1">{opt.icon}</div>
                      <div>{opt.label}</div>
                      <div className="text-xs font-normal opacity-70 mt-0.5">{opt.desc}</div>
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
