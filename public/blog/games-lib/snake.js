import { themeHsl, isDark, onSwipe, KEY_DIR, fitCanvas } from './core.js'

export function mount(stage, api) {
  const viewport = stage.querySelector('[data-role="viewport"]')

  const COLS = 20
  const ROWS = 20
  let cell = 20
  let snake = []
  let dir = 'right'
  let queued = []
  let food = { x: 0, y: 0 }
  let score = 0
  let alive = true
  let started = false
  let acc = 0
  let last = 0
  let raf = 0
  let stepMs = 130

  const surface = fitCanvas(viewport, (px) => {
    cell = Math.floor(px / COLS)
    draw()
  })
  const { canvas, ctx } = surface

  const placeFood = () => {
    let p
    do {
      p = { x: Math.floor(Math.random() * COLS), y: Math.floor(Math.random() * ROWS) }
    } while (snake.some((s) => s.x === p.x && s.y === p.y))
    food = p
  }

  const reset = () => {
    snake = [
      { x: 8, y: 10 },
      { x: 7, y: 10 },
      { x: 6, y: 10 },
    ]
    dir = 'right'
    queued = []
    score = 0
    alive = true
    started = false
    stepMs = 130
    acc = 0
    last = 0
    placeFood()
    api.setScore(0)
    api.hideOverlay()
    draw()
  }

  const opposite = { up: 'down', down: 'up', left: 'right', right: 'left' }

  const turn = (d) => {
    if (!alive) return
    if (!started) {
      started = true
      last = 0
      acc = 0
    }
    const ref = queued.length ? queued[queued.length - 1] : dir
    if (d === ref || d === opposite[ref]) return
    if (queued.length < 2) queued.push(d)
  }

  const step = () => {
    if (queued.length) dir = queued.shift()
    const head = { ...snake[0] }
    if (dir === 'up') head.y--
    else if (dir === 'down') head.y++
    else if (dir === 'left') head.x--
    else head.x++

    if (head.x < 0 || head.y < 0 || head.x >= COLS || head.y >= ROWS) return die()
    if (snake.some((s) => s.x === head.x && s.y === head.y)) return die()

    snake.unshift(head)
    if (head.x === food.x && head.y === food.y) {
      score += 10
      api.setScore(score)
      stepMs = Math.max(70, stepMs - 2)
      placeFood()
    } else {
      snake.pop()
    }
  }

  const die = () => {
    alive = false
    api.gameOver('游戏结束', `得分 ${score} · 长度 ${snake.length}`)
  }

  const draw = () => {
    const px = cell * COLS
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    ctx.fillStyle = isDark() ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)'
    ctx.fillRect(0, 0, px, px)

    ctx.strokeStyle = isDark() ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)'
    ctx.lineWidth = 1
    for (let i = 1; i < COLS; i++) {
      ctx.beginPath()
      ctx.moveTo(i * cell + 0.5, 0)
      ctx.lineTo(i * cell + 0.5, px)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(0, i * cell + 0.5)
      ctx.lineTo(px, i * cell + 0.5)
      ctx.stroke()
    }

    const r = cell * 0.32
    ctx.fillStyle = themeHsl(stage, { shift: 150, s: 70, l: 55 })
    ctx.shadowColor = themeHsl(stage, { shift: 150, s: 70, l: 55, alpha: 0.6 })
    ctx.shadowBlur = 12
    ctx.beginPath()
    ctx.arc(food.x * cell + cell / 2, food.y * cell + cell / 2, r, 0, Math.PI * 2)
    ctx.fill()
    ctx.shadowBlur = 0

    snake.forEach((seg, i) => {
      const t = i / Math.max(1, snake.length - 1)
      ctx.fillStyle = themeHsl(stage, { l: 62 - t * 22, s: 70 - t * 20 })
      const pad = i === 0 ? 1 : 2
      const rad = Math.max(2, cell * 0.24)
      const x = seg.x * cell + pad
      const y = seg.y * cell + pad
      const w = cell - pad * 2
      ctx.beginPath()
      ctx.roundRect(x, y, w, w, rad)
      ctx.fill()
    })

    if (!started && alive) {
      ctx.fillStyle = isDark() ? 'rgba(10,12,16,0.55)' : 'rgba(255,255,255,0.6)'
      ctx.fillRect(0, px / 2 - cell * 1.1, px, cell * 2.2)
      ctx.fillStyle = themeHsl(stage, { l: isDark() ? 72 : 40 })
      ctx.font = `600 ${Math.max(13, cell * 0.72)}px "Helvetica Neue", "Microsoft Yahei", sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('按方向键或滑动开始', px / 2, px / 2)
    }
  }

  const loop = (ts) => {
    raf = requestAnimationFrame(loop)
    if (!alive) return
    if (!started) {
      draw()
      return
    }
    if (!last) last = ts
    acc += Math.min(ts - last, stepMs * 2)
    last = ts
    while (acc >= stepMs) {
      acc -= stepMs
      if (alive) step()
    }
    draw()
  }

  const onVisibility = () => {
    last = 0
    acc = 0
  }
  document.addEventListener('visibilitychange', onVisibility)

  const onKey = (e) => {
    const d = KEY_DIR[e.key]
    if (!d) return
    e.preventDefault()
    turn(d)
  }

  const offSwipe = onSwipe(viewport, turn)
  window.addEventListener('keydown', onKey)

  reset()
  raf = requestAnimationFrame(loop)

  return {
    restart: reset,
    destroy() {
      cancelAnimationFrame(raf)
      window.removeEventListener('keydown', onKey)
      document.removeEventListener('visibilitychange', onVisibility)
      offSwipe()
      surface.destroy()
    },
  }
}
