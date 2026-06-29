import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Number Cipher — Multiplayer Guessing Game'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#0e0d0b',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'system-ui, sans-serif',
          gap: 24,
        }}
      >
        {/* amber glow orb */}
        <div
          style={{
            position: 'absolute',
            width: 500,
            height: 500,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(245,158,11,0.15) 0%, transparent 70%)',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        />

        <div style={{ fontSize: 96, lineHeight: 1 }}>🔢</div>

        <div
          style={{
            fontSize: 64,
            fontWeight: 700,
            color: '#f59e0b',
            letterSpacing: '-1px',
          }}
        >
          Number Cipher
        </div>

        <div
          style={{
            fontSize: 28,
            color: '#a3a3a3',
            fontWeight: 400,
          }}
        >
          Real-time multiplayer number guessing — no login required
        </div>

        <div
          style={{
            display: 'flex',
            gap: 12,
            marginTop: 8,
          }}
        >
          {['Create a game', 'Share the code', 'Last one standing wins'].map((s) => (
            <div
              key={s}
              style={{
                background: 'rgba(245,158,11,0.12)',
                border: '1px solid rgba(245,158,11,0.3)',
                borderRadius: 8,
                padding: '8px 16px',
                fontSize: 18,
                color: '#fbbf24',
              }}
            >
              {s}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size }
  )
}
