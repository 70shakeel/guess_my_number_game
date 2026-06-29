import { createBrowserClient } from '@supabase/ssr'
import { SupabaseClient } from '@supabase/supabase-js'

let _supabase: SupabaseClient | null = null

export function getSupabase(): SupabaseClient {
  if (!_supabase) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    _supabase = createBrowserClient(url, key)
  }
  return _supabase
}

// Proxy so existing imports work unchanged
export const supabase = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    return (getSupabase() as unknown as Record<string | symbol, unknown>)[prop]
  },
})

export type GameStatus = 'waiting' | 'playing' | 'finished'
export type Difficulty = 'easy' | 'hard'

export interface Game {
  id: string
  code: string
  status: GameStatus
  difficulty: Difficulty
  host_player_id: string | null
  current_guesser_id: string | null
  current_target_id: string | null
  winner_id: string | null
  player_order: string[]
  round: number
  created_at: string
  updated_at: string
}

export interface Player {
  id: string
  game_id: string
  username: string
  avatar: string
  avatar_color: string
  secret_number: number | null
  is_eliminated: boolean
  joined_at: string
}

export interface GameEvent {
  id: string
  game_id: string
  type: 'guess' | 'response' | 'eliminate' | 'win'
  actor_id: string | null
  target_id: string | null
  payload: Record<string, unknown>
  created_at: string
}
