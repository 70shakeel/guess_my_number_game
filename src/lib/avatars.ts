export const BOT_NAMES = ['R2-D2', 'HAL 9000', 'WALL-E', 'GLaDOS', 'T-800']
export const BOT_AVATARS = ['🤖', '🦾', '👾', '🧠', '⚡']

export const ANIMAL_AVATARS = [
  '🦊', '🐼', '🦁', '🐯', '🐻', '🐨', '🦝', '🐸',
  '🦄', '🐺', '🦊', '🐧', '🦉', '🐙', '🦋', '🐬',
  '🦈', '🐲', '🦅', '🦚', '🦜', '🐳', '🦞', '🦊',
]

export const AVATAR_COLORS = [
  '#f59e0b', '#d97706', '#b45309', '#f97316',
  '#84cc16', '#22c55e', '#14b8a6', '#a78bfa',
  '#e879f9', '#f43f5e', '#a3a3a3', '#fbbf24',
]

const ADJECTIVES = [
  'Swift', 'Brave', 'Clever', 'Lucky', 'Cosmic',
  'Shadow', 'Crystal', 'Neon', 'Mystic', 'Turbo',
  'Silent', 'Wild', 'Frozen', 'Solar', 'Phantom',
]

const NOUNS = [
  'Fox', 'Wolf', 'Tiger', 'Panda', 'Dragon',
  'Eagle', 'Shark', 'Falcon', 'Viper', 'Phoenix',
  'Comet', 'Storm', 'Blaze', 'Frost', 'Nova',
]

export function generateUsername(): string {
  const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)]
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)]
  const num = Math.floor(Math.random() * 99) + 1
  return `${adj}${noun}${num}`
}

export function generateAvatar(): string {
  return ANIMAL_AVATARS[Math.floor(Math.random() * ANIMAL_AVATARS.length)]
}

export function generateAvatarColor(): string {
  return AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)]
}

export function generateGameCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}
