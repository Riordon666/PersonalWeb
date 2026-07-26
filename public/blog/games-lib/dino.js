import { themeHsl, isDark, fitCanvas, gameLoop } from './core.js'

export function mount(stage, api) {
  const viewport = stage.querySelector('[data-role="viewport"]')

  let W = 400
  let groundY = 320
  let dino = { x: 60, y: 0, vy: 0, size: 30 }
  let obstacles = []
  let clouds = []
  let speed = 5
  let distance = 0
  let nextGap = 300
  let started = false
  let over = false

  const surface = fitCanvas(viewport, (px) => {
    W = px
    groundY = Math.floor(px * 0.72)
    dino.size = Math.max(22, px * 0.055)
    dino.x = px * 0.14
    draw()
  })
  const { ctx } = surface

  const reset = () => {
    obstacles = []
    clouds = [
      { x: W * 0.3, y: W * 0.18, w: W * 0.1 },
      { x: W * 0.75, y: W * 0.3, w: W * 0.14 },
    ]
    dino.y = 0
    dino.vy = 0
    speed = W * 0.011
    distance = 0
    nextGap = W * 0.7
    started = false
    over = false
    api.setScore(0)
    api.hideOverlay()
    draw()
  }

  const jump = () => {
    if (over) return
    if (!started) {
      started = true
      return
    }
    if (dino.y === 0) {
      dino.vy = -W * 0.026
    }
  }

  const spawnObstacle = () => {
    const kind = Math.random()
    const h = kind < 0.5 ? dino.size * (0.9 + Math.random() * 0.5) : dino.size * 0.7
    const w = kind < 0.72 ? dino.size * (0.5 + Math.random() * 0.5) : dino.size * 1.5
    const fly = kind > 0.82 // low hovering "bird", still jumpable
    obstacles.push({
      x: W + w,
      w,
      h,
      yOff: fly ? dino.size * 0.9 : 0,
      fly,
    })
    nextGap = W * (0.55 + Math.random() * 0.55) * (speed / (W * 0.011))
  }

  const stopLoop = gameLoop((dt) => {
    if (!started || over) {
      draw()
      return
    }
    const k = dt / 16.7

    // physics
    dino.vy += W * 0.0016 * k
    dino.y = Math.min(0, dino.y + dino.vy * k)
    if (dino.y === 0) dino.vy = 0

    // world
    speed = Math.min(W * 0.024, speed + 0.0006 * k)
    distance += speed * k
    api.setScore(Math.floor(distance / 10))

    for (const o of obstacles) o.x -= speed * k
    obstacles = obstacles.filter((o) => o.x + o.w > -10)
    const lastX = obstacles.length ? obstacles[obstacles.length - 1].x : -Infinity
    if (W - lastX >= nextGap) spawnObstacle()

    for (const c of clouds) {
      c.x -= speed * 0.25 * k
      if (c.x + c.w < 0) {
        c.x = W + Math.random() * W * 0.3
        c.y = W * (0.12 + Math.random() * 0.25)
      }
    }

    // collision (slightly forgiving box)
    const dx = dino.x + 4
    const dw = dino.size - 8
    const dy = groundY + dino.y - dino.size + 4
    const dh = dino.size - 8
    for (const o of obstacles) {
      const oy = groundY - o.h - o.yOff
      if (dx < o.x + o.w && dx + dw > o.x && dy < oy + o.h && dy + dh > oy) {
        over = true
        api.gameOver('撞上了', `跑了 ${Math.floor(distance / 10)} 米`)
        break
      }
    }

    draw()
  })

  const draw = () => {
    ctx.clearRect(0, 0, W, W)
    const dark = isDark()

    // sky
    ctx.fillStyle = dark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)'
    ctx.fillRect(0, 0, W, W)

    // clouds
    ctx.fillStyle = dark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)'
    for (const c of clouds) {
      ctx.beginPath()
      ctx.ellipse(c.x, c.y, c.w, c.w * 0.35, 0, 0, Math.PI * 2)
      ctx.fill()
    }

    // ground
    ctx.strokeStyle = dark ? 'rgba(255,255,255,0.35)' : 'rgba(0,0,0,0.45)'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(0, groundY + 1)
    ctx.lineTo(W, groundY + 1)
    ctx.stroke()

    // ground speckles
    ctx.fillStyle = dark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)'
    const off = (distance * 1) % 40
    for (let x = -off; x < W; x += 40) {
      ctx.fillRect(x, groundY + 8, 10, 2)
    }

    // dino: rounded blob with an eye
    const s = dino.size
    const y = groundY + dino.y - s
    ctx.fillStyle = themeHsl(stage, { l: 55 })
    ctx.beginPath()
    ctx.roundRect(dino.x, y, s, s, s * 0.28)
    ctx.fill()
    ctx.fillStyle = '#fff'
    ctx.beginPath()
    ctx.arc(dino.x + s * 0.68, y + s * 0.3, s * 0.12, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#222'
    ctx.beginPath()
    ctx.arc(dino.x + s * 0.71, y + s * 0.3, s * 0.06, 0, Math.PI * 2)
    ctx.fill()

    // obstacles
    for (const o of obstacles) {
      ctx.fillStyle = o.fly
        ? themeHsl(stage, { shift: 200, l: 55 })
        : themeHsl(stage, { shift: 120, s: 45, l: dark ? 45 : 42 })
      ctx.beginPath()
      ctx.roundRect(o.x, groundY - o.h - o.yOff, o.w, o.h, Math.min(6, o.w * 0.3))
      ctx.fill()
    }

    if (!started && !over) {
      ctx.fillStyle = dark ? 'rgba(255,255,255,0.65)' : 'rgba(0,0,0,0.55)'
      ctx.font = `600 ${Math.max(13, W * 0.034)}px "Microsoft Yahei", sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('空格 / 点击开始，再按跳跃', W / 2, W * 0.42)
    }
  }

  const onKey = (e) => {
    if (e.key === ' ' || e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
      e.preventDefault()
      jump()
    }
  }
  const onPointer = (e) => {
    e.preventDefault()
    jump()
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
