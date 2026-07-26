import { themeHsl, isDark, fitCanvas, gameLoop, randInt } from './core.js'

const COLORS = 5

export function mount(stage, api) {
  const viewport = stage.querySelector('[data-role="viewport"]')

  let W = 400
  let path = []
  let beads = [] // {t, color} where t is distance along the path
  let shot = null
  let ready = randInt(0, COLORS - 1)
  let next = randInt(0, COLORS - 1)
  let angle = 0
  let score = 0
  let over = false
  let spawnAcc = 0
  let comboUntil = 0
  let combo = 1

  const setProgress = api.addHudItem('进度', '0%')
  const setCombo = api.addHudItem('连击', '×1')

  const surface = fitCanvas(viewport, (px) => {
    W = px
    buildPath()
    draw()
  })
  const { ctx, canvas } = surface

  const R = () => W * 0.026
  const SPACING = () => R() * 1.95

  // A spiral path from the outside toward the center hole
  const buildPath = () => {
    path = []
    const cx = W / 2
    const cy = W / 2
    const turns = 2.6
    const steps = 900
    for (let i = 0; i <= steps; i++) {
      const p = i / steps
      const a = p * Math.PI * 2 * turns
      const rad = W * 0.46 - p * W * 0.34
      path.push({ x: cx + Math.cos(a) * rad, y: cy + Math.sin(a) * rad * 0.9 })
    }
  }

  const posAt = (t) => {
    const i = Math.max(0, Math.min(path.length - 1, Math.floor(t)))
    return path[i]
  }

  const reset = () => {
    buildPath()
    beads = []
    for (let i = 0; i < 22; i++) {
      beads.push({ t: -i * (SPACING() / (W * 0.0016)), color: randInt(0, COLORS - 1) })
    }
    shot = null
    ready = randInt(0, COLORS - 1)
    next = randInt(0, COLORS - 1)
    score = 0
    over = false
    spawnAcc = 0
    combo = 1
    api.setScore(0)
    setProgress('0%')
    setCombo('×1')
    api.hideOverlay()
    draw()
  }

  const step = () => Math.max(1, SPACING() / (W * 0.0016) / 8)

  const resolveMatches = (index) => {
    const color = beads[index].color
    let lo = index
    let hi = index
    while (lo > 0 && beads[lo - 1].color === color) lo--
    while (hi < beads.length - 1 && beads[hi + 1].color === color) hi++
    const count = hi - lo + 1
    if (count < 3) {
      combo = 1
      setCombo('×1')
      return false
    }
    beads.splice(lo, count)
    const now = performance.now()
    if (now < comboUntil) combo = Math.min(6, combo + 1)
    else combo = 1
    comboUntil = now + 1400
    setCombo(`×${combo}`)
    score += count * 30 * combo
    api.setScore(score)

    // chain: the two ends may now match
    if (lo > 0 && lo < beads.length && beads[lo - 1].color === beads[lo].color) {
      resolveMatches(lo)
    }
    return true
  }

  const stopLoop = gameLoop((dt) => {
    if (over) {
      draw()
      return
    }
    const k = dt / 16.7
    const advance = W * 0.0016 * k * 16.7 * 0.34

    for (const b of beads) b.t += advance

    // The lead bead reaching the end is a loss
    if (beads.length && beads[0].t >= path.length - 1) {
      over = true
      api.gameOver('珠子到终点了', `得分 ${score}`)
      return
    }

    // keep the chain packed
    const gap = SPACING() / (W * 0.0016) / 8
    for (let i = 1; i < beads.length; i++) {
      const minT = beads[i - 1].t - gap
      if (beads[i].t > minT) beads[i].t = minT
    }

    setProgress(`${Math.round(((beads[0]?.t || 0) / path.length) * 100)}%`)

    if (shot) {
      shot.x += shot.vx * k
      shot.y += shot.vy * k
      const r = R()

      let hitIndex = -1
      for (let i = 0; i < beads.length; i++) {
        const p = posAt(beads[i].t)
        if (!p) continue
        if (Math.hypot(p.x - shot.x, p.y - shot.y) < r * 1.85) {
          hitIndex = i
          break
        }
      }

      if (hitIndex >= 0) {
        const insertAt = hitIndex
        beads.splice(insertAt, 0, { t: beads[hitIndex].t + gap * 0.5, color: shot.color })
        shot = null
        resolveMatches(insertAt)
        if (!beads.length) {
          over = true
          api.gameOver('清空了！', `得分 ${score}`)
          return
        }
      } else if (shot.x < -20 || shot.x > W + 20 || shot.y < -20 || shot.y > W + 20) {
        shot = null
      }
    }

    draw()
  })

  const beadColor = (i) => themeHsl(stage, { shift: i * 70, s: 70, l: 56 })

  const draw = () => {
    const dark = isDark()
    ctx.clearRect(0, 0, W, W)
    ctx.fillStyle = dark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)'
    ctx.fillRect(0, 0, W, W)

    // path groove
    ctx.strokeStyle = dark ? 'rgba(255,255,255,0.09)' : 'rgba(0,0,0,0.08)'
    ctx.lineWidth = R() * 2.2
    ctx.lineCap = 'round'
    ctx.beginPath()
    path.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)))
    ctx.stroke()

    const r = R()
    for (const b of beads) {
      const p = posAt(b.t)
      if (!p || b.t < 0) continue
      ctx.fillStyle = beadColor(b.color)
      ctx.beginPath()
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = 'rgba(255,255,255,0.3)'
      ctx.beginPath()
      ctx.arc(p.x - r * 0.3, p.y - r * 0.3, r * 0.28, 0, Math.PI * 2)
      ctx.fill()
    }

    // frog / launcher at the center
    const cx = W / 2
    const cy = W / 2
    ctx.strokeStyle = dark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.2)'
    ctx.lineWidth = 2
    ctx.setLineDash([4, 7])
    ctx.beginPath()
    ctx.moveTo(cx, cy)
    ctx.lineTo(cx + Math.cos(angle) * W * 0.24, cy + Math.sin(angle) * W * 0.24)
    ctx.stroke()
    ctx.setLineDash([])

    ctx.fillStyle = dark ? '#2b2f38' : '#e9eaee'
    ctx.beginPath()
    ctx.arc(cx, cy, r * 2, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = beadColor(ready)
    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = beadColor(next)
    ctx.beginPath()
    ctx.arc(cx + r * 2.4, cy + r * 2.4, r * 0.6, 0, Math.PI * 2)
    ctx.fill()

    if (shot) {
      ctx.fillStyle = beadColor(shot.color)
      ctx.beginPath()
      ctx.arc(shot.x, shot.y, r, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  const aim = (e) => {
    const rect = canvas.getBoundingClientRect()
    angle = Math.atan2(e.clientY - rect.top - W / 2, e.clientX - rect.left - W / 2)
  }

  const fire = () => {
    if (shot || over) return
    shot = {
      x: W / 2,
      y: W / 2,
      vx: Math.cos(angle) * W * 0.021,
      vy: Math.sin(angle) * W * 0.021,
      color: ready,
    }
    ready = next
    next = randInt(0, COLORS - 1)
  }

  const onMove = (e) => aim(e)
  const onDown = (e) => {
    aim(e)
    fire()
  }
  const onKey = (e) => {
    if (e.key === ' ') {
      e.preventDefault()
      fire()
    } else if (e.key === 'ArrowLeft') angle -= 0.09
    else if (e.key === 'ArrowRight') angle += 0.09
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
