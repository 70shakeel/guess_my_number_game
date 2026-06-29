export type AudioPack = 'normal' | 'kids' | 'adult'

function ctx(): AudioContext | null {
  if (typeof window === 'undefined') return null
  return new AudioContext()
}

function playFile(path: string, volume = 1) {
  if (typeof window === 'undefined') return
  const audio = new Audio(path)
  audio.volume = volume
  audio.play().catch(() => {})
}

// ─── helpers ───────────────────────────────────────────────────────────────

function playTone(
  ac: AudioContext,
  type: OscillatorType,
  freqStart: number,
  freqEnd: number,
  startAt: number,
  duration: number,
  volume = 0.25,
) {
  const osc = ac.createOscillator()
  const gain = ac.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freqStart, startAt)
  if (freqEnd !== freqStart) osc.frequency.linearRampToValueAtTime(freqEnd, startAt + duration)
  gain.gain.setValueAtTime(0, startAt)
  gain.gain.linearRampToValueAtTime(volume, startAt + 0.02)
  gain.gain.exponentialRampToValueAtTime(0.001, startAt + duration)
  osc.connect(gain)
  gain.connect(ac.destination)
  osc.start(startAt)
  osc.stop(startAt + duration + 0.01)
}

function addVibrato(ac: AudioContext, targetOsc: OscillatorNode, rate: number, depth: number, startAt: number, dur: number) {
  const vib = ac.createOscillator()
  const vibGain = ac.createGain()
  vib.frequency.value = rate
  vibGain.gain.value = depth
  vib.connect(vibGain)
  vibGain.connect(targetOsc.frequency)
  vib.start(startAt)
  vib.stop(startAt + dur + 0.01)
}

// ─── NORMAL pack ───────────────────────────────────────────────────────────

// Sad trombone: wah-wah-wah-waaaaah
function normalEliminated() {
  const ac = ctx(); if (!ac) return
  const notes = [
    { freq: 466, dur: 0.22 },
    { freq: 415, dur: 0.22 },
    { freq: 370, dur: 0.22 },
    { freq: 311, dur: 0.75 },
  ]
  let t = ac.currentTime + 0.05
  notes.forEach(({ freq, dur }) => {
    const osc = ac.createOscillator()
    const gain = ac.createGain()
    osc.type = 'sawtooth'
    osc.frequency.setValueAtTime(freq, t)
    gain.gain.setValueAtTime(0, t)
    gain.gain.linearRampToValueAtTime(0.28, t + 0.03)
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur)
    osc.connect(gain); gain.connect(ac.destination)
    addVibrato(ac, osc, 5, 6, t, dur)
    osc.start(t); osc.stop(t + dur)
    t += dur * 0.85
  })
}

// Wrong guess: buzzer "BZZZT"
function normalWrongGuess() {
  const ac = ctx(); if (!ac) return
  const t = ac.currentTime + 0.02
  playTone(ac, 'square', 180, 80, t, 0.35, 0.3)
  playTone(ac, 'sawtooth', 160, 60, t + 0.05, 0.3, 0.15)
}

// Higher: quick upward sweep
function normalHigher() {
  const ac = ctx(); if (!ac) return
  playTone(ac, 'sine', 400, 640, ac.currentTime + 0.02, 0.14, 0.18)
}

// Lower: quick downward sweep
function normalLower() {
  const ac = ctx(); if (!ac) return
  playTone(ac, 'sine', 640, 300, ac.currentTime + 0.02, 0.14, 0.18)
}

// ─── KIDS pack ─────────────────────────────────────────────────────────────

// Cartoon "boing boing boing" falling down
function kidsEliminated() {
  const ac = ctx(); if (!ac) return
  const boings = [0, 0.28, 0.52, 0.72]
  boings.forEach((offset, i) => {
    const t = ac.currentTime + 0.05 + offset
    const startFreq = 600 - i * 80
    playTone(ac, 'sine', startFreq, startFreq * 0.45, t, 0.22, 0.3)
  })
}

// Wrong guess: silly "woooop" descending wobble
function kidsWrongGuess() {
  const ac = ctx(); if (!ac) return
  const t = ac.currentTime + 0.02
  const osc = ac.createOscillator()
  const gain = ac.createGain()
  osc.type = 'sine'
  osc.frequency.setValueAtTime(800, t)
  osc.frequency.linearRampToValueAtTime(200, t + 0.5)
  gain.gain.setValueAtTime(0.28, t)
  gain.gain.exponentialRampToValueAtTime(0.001, t + 0.55)
  osc.connect(gain); gain.connect(ac.destination)
  addVibrato(ac, osc, 12, 30, t, 0.5)
  osc.start(t); osc.stop(t + 0.6)
}

// Higher: cheerful two-note up
function kidsHigher() {
  const ac = ctx(); if (!ac) return
  const t = ac.currentTime + 0.02
  playTone(ac, 'triangle', 523, 523, t, 0.1, 0.22)
  playTone(ac, 'triangle', 659, 659, t + 0.11, 0.12, 0.22)
}

// Lower: two-note down
function kidsLower() {
  const ac = ctx(); if (!ac) return
  const t = ac.currentTime + 0.02
  playTone(ac, 'triangle', 523, 523, t, 0.1, 0.22)
  playTone(ac, 'triangle', 392, 392, t + 0.11, 0.12, 0.22)
}

// ─── ADULT (18+) pack ──────────────────────────────────────────────────────

function adultEliminated() {
  playFile('/sounds/adult/812003__jackiecalistahhh__moan-188-oh-my-god-jackie-calistahhh.wav', 0.9)
}

function adultWrongGuess() {
  playFile('/sounds/adult/204805__ezcah__spanking.mp3', 0.85)
}

// Cache decoded buffers so we don't re-fetch on every play
const _bufferCache = new Map<string, AudioBuffer>()

async function getDecodedBuffer(path: string, ac: AudioContext): Promise<AudioBuffer> {
  if (_bufferCache.has(path)) return _bufferCache.get(path)!
  const res = await fetch(path)
  const arr = await res.arrayBuffer()
  const buf = await ac.decodeAudioData(arr)
  _bufferCache.set(path, buf)
  return buf
}

function playFileTrimmed(path: string, volume = 1, durationSec = 1) {
  if (typeof window === 'undefined') return
  const ac = new AudioContext()
  getDecodedBuffer(path, ac).then((decoded) => {
    const rate = decoded.sampleRate
    const frames = Math.min(Math.floor(rate * durationSec), decoded.length)
    // Physically slice the buffer so playback ends naturally at durationSec
    const trimmed = ac.createBuffer(decoded.numberOfChannels, frames, rate)
    for (let ch = 0; ch < decoded.numberOfChannels; ch++) {
      trimmed.copyToChannel(decoded.getChannelData(ch).slice(0, frames), ch)
    }
    const source = ac.createBufferSource()
    source.buffer = trimmed
    const gain = ac.createGain()
    gain.gain.setValueAtTime(volume, ac.currentTime)
    // Fade out last 80ms to avoid click
    gain.gain.setValueAtTime(volume, ac.currentTime + durationSec - 0.08)
    gain.gain.linearRampToValueAtTime(0, ac.currentTime + durationSec)
    source.connect(gain)
    gain.connect(ac.destination)
    source.start()
  }).catch(() => {})
}

function adultHigher() {
  playFileTrimmed('/sounds/adult/204805__ezcah__spanking.mp3', 0.85, 1)
}

function adultLower() {
  playFileTrimmed('/sounds/adult/204805__ezcah__spanking.mp3', 0.85, 1)
}

// ─── Public API ────────────────────────────────────────────────────────────

export function playEliminatedSound(pack: AudioPack = 'normal') {
  if (pack === 'kids') return kidsEliminated()
  if (pack === 'adult') return adultEliminated()
  return normalEliminated()
}

export function playWrongGuessSound(pack: AudioPack = 'normal') {
  if (pack === 'kids') return kidsWrongGuess()
  if (pack === 'adult') return adultWrongGuess()
  return normalWrongGuess()
}

export function playResponseSound(type: 'higher' | 'lower', pack: AudioPack = 'normal') {
  if (pack === 'kids') return type === 'higher' ? kidsHigher() : kidsLower()
  if (pack === 'adult') return type === 'higher' ? adultHigher() : adultLower()
  return type === 'higher' ? normalHigher() : normalLower()
}
