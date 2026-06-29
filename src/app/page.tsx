'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { generateUsername, generateAvatar, generateAvatarColor, generateGameCode } from '@/lib/avatars'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { toast } from 'sonner'

export default function HomePage() {
  const router = useRouter()
  const [username, setUsername] = useState(() => generateUsername())
  const [avatar] = useState(() => generateAvatar())
  const [avatarColor] = useState(() => generateAvatarColor())
  const [joinCode, setJoinCode] = useState('')
  const [loading, setLoading] = useState<'create' | 'join' | null>(null)

  async function handleCreate() {
    setLoading('create')
    try {
      const code = generateGameCode()
      const { data: game, error: gameError } = await supabase
        .from('games')
        .insert({ code, status: 'waiting', player_order: [] })
        .select()
        .single()

      if (gameError) throw gameError

      const { data: player, error: playerError } = await supabase
        .from('players')
        .insert({ game_id: game.id, username, avatar, avatar_color: avatarColor })
        .select()
        .single()

      if (playerError) throw playerError

      await supabase.from('games').update({ host_player_id: player.id }).eq('id', game.id)

      sessionStorage.setItem('player_id', player.id)
      sessionStorage.setItem('game_id', game.id)
      router.push(`/game/${game.id}`)
    } catch (e) {
      toast.error('Failed to create game. Check your Supabase config.')
      console.error(e)
    } finally {
      setLoading(null)
    }
  }

  async function handleJoin() {
    if (!joinCode.trim()) return
    setLoading('join')
    try {
      const { data: game, error } = await supabase
        .from('games')
        .select()
        .eq('code', joinCode.toUpperCase().trim())
        .single()

      if (error || !game) { toast.error('Game not found.'); return }
      if (game.status !== 'waiting') { toast.error('Game already started.'); return }

      const { data: player, error: playerError } = await supabase
        .from('players')
        .insert({ game_id: game.id, username, avatar, avatar_color: avatarColor })
        .select()
        .single()

      if (playerError) throw playerError

      sessionStorage.setItem('player_id', player.id)
      sessionStorage.setItem('game_id', game.id)
      router.push(`/game/${game.id}`)
    } catch (e) {
      toast.error('Failed to join game.')
      console.error(e)
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-animated flex items-center justify-center p-4">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-amber-500/8 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-yellow-600/8 rounded-full blur-3xl" />
        <div className="absolute top-3/4 left-1/3 w-64 h-64 bg-stone-400/6 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="text-6xl mb-4"
          >
            🎯
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-4xl font-bold bg-gradient-to-r from-amber-300 via-yellow-200 to-stone-300 bg-clip-text text-transparent"
          >
            Number Cipher
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35 }}
            className="text-muted-foreground mt-2 text-sm"
          >
            Multiplayer guessing game — no login required
          </motion.p>
        </div>

        <Card className="glass border-white/10 shadow-2xl">
          <CardContent className="p-6 space-y-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
              className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/8"
            >
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-2xl flex-shrink-0"
                style={{ backgroundColor: avatarColor + '33', border: `2px solid ${avatarColor}66` }}
              >
                {avatar}
              </div>
              <div className="flex-1">
                <Label className="text-xs text-muted-foreground mb-1 block">Your name</Label>
                <Input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="h-8 bg-transparent border-white/10 text-sm font-medium"
                  maxLength={20}
                />
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }}>
              <Button
                className="w-full h-12 text-base font-semibold bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-stone-900 border-0 shadow-lg shadow-amber-900/20"
                onClick={handleCreate}
                disabled={!!loading || !username.trim()}
              >
                {loading === 'create' ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Creating...
                  </span>
                ) : '✦ Create New Game'}
              </Button>
            </motion.div>

            <div className="flex items-center gap-3">
              <Separator className="flex-1 bg-white/10" />
              <span className="text-xs text-muted-foreground">or join with code</span>
              <Separator className="flex-1 bg-white/10" />
            </div>

            <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.55 }} className="space-y-3">
              <Input
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="ENTER CODE"
                className="h-12 text-center text-lg tracking-widest font-mono bg-white/5 border-white/10 focus:border-amber-500/50"
                maxLength={6}
                onKeyDown={(e) => e.key === 'Enter' && handleJoin()}
              />
              <Button
                variant="outline"
                className="w-full h-11 border-white/15 hover:bg-white/10 hover:border-white/25 font-semibold"
                onClick={handleJoin}
                disabled={!!loading || !joinCode.trim() || !username.trim()}
              >
                {loading === 'join' ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Joining...
                  </span>
                ) : 'Join Game'}
              </Button>
            </motion.div>
          </CardContent>
        </Card>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="text-center text-xs text-muted-foreground/60 mt-4"
        >
          Last player with their number unguessed wins
        </motion.p>
      </motion.div>
    </div>
  )
}
