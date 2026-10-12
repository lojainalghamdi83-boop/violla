import { useEffect, useMemo, useState } from 'react'

// Track slots: 0 = Player 1 start, 1–5 = the five squares, 6 = Player 2 start.
const P1_START = 0
const P2_START = 6
const CENTER = 3
const SLOTS = 7
const SQUARES = [1, 2, 3, 4, 5]

const DEFAULT_NAMES = { p1: 'Player 1', p2: 'Player 2' }
const NAMES_KEY = 'center-rush-names'

const PLAYER_STYLE = {
  p1: {
    text: 'text-purple-soft',
    token: 'from-[#a78bfa] via-purple to-purple-deep',
    ring: 'ring-purple-soft/60',
    glow: 'shadow-[0_0_28px_rgb(139_92_246/0.65)]',
    button:
      'bg-gradient-to-b from-purple to-purple-deep shadow-[0_8px_30px_rgb(139_92_246/0.35)] hover:shadow-[0_10px_40px_rgb(139_92_246/0.6)]',
    dot: 'bg-purple',
  },
  p2: {
    text: 'text-gold-soft',
    token: 'from-gold-soft via-gold to-gold-deep',
    ring: 'ring-gold-soft/60',
    glow: 'shadow-[0_0_28px_rgb(232_184_74/0.6)]',
    button:
      'bg-gradient-to-b from-gold to-gold-deep text-ink shadow-[0_8px_30px_rgb(232_184_74/0.3)] hover:shadow-[0_10px_40px_rgb(232_184_74/0.55)]',
    dot: 'bg-gold',
  },
}

function loadNames() {
  try {
    const saved = JSON.parse(localStorage.getItem(NAMES_KEY))
    if (saved && typeof saved.p1 === 'string' && typeof saved.p2 === 'string') return saved
  } catch {}
  return DEFAULT_NAMES
}

function displayName(names, id) {
  return names[id].trim() || DEFAULT_NAMES[id]
}

function initials(name) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  return parts
    .slice(0, 2)
    .map((p) => p[0].toUpperCase())
    .join('')
}

const initialGame = { p1: P1_START, p2: P2_START, winner: null }

export default function App() {
  const [game, setGame] = useState(initialGame)
  const [names, setNames] = useState(loadNames)
  const [round, setRound] = useState(0)

  useEffect(() => {
    try {
      localStorage.setItem(NAMES_KEY, JSON.stringify(names))
    } catch {}
  }, [names])

  function advance(id) {
    setGame((g) => {
      if (g.winner) return g
      const other = id === 'p1' ? 'p2' : 'p1'
      const next = id === 'p1' ? g.p1 + 1 : g.p2 - 1
      // Forward only, one square, never past the center, never onto the opponent.
      if (id === 'p1' && next > CENTER) return g
      if (id === 'p2' && next < CENTER) return g
      if (next === g[other]) return g
      return { ...g, [id]: next, winner: next === CENTER ? id : null }
    })
  }

  function restart() {
    setGame(initialGame)
    setRound((r) => r + 1)
  }

  const winner = game.winner

  return (
    <div className="ambient flex min-h-full flex-col items-center px-4 py-[clamp(12px,3vh,40px)] sm:px-8">
      <Header />

      <main className="flex w-full max-w-[1500px] flex-1 flex-col justify-center gap-[clamp(20px,5vh,64px)] py-[clamp(12px,3vh,40px)]">
        <Board game={game} names={names} />

        {winner ? (
          <WinBanner key={round} name={displayName(names, winner)} id={winner} onRestart={restart} />
        ) : (
          <Controls names={names} setNames={setNames} onAdvance={advance} onRestart={restart} />
        )}
      </main>

      {winner && <Confetti key={round} />}
    </div>
  )
}

function Header() {
  return (
    <header className="flex flex-col items-center text-center">
      <div
        className="brand-logo h-[clamp(64px,13vh,150px)]"
        role="img"
        aria-label="Event emblem"
      />
      <h1 className="title-gradient mt-[clamp(8px,1.6vh,20px)] font-display text-[clamp(2rem,6vw,5.25rem)] leading-none font-bold tracking-[0.12em]">
        CENTER RUSH
      </h1>
      <p className="mt-[clamp(6px,1.2vh,14px)] text-[clamp(0.8rem,1.5vw,1.35rem)] font-light tracking-[0.45em] text-white/70 uppercase">
        Answer. Advance. Win.
      </p>
    </header>
  )
}

function Board({ game, names }) {
  const { winner } = game
  const slotPct = 100 / SLOTS

  return (
    <section aria-label="Game board" className="relative w-full">
      {/* Faint rail connecting the two starts through the squares */}
      <div className="pointer-events-none absolute top-1/2 right-[7%] left-[7%] h-px -translate-y-1/2 bg-gradient-to-r from-purple/50 via-gold/50 to-gold/50" />

      <div className="relative grid grid-cols-7">
        <StartPad id="p1" label={displayName(names, 'p1')} />
        {SQUARES.map((n) => (
          <Square key={n} n={n} isCenter={n === CENTER} won={!!winner} />
        ))}
        <StartPad id="p2" label={displayName(names, 'p2')} />

        {['p1', 'p2'].map((id) => {
          const pos = game[id]
          const isWinner = winner === id
          const isLoser = winner && !isWinner
          const s = PLAYER_STYLE[id]
          return (
            <div
              key={id}
              className="pointer-events-none absolute top-0 flex aspect-square items-center justify-center transition-[left] duration-700 ease-[cubic-bezier(.65,0,.35,1)]"
              style={{ width: `${slotPct}%`, left: `${pos * slotPct}%`, zIndex: isWinner ? 20 : 10 }}
            >
              {/* key={pos} replays the landing pop on every move */}
              <div key={pos} className={pos === P1_START || pos === P2_START ? '' : 'token-land'}>
                <div
                  className={[
                    'flex aspect-square w-[clamp(30px,6.2vw,118px)] items-center justify-center rounded-full bg-gradient-to-br ring-2 ring-offset-0 transition-all duration-500',
                    s.token,
                    s.ring,
                    s.glow,
                    isWinner ? 'token-winner' : '',
                    isLoser ? 'opacity-35 saturate-50' : '',
                  ].join(' ')}
                  aria-label={`${displayName(names, id)} token`}
                >
                  <span
                    className={`font-display text-[clamp(0.75rem,1.9vw,2.2rem)] font-bold ${
                      id === 'p2' ? 'text-ink' : 'text-white'
                    }`}
                  >
                    {initials(displayName(names, id))}
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

function StartPad({ id, label }) {
  const s = PLAYER_STYLE[id]
  return (
    <div className="relative flex aspect-square items-center justify-center p-[6%]">
      <div className="flex h-[78%] w-[78%] items-center justify-center rounded-full border border-dashed border-white/15 bg-white/[0.02]" />
      <span
        className={`absolute -bottom-[0.5em] left-1/2 w-[160%] -translate-x-1/2 truncate text-center text-[clamp(0.55rem,1vw,0.95rem)] font-medium tracking-[0.25em] uppercase ${s.text}`}
        title={label}
      >
        Start
      </span>
    </div>
  )
}

function Square({ n, isCenter, won }) {
  return (
    <div className="flex aspect-square items-center justify-center p-[6%]">
      <div
        className={[
          'relative flex h-full w-full items-center justify-center rounded-[clamp(10px,1.4vw,26px)] border backdrop-blur-sm transition-all duration-700',
          isCenter
            ? `border-gold/90 border-2 bg-gradient-to-b from-gold/[0.14] to-gold/[0.04] ${won ? 'center-won' : 'center-glow'}`
            : 'border-white/12 bg-gradient-to-b from-white/[0.06] to-white/[0.015]',
        ].join(' ')}
      >
        {isCenter ? (
          <Trophy className="h-[42%] w-[42%] text-gold opacity-90 drop-shadow-[0_0_12px_rgb(232_184_74/0.6)]" />
        ) : (
          <span className="font-display text-[clamp(0.9rem,2.6vw,3rem)] font-semibold text-white/20">{n}</span>
        )}
      </div>
    </div>
  )
}

function Controls({ names, setNames, onAdvance, onRestart }) {
  return (
    <section className="fade-in grid w-full grid-cols-2 items-end gap-x-[clamp(12px,4vw,80px)] gap-y-6 md:grid-cols-[1fr_auto_1fr]">
      <PlayerControl id="p1" names={names} setNames={setNames} onAdvance={onAdvance} align="start" />
      <div className="order-last col-span-2 flex justify-center md:order-none md:col-span-1">
        <RestartButton onClick={onRestart} />
      </div>
      <PlayerControl id="p2" names={names} setNames={setNames} onAdvance={onAdvance} align="end" />
    </section>
  )
}

function PlayerControl({ id, names, setNames, onAdvance, align }) {
  const s = PLAYER_STYLE[id]
  const number = id === 'p1' ? 1 : 2
  const alignCls = align === 'start' ? 'items-start text-left' : 'items-end text-right'

  return (
    <div className={`flex min-w-0 flex-col gap-[clamp(8px,1.4vh,16px)] ${alignCls}`}>
      <label className={`group flex w-full flex-col ${alignCls}`}>
        <span className="flex items-center gap-2 text-[clamp(0.6rem,0.9vw,0.85rem)] tracking-[0.3em] text-white/45 uppercase">
          <span className={`h-2 w-2 rounded-full ${s.dot}`} />
          Player {number}
          <PencilIcon className="h-3 w-3 opacity-0 transition-opacity group-focus-within:opacity-60 group-hover:opacity-60" />
        </span>
        <input
          value={names[id]}
          maxLength={24}
          spellCheck={false}
          placeholder={DEFAULT_NAMES[id]}
          onChange={(e) => setNames((n) => ({ ...n, [id]: e.target.value }))}
          onBlur={() => setNames((n) => (n[id].trim() ? n : { ...n, [id]: DEFAULT_NAMES[id] }))}
          onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
          aria-label={`Player ${number} name`}
          className={`w-full max-w-[22ch] rounded-lg border-b border-transparent bg-transparent py-1 font-display text-[clamp(1.05rem,2.4vw,2.4rem)] font-semibold outline-none transition-colors placeholder:text-white/25 hover:border-white/15 focus:border-white/40 ${s.text} ${
            align === 'end' ? 'text-right' : 'text-left'
          }`}
        />
      </label>

      <button
        type="button"
        onClick={() => onAdvance(id)}
        className={`w-full max-w-[460px] cursor-pointer rounded-2xl px-[clamp(12px,2vw,32px)] py-[clamp(12px,2vh,22px)] text-[clamp(0.8rem,1.35vw,1.3rem)] leading-snug font-semibold transition-all duration-300 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:outline-none ${s.button}`}
      >
        <span className="block text-[0.72em] font-medium tracking-[0.2em] uppercase opacity-75">Correct Answer</span>
        Advance {displayName(names, id)} {id === 'p1' ? '→' : '←'}
      </button>
    </div>
  )
}

function RestartButton({ onClick, prominent = false }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex cursor-pointer items-center gap-2 rounded-full border transition-all duration-300 focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:outline-none ${
        prominent
          ? 'border-gold/70 bg-gold/10 px-8 py-3 text-[clamp(0.9rem,1.3vw,1.2rem)] text-gold-soft hover:bg-gold/20 hover:shadow-[0_0_30px_rgb(232_184_74/0.35)]'
          : 'border-white/15 bg-white/[0.03] px-5 py-2 text-[clamp(0.75rem,0.95vw,0.95rem)] text-white/60 hover:border-white/35 hover:text-white'
      }`}
    >
      <RestartIcon className="h-[1em] w-[1em]" />
      Restart Game
    </button>
  )
}

function WinBanner({ name, id, onRestart }) {
  const s = PLAYER_STYLE[id]
  return (
    <section
      className="rise-in flex flex-col items-center gap-[clamp(14px,2.4vh,28px)] text-center"
      style={{ animationDelay: '0.55s' }}
      aria-live="polite"
    >
      <div className="flex items-center gap-[0.4em] font-display text-[clamp(1.6rem,5vw,4.75rem)] leading-tight font-bold tracking-[0.06em]">
        <Trophy className="h-[1em] w-[1em] shrink-0 text-gold drop-shadow-[0_0_16px_rgb(232_184_74/0.7)]" />
        <span>
          <span className={s.text}>{name.toUpperCase()}</span> <span className="text-white">WINS!</span>
        </span>
      </div>
      <p className="text-[clamp(0.8rem,1.3vw,1.2rem)] tracking-[0.35em] text-white/55 uppercase">
        First to the center
      </p>
      <RestartButton onClick={onRestart} prominent />
    </section>
  )
}

function Confetti() {
  const pieces = useMemo(() => {
    const colors = ['#8b5cf6', '#c4b5fd', '#e8b84a', '#f6dc9a', '#ffffff']
    return Array.from({ length: 55 }, (_, i) => ({
      left: Math.random() * 100,
      w: 6 + Math.random() * 7,
      h: 10 + Math.random() * 10,
      color: colors[i % colors.length],
      drift: `${(Math.random() - 0.5) * 30}vw`,
      spin: `${(Math.random() - 0.5) * 1080}deg`,
      dur: `${2.6 + Math.random() * 2}s`,
      delay: `${0.45 + Math.random() * 0.9}s`,
    }))
  }, [])

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden" aria-hidden="true">
      {pieces.map((p, i) => (
        <span
          key={i}
          className="confetti-piece"
          style={{
            left: `${p.left}%`,
            width: p.w,
            height: p.h,
            background: p.color,
            '--drift': p.drift,
            '--spin': p.spin,
            '--dur': p.dur,
            '--delay': p.delay,
          }}
        />
      ))}
    </div>
  )
}

function Trophy({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4Z" />
      <path d="M17 5h3v2a3 3 0 0 1-3 3M7 5H4v2a3 3 0 0 0 3 3" />
    </svg>
  )
}

function RestartIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M3 12a9 9 0 1 0 3-6.7L3 8" />
      <path d="M3 3v5h5" />
    </svg>
  )
}

function PencilIcon({ className }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  )
}
