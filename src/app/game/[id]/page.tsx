'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { supabase, Game, Player, GameEvent } from '@/lib/supabase'
import { LobbyView } from '@/components/game/LobbyView'
import { SetNumberView } from '@/components/game/SetNumberView'
import { GameplayView } from '@/components/game/GameplayView'
import { WinnerView } from '@/components/game/WinnerView'
import { motion, AnimatePresence } from 'framer-motion'

export default function GamePage() {
  const params = useParams()
  const gameId = params.id as string

  const [game, setGame] = useState<Game | null>(null)
  const [players, setPlayers] = useState<Player[]>([])
  const [events, setEvents] = useState<GameEvent[]>([])
  const [myPlayerId, setMyPlayerId] = useState<string | null>(null)
  const [phase, setPhase] = useState<'loading' | 'lobby' | 'set-number' | 'playing' | 'finished'>('loading')

  const myPlayer = players.find((p) => p.id === myPlayerId) ?? null

  const loadData = useCallback(async () => {
    const [{ data: gameData }, { data: playersData }, { data: eventsData }] = await Promise.all([
      supabase.from('games').select().eq('id', gameId).single(),
      supabase.from('players').select().eq('game_id', gameId).order('joined_at'),
      supabase.from('game_events').select().eq('game_id', gameId).order('created_at'),
    ])
    if (gameData) setGame(gameData)
    if (playersData) setPlayers(playersData)
    // Always use the authoritative DB list — deduplication happens here
    if (eventsData) setEvents(eventsData)
  }, [gameId])

  const loadPlayersOnly = useCallback(async () => {
    const { data } = await supabase.from('players').select().eq('game_id', gameId).order('joined_at')
    if (data) setPlayers(data)
  }, [gameId])

  useEffect(() => {
    const pid = sessionStorage.getItem('player_id')
    setMyPlayerId(pid)
    loadData()
  }, [loadData])

  // Determine phase from game state
  useEffect(() => {
    if (!game) return
    if (game.status === 'waiting') {
      setPhase('lobby')
    } else if (game.status === 'playing') {
      const me = players.find((p) => p.id === myPlayerId)
      if (me && me.secret_number === null) {
        setPhase('set-number')
      } else {
        setPhase('playing')
      }
    } else if (game.status === 'finished') {
      setPhase('finished')
    }
  }, [game, players, myPlayerId])

  // Realtime subscriptions
  useEffect(() => {
    const gameChannel = supabase
      .channel(`game:${gameId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'games', filter: `id=eq.${gameId}` }, (payload) => {
        setGame(payload.new as Game)
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'players', filter: `game_id=eq.${gameId}` }, () => {
        loadPlayersOnly()
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'game_events', filter: `game_id=eq.${gameId}` }, (payload) => {
        const incoming = payload.new as GameEvent
        setEvents((prev) => prev.some((e) => e.id === incoming.id) ? prev : [...prev, incoming])
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'game_events', filter: `game_id=eq.${gameId}` }, () => {
        setEvents([])
      })
      .subscribe()

    return () => { supabase.removeChannel(gameChannel) }
  }, [gameId, loadData, loadPlayersOnly])

  if (phase === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-animated flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          className="w-10 h-10 border-2 border-purple-500/30 border-t-purple-500 rounded-full"
        />
      </div>
    )
  }

  if (!game || !myPlayer) {
    return (
      <div className="min-h-screen bg-gradient-animated flex items-center justify-center">
        <p className="text-muted-foreground">Game not found or session expired.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-animated">
      <AnimatePresence mode="wait">
        {phase === 'lobby' && (
          <motion.div key="lobby" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <LobbyView game={game} players={players} myPlayer={myPlayer} onRefresh={loadData} />
          </motion.div>
        )}
        {phase === 'set-number' && (
          <motion.div key="set-number" initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
            <SetNumberView game={game} myPlayer={myPlayer} onDone={loadData} />
          </motion.div>
        )}
        {phase === 'playing' && (
          <motion.div key="playing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <GameplayView game={game} players={players} myPlayer={myPlayer} events={events} onRefresh={loadData} />
          </motion.div>
        )}
        {phase === 'finished' && (
          <motion.div key="finished" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
            <WinnerView game={game} players={players} myPlayer={myPlayer} events={events} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
