'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Game, Player, GameEvent, supabase } from '@/lib/supabase'
import { getNextGuesserAndTarget } from '@/lib/game-logic'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PlayerCard } from './PlayerCard'
import { toast } from 'sonner'
import { ScrollArea } from '@/components/ui/scroll-area'

interface Props {
  game: Game
  players: Player[]
  myPlayer: Player
  events: GameEvent[]
  onRefresh: () => void
}

export function GameplayView({ game, players, myPlayer, events, onRefresh }: Props) {
  const [guessInput, setGuessInput] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const activePlayers = players.filter((p) => !p.is_eliminated)
  const guesser = players.find((p) => p.id === game.current_guesser_id)
  const target = players.find((p) => p.id === game.current_target_id)

  const isMyTurnToGuess = myPlayer.id === game.current_guesser_id
  const isMyTurnToRespond = myPlayer.id === game.current_target_id

  // Find the pending guess event (guess without a response yet)
  const lastGuessEvent = [...events].reverse().find((e) => e.type === 'guess')
  const lastResponseEvent = [...events].reverse().find((e) => e.type === 'response')
  const hasPendingGuess =
    lastGuessEvent &&
    (!lastResponseEvent || new Date(lastGuessEvent.created_at) > new Date(lastResponseEvent.created_at))

  const pendingGuessValue = hasPendingGuess ? (lastGuessEvent!.payload as { number: number }).number : null

  async function submitGuess() {
    const n = parseInt(guessInput)
    if (isNaN(n) || n < 1 || n > 100) {
      toast.error('Enter a number between 1 and 100.')
      return
    }
    setSubmitting(true)
    try {
      await supabase.from('game_events').insert({
        game_id: game.id,
        type: 'guess',
        actor_id: myPlayer.id,
        target_id: game.current_target_id,
        payload: { number: n },
      })
      setGuessInput('')
      onRefresh()
    } catch {
      toast.error('Failed to submit guess.')
    } finally {
      setSubmitting(false)
    }
  }

  async function submitResponse(response: 'correct' | 'higher' | 'lower') {
    if (!hasPendingGuess) return
    setSubmitting(true)
    try {
      await supabase.from('game_events').insert({
        game_id: game.id,
        type: 'response',
        actor_id: myPlayer.id,
        target_id: game.current_guesser_id,
        payload: { response, guessed_number: pendingGuessValue },
      })

      if (response === 'correct') {
        // Eliminate this player
        await supabase.from('players').update({ is_eliminated: true }).eq('id', myPlayer.id)

        // Check if only one remains
        const { data: remaining } = await supabase
          .from('players')
          .select()
          .eq('game_id', game.id)
          .eq('is_eliminated', false)

        const stillActive = (remaining ?? []).filter((p) => p.id !== myPlayer.id)

        if (stillActive.length === 1) {
          const winner = stillActive[0]
          await supabase.from('games').update({
            status: 'finished',
            winner_id: winner.id,
          }).eq('id', game.id)

          await supabase.from('game_events').insert({
            game_id: game.id,
            type: 'win',
            actor_id: winner.id,
            payload: { winner_username: winner.username },
          })
        } else {
          // Advance turn — next guesser and target
          const freshPlayers = (remaining ?? []).filter((p) => p.id !== myPlayer.id)
          const order = game.player_order.filter((id) =>
            freshPlayers.some((p) => p.id === id)
          )
          const currentGuesserIdx = order.indexOf(game.current_guesser_id ?? order[0])
          const nextGuesserIdx = (currentGuesserIdx + 1) % order.length
          const nextTargetIdx = (nextGuesserIdx + 1) % order.length

          await supabase.from('games').update({
            current_guesser_id: order[nextGuesserIdx],
            current_target_id: order[nextTargetIdx],
            round: game.round + 1,
          }).eq('id', game.id)
        }
      } else {
        // Advance turn without elimination
        const order = game.player_order.filter((id) =>
          activePlayers.some((p) => p.id === id)
        )
        const currentGuesserIdx = order.indexOf(game.current_guesser_id ?? order[0])
        const nextGuesserIdx = (currentGuesserIdx + 1) % order.length
        const nextTargetIdx = (nextGuesserIdx + 1) % order.length

        await supabase.from('games').update({
          current_guesser_id: order[nextGuesserIdx],
          current_target_id: order[nextTargetIdx],
          round: game.round + 1,
        }).eq('id', game.id)
      }

      onRefresh()
    } catch (e) {
      toast.error('Failed to submit response.')
      console.error(e)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen p-4">
      <div className="max-w-2xl mx-auto space-y-4 pt-6">
        {/* Round indicator */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Round {game.round}</span>
          <span className="text-xs text-muted-foreground">{activePlayers.length} players remaining</span>
        </div>

        {/* Current turn info */}
        <Card className="glass border-white/10">
          <CardContent className="p-5">
            <AnimatePresence mode="wait">
              <motion.div
                key={`${game.current_guesser_id}-${game.current_target_id}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="flex items-center justify-between gap-4"
              >
                <div className="text-center flex-1">
                  <p className="text-xs text-yellow-400 mb-1">Guesser</p>
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-2xl mx-auto mb-1"
                    style={{ backgroundColor: (guesser?.avatar_color ?? '#6366f1') + '33', border: `2px solid ${(guesser?.avatar_color ?? '#6366f1')}66` }}
                  >
                    {guesser?.avatar ?? '?'}
                  </div>
                  <p className="text-sm font-medium">{guesser?.username ?? '…'}</p>
                </div>

                <div className="text-2xl text-muted-foreground">→</div>

                <div className="text-center flex-1">
                  <p className="text-xs text-red-400 mb-1">Target</p>
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-2xl mx-auto mb-1"
                    style={{ backgroundColor: (target?.avatar_color ?? '#ec4899') + '33', border: `2px solid ${(target?.avatar_color ?? '#ec4899')}66` }}
                  >
                    {target?.avatar ?? '?'}
                  </div>
                  <p className="text-sm font-medium">{target?.username ?? '…'}</p>
                </div>
              </motion.div>
            </AnimatePresence>
          </CardContent>
        </Card>

        {/* Pending guess display */}
        <AnimatePresence>
          {hasPendingGuess && pendingGuessValue !== null && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <Card className="border-yellow-500/30 bg-yellow-500/10">
                <CardContent className="p-4 text-center">
                  <p className="text-xs text-yellow-400 mb-1">
                    {guesser?.username} guessed
                  </p>
                  <p className="text-5xl font-bold font-mono text-yellow-300">{pendingGuessValue}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {isMyTurnToRespond ? 'Is this your number?' : `Waiting for ${target?.username} to respond…`}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action area */}
        <AnimatePresence mode="wait">
          {isMyTurnToGuess && !hasPendingGuess && (
            <motion.div
              key="guess-input"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <Card className="glass border-amber-500/30 bg-amber-500/8">
                <CardContent className="p-5 space-y-3">
                  <p className="text-sm font-medium text-center text-amber-300">
                    Your turn! Guess {target?.username}&apos;s number
                  </p>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      min={1}
                      max={100}
                      value={guessInput}
                      onChange={(e) => setGuessInput(e.target.value)}
                      placeholder="1 – 100"
                      className="h-12 text-center text-xl font-mono bg-white/5 border-white/10 focus:border-amber-500/60"
                      onKeyDown={(e) => e.key === 'Enter' && submitGuess()}
                      autoFocus
                    />
                    <Button
                      className="h-12 px-6 bg-gradient-to-r from-amber-500 to-yellow-500 text-stone-900 border-0 font-semibold"
                      onClick={submitGuess}
                      disabled={submitting || !guessInput}
                    >
                      {submitting ? '…' : 'Guess'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {isMyTurnToRespond && hasPendingGuess && pendingGuessValue !== null && (
            <motion.div
              key="response-buttons"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <Card className="glass border-red-500/30 bg-red-500/10">
                <CardContent className="p-5 space-y-3">
                  <p className="text-sm font-medium text-center text-red-300">
                    {guesser?.username} guessed <strong>{pendingGuessValue}</strong> — respond:
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    <Button
                      variant="outline"
                      className="border-green-500/40 text-green-400 hover:bg-green-500/20 h-14 flex-col gap-1"
                      onClick={() => submitResponse('correct')}
                      disabled={submitting}
                    >
                      <span className="text-xl">✓</span>
                      <span className="text-xs">Correct!</span>
                    </Button>
                    <Button
                      variant="outline"
                      className="border-amber-500/40 text-amber-400 hover:bg-amber-500/20 h-14 flex-col gap-1"
                      onClick={() => submitResponse('higher')}
                      disabled={submitting}
                    >
                      <span className="text-xl">↑</span>
                      <span className="text-xs">Higher</span>
                    </Button>
                    <Button
                      variant="outline"
                      className="border-orange-500/40 text-orange-400 hover:bg-orange-500/20 h-14 flex-col gap-1"
                      onClick={() => submitResponse('lower')}
                      disabled={submitting}
                    >
                      <span className="text-xl">↓</span>
                      <span className="text-xs">Lower</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {!isMyTurnToGuess && !isMyTurnToRespond && (
            <motion.div
              key="waiting"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Card className="glass border-white/8">
                <CardContent className="p-4 text-center">
                  <p className="text-muted-foreground text-sm">
                    {hasPendingGuess
                      ? `Waiting for ${target?.username} to respond…`
                      : `Waiting for ${guesser?.username} to guess…`}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Players grid */}
        <div className="grid grid-cols-2 gap-2">
          {players.map((p) => (
            <PlayerCard
              key={p.id}
              player={p}
              isMe={p.id === myPlayer.id}
              isHost={p.id === game.host_player_id}
              isCurrentGuesser={p.id === game.current_guesser_id}
              isCurrentTarget={p.id === game.current_target_id}
              showEliminated
              size="sm"
            />
          ))}
        </div>

        {/* Event log */}
        {events.length > 0 && (
          <Card className="glass border-white/8">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-xs text-muted-foreground uppercase tracking-wider">Event Log</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <ScrollArea className="h-40">
                <div className="space-y-1">
                  {[...events].reverse().map((e) => (
                    <EventLine key={e.id} event={e} players={players} />
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}

function EventLine({ event, players }: { event: GameEvent; players: Player[] }) {
  const actor = players.find((p) => p.id === event.actor_id)
  const target = players.find((p) => p.id === event.target_id)

  let text = ''
  if (event.type === 'guess') {
    const n = (event.payload as { number: number }).number
    text = `${actor?.username ?? '?'} guessed ${n} for ${target?.username ?? '?'}`
  } else if (event.type === 'response') {
    const r = (event.payload as { response: string }).response
    text = `${actor?.username ?? '?'} said: ${r}`
  } else if (event.type === 'eliminate') {
    text = `${actor?.username ?? '?'} was eliminated!`
  } else if (event.type === 'win') {
    const w = (event.payload as { winner_username: string }).winner_username
    text = `🏆 ${w} wins!`
  }

  return (
    <p className="text-xs text-muted-foreground py-0.5">
      {text}
    </p>
  )
}
