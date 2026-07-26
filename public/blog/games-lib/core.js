// Shared helpers for all mini games.

export const readVar = (name, fallback) => {
  const v = getComputedStyle(document.documentElement).getPropertyValue(name).trim()
  return v || fallback
}

// Games tint themselves from the site theme; each game shifts the hue
// (--accent-shift on the stage) so they don't all look identical.
export const themeHsl = (stage, { s = null, l = null, shift = 0, alpha = 1 } = {}) => {
  const h =
    (Number(readVar('--theme-h', '210')) +
      Number(getComputedStyle(stage).getPropertyValue('--accent-shift') || 0) +
      shift +
      360) %
    360
  const sat = s ?? parseFloat(readVar('--theme-s', '75%'))
  const light = l ?? parseFloat(readVar('--theme-l', '65%'))
  return alpha >= 1 ? `hsl(${h}, ${sat}%, ${light}%)` : `hsla(${h}, ${sat}%, ${light}%, ${alpha})`
}

export const isDark = () => document.documentElement.getAttribute('data-scheme') === 'dark'

export const clamp = (v, min, max) => Math.max(min, Math.min(max, v))

export const randInt = (min, max) => min + Math.floor(Math.random() * (max - min + 1))

export const shuffle = (arr) => {
  const a = arr.slice()
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export const KEY_DIR = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
  w: 'up',
  a: 'left',
  s: 'down',
  d: 'right',
  W: 'up',
  A: 'left',
  S: 'down',
  D: 'right',
}

// Swipe recognition for touch devices
export const onSwipe = (el, handler) => {
  let sx = 0
  let sy = 0
  let active = false

  const start = (e) => {
    const t = e.touches[0]
    sx = t.clientX
    sy = t.clientY
    active = true
  }
  const end = (e) => {
    if (!active) return
    active = false
    const t = e.changedTouches[0]
    const dx = t.clientX - sx
    const dy = t.clientY - sy
    if (Math.abs(dx) < 24 && Math.abs(dy) < 24) return
    handler(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up')
  }

  el.addEventListener('touchstart', start, { passive: true })
  el.addEventListener('touchend', end, { passive: true })
  return () => {
    el.removeEventListener('touchstart', start)
    el.removeEventListener('touchend', end)
  }
}

// Square canvas fitted to the viewport element, DPR-aware.
// Returns { canvas, ctx, size(), destroy() } and calls onResize(sizePx).
export const fitCanvas = (viewport, onResize) => {
  viewport.innerHTML = '<canvas class="game-canvas"></canvas>'
  const canvas = viewport.querySelector('canvas')
  const ctx = canvas.getContext('2d')
  let px = 0

  const resize = () => {
    const dpr = window.devicePixelRatio || 1
    px = Math.max(100, Math.min(viewport.clientWidth, viewport.clientHeight))
    canvas.width = px * dpr
    canvas.height = px * dpr
    canvas.style.width = `${px}px`
    canvas.style.height = `${px}px`
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    onResize?.(px)
  }

  const ro = new ResizeObserver(resize)
  ro.observe(viewport)
  // Defer the first measurement: calling onResize synchronously here
  // would hit the caller's not-yet-initialized bindings (TDZ), since
  // fitCanvas runs at the top of every game's mount().
  queueMicrotask(resize)

  return {
    canvas,
    ctx,
    size: () => px,
    destroy: () => ro.disconnect(),
  }
}

// requestAnimationFrame loop with hidden-tab protection: the delta is
// clamped so a background tab can never fast-forward the game.
export const gameLoop = (tick) => {
  let raf = 0
  let last = 0
  const frame = (ts) => {
    raf = requestAnimationFrame(frame)
    if (!last) last = ts
    const dt = Math.min(ts - last, 64)
    last = ts
    tick(dt, ts)
  }
  const onVisibility = () => {
    last = 0
  }
  document.addEventListener('visibilitychange', onVisibility)
  raf = requestAnimationFrame(frame)
  return () => {
    cancelAnimationFrame(raf)
    document.removeEventListener('visibilitychange', onVisibility)
  }
}
