'use client'

import { playEliminatedSound, playWrongGuessSound, playResponseSound, AudioPack } from '@/lib/sounds'

const PACKS: { value: AudioPack; icon: string; label: string }[] = [
  { value: 'normal', icon: '🎺', label: 'Normal' },
  { value: 'kids',   icon: '🎈', label: 'Kids' },
  { value: 'adult',  icon: '🔞', label: '18+' },
]

const SOUNDS: { label: string; icon: string; play: (pack: AudioPack) => void }[] = [
  { label: 'Eliminated',  icon: '💀', play: (p) => playEliminatedSound(p) },
  { label: 'Wrong Guess', icon: '❌', play: (p) => playWrongGuessSound(p) },
  { label: 'Higher',      icon: '↑',  play: (p) => playResponseSound('higher', p) },
  { label: 'Lower',       icon: '↓',  play: (p) => playResponseSound('lower', p) },
]

export default function SoundsPage() {
  return (
    <div className="min-h-screen bg-gradient-animated flex items-center justify-center p-6">
      <div className="w-full max-w-lg space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-amber-300 mb-1">Sound Preview</h1>
          <p className="text-sm text-muted-foreground">Click any button to hear the sound</p>
        </div>

        {PACKS.map((pack) => (
          <div key={pack.value} className="glass border border-white/10 rounded-2xl p-5 space-y-3">
            <p className="text-sm font-semibold text-foreground flex items-center gap-2">
              <span className="text-xl">{pack.icon}</span> {pack.label}
            </p>
            <div className="grid grid-cols-2 gap-2">
              {SOUNDS.map((sound) => (
                <button
                  key={sound.label}
                  onClick={() => sound.play(pack.value)}
                  className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 active:scale-95 transition-all px-4 py-3 text-sm font-medium text-left"
                >
                  <span className="text-lg w-6 text-center">{sound.icon}</span>
                  <span>{sound.label}</span>
                </button>
              ))}
            </div>
          </div>
        ))}

        <p className="text-center text-xs text-muted-foreground/50">
          This page is only for previewing — not linked in the game
        </p>
      </div>
    </div>
  )
}
