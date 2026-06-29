'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase, Game, Player } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'

interface Props {
  game: Game
  myPlayer: Player
  activePlayers?: Player[]
}

export function LeaveGameButton({ game, myPlayer, activePlayers = [] }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [leaving, setLeaving] = useState(false)
  const isHost = myPlayer.id === game.host_player_id

  async function handleLeave() {
    setLeaving(true)
    try {
      if (game.status === 'waiting') {
        if (isHost) {
          // Host leaving lobby — delete whole game and all players
          await supabase.from('game_events').delete().eq('game_id', game.id)
          await supabase.from('players').delete().eq('game_id', game.id)
          await supabase.from('games').delete().eq('id', game.id)
        } else {
          await supabase.from('players').delete().eq('id', myPlayer.id)
        }
      } else if (game.status === 'playing') {
        // Eliminate the player
        await supabase.from('players').update({ is_eliminated: true }).eq('id', myPlayer.id)

        // If it was my turn to guess or respond, advance the turn
        const isMyTurn =
          myPlayer.id === game.current_guesser_id || myPlayer.id === game.current_target_id

        if (isMyTurn) {
          const remaining = activePlayers.filter((p) => p.id !== myPlayer.id)
          if (remaining.length <= 1) {
            const winner = remaining[0]
            if (winner) {
              await supabase.from('games').update({ status: 'finished', winner_id: winner.id }).eq('id', game.id)
              await supabase.from('game_events').insert({
                game_id: game.id,
                type: 'win',
                actor_id: winner.id,
                payload: { winner_username: winner.username },
              })
            }
          } else {
            const order = game.player_order.filter((id) => remaining.some((p) => p.id === id))
            const rawIdx = order.indexOf(game.current_guesser_id ?? order[0])
            const currentIdx = rawIdx === -1 ? 0 : rawIdx
            const nextGuesserIdx = (currentIdx + 1) % order.length
            const nextTargetIdx = (nextGuesserIdx + 1) % order.length
            await supabase.from('games').update({
              current_guesser_id: order[nextGuesserIdx],
              current_target_id: order[nextTargetIdx],
              round: game.round + 1,
            }).eq('id', game.id)
          }
        }
      }

      sessionStorage.removeItem('player_id')
      sessionStorage.removeItem('game_id')
      router.push('/')
    } catch (e) {
      toast.error('Failed to leave game.')
      console.error(e)
      setLeaving(false)
      setOpen(false)
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed top-4 right-4 z-40 text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors px-2 py-1 rounded-lg hover:bg-white/5"
      >
        Leave
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="glass border-white/10 max-w-xs">
          <DialogHeader>
            <DialogTitle>Leave game?</DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm">
              {game.status === 'waiting' && isHost
                ? 'You are the host. Leaving will end the game for everyone.'
                : game.status === 'playing'
                ? 'You will be eliminated and removed from the game.'
                : 'You will be removed from the game.'}
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 mt-2">
            <Button
              variant="outline"
              className="flex-1 border-white/15"
              onClick={() => setOpen(false)}
              disabled={leaving}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 bg-red-500/80 hover:bg-red-500 text-white border-0"
              onClick={handleLeave}
              disabled={leaving}
            >
              {leaving ? (
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  Leaving…
                </span>
              ) : 'Leave'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
