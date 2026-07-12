'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Game, Player, GameEvent, supabase } from '@/lib/supabase'
import { playEliminatedSound, playWrongGuessSound, playResponseSound } from '@/lib/sounds'
import { LeaveGameButton } from './LeaveGameButton'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PlayerCard } from './PlayerCard'
import { toast } from 'sonner'
import { ScrollArea } from '@/components/ui/scroll-area'
import { getBotGuess } from '@/lib/game-logic'

interface Props {
  game: Game
  players: Player[]
  myPlayer: Player
  events: GameEvent[]
  onRefresh: () => void
}

type ResponseType = 'higher' | 'lower' | 'correct'

const RESPONSE_CONFIG: Record<ResponseType, { icon: string; label: string; color: string; bg: string }> = {
  higher: { icon: '↑', label: 'HIGHER', color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' },
  lower:  { icon: '↓', label: 'LOWER',  color: '#f97316', bg: 'rgba(249,115,22,0.15)' },
  correct:{ icon: '✓', label: 'CORRECT!',color: '#22c55e', bg: 'rgba(34,197,94,0.15)' },
}

const TEASE_MESSAGES: [string, string][] = [
  ["😂", "Not even close!"],
  ["👵", "My grandma guesses better"],
  ["😏", "Nice try though"],
  ["🤡", "Keep dreaming"],
  ["💨", "Ooph, way off!"],
  ["💀", "Really? REALLY?"],
  ["😤", "The audacity..."],
  ["🎯", "Certified miss"],
  ["🍀", "Better luck next turn"],
  ["😬", "That was rough"],
  ["⚡", "Big miss energy"],
  ["🤖", "Even a bot does better"],
  ["🥴", "Were you even trying?"],
  ["😵", "My eyes are burning"],
  ["🌍", "That number was nowhere close"],
  ["🎲", "Did you guess randomly?"],
  ["🍔", "Sir this is a Wendy's"],
  ["🙏", "Sending thoughts and prayers"],
  ["😭", "The confidence though..."],
  ["🪖", "Bold strategy, zero results"],
  ["🖥️", "Error 404: correct guess not found"],
  ["👀", "That hurt to watch"],
  ["🤔", "Maybe try a different number"],
  ["🎪", "You absolute clown"],
  ["🪙", "I've seen better guesses from a coin flip"],
  ["💀", "Bro really said that number"],
  ["🎖️", "Mission failed successfully"],
  ["😮", "We're so back... wait no we're not"],
  ["📋", "Certified L moment"],
  ["🧮", "The math is not mathing"],
  ["🔍", "Skill issue detected"],
  ["😔", "Please... just... no"],
  ["🌀", "That was so bad it circled back to funny"],
  ["👑", "Not the guessing queen you thought"],
  ["🎬", "Plot twist: that was wrong"],
  ["📊", "Statistical anomaly: still wrong"],
  ["💔", "I felt that miss in my soul"],
  ["😢", "The number is crying right now"],
  ["🏆", "Try harder, champ"],
  ["🙃", "You got this! (you don't)"],
  ["🦕", "Darwin's guessing theory in action"],
  ["🌿", "Touch grass, then guess again"],
  ["📏", "My disappointment is immeasurable"],
  ["🙈", "This is why we can't have nice things"],
  ["🕯️", "Somewhere a number weeps"],
  ["🎮", "Not your day, not your game"],
  ["🙈", "Bro is guessing with eyes closed"],
  ["🪐", "You and the right answer live on different planets"],
  ["🫣", "Imagine guessing that"],
  ["📉", "Your guessing arc is not it"],
  ["🤦", "Did you just... yeah you did"],
  ["👻", "The vibes said wrong"],
  ["🏗️", "Built different (badly)"],
  ["⚰️", "That was a war crime against numbers"],
  ["🚫", "We going to pretend that didn't happen"],
  ["🚑", "Sir/ma'am, are you okay?"],
  ["🧠", "404 brain cells not found"],
  ["🌑", "That was a shot in the dark"],
  ["🕳️", "Into the void it goes"],
  ["🤷", "Technically a guess. Barely."],
  ["📡", "You guessed wrong in 4K HD"],
  ["📣", "The crowd goes mild"],
  ["💭", "Even autocorrect wouldn't suggest that"],
  ["🆘", "Do you need a hint? (you need a hint)"],
  ["⏳", "Loading better guess... failed"],
  ["😮‍💨", "Guessing with full confidence, zero accuracy"],
  ["😹", "The number is laughing at you"],
  ["🫡", "Respectfully... no"],
  ["🏅", "You tried. You failed. Iconic."],
  ["🤖", "The algorithm rejects your answer"],
  ["⚡", "That was giving very wrong energy"],
  ["✅", "Bravery ✅  Accuracy ❌"],
  ["🦹", "That was a villain origin story"],
  ["🏃", "Are you speedrunning losing?"],
  ["💔", "Next time guess with your heart"],
  ["😬", "Your future self cringed"],
  ["🏺", "Legendary miss, honestly"],
  ["🪦", "Hall of shame material right there"],
  ["😞", "I'm not mad, just disappointed"],
  ["📐", "The range on that miss though"],
  ["🎙️", "Narrator: it was not the right number"],
  ["🔮", "You manifested the wrong number"],
  ["🥛", "That guess aged like warm milk"],
  ["🌋", "Incredible. Incredibly wrong."],
  ["💅", "The audacity is unmatched"],
  ["🌅", "One day you'll get one right"],
  ["🎳", "Keep shooting your shot (and missing)"],
  ["📜", "History will remember this guess"],
  ["🚪", "The number has left the chat"],
  ["🎻", "Nobody: ...  You: that number"],
  ["🫠", "Melting from secondhand embarrassment"],
  ["🌊", "Drowned in wrongness"],
  ["🧊", "Ice cold, not in a good way"],
  ["🐠", "Something smells fishy about that guess"],
  ["🎠", "Round and round, still wrong"],
  ["🌪️", "Chaos energy, zero results"],
  ["🦆", "Quack (that's what your guess was)"],
  ["🪤", "Walked right into that miss"],
  ["🎭", "Truly a performance of wrongness"],
]

const teasePool = { remaining: [...TEASE_MESSAGES] }

function getNextTease(): [string, string] {
  if (teasePool.remaining.length === 0) {
    teasePool.remaining = [...TEASE_MESSAGES]
  }
  const idx = Math.floor(Math.random() * teasePool.remaining.length)
  return teasePool.remaining.splice(idx, 1)[0]
}

export function GameplayView({ game, players, myPlayer, events, onRefresh }: Props) {
  const [guessInput, setGuessInput] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [flashResponse, setFlashResponse] = useState<ResponseType | null>(null)
  const [teaseMessage, setTeaseMessage] = useState<[string, string] | null>(null)
  const lastSeenResponseId = useRef<string | null>(null)
  const botActing = useRef(false)

  const activePlayers = players.filter((p) => !p.is_eliminated)
  const guesser = players.find((p) => p.id === game.current_guesser_id)
  const target = players.find((p) => p.id === game.current_target_id)
  const isHost = myPlayer.id === game.host_player_id

  const isMyTurnToGuess = myPlayer.id === game.current_guesser_id
  const isMyTurnToRespond = myPlayer.id === game.current_target_id

  const lastGuessEvent = useMemo(() => [...events].reverse().find((e) => e.type === 'guess'), [events])
  const lastResponseEvent = useMemo(() => [...events].reverse().find((e) => e.type === 'response'), [events])
  const hasPendingGuess =
    lastGuessEvent &&
    (!lastResponseEvent || new Date(lastGuessEvent.created_at) > new Date(lastResponseEvent.created_at))
  const pendingGuessValue = hasPendingGuess ? (lastGuessEvent!.payload as { number: number }).number : null

  // Flash + sound + tease on every new response event
  useEffect(() => {
    if (!lastResponseEvent) return
    if (lastResponseEvent.id === lastSeenResponseId.current) return
    lastSeenResponseId.current = lastResponseEvent.id
    const r = (lastResponseEvent.payload as { response: ResponseType }).response
    if (!r) return
    setFlashResponse(r)
    setTeaseMessage(null)
    const pack = game.audio_pack ?? 'normal'
    if (r === 'correct') {
      playEliminatedSound(pack)
    } else {
      playWrongGuessSound(pack)
      playResponseSound(r, pack)
      // tease appears after direction has been shown for 0.8s
      const tease = setTimeout(() => {
        setTeaseMessage(getNextTease())
      }, 800)
      const hide = setTimeout(() => setFlashResponse(null), 2800)
      return () => { clearTimeout(tease); clearTimeout(hide) }
    }
    const t = setTimeout(() => setFlashResponse(null), 1800)
    return () => clearTimeout(t)
  }, [lastResponseEvent?.id])

  // ── shared helpers ─────────────────────────────────────────────────────────

  async function advanceTurn(activeList: Player[]) {
    const order = game.player_order.filter((id) => activeList.some((p) => p.id === id))
    const rawIdx = order.indexOf(game.current_guesser_id ?? order[0])
    const currentGuesserIdx = rawIdx === -1 ? 0 : rawIdx
    const nextGuesserIdx = (currentGuesserIdx + 1) % order.length
    const nextTargetIdx = (nextGuesserIdx + 1) % order.length
    await supabase.from('games').update({
      current_guesser_id: order[nextGuesserIdx],
      current_target_id: order[nextTargetIdx],
      round: game.round + 1,
    }).eq('id', game.id)
  }

  async function handleResponse(actorPlayer: Player, response: ResponseType) {
    if (!hasPendingGuess) return
    await supabase.from('game_events').insert({
      game_id: game.id,
      type: 'response',
      actor_id: actorPlayer.id,
      target_id: game.current_guesser_id,
      payload: { response, guessed_number: pendingGuessValue },
    })
    if (response === 'correct') {
      await supabase.from('players').update({ is_eliminated: true }).eq('id', actorPlayer.id)
      const activeAfterElimination = activePlayers.filter((p) => p.id !== actorPlayer.id)
      if (activeAfterElimination.length <= 1) {
        const winner = activeAfterElimination[0]
        await supabase.from('games').update({ status: 'finished', winner_id: winner?.id ?? null }).eq('id', game.id)
        if (winner) {
          await supabase.from('game_events').insert({
            game_id: game.id,
            type: 'win',
            actor_id: winner.id,
            payload: { winner_username: winner.username },
          })
        }
      } else {
        await advanceTurn(activeAfterElimination)
      }
    } else {
      await advanceTurn(activePlayers)
    }
    onRefresh()
  }

  // ── human auto-respond ─────────────────────────────────────────────────────

  useEffect(() => {
    if (!isMyTurnToRespond || !hasPendingGuess || pendingGuessValue === null || myPlayer.secret_number === null || submitting) return
    let response: ResponseType
    if (pendingGuessValue === myPlayer.secret_number) response = 'correct'
    else if (pendingGuessValue < myPlayer.secret_number) response = 'higher'
    else response = 'lower'
    submitResponse(response)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMyTurnToRespond, hasPendingGuess, pendingGuessValue, myPlayer.secret_number])

  // ── bot driver (host only) ─────────────────────────────────────────────────

  useEffect(() => {
    if (!isHost) return
    if (botActing.current) return

    const currentGuesserPlayer = players.find((p) => p.id === game.current_guesser_id)
    const currentTargetPlayer = players.find((p) => p.id === game.current_target_id)

    // Bot needs to guess
    if (currentGuesserPlayer?.is_bot && !hasPendingGuess && currentTargetPlayer) {
      botActing.current = true
      const timer = setTimeout(async () => {
        try {
          const n = getBotGuess(currentTargetPlayer.id, events)
          await supabase.from('game_events').insert({
            game_id: game.id,
            type: 'guess',
            actor_id: currentGuesserPlayer.id,
            target_id: currentTargetPlayer.id,
            payload: { number: n },
          })
          onRefresh()
        } catch (e) {
          console.error('Bot guess failed:', e)
        } finally {
          botActing.current = false
        }
      }, 2500 + Math.floor(Math.random() * 2000))
      return () => { clearTimeout(timer); botActing.current = false }
    }

    // Bot needs to respond
    if (
      currentTargetPlayer?.is_bot &&
      hasPendingGuess &&
      pendingGuessValue !== null &&
      currentTargetPlayer.secret_number !== null
    ) {
      const secret = currentTargetPlayer.secret_number
      const guessVal = pendingGuessValue
      botActing.current = true
      const timer = setTimeout(async () => {
        try {
          let response: ResponseType
          if (guessVal === secret) response = 'correct'
          else if (guessVal < secret) response = 'higher'
          else response = 'lower'
          await handleResponse(currentTargetPlayer, response)
        } catch (e) {
          console.error('Bot response failed:', e)
        } finally {
          botActing.current = false
        }
      }, 1500 + Math.floor(Math.random() * 1500))
      return () => { clearTimeout(timer); botActing.current = false }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isHost, game.current_guesser_id, game.current_target_id, hasPendingGuess, pendingGuessValue, activePlayers.length])

  // ── human actions ──────────────────────────────────────────────────────────

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

  async function submitResponse(response: ResponseType) {
    if (!hasPendingGuess || submitting) return
    setSubmitting(true)
    try {
      await handleResponse(myPlayer, response)
    } catch (e) {
      toast.error('Failed to submit response.')
      console.error(e)
    } finally {
      setSubmitting(false)
    }
  }

  const cfg = flashResponse ? RESPONSE_CONFIG[flashResponse] : null
  const sortedEvents = useMemo(
    () => [...events].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
    [events]
  )

  return (
    <div className="min-h-screen p-4 pb-8">
      <LeaveGameButton game={game} myPlayer={myPlayer} activePlayers={activePlayers} />

      {/* Full-screen response flash */}
      <AnimatePresence>
        {flashResponse && cfg && (
          <motion.div
            key={flashResponse + lastResponseEvent?.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
            style={{ background: cfg.bg }}
          >
            <motion.div
              initial={{ scale: 0.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 1.3, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
              className="flex flex-col items-center gap-2"
            >
              <AnimatePresence mode="wait">
                {!teaseMessage ? (
                  <motion.div
                    key="direction"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8, y: -10 }}
                    transition={{ duration: 0.25 }}
                    className="flex flex-col items-center gap-2"
                  >
                    <motion.span
                      animate={{ y: flashResponse === 'higher' ? [-8, 8, -8] : flashResponse === 'lower' ? [8, -8, 8] : [0] }}
                      transition={{ repeat: 2, duration: 0.4 }}
                      style={{ fontSize: 120, lineHeight: 1, color: cfg.color, textShadow: `0 0 60px ${cfg.color}88` }}
                    >
                      {cfg.icon}
                    </motion.span>
                    <span
                      className="text-4xl font-black tracking-widest"
                      style={{ color: cfg.color, textShadow: `0 0 30px ${cfg.color}66` }}
                    >
                      {cfg.label}
                    </span>
                    <span className="text-sm text-white/50 mt-1">
                      {target?.username} responded
                    </span>
                  </motion.div>
                ) : (
                  <motion.div
                    key="tease"
                    initial={{ opacity: 0, scale: 0.7, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 18 }}
                    className="flex flex-col items-center gap-3 px-4 text-center"
                  >
                    <span className="text-6xl">{teaseMessage[0]}</span>
                    <div className="rounded-2xl bg-black/70 border border-white/10 px-6 py-3 max-w-xs">
                      <span className="text-xl font-black text-white tracking-wide">
                        {teaseMessage[1]}
                      </span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="max-w-2xl mx-auto space-y-4 pt-6">
        {/* Round indicator */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">Round {game.round}</span>
          <span className="text-xs text-muted-foreground">{activePlayers.length} players remaining</span>
        </div>

        {/* My secret number */}
        {myPlayer.secret_number !== null && !myPlayer.is_eliminated && (
          <div className="flex justify-center">
            <span className="text-xs text-white/40 mr-1.5 self-center">Your number:</span>
            <span className="text-sm font-mono font-bold text-emerald-400">{myPlayer.secret_number}</span>
          </div>
        )}

        {/* Current turn */}
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
                    style={{ backgroundColor: (guesser?.avatar_color ?? '#f59e0b') + '33', border: `2px solid ${(guesser?.avatar_color ?? '#f59e0b')}66` }}
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

        {/* Pending guess */}
        <AnimatePresence>
          {hasPendingGuess && pendingGuessValue !== null && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
            >
              <Card className="border-yellow-500/30 bg-yellow-500/10">
                <CardContent className="p-4 text-center">
                  <p className="text-xs text-yellow-400 mb-1">{guesser?.username} guessed</p>
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
                      type="text"
                      inputMode="numeric"
                      value={guessInput}
                      onChange={(e) => {
                        const digits = e.target.value.replace(/\D/g, '').slice(0, 3)
                        const n = parseInt(digits)
                        if (digits === '') { setGuessInput(''); return }
                        setGuessInput(n > 100 ? '100' : digits)
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') { submitGuess(); return }
                        if (!/^\d$/.test(e.key) && !['Backspace','Delete','ArrowLeft','ArrowRight','Tab'].includes(e.key)) {
                          e.preventDefault()
                        }
                      }}
                      placeholder="1 – 100"
                      className="h-12 text-center text-xl font-mono bg-white/5 border-white/10 focus:border-amber-500/60"
                      autoFocus
                    />
                    <Button
                      className="h-12 px-6 bg-linear-to-r from-amber-500 to-yellow-500 text-stone-900 border-0 font-semibold"
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
              key="auto-responding"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <Card className="glass border-red-500/30 bg-red-500/10">
                <CardContent className="p-4 text-center">
                  <p className="text-sm text-red-300 animate-pulse">Auto-responding…</p>
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

        {/* Event log — only in easy mode */}
        {game.difficulty === 'easy' && events.length > 0 && (
          <Card className="glass border-white/8">
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-xs text-muted-foreground uppercase tracking-wider">Event Log</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <ScrollArea className="h-32">
                <div className="space-y-1 pr-2">
                  {sortedEvents.map((e) => (
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

function Name({ name, color }: { name: string; color?: string }) {
  return <span className="font-medium" style={{ color: color ?? '#7dd3fc' }}>{name}</span>
}

function Num({ n }: { n: number }) {
  return <span className="text-yellow-300 font-mono font-bold">{n}</span>
}

function EventLine({ event, players }: { event: GameEvent; players: Player[] }) {
  const actor = players.find((p) => p.id === event.actor_id)
  const target = players.find((p) => p.id === event.target_id)

  if (event.type === 'guess') {
    const n = (event.payload as { number: number }).number
    return (
      <p className="text-xs py-0.5 text-white/50">
        <Name name={actor?.username ?? '?'} color={actor?.avatar_color} /> guessed <Num n={n} /> for <Name name={target?.username ?? '?'} color={target?.avatar_color} />
      </p>
    )
  }

  if (event.type === 'response') {
    const r = (event.payload as { response: string }).response
    return (
      <p className="text-xs py-0.5 text-white/50">
        <Name name={actor?.username ?? '?'} color={actor?.avatar_color} /> said{' '}
        {r === 'higher' && <span className="text-amber-400 font-semibold">↑ Higher</span>}
        {r === 'lower'  && <span className="text-orange-400 font-semibold">↓ Lower</span>}
        {r === 'correct' && <span className="text-green-400 font-semibold">✓ Correct!</span>}
      </p>
    )
  }

  if (event.type === 'eliminate') {
    return (
      <p className="text-xs py-0.5 text-white/50">
        <Name name={actor?.username ?? '?'} color={actor?.avatar_color} /> <span className="text-red-400">was eliminated 💀</span>
      </p>
    )
  }

  if (event.type === 'win') {
    const w = (event.payload as { winner_username: string }).winner_username
    const winner = players.find((p) => p.id === event.actor_id)
    return (
      <p className="text-xs py-0.5">
        <span className="text-amber-300 font-semibold">🏆 <Name name={w} color={winner?.avatar_color} /> wins!</span>
      </p>
    )
  }

  return null
}
