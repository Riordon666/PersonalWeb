import { themeHsl, isDark, fitCanvas, gameLoop, clamp } from './core.js'

export function mount(stage, api) {
  const viewport = stage.querySelector('[data-role="viewport"]')

  let W = 400
  let balls = []
  let bumpers = []
  let flipperL = { angle: 0.5, target: 0.5 }
  let flipperR = { angle: 0.5, target: 0.5 }
  let score = 0
  let ballsLeft = 3
  let over = false
  let launched = false
  let multiplier = 1
  let comboUntil = 0

  const setBalls = api.addHudItem('剩余球', 3)
  const setMul = api.addHudItem('倍率', '×1')

  const surface = fitCanvas(viewport, (px) => {
    W = px
    layout()
    draw()
  })
  const { ctx, canvas } = surface

  const R = () => W * 0.022
  const FL_LEN = () => W * 0.2
  const FL_Y = () => W * 0.86
  const FL_LX = () => W * 0.3
  const FL_RX = () => W * 0.7

  const layout = () => {
    bumpers = [
      { x: W * 0.3, y: W * 0.26, r: W * 0.065, pts: 100, lit: 0 },
      { x: W * 0.7, y: W * 0.26, r: W * 0.065, pts: 100, lit: 0 },
      { x: W * 0.5, y: W * 0.42, r: W * 0.075, pts: 150, lit: 0 },
      { x: W * 0.2, y: W * 0.56, r: W * 0.05, pts: 50, lit: 0 },
      { x: W * 0.8, y: W * 0.56, r: W * 0.05, pts: 50, lit: 0 },
    ]
  }

  const newBall = () => ({
    x: W * 0.5,
    y: W * 0.2,
    vx: (Math.random() - 0.5) * W * 0.006,
    vy: W * 0.004,
  })

  const reset = () => {
    layout()
    balls = [newBall()]
    score = 0
    ballsLeft = 3
    over = false
    launched = false
    multiplier = 1
    comboUntil = 0
    flipperL = { angle: 0.5, target: 0.5 }
    flipperR = { angle: 0.5, target: 0.5 }
    api.setScore(0)
    setBalls(3)
    setMul('×1')
    api.hideOverlay()
    draw()
  }

  const addScore = (n) => {
    const now = performance.now()
    if (now < comboUntil) multiplier = Math.min(8, multiplier + 1)
    else multiplier = 1
    comboUntil = now + 1500
    setMul(`×${multiplier}`)
    score += n * multiplier
    api.setScore(score)
  }

  const loseBall = () => {
    ballsLeft--
    setBalls(Math.max(0, ballsLeft))
    multiplier = 1
    setMul('×1')
    if (ballsLeft <= 0) {
      over = true
      api.gameOver('球用完了', `得分 ${score}`)
    } else {
      balls = [newBall()]
      launched = false
    }
  }

  // Flipper segment endpoints for the current angle
  const flipperSeg = (side) => {
    const f = side === 'L' ? flipperL : flipperR
    const baseX = side === 'L' ? FL_LX() : FL_RX()
    const dir = side === 'L' ? 1 : -1
    const a = f.angle * 0.9 - 0.45
    return {
      x1: baseX,
      y1: FL_Y(),
      x2: baseX + dir * FL_LEN() * Math.cos(a),
      y2: FL_Y() + FL_LEN() * Math.sin(a),
      up: f.target < 0.5,
    }
  }

  const collideSegment = (b, seg) => {
    const r = R()
    const dx = seg.x2 - seg.x1
    const dy = seg.y2 - seg.y1
    const len2 = dx * dx + dy * dy || 1
    let t = ((b.x - seg.x1) * dx + (b.y - seg.y1) * dy) / len2
    t = clamp(t, 0, 1)
    const px = seg.x1 + dx * t
    const py = seg.y1 + dy * t
    const distX = b.x - px
    const distY = b.y - py
    const dist = Math.hypot(distX, distY)
    if (dist > r) return false

    const nx = distX / (dist || 1)
    const ny = distY / (dist || 1)
    b.x = px + nx * (r + 0.5)
    b.y = py + ny * (r + 0.5)
    const dot = b.vx * nx + b.vy * ny
    b.vx -= 2 * dot * nx
    b.vy -= 2 * dot * ny
    b.vx *= 0.94
    b.vy *= 0.94
    // A raised flipper kicks the ball hard
    if (seg.up) {
      b.vy -= W * 0.011
      b.vx += nx * W * 0.004
    }
    return true
  }

  const stopLoop = gameLoop((dt) => {
    if (over) {
      draw()
      return
    }
    const k = Math.min(2.2, dt / 16.7)

    for (const f of [flipperL, flipperR]) {
      f.angle += (f.target - f.angle) * Math.min(1, 0.35 * k)
    }

    const r = R()
    for (const b of balls) {
      if (launched) b.vy += W * 0.00055 * k
      b.x += b.vx * k
      b.y += b.vy * k

      // walls
      if (b.x < W * 0.06 + r) {
        b.x = W * 0.06 + r
        b.vx = Math.abs(b.vx) * 0.92
      }
      if (b.x > W * 0.94 - r) {
        b.x = W * 0.94 - r
        b.vx = -Math.abs(b.vx) * 0.92
      }
      if (b.y < W * 0.06 + r) {
        b.y = W * 0.06 + r
        b.vy = Math.abs(b.vy) * 0.92
      }

      // bumpers
      for (const bump of bumpers) {
        const d = Math.hypot(b.x - bump.x, b.y - bump.y)
        if (d < bump.r + r) {
          const nx = (b.x - bump.x) / (d || 1)
          const ny = (b.y - bump.y) / (d || 1)
          b.x = bump.x + nx * (bump.r + r + 0.5)
          b.y = bump.y + ny * (bump.r + r + 0.5)
          const speed = Math.max(Math.hypot(b.vx, b.vy), W * 0.008) * 1.12
          b.vx = nx * speed
          b.vy = ny * speed
          bump.lit = performance.now() + 220
          addScore(bump.pts)
        }
      }

      collideSegment(b, flipperSeg('L'))
      collideSegment(b, flipperSeg('R'))

      // side deflectors near the drain
      const dl = { x1: W * 0.06, y1: W * 0.72, x2: FL_LX(), y2: FL_Y() }
      const dr = { x1: W * 0.94, y1: W * 0.72, x2: FL_RX(), y2: FL_Y() }
      collideSegment(b, dl)
      collideSegment(b, dr)
    }

    const before = balls.length
    balls = balls.filter((b) => b.y < W + r * 3)
    if (before && !balls.length) loseBall()

    draw()
  })

  const draw = () => {
    const dark = isDark()
    ctx.clearRect(0, 0, W, W)

    // table
    ctx.fillStyle = dark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.04)'
    ctx.beginPath()
    ctx.roundRect(W * 0.06, W * 0.06, W * 0.88, W * 0.94, W * 0.1)
    ctx.fill()
    ctx.strokeStyle = themeHsl(stage, { l: 55, alpha: 0.5 })
    ctx.lineWidth = 3
    ctx.stroke()

    for (const b of bumpers) {
      const lit = performance.now() < b.lit
      ctx.fillStyle = lit
        ? themeHsl(stage, { shift: 50, s: 90, l: 62 })
        : themeHsl(stage, { shift: b.pts / 4, s: 60, l: dark ? 45 : 58 })
      ctx.beginPath()
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = 'rgba(255,255,255,0.5)'
      ctx.beginPath()
      ctx.arc(b.x, b.y, b.r * 0.45, 0, Math.PI * 2)
      ctx.fill()
    }

    // deflectors
    ctx.strokeStyle = dark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.3)'
    ctx.lineWidth = W * 0.018
    ctx.lineCap = 'round'
    ctx.beginPath()
    ctx.moveTo(W * 0.06, W * 0.72)
    ctx.lineTo(FL_LX(), FL_Y())
    ctx.moveTo(W * 0.94, W * 0.72)
    ctx.lineTo(FL_RX(), FL_Y())
    ctx.stroke()

    // flippers
    ctx.strokeStyle = themeHsl(stage, { l: 55 })
    ctx.lineWidth = W * 0.032
    for (const side of ['L', 'R']) {
      const s = flipperSeg(side)
      ctx.beginPath()
      ctx.moveTo(s.x1, s.y1)
      ctx.lineTo(s.x2, s.y2)
      ctx.stroke()
    }

    // balls
    const r = R()
    for (const b of balls) {
      const g = ctx.createRadialGradient(b.x - r * 0.3, b.y - r * 0.3, r * 0.1, b.x, b.y, r)
      g.addColorStop(0, '#fff')
      g.addColorStop(1, dark ? '#98a0b0' : '#6a7080')
      ctx.fillStyle = g
      ctx.beginPath()
      ctx.arc(b.x, b.y, r, 0, Math.PI * 2)
      ctx.fill()
    }

    if (!launched && !over) {
      ctx.fillStyle = dark ? 'rgba(255,255,255,0.78)' : 'rgba(0,0,0,0.62)'
      ctx.font = `600 ${Math.max(12, W * 0.032)}px "Microsoft Yahei", sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('A D / ←→ 拍挡板，空格发球', W / 2, W * 0.68)
    }
  }

  const setFlipper = (side, up) => {
    launched = true
    const f = side === 'L' ? flipperL : flipperR
    f.target = up ? 0.05 : 0.5
  }

  const onKeyDown = (e) => {
    if (['ArrowLeft', 'a', 'A'].includes(e.key)) {
      e.preventDefault()
      setFlipper('L', true)
    } else if (['ArrowRight', 'd', 'D'].includes(e.key)) {
      e.preventDefault()
      setFlipper('R', true)
    } else if (e.key === ' ') {
      e.preventDefault()
      launched = true
    }
  }
  const onKeyUp = (e) => {
    if (['ArrowLeft', 'a', 'A'].includes(e.key)) setFlipper('L', false)
    if (['ArrowRight', 'd', 'D'].includes(e.key)) setFlipper('R', false)
  }
  const onPointerDown = (e) => {
    const rect = canvas.getBoundingClientRect()
    setFlipper(e.clientX - rect.left < rect.width / 2 ? 'L' : 'R', true)
  }
  const onPointerUp = () => {
    setFlipper('L', false)
    setFlipper('R', false)
  }

  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('keyup', onKeyUp)
  canvas.addEventListener('pointerdown', onPointerDown)
  window.addEventListener('pointerup', onPointerUp)

  reset()

  return {
    restart: reset,
    destroy() {
      stopLoop()
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      canvas.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('pointerup', onPointerUp)
      surface.destroy()
    },
  }
}
