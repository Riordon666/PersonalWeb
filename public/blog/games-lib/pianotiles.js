import { themeHsl, isDark, fitCanvas, gameLoop, randInt } from './core.js'

const LANES = 4
const KEYS = ['d', 'f', 'j', 'k']

export function mount(stage, api) {
  const viewport = stage.querySelector('[data-role="viewport"]')

  let W = 400
  let tiles = []
  let score = 0
  let combo = 0
  let maxCombo = 0
  let speed = 0
  let over = false
  let started = false
  let spawnGap = 0
  let flashes = []

  const setCombo = api.addHudItem('连击', 0)

  const surface = fitCanvas(viewport, (px) => {
    W = px
    draw()
  })
  const { ctx, canvas } = surface

  const TILE_H = () => W * 0.24
  const laneW = () => W / LANES

  const reset = () => {
    tiles = []
    score = 0
    combo = 0
    maxCombo = 0
    speed = W * 0.0055
    over = false
    started = false
    spawnGap = 0
    flashes = []
    api.setScore(0)
    setCombo(0)
    api.hideOverlay()
    // Pre-fill so the board doesn't start empty
    for (let i = 0; i < 4; i++) {
      tiles.push({ lane: randInt(0, LANES - 1), y: -i * TILE_H(), hit: false })
    }
    draw()
  }

  const fail = (why) => {
    over = true
    api.gameOver(why, `得分 ${score} · 最高连击 ${maxCombo}`)
  }

  const hitLane = (lane) => {
    if (over) return
    if (!started) {
      started = true
      return
    }
    // The lowest un-hit tile in this lane counts, but only if it's on screen
    const candidates = tiles.filter((t) => t.lane === lane && !t.hit && t.y + TILE_H() > 0)
    if (!candidates.length) return fail('踩空了')
    const target = candidates.reduce((a, b) => (a.y > b.y ? a : b))
    if (target.y + TILE_H() < W * 0.1) return fail('太早了')

    target.hit = true
    combo++
    maxCombo = Math.max(maxCombo, combo)
    score += 1 + Math.floor(combo / 10)
    api.setScore(score)
    setCombo(combo)
    speed = Math.min(W * 0.02, speed + W * 0.00007)
    flashes.push({ lane, t: 0 })
  }

  const stopLoop = gameLoop((dt) => {
    if (over || !started) {
      draw()
      return
    }
    const k = dt / 16.7

    for (const t of tiles) t.y += speed * k * 16.7
    flashes = flashes.filter((f) => (f.t += dt) < 260)

    // A missed tile that scrolls off the bottom ends the run
    for (const t of tiles) {
      if (!t.hit && t.y > W) return fail('漏掉了一块')
    }
    tiles = tiles.filter((t) => t.y < W + TILE_H())

    spawnGap += speed * k * 16.7
    if (spawnGap >= TILE_H()) {
      spawnGap -= TILE_H()
      const top = tiles.reduce((m, t) => Math.min(m, t.y), W)
      tiles.push({ lane: randInt(0, LANES - 1), y: top - TILE_H(), hit: false })
    }

    draw()
  })

  const draw = () => {
    const dark = isDark()
    ctx.clearRect(0, 0, W, W)
    ctx.fillStyle = dark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)'
    ctx.fillRect(0, 0, W, W)

    const lw = laneW()
    ctx.strokeStyle = dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)'
    ctx.lineWidth = 1
    for (let i = 1; i < LANES; i++) {
      ctx.beginPath()
      ctx.moveTo(i * lw, 0)
      ctx.lineTo(i * lw, W)
      ctx.stroke()
    }

    const th = TILE_H()
    for (const t of tiles) {
      if (t.hit) {
        ctx.fillStyle = themeHsl(stage, { l: dark ? 30 : 82, alpha: 0.5 })
      } else {
        ctx.fillStyle = dark ? '#e6e8ee' : '#26282f'
      }
      ctx.beginPath()
      ctx.roundRect(t.lane * lw + 3, t.y + 3, lw - 6, th - 6, 8)
      ctx.fill()
    }

    // hit line
    ctx.strokeStyle = themeHsl(stage, { l: 55, alpha: 0.5 })
    ctx.lineWidth = 3
    ctx.beginPath()
    ctx.moveTo(0, W * 0.86)
    ctx.lineTo(W, W * 0.86)
    ctx.stroke()

    for (const f of flashes) {
      ctx.fillStyle = themeHsl(stage, { l: 60, alpha: 0.5 * (1 - f.t / 260) })
      ctx.fillRect(f.lane * lw, 0, lw, W)
    }

    // key hints
    ctx.fillStyle = dark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.3)'
    ctx.font = `700 ${W * 0.045}px "Helvetica Neue", sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    KEYS.forEach((k, i) => ctx.fillText(k.toUpperCase(), i * lw + lw / 2, W * 0.94))

    if (!started && !over) {
      ctx.fillStyle = dark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.65)'
      ctx.font = `600 ${Math.max(12, W * 0.034)}px "Microsoft Yahei", sans-serif`
      ctx.fillText('按 D F J K 或点击轨道开始', W / 2, W * 0.45)
    }
  }

  const onKey = (e) => {
    const idx = KEYS.indexOf(e.key.toLowerCase())
    if (idx === -1) return
    e.preventDefault()
    hitLane(idx)
  }
  const onPointer = (e) => {
    e.preventDefault()
    const rect = canvas.getBoundingClientRect()
    const lane = Math.floor(((e.clientX - rect.left) / rect.width) * LANES)
    hitLane(Math.max(0, Math.min(LANES - 1, lane)))
  }

  window.addEventListener('keydown', onKey)
  canvas.addEventListener('pointerdown', onPointer)

  reset()

  return {
    restart: reset,
    destroy() {
      stopLoop()
      window.removeEventListener('keydown', onKey)
      canvas.removeEventListener('pointerdown', onPointer)
      surface.destroy()
    },
  }
}
