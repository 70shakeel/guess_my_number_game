export type AudioPack = 'normal' | 'kids' | 'adult'

function ctx(): AudioContext | null {
  if (typeof window === 'undefined') return null
  return new AudioContext()
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

// Sharp percussive spank hit followed by an "ahhh~" moan
function adultEliminated() {
  const ac = ctx(); if (!ac) return
  const t = ac.currentTime + 0.05

  // --- SPANK: sharp noise burst (hand-on-skin thwack) ---
  const spanks = [0, 0.55, 1.05]
  spanks.forEach((offset) => {
    const st = t + offset
    // white noise via buffer
    const bufLen = ac.sampleRate * 0.06
    const buf = ac.createBuffer(1, bufLen, ac.sampleRate)
    const data = buf.getChannelData(0)
    for (let i = 0; i < bufLen; i++) data[i] = (Math.random() * 2 - 1)
    const noise = ac.createBufferSource()
    noise.buffer = buf

    // shape it: instant attack, fast decay — gives a crisp smack
    const noiseGain = ac.createGain()
    noiseGain.gain.setValueAtTime(0.9, st)
    noiseGain.gain.exponentialRampToValueAtTime(0.001, st + 0.055)

    // body thump underneath
    const thump = ac.createOscillator()
    const thumpGain = ac.createGain()
    thump.type = 'sine'
    thump.frequency.setValueAtTime(180, st)
    thump.frequency.exponentialRampToValueAtTime(40, st + 0.08)
    thumpGain.gain.setValueAtTime(0.6, st)
    thumpGain.gain.exponentialRampToValueAtTime(0.001, st + 0.09)

    noise.connect(noiseGain); noiseGain.connect(ac.destination)
    thump.connect(thumpGain); thumpGain.connect(ac.destination)
    noise.start(st); noise.stop(st + 0.07)
    thump.start(st); thump.stop(st + 0.1)
  })

  // --- AHH moan: breathy formant after last spank ---
  const mt = t + 1.3
  const moans = [
    { freq: 260, vibRate: 5.5, vibDepth: 8, vol: 0.18, dur: 0.9 },
    { freq: 264, vibRate: 5,   vibDepth: 6, vol: 0.10, dur: 0.85 },
    { freq: 520, vibRate: 6,   vibDepth: 5, vol: 0.06, dur: 0.8 },  // 1st formant
    { freq: 780, vibRate: 5.5, vibDepth: 4, vol: 0.04, dur: 0.75 }, // 2nd formant
  ]
  moans.forEach(({ freq, vibRate, vibDepth, vol, dur }) => {
    const osc = ac.createOscillator()
    const gain = ac.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(freq * 0.88, mt)
    osc.frequency.linearRampToValueAtTime(freq, mt + 0.12)        // pitch rise
    osc.frequency.linearRampToValueAtTime(freq * 0.96, mt + dur)  // slight fall-off
    gain.gain.setValueAtTime(0, mt)
    gain.gain.linearRampToValueAtTime(vol, mt + 0.1)
    gain.gain.exponentialRampToValueAtTime(0.001, mt + dur)
    osc.connect(gain); gain.connect(ac.destination)
    addVibrato(ac, osc, vibRate, vibDepth, mt, dur)
    osc.start(mt); osc.stop(mt + dur + 0.05)
  })
}

// Wrong guess: single spank + quick surprised "ah!"
function adultWrongGuess() {
  const ac = ctx(); if (!ac) return
  const t = ac.currentTime + 0.02

  // spank
  const bufLen = ac.sampleRate * 0.055
  const buf = ac.createBuffer(1, bufLen, ac.sampleRate)
  const data = buf.getChannelData(0)
  for (let i = 0; i < bufLen; i++) data[i] = (Math.random() * 2 - 1)
  const noise = ac.createBufferSource()
  noise.buffer = buf
  const noiseGain = ac.createGain()
  noiseGain.gain.setValueAtTime(0.75, t)
  noiseGain.gain.exponentialRampToValueAtTime(0.001, t + 0.05)
  noise.connect(noiseGain); noiseGain.connect(ac.destination)
  noise.start(t); noise.stop(t + 0.06)

  const thump = ac.createOscillator()
  const thumpGain = ac.createGain()
  thump.type = 'sine'
  thump.frequency.setValueAtTime(160, t)
  thump.frequency.exponentialRampToValueAtTime(40, t + 0.07)
  thumpGain.gain.setValueAtTime(0.5, t)
  thumpGain.gain.exponentialRampToValueAtTime(0.001, t + 0.08)
  thump.connect(thumpGain); thumpGain.connect(ac.destination)
  thump.start(t); thump.stop(t + 0.09)

  // surprised "ah!" — short sharp moan
  const at = t + 0.1
  ;[{ f: 320, v: 0.16 }, { f: 640, v: 0.07 }, { f: 1000, v: 0.03 }].forEach(({ f, v }) => {
    const osc = ac.createOscillator()
    const gain = ac.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(f * 0.9, at)
    osc.frequency.linearRampToValueAtTime(f, at + 0.06)
    osc.frequency.linearRampToValueAtTime(f * 1.05, at + 0.2)
    gain.gain.setValueAtTime(0, at)
    gain.gain.linearRampToValueAtTime(v, at + 0.05)
    gain.gain.exponentialRampToValueAtTime(0.001, at + 0.28)
    osc.connect(gain); gain.connect(ac.destination)
    addVibrato(ac, osc, 6, 7, at, 0.28)
    osc.start(at); osc.stop(at + 0.3)
  })
}

// Higher: rising "ooh~"
function adultHigher() {
  const ac = ctx(); if (!ac) return
  const t = ac.currentTime + 0.02
  ;[{ f: 300, v: 0.15 }, { f: 600, v: 0.06 }].forEach(({ f, v }) => {
    const osc = ac.createOscillator()
    const gain = ac.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(f, t)
    osc.frequency.linearRampToValueAtTime(f * 1.35, t + 0.22)
    gain.gain.setValueAtTime(0, t)
    gain.gain.linearRampToValueAtTime(v, t + 0.04)
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25)
    osc.connect(gain); gain.connect(ac.destination)
    osc.start(t); osc.stop(t + 0.27)
  })
}

// Lower: descending "ohh~"
function adultLower() {
  const ac = ctx(); if (!ac) return
  const t = ac.currentTime + 0.02
  ;[{ f: 380, v: 0.15 }, { f: 760, v: 0.06 }].forEach(({ f, v }) => {
    const osc = ac.createOscillator()
    const gain = ac.createGain()
    osc.type = 'sine'
    osc.frequency.setValueAtTime(f, t)
    osc.frequency.linearRampToValueAtTime(f * 0.68, t + 0.22)
    gain.gain.setValueAtTime(0, t)
    gain.gain.linearRampToValueAtTime(v, t + 0.04)
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25)
    osc.connect(gain); gain.connect(ac.destination)
    osc.start(t); osc.stop(t + 0.27)
  })
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
