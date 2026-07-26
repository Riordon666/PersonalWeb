import { themeHsl, isDark, fitCanvas, gameLoop, clamp, randInt } from './core.js'

export function mount(stage, api) {
  const viewport = stage.querySelector('[data-role="viewport"]')

  let W = 400
  let player = { x: 200, y: 0, vy: 0, r: 14 }
  let platforms = []
  let cameraY = 0
  let best = 0
  let over = false
  let started = false
  let dir = 0

  const surface = fitCanvas(viewport, (px) => {
    W = px
    player.r = Math.max(10, px * 0.035)
    draw()
  })
  const { ctx, canvas } = surface

  const PLAT_H = () => Math.max(7, W * 0.022)
  const JUMP_V = () => -W * 0.0295
  const GRAVITY = () => W * 0.0011

  const makePlatform = (y) => ({
    x: randInt(0, Math.floor(W - W * 0.24)),
    y,
    w: W * 0.24,
    spring: Math.random() < 0.14,
    // Some platforms drift sideways at higher altitudes
    vx: Math.random() < Math.min(0.3, best / 4000) ? (Math.random() < 0.5 ? -1 : 1) * W * 0.0018 : 0,
  })

  const reset = () => {
    platforms = []
    const gap = W * 0.17
    for (let i = 0; i < 12; i++) platforms.push(makePlatform(W - i * gap))
    platforms[0].x = W / 2 - W * 0.12
    platforms[0].vx = 0
    platforms[0].spring = false
    player = { x: W / 2, y: W - PLAT_H() - 20, vy: JUMP_V(), r: Math.max(10, W * 0.035) }
    cameraY = 0
    best = 0
    over = false
    started = false
    dir = 0
    api.setScore(0)
    api.hideOverlay()
    draw()
  }

  const stopLoop = gameLoop((dt) => {
    if (over) {
      draw()
      return
    }
    const k = Math.min(2.2, dt / 16.7)

    if (started) {
      player.x += dir * W * 0.011 * k
      // wrap around the sides, like the original
      if (player.x < -player.r) player.x = W + player.r
      if (player.x > W + player.r) player.x = -player.r

      player.vy += GRAVITY() * k
      player.y += player.vy * k

      // scroll when the player climbs past the upper third
      const threshold = W * 0.38
      if (player.y < threshold) {
        const shift = threshold - player.y
        player.y = threshold
        cameraY += shift
        platforms.forEach((p) => (p.y += shift))
        best = Math.max(best, Math.floor(cameraY / 10))
        api.setScore(best)
      }

      for (const p of platforms) {
        if (p.vx) {
          p.x += p.vx * k
          if (p.x < 0 || p.x + p.w > W) p.vx *= -1
        }
      }

      // land only while falling
      if (player.vy > 0) {
        for (const p of platforms) {
          if (
            player.x + player.r * 0.6 > p.x &&
            player.x - player.r * 0.6 < p.x + p.w &&
            player.y + player.r >= p.y &&
            player.y + player.r <= p.y + PLAT_H() + Math.abs(player.vy) * k
          ) {
            player.vy = p.spring ? JUMP_V() * 1.65 : JUMP_V()
            break
          }
        }
      }

      platforms = platforms.filter((p) => p.y < W + 40)
      while (platforms.length < 12) {
        const top = platforms.reduce((m, p) => Math.min(m, p.y), W)
        platforms.push(makePlatform(top - W * (0.13 + Math.random() * 0.07)))
      }

      if (player.y - player.r > W) {
        over = true
        api.gameOver('掉下去了', `爬升 ${best} 米`)
      }
    }

    draw()
  })

  const draw = () => {
    const dark = isDark()
    ctx.clearRect(0, 0, W, W)
    ctx.fillStyle = dark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)'
    ctx.fillRect(0, 0, W, W)

    const ph = PLAT_H()
    for (const p of platforms) {
      ctx.fillStyle = p.spring
        ? themeHsl(stage, { shift: 150, s: 70, l: 52 })
        : themeHsl(stage, { l: dark ? 48 : 58 })
      ctx.beginPath()
      ctx.roundRect(p.x, p.y, p.w, ph, ph / 2)
      ctx.fill()
      if (p.spring) {
        ctx.strokeStyle = 'rgba(255,255,255,0.85)'
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(p.x + p.w / 2 - 6, p.y - 5)
        ctx.lineTo(p.x + p.w / 2, p.y - 11)
        ctx.lineTo(p.x + p.w / 2 + 6, p.y - 5)
        ctx.stroke()
      }
    }

    // player
    ctx.fillStyle = themeHsl(stage, { shift: 40, s: 75, l: 58 })
    ctx.beginPath()
    ctx.ellipse(player.x, player.y, player.r, player.r * 0.92, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#fff'
    const eyeDx = dir * player.r * 0.18
    ctx.beginPath()
    ctx.arc(player.x - player.r * 0.3 + eyeDx, player.y - player.r * 0.2, player.r * 0.2, 0, Math.PI * 2)
    ctx.arc(player.x + player.r * 0.35 + eyeDx, player.y - player.r * 0.2, player.r * 0.2, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#222'
    ctx.beginPath()
    ctx.arc(player.x - player.r * 0.28 + eyeDx, player.y - player.r * 0.2, player.r * 0.1, 0, Math.PI * 2)
    ctx.arc(player.x + player.r * 0.37 + eyeDx, player.y - player.r * 0.2, player.r * 0.1, 0, Math.PI * 2)
    ctx.fill()

    if (!started && !over) {
      ctx.fillStyle = dark ? 'rgba(255,255,255,0.72)' : 'rgba(0,0,0,0.6)'
      ctx.font = `600 ${Math.max(12, W * 0.034)}px "Microsoft Yahei", sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('←→ / A D 左右移动', W / 2, W * 0.2)
    }
  }

  const begin = () => {
    started = true
  }
  const onKeyDown = (e) => {
    if (['ArrowLeft', 'a', 'A'].includes(e.key)) {
      e.preventDefault()
      dir = -1
      begin()
    } else if (['ArrowRight', 'd', 'D'].includes(e.key)) {
      e.preventDefault()
      dir = 1
      begin()
    }
  }
  const onKeyUp = (e) => {
    if (['ArrowLeft', 'a', 'A'].includes(e.key) && dir === -1) dir = 0
    if (['ArrowRight', 'd', 'D'].includes(e.key) && dir === 1) dir = 0
  }

  // Touch: hold the left or right half of the board
  const pointFromEvent = (e) => {
    const rect = canvas.getBoundingClientRect()
    const x = (e.touches ? e.touches[0].clientX : e.clientX) - rect.left
    return x < rect.width / 2 ? -1 : 1
  }
  const onPointerDown = (e) => {
    e.preventDefault()
    dir = pointFromEvent(e)
    begin()
  }
  const onPointerMove = (e) => {
    if (dir !== 0) dir = pointFromEvent(e)
  }
  const onPointerUp = () => {
    dir = 0
  }

  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('keyup', onKeyUp)
  viewport.addEventListener('pointerdown', onPointerDown)
  viewport.addEventListener('pointermove', onPointerMove)
  window.addEventListener('pointerup', onPointerUp)

  reset()

  return {
    restart: reset,
    destroy() {
      stopLoop()
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      viewport.removeEventListener('pointerdown', onPointerDown)
      viewport.removeEventListener('pointermove', onPointerMove)
      window.removeEventListener('pointerup', onPointerUp)
      surface.destroy()
    },
  }
}
