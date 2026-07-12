'use client'

import { Player } from '@/lib/supabase'
import { Badge } from '@/components/ui/badge'

interface Props {
  player: Player
  isMe?: boolean
  isHost?: boolean
  isCurrentGuesser?: boolean
  isCurrentTarget?: boolean
  showEliminated?: boolean
  size?: 'sm' | 'md'
}

export function PlayerCard({ player, isMe, isHost, isCurrentGuesser, isCurrentTarget, showEliminated, size = 'md' }: Props) {
  const isSmall = size === 'sm'

  return (
    <div
      className={`relative flex items-center gap-3 rounded-xl border transition-colors ${
        isSmall ? 'p-2' : 'p-3'
      } ${
        isCurrentGuesser
          ? 'border-yellow-500/40 bg-yellow-500/10'
          : isCurrentTarget
          ? 'border-red-500/40 bg-red-500/10'
          : 'border-white/8 bg-white/5'
      } ${player.is_eliminated ? 'opacity-40 grayscale' : ''}`}
    >
      {/* Avatar */}
      <div
        className={`rounded-full flex items-center justify-center flex-shrink-0 ${isSmall ? 'w-8 h-8 text-lg' : 'w-10 h-10 text-2xl'}`}
        style={{
          backgroundColor: player.avatar_color + '22',
          border: `2px solid ${player.avatar_color}55`,
        }}
      >
        {player.avatar}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className={`font-medium truncate ${isSmall ? 'text-xs' : 'text-sm'}`}>
          {player.username}
          {isMe && <span className="text-muted-foreground font-normal"> (you)</span>}
        </p>
        <div className="flex gap-1 flex-wrap mt-0.5">
          {isHost && (
            <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 border-amber-500/40 text-amber-400">
              Host
            </Badge>
          )}
          {isCurrentGuesser && (
            <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 border-yellow-500/40 text-yellow-400">
              Guessing
            </Badge>
          )}
          {isCurrentTarget && (
            <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 border-red-500/40 text-red-400">
              Target
            </Badge>
          )}
          {player.is_bot && (
            <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 border-blue-500/40 text-blue-400">
              Bot
            </Badge>
          )}
          {showEliminated && player.is_eliminated && (
            <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 border-gray-500/40 text-gray-500">
              Out
            </Badge>
          )}
        </div>
      </div>
    </div>
  )
}
