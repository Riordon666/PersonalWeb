import { themeHsl, isDark, fitCanvas, gameLoop, clamp } from './core.js'

// Fruit tiers: radius factor (of board width) and score when merged
const FRUITS = [
  { name: '樱桃', rf: 0.045, pts: 1 },
  { name: '草莓', rf: 0.058, pts: 3 },
  { name: '葡萄', rf: 0.073, pts: 6 },
  { name: '橘子', rf: 0.09, pts: 10 },
  { name: '柿子', rf: 0.108, pts: 15 },
  { name: '苹果', rf: 0.126, pts: 21 },
  { name: '梨', rf: 0.147, pts: 28 },
  { name: '桃子', rf: 0.168, pts: 36 },
  { name: '菠萝', rf: 0.19, pts: 45 },
  { name: '甜瓜', rf: 0.215, pts: 55 },
  { name: '西瓜', rf: 0.245, pts: 66 },
]

export function mount(stage, api) {
  const viewport = stage.querySelector('[data-role="viewport"]')

  let W = 400
  let bodies = []
  let dropX = 200
  let nextTier = 0
  let previewTier = 0
  let score = 0
  let over = false
  let cooldown = 0
  let dangerFor = 0
  let biggest = 0

  const setNextHud = api.addHudItem('下一个', FRUITS[0].name)
  const setBiggest = api.addHudItem('最大', FRUITS[0].name)

  const surface = fitCanvas(viewport, (px) => {
    W = px
    dropX = clamp(dropX, W * 0.1, W * 0.9)
    draw()
  })
  const { ctx, canvas } = surface

  const TOP = () => W * 0.14
  const radiusOf = (tier) => FRUITS[tier].rf * W * 0.92

  const randTier = () => Math.floor(Math.random() * 5)

  const reset = () => {
    bodies = []
    dropX = W / 2
    nextTier = randTier()
    previewTier = randTier()
    score = 0
    over = false
    cooldown = 0
    dangerFor = 0
    biggest = 0
    api.setScore(0)
    setNextHud(FRUITS[previewTier].name)
    setBiggest(FRUITS[0].name)
    api.hideOverlay()
    draw()
  }

  const drop = () => {
    if (over || cooldown > 0) return
    bodies.push({
      x: dropX,
      y: TOP() - radiusOf(nextTier),
      vx: 0,
      vy: 0,
      tier: nextTier,
      merging: false,
      rest: 0,
    })
    nextTier = previewTier
    previewTier = randTier()
    setNextHud(FRUITS[previewTier].name)
    cooldown = 420
  }

  const merge = (a, b) => {
    const tier = a.tier + 1
    if (tier >= FRUITS.length) {
      // Two watermelons annihilate for a big bonus
      score += 200
      api.setScore(score)
      bodies = bodies.filter((x) => x !== a && x !== b)
      return
    }
    const nx = (a.x + b.x) / 2
    const ny = (a.y + b.y) / 2
    bodies = bodies.filter((x) => x !== a && x !== b)
    bodies.push({ x: nx, y: ny, vx: 0, vy: -W * 0.002, tier, merging: true, rest: 0 })
    score += FRUITS[tier].pts
    api.setScore(score)
    if (tier > biggest) {
      biggest = tier
      setBiggest(FRUITS[tier].name)
    }
  }

  const stopLoop = gameLoop((dt) => {
    if (over) {
      draw()
      return
    }
    cooldown = Math.max(0, cooldown - dt)
    const k = Math.min(2, dt / 16.7)
    const gravity = W * 0.0009

    for (const b of bodies) {
      b.vy += gravity * k
      b.x += b.vx * k
      b.y += b.vy * k
      b.vx *= 0.995

      const r = radiusOf(b.tier)
      // walls and floor
      if (b.x - r < 0) {
        b.x = r
        b.vx = Math.abs(b.vx) * 0.5
      }
      if (b.x + r > W) {
        b.x = W - r
        b.vx = -Math.abs(b.vx) * 0.5
      }
      if (b.y + r > W) {
        b.y = W - r
        b.vy *= -0.24
        b.vx *= 0.9
      }
    }

    // pairwise collisions, several relaxation passes for stability
    for (let pass = 0; pass < 4; pass++) {
      for (let i = 0; i < bodies.length; i++)
        for (let j = i + 1; j < bodies.length; j++) {
          const a = bodies[i]
          const b = bodies[j]
          const ra = radiusOf(a.tier)
          const rb = radiusOf(b.tier)
          let dx = b.x - a.x
          let dy = b.y - a.y
          let dist = Math.hypot(dx, dy)
          const minDist = ra + rb
          if (dist >= minDist || dist === 0) continue

          if (a.tier === b.tier && pass === 0) {
            merge(a, b)
            return
          }

          const nx = dx / dist
          const ny = dy / dist
          const overlap = minDist - dist
          const wa = rb / (ra + rb)
          const wb = ra / (ra + rb)
          a.x -= nx * overlap * wa
          a.y -= ny * overlap * wa
          b.x += nx * overlap * wb
          b.y += ny * overlap * wb

          const rel = (b.vx - a.vx) * nx + (b.vy - a.vy) * ny
          if (rel < 0) {
            const imp = rel * 0.42
            a.vx += imp * nx
            a.vy += imp * ny
            b.vx -= imp * nx
            b.vy -= imp * ny
          }
        }
    }

    // Losing takes sustained overflow, not a momentary bounce
    const overflow = bodies.some((b) => b.y - radiusOf(b.tier) < TOP() && Math.abs(b.vy) < W * 0.002)
    dangerFor = overflow ? dangerFor + dt : 0
    if (dangerFor > 1600) {
      over = true
      api.gameOver('堆太高了', `得分 ${score} · 最大合成 ${FRUITS[biggest].name}`)
    }

    draw()
  })

  const fruitColor = (tier) => themeHsl(stage, { shift: tier * 33, s: 68, l: 58 - tier * 1.4 })

  const draw = () => {
    const dark = isDark()
    ctx.clearRect(0, 0, W, W)
    ctx.fillStyle = dark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)'
    ctx.fillRect(0, 0, W, W)

    // danger line
    const t = TOP()
    ctx.strokeStyle = dangerFor > 600 ? 'hsla(4,80%,55%,0.85)' : 'hsla(4,70%,55%,0.3)'
    ctx.lineWidth = 2
    ctx.setLineDash([7, 7])
    ctx.beginPath()
    ctx.moveTo(0, t)
    ctx.lineTo(W, t)
    ctx.stroke()
    ctx.setLineDash([])

    // drop guide
    if (!over) {
      ctx.strokeStyle = dark ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.14)'
      ctx.setLineDash([3, 8])
      ctx.beginPath()
      ctx.moveTo(dropX, t)
      ctx.lineTo(dropX, W)
      ctx.stroke()
      ctx.setLineDash([])

      const r = radiusOf(nextTier)
      ctx.fillStyle = fruitColor(nextTier)
      ctx.beginPath()
      ctx.arc(dropX, t - r - 4, r, 0, Math.PI * 2)
      ctx.fill()
    }

    for (const b of bodies) {
      const r = radiusOf(b.tier)
      const g = ctx.createRadialGradient(b.x - r * 0.35, b.y - r * 0.35, r * 0.1, b.x, b.y, r)
      g.addColorStop(0, themeHsl(stage, { shift: b.tier * 33, s: 72, l: 70 - b.tier }))
      g.addColorStop(1, fruitColor(b.tier))
      ctx.fillStyle = g
      ctx.beginPath()
      ctx.arc(b.x, b.y, r, 0, Math.PI * 2)
      ctx.fill()

      if (r > W * 0.06) {
        ctx.fillStyle = 'rgba(255,255,255,0.85)'
        ctx.font = `600 ${r * 0.42}px "Microsoft Yahei", sans-serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText(FRUITS[b.tier].name, b.x, b.y)
      }
    }
  }

  const aim = (e) => {
    const rect = canvas.getBoundingClientRect()
    dropX = clamp(e.clientX - rect.left, radiusOf(nextTier), W - radiusOf(nextTier))
  }

  const onMove = (e) => aim(e)
  const onDown = (e) => {
    aim(e)
    drop()
  }
  const onKey = (e) => {
    if (e.key === 'ArrowLeft') dropX = clamp(dropX - W * 0.05, 0, W)
    else if (e.key === 'ArrowRight') dropX = clamp(dropX + W * 0.05, 0, W)
    else if (e.key === ' ' || e.key === 'ArrowDown') {
      e.preventDefault()
      drop()
    } else return
    e.preventDefault()
  }

  canvas.addEventListener('pointermove', onMove)
  canvas.addEventListener('pointerdown', onDown)
  window.addEventListener('keydown', onKey)

  reset()

  return {
    restart: reset,
    destroy() {
      stopLoop()
      canvas.removeEventListener('pointermove', onMove)
      canvas.removeEventListener('pointerdown', onDown)
      window.removeEventListener('keydown', onKey)
      surface.destroy()
    },
  }
}
