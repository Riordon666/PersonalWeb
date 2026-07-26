import { themeHsl, isDark, fitCanvas, gameLoop, clamp } from './core.js'

export function mount(stage, api) {
  const viewport = stage.querySelector('[data-role="viewport"]')

  let W = 400
  let paddle = { x: 0, w: 70, h: 10 }
  let baseW = 70
  let balls = []
  let bricks = []
  let drops = []
  let score = 0
  let lives = 3
  let wave = 1
  let launched = false
  let over = false
  let hits = 0
  let widenUntil = 0
  let slowUntil = 0

  const setLives = api.addHudItem('生命', '❤❤❤')
  const setWave = api.addHudItem('关卡', 1)

  const surface = fitCanvas(viewport, (px) => {
    W = px
    paddle.x = clamp(paddle.x, 0, W - paddle.w)
    draw()
  })
  const { ctx, canvas } = surface

  const COLS = 9
  const ROWS = 6

  const buildBricks = () => {
    bricks = []
    const bw = (W - 24) / COLS
    const bh = Math.max(14, W * 0.038)
    for (let r = 0; r < ROWS; r++)
      for (let c = 0; c < COLS; c++) {
        bricks.push({
          x: 12 + c * bw,
          y: 40 + r * (bh + 4),
          w: bw - 4,
          h: bh,
          row: r,
          alive: true,
        })
      }
  }

  const ballSpeed = () => {
    const base = W * 0.0105 * (1 + (wave - 1) * 0.12 + Math.min(hits, 40) * 0.004)
    return Date.now() < slowUntil ? base * 0.65 : base
  }

  const newBall = () => ({
    x: paddle.x + paddle.w / 2,
    y: W - 40,
    dx: 0.5,
    dy: -1,
  })

  const reset = () => {
    score = 0
    lives = 3
    wave = 1
    hits = 0
    over = false
    launched = false
    drops = []
    widenUntil = 0
    slowUntil = 0
    paddle.w = baseW = Math.max(60, W * 0.18)
    paddle.x = (W - paddle.w) / 2
    balls = [newBall()]
    buildBricks()
    api.setScore(0)
    setLives('❤❤❤')
    setWave(1)
    api.hideOverlay()
    draw()
  }

  const loseBall = () => {
    if (balls.length > 0) return
    lives--
    setLives('❤'.repeat(Math.max(0, lives)) || '—')
    if (lives <= 0) {
      over = true
      api.gameOver('游戏结束', `得分 ${score} · 第 ${wave} 关`)
      return
    }
    launched = false
    balls = [newBall()]
  }

  const nextWave = () => {
    wave++
    setWave(wave)
    launched = false
    balls = [newBall()]
    drops = []
    buildBricks()
  }

  const movePaddleTo = (clientX) => {
    const rect = canvas.getBoundingClientRect()
    paddle.x = clamp(clientX - rect.left - paddle.w / 2, 0, W - paddle.w)
    if (!launched) {
      balls.forEach((b) => {
        b.x = paddle.x + paddle.w / 2
      })
    }
  }

  const launch = () => {
    if (over) return
    launched = true
  }

  const tickBall = (b, speed) => {
    const len = Math.hypot(b.dx, b.dy) || 1
    b.x += (b.dx / len) * speed
    b.y += (b.dy / len) * speed
    const r = W * 0.014

    if (b.x < r) {
      b.x = r
      b.dx = Math.abs(b.dx)
    }
    if (b.x > W - r) {
      b.x = W - r
      b.dx = -Math.abs(b.dx)
    }
    if (b.y < r) {
      b.y = r
      b.dy = Math.abs(b.dy)
    }

    // paddle
    const py = W - 26
    if (b.dy > 0 && b.y + r >= py && b.y + r <= py + paddle.h + 8 && b.x >= paddle.x - r && b.x <= paddle.x + paddle.w + r) {
      const t = clamp((b.x - paddle.x) / paddle.w, 0, 1)
      const angle = (t - 0.5) * (Math.PI * 0.7)
      b.dx = Math.sin(angle)
      b.dy = -Math.cos(angle)
      b.y = py - r
    }

    // bricks
    for (const brick of bricks) {
      if (!brick.alive) continue
      if (b.x + r < brick.x || b.x - r > brick.x + brick.w || b.y + r < brick.y || b.y - r > brick.y + brick.h) continue
      brick.alive = false
      hits++
      score += 10 + (ROWS - brick.row) * 2
      api.setScore(score)

      // bounce by shallowest penetration
      const overlapX = Math.min(b.x + r - brick.x, brick.x + brick.w - (b.x - r))
      const overlapY = Math.min(b.y + r - brick.y, brick.y + brick.h - (b.y - r))
      if (overlapX < overlapY) b.dx = -b.dx
      else b.dy = -b.dy

      if (Math.random() < 0.12) {
        drops.push({
          x: brick.x + brick.w / 2,
          y: brick.y,
          kind: Math.random() < 0.5 ? 'W' : 'S',
        })
      }
      break
    }

    return b.y < W + r * 2
  }

  const stopLoop = gameLoop(() => {
    if (over) {
      draw()
      return
    }
    if (launched) {
      const speed = ballSpeed()
      balls = balls.filter((b) => tickBall(b, speed))
      if (!balls.length) loseBall()
      if (bricks.every((k) => !k.alive) && !over) nextWave()
    }

    // powerup capsules
    if (Date.now() > widenUntil && paddle.w !== baseW) {
      paddle.w = baseW
      paddle.x = clamp(paddle.x, 0, W - paddle.w)
    }
    drops = drops.filter((d) => {
      d.y += W * 0.004
      const py = W - 26
      if (d.y >= py && d.y <= py + 16 && d.x >= paddle.x && d.x <= paddle.x + paddle.w) {
        if (d.kind === 'W') {
          paddle.w = baseW * 1.55
          widenUntil = Date.now() + 12000
        } else {
          slowUntil = Date.now() + 8000
        }
        return false
      }
      return d.y < W + 20
    })

    draw()
  })

  const draw = () => {
    ctx.clearRect(0, 0, W, W)
    ctx.fillStyle = isDark() ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)'
    ctx.fillRect(0, 0, W, W)

    for (const brick of bricks) {
      if (!brick.alive) continue
      ctx.fillStyle = themeHsl(stage, { shift: brick.row * 16, l: 60 })
      ctx.beginPath()
      ctx.roundRect(brick.x, brick.y, brick.w, brick.h, 4)
      ctx.fill()
    }

    // paddle
    ctx.fillStyle = themeHsl(stage, { l: 52 })
    ctx.beginPath()
    ctx.roundRect(paddle.x, W - 26, paddle.w, paddle.h, 6)
    ctx.fill()

    // balls
    ctx.fillStyle = isDark() ? '#e8e9ee' : '#33363f'
    for (const b of balls) {
      ctx.beginPath()
      ctx.arc(b.x, b.y, W * 0.014, 0, Math.PI * 2)
      ctx.fill()
    }

    // drops
    for (const d of drops) {
      ctx.fillStyle = d.kind === 'W' ? themeHsl(stage, { shift: 90, l: 55 }) : themeHsl(stage, { shift: 180, l: 55 })
      ctx.beginPath()
      ctx.roundRect(d.x - 11, d.y - 8, 22, 16, 6)
      ctx.fill()
      ctx.fillStyle = '#fff'
      ctx.font = `700 11px sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(d.kind === 'W' ? '宽' : '慢', d.x, d.y + 0.5)
    }

    if (!launched && !over) {
      ctx.fillStyle = isDark() ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)'
      ctx.font = `600 ${Math.max(12, W * 0.032)}px "Microsoft Yahei", sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('移动瞄准 · 点击或按空格发射', W / 2, W * 0.62)
    }
  }

  const onMouseMove = (e) => movePaddleTo(e.clientX)
  const onTouchMove = (e) => {
    movePaddleTo(e.touches[0].clientX)
  }
  const onClick = () => launch()
  const onKey = (e) => {
    if (e.key === ' ') {
      e.preventDefault()
      launch()
    } else if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
      paddle.x = clamp(paddle.x - 28, 0, W - paddle.w)
      if (!launched) balls.forEach((b) => (b.x = paddle.x + paddle.w / 2))
    } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
      paddle.x = clamp(paddle.x + 28, 0, W - paddle.w)
      if (!launched) balls.forEach((b) => (b.x = paddle.x + paddle.w / 2))
    }
  }

  canvas.addEventListener('mousemove', onMouseMove)
  canvas.addEventListener('touchmove', onTouchMove, { passive: true })
  canvas.addEventListener('touchstart', onTouchMove, { passive: true })
  canvas.addEventListener('click', onClick)
  window.addEventListener('keydown', onKey)

  reset()

  return {
    restart: reset,
    destroy() {
      stopLoop()
      canvas.removeEventListener('mousemove', onMouseMove)
      canvas.removeEventListener('touchmove', onTouchMove)
      canvas.removeEventListener('touchstart', onTouchMove)
      canvas.removeEventListener('click', onClick)
      window.removeEventListener('keydown', onKey)
      surface.destroy()
    },
  }
}
