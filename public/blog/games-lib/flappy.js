import { themeHsl, isDark, fitCanvas, gameLoop, randInt } from './core.js'

export function mount(stage, api) {
  const viewport = stage.querySelector('[data-role="viewport"]')

  let W = 400
  let bird = { y: 200, vy: 0, r: 12 }
  let pipes = []
  let score = 0
  let started = false
  let over = false
  let frame = 0

  const surface = fitCanvas(viewport, (px) => {
    W = px
    bird.r = Math.max(9, px * 0.03)
    if (!started) bird.y = W * 0.45
    draw()
  })
  const { ctx } = surface

  const gapSize = () => Math.max(W * 0.2, W * 0.3 - score * W * 0.004)
  const pipeW = () => W * 0.13
  const speed = () => W * 0.005 + Math.min(score, 30) * W * 0.00008

  const spawnPipe = () => {
    const gap = gapSize()
    const margin = W * 0.12
    const top = randInt(margin, Math.max(margin + 1, W - margin - gap))
    pipes.push({ x: W, top, gap, passed: false })
  }

  const reset = () => {
    bird = { y: W * 0.45, vy: 0, r: Math.max(9, W * 0.03) }
    pipes = []
    score = 0
    started = false
    over = false
    frame = 0
    api.setScore(0)
    api.hideOverlay()
    draw()
  }

  const flap = () => {
    if (over) return
    if (!started) {
      started = true
      pipes = []
      spawnPipe()
    }
    bird.vy = -W * 0.0125
  }

  const die = () => {
    over = true
    api.gameOver('撞上了', `穿过 ${score} 根管道`)
  }

  const stopLoop = gameLoop((dt) => {
    if (!started || over) {
      draw()
      return
    }
    const k = dt / 16.7
    frame += k

    bird.vy += W * 0.00075 * k
    bird.y += bird.vy * k

    if (bird.y + bird.r > W) {
      bird.y = W - bird.r
      return die()
    }
    if (bird.y - bird.r < 0) {
      bird.y = bird.r
      bird.vy = 0
    }

    const pw = pipeW()
    for (const p of pipes) p.x -= speed() * k
    pipes = pipes.filter((p) => p.x + pw > -4)

    const last = pipes[pipes.length - 1]
    if (!last || W - last.x > W * 0.52) spawnPipe()

    const bx = W * 0.28
    for (const p of pipes) {
      if (!p.passed && p.x + pw < bx - bird.r) {
        p.passed = true
        score++
        api.setScore(score)
      }
      const inX = bx + bird.r > p.x && bx - bird.r < p.x + pw
      if (inX && (bird.y - bird.r < p.top || bird.y + bird.r > p.top + p.gap)) return die()
    }

    draw()
  })

  const draw = () => {
    const dark = isDark()
    ctx.clearRect(0, 0, W, W)

    // sky
    const sky = ctx.createLinearGradient(0, 0, 0, W)
    sky.addColorStop(0, themeHsl(stage, { s: 45, l: dark ? 16 : 82, alpha: 0.55 }))
    sky.addColorStop(1, themeHsl(stage, { s: 40, l: dark ? 10 : 92, alpha: 0.35 }))
    ctx.fillStyle = sky
    ctx.fillRect(0, 0, W, W)

    // pipes
    const pw = pipeW()
    for (const p of pipes) {
      ctx.fillStyle = themeHsl(stage, { shift: 110, s: 55, l: dark ? 38 : 48 })
      ctx.beginPath()
      ctx.roundRect(p.x, 0, pw, p.top, [0, 0, 6, 6])
      ctx.fill()
      ctx.beginPath()
      ctx.roundRect(p.x, p.top + p.gap, pw, W - p.top - p.gap, [6, 6, 0, 0])
      ctx.fill()
      // lip
      ctx.fillStyle = themeHsl(stage, { shift: 110, s: 50, l: dark ? 46 : 40 })
      ctx.fillRect(p.x - 3, p.top - 12, pw + 6, 12)
      ctx.fillRect(p.x - 3, p.top + p.gap, pw + 6, 12)
    }

    // bird
    const bx = W * 0.28
    ctx.save()
    ctx.translate(bx, bird.y)
    ctx.rotate(Math.max(-0.5, Math.min(1.1, bird.vy * 0.06)))
    ctx.fillStyle = themeHsl(stage, { shift: 45, s: 80, l: 58 })
    ctx.beginPath()
    ctx.arc(0, 0, bird.r, 0, Math.PI * 2)
    ctx.fill()
    // wing flaps while rising
    ctx.fillStyle = themeHsl(stage, { shift: 45, s: 70, l: 46 })
    const wing = Math.sin(frame * 0.35) * bird.r * 0.28
    ctx.beginPath()
    ctx.ellipse(-bird.r * 0.15, wing, bird.r * 0.55, bird.r * 0.34, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#fff'
    ctx.beginPath()
    ctx.arc(bird.r * 0.42, -bird.r * 0.3, bird.r * 0.26, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#222'
    ctx.beginPath()
    ctx.arc(bird.r * 0.5, -bird.r * 0.3, bird.r * 0.13, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = 'hsl(32, 85%, 55%)'
    ctx.beginPath()
    ctx.moveTo(bird.r * 0.75, 0)
    ctx.lineTo(bird.r * 1.35, bird.r * 0.16)
    ctx.lineTo(bird.r * 0.75, bird.r * 0.32)
    ctx.closePath()
    ctx.fill()
    ctx.restore()

    // score
    ctx.fillStyle = dark ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.6)'
    ctx.font = `800 ${W * 0.1}px "Helvetica Neue", sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'top'
    if (started && !over) ctx.fillText(String(score), W / 2, W * 0.06)

    if (!started && !over) {
      ctx.fillStyle = dark ? 'rgba(255,255,255,0.75)' : 'rgba(0,0,0,0.6)'
      ctx.font = `600 ${Math.max(13, W * 0.036)}px "Microsoft Yahei", sans-serif`
      ctx.textBaseline = 'middle'
      ctx.fillText('空格 / 点击起飞', W / 2, W * 0.62)
    }
  }

  const onKey = (e) => {
    if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
      e.preventDefault()
      flap()
    }
  }
  const onPointer = (e) => {
    e.preventDefault()
    flap()
  }

  window.addEventListener('keydown', onKey)
  viewport.addEventListener('pointerdown', onPointer)
  reset()

  return {
    restart: reset,
    destroy() {
      stopLoop()
      window.removeEventListener('keydown', onKey)
      viewport.removeEventListener('pointerdown', onPointer)
      surface.destroy()
    },
  }
}
