'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Game, Player, supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'
import { LeaveGameButton } from './LeaveGameButton'

interface Props {
  game: Game
  myPlayer: Player
  onDone: () => void
}

export function SetNumberView({ game, myPlayer, onDone }: Props) {
  const [number, setNumber] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSet() {
    const n = parseInt(number)
    if (isNaN(n) || n < 1 || n > 100) {
      toast.error('Pick a number between 1 and 100.')
      return
    }
    setSaving(true)
    try {
      await supabase.from('players').update({ secret_number: n }).eq('id', myPlayer.id)
      onDone()
    } catch {
      toast.error('Failed to set number.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <LeaveGameButton game={game} myPlayer={myPlayer} />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm"
      >
        <Card className="glass border-white/10 shadow-2xl">
          <CardContent className="p-8 space-y-6">
            <div className="text-center">
              <div className="text-5xl mb-4">🔒</div>
              <h2 className="text-2xl font-bold">Set Your Secret Number</h2>
              <p className="text-muted-foreground text-sm mt-2">
                Choose a number between 1 and 100. Keep it secret!
              </p>
            </div>

            <div className="space-y-3">
              <Input
                type="number"
                min={1}
                max={100}
                value={number}
                onChange={(e) => setNumber(e.target.value)}
                placeholder="1 – 100"
                className="h-16 text-center text-3xl font-bold font-mono bg-white/5 border-white/10 focus:border-amber-500/60"
                onKeyDown={(e) => e.key === 'Enter' && handleSet()}
                autoFocus
              />
              <Button
                className="w-full h-12 text-base font-semibold bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-400 hover:to-yellow-400 text-stone-900 border-0"
                onClick={handleSet}
                disabled={saving || !number}
              >
                {saving ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    Locking in…
                  </span>
                ) : 'Lock In My Number'}
              </Button>
            </div>

            <p className="text-center text-xs text-muted-foreground">
              Other players will try to guess this. Defend it well!
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
