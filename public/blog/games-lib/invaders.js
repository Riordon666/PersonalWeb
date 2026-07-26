import { themeHsl, isDark, fitCanvas, gameLoop, clamp } from './core.js'

const COLS = 8
const ROWS = 4

export function mount(stage, api) {
  const viewport = stage.querySelector('[data-role="viewport"]')

  let W = 400
  let ship = { x: 200, w: 34, h: 12 }
  let aliens = []
  let bullets = []
  let bombs = []
  let shields = []
  let dirX = 1
  let stepDown = false
  let moveAcc = 0
  let fireAcc = 0
  let score = 0
  let lives = 3
  let wave = 1
  let over = false
  let started = false
  let holdLeft = false
  let holdRight = false

  const setLives = api.addHudItem('生命', '❤❤❤')
  const setWave = api.addHudItem('波次', 1)

  const surface = fitCanvas(viewport, (px) => {
    W = px
    ship.w = px * 0.09
    ship.h = px * 0.032
    ship.x = clamp(ship.x, ship.w / 2, W - ship.w / 2)
    draw()
  })
  const { ctx } = surface

  const alienSize = () => W * 0.055

  const buildWave = () => {
    aliens = []
    const s = alienSize()
    const gapX = W * 0.105
    const gapY = W * 0.085
    const startX = (W - (COLS - 1) * gapX) / 2
    for (let r = 0; r < ROWS; r++)
      for (let c = 0; c < COLS; c++) {
        aliens.push({ x: startX + c * gapX, y: W * 0.12 + r * gapY, row: r, alive: true, s })
      }
    bullets = []
    bombs = []
    dirX = 1
  }

  const buildShields = () => {
    shields = []
    const count = 3
    const blockW = W * 0.035
    for (let i = 0; i < count; i++) {
      const cx = W * (0.22 + i * 0.28)
      for (let bx = -1; bx <= 1; bx++)
        for (let by = 0; by < 2; by++) {
          shields.push({ x: cx + bx * blockW, y: W * 0.74 + by * blockW, s: blockW, hp: 3 })
        }
    }
  }

  const reset = () => {
    ship = { x: W / 2, w: W * 0.09, h: W * 0.032 }
    score = 0
    lives = 3
    wave = 1
    over = false
    started = false
    moveAcc = 0
    fireAcc = 0
    api.setScore(0)
    setLives('❤❤❤')
    setWave(1)
    api.hideOverlay()
    buildWave()
    buildShields()
    draw()
  }

  const shoot = () => {
    if (over || !started) {
      started = true
      return
    }
    if (bullets.length >= 3) return
    bullets.push({ x: ship.x, y: W - W * 0.1 })
  }

  const alienStepMs = () => {
    const alive = aliens.filter((a) => a.alive).length
    return Math.max(90, 620 - (COLS * ROWS - alive) * 14 - (wave - 1) * 60)
  }

  const hitShield = (x, y) => {
    for (const s of shields) {
      if (s.hp > 0 && x > s.x - s.s / 2 && x < s.x + s.s / 2 && y > s.y && y < s.y + s.s) {
        s.hp--
        return true
      }
    }
    return false
  }

  const loseLife = () => {
    lives--
    setLives('❤'.repeat(Math.max(0, lives)) || '—')
    bombs = []
    if (lives <= 0) {
      over = true
      api.gameOver('防线失守', `得分 ${score} · 第 ${wave} 波`)
    }
  }

  const stopLoop = gameLoop((dt) => {
    if (over || !started) {
      draw()
      return
    }
    const k = dt / 16.7

    if (holdLeft) ship.x -= W * 0.0105 * k
    if (holdRight) ship.x += W * 0.0105 * k
    ship.x = clamp(ship.x, ship.w / 2, W - ship.w / 2)

    // alien formation marches on a timer, not per frame
    moveAcc += dt
    const step = alienStepMs()
    while (moveAcc >= step) {
      moveAcc -= step
      const alive = aliens.filter((a) => a.alive)
      if (!alive.length) break
      const minX = Math.min(...alive.map((a) => a.x))
      const maxX = Math.max(...alive.map((a) => a.x))
      if (stepDown) {
        alive.forEach((a) => (a.y += W * 0.032))
        dirX *= -1
        stepDown = false
      } else {
        const dx = dirX * W * 0.022
        if (minX + dx < W * 0.05 || maxX + dx > W * 0.95) stepDown = true
        else alive.forEach((a) => (a.x += dx))
      }
      if (alive.some((a) => a.y > W * 0.72)) {
        over = true
        api.gameOver('被攻破了', `得分 ${score} · 第 ${wave} 波`)
        return
      }
    }

    // aliens drop bombs
    fireAcc += dt
    const fireEvery = Math.max(420, 1400 - wave * 120)
    if (fireAcc >= fireEvery) {
      fireAcc = 0
      const alive = aliens.filter((a) => a.alive)
      if (alive.length) {
        const shooter = alive[Math.floor(Math.random() * alive.length)]
        bombs.push({ x: shooter.x, y: shooter.y })
      }
    }

    for (const b of bullets) b.y -= W * 0.017 * k
    for (const b of bombs) b.y += W * 0.0085 * k

    // bullet collisions
    bullets = bullets.filter((b) => {
      if (b.y < 0) return false
      if (hitShield(b.x, b.y)) return false
      for (const a of aliens) {
        if (!a.alive) continue
        if (Math.abs(a.x - b.x) < a.s * 0.55 && Math.abs(a.y - b.y) < a.s * 0.5) {
          a.alive = false
          score += (ROWS - a.row) * 10
          api.setScore(score)
          return false
        }
      }
      return true
    })

    // bombs
    bombs = bombs.filter((b) => {
      if (b.y > W) return false
      if (hitShield(b.x, b.y)) return false
      if (Math.abs(b.x - ship.x) < ship.w * 0.5 && b.y > W - W * 0.09) {
        loseLife()
        return false
      }
      return true
    })

    if (aliens.every((a) => !a.alive)) {
      wave++
      setWave(wave)
      buildWave()
      buildShields()
    }

    draw()
  })

  const draw = () => {
    const dark = isDark()
    ctx.clearRect(0, 0, W, W)
    ctx.fillStyle = dark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.03)'
    ctx.fillRect(0, 0, W, W)

    // aliens
    for (const a of aliens) {
      if (!a.alive) continue
      const s = a.s
      ctx.fillStyle = themeHsl(stage, { shift: a.row * 26, s: 65, l: 58 })
      ctx.beginPath()
      ctx.roundRect(a.x - s / 2, a.y - s * 0.35, s, s * 0.7, s * 0.22)
      ctx.fill()
      ctx.fillStyle = dark ? '#14161b' : '#fff'
      ctx.beginPath()
      ctx.arc(a.x - s * 0.17, a.y - s * 0.05, s * 0.09, 0, Math.PI * 2)
      ctx.arc(a.x + s * 0.17, a.y - s * 0.05, s * 0.09, 0, Math.PI * 2)
      ctx.fill()
      // legs
      ctx.fillStyle = themeHsl(stage, { shift: a.row * 26, s: 60, l: 46 })
      ctx.fillRect(a.x - s * 0.4, a.y + s * 0.3, s * 0.16, s * 0.16)
      ctx.fillRect(a.x + s * 0.24, a.y + s * 0.3, s * 0.16, s * 0.16)
    }

    // shields
    for (const s of shields) {
      if (s.hp <= 0) continue
      ctx.fillStyle = themeHsl(stage, { shift: 130, s: 45, l: 50, alpha: 0.35 + s.hp * 0.2 })
      ctx.fillRect(s.x - s.s / 2, s.y, s.s, s.s)
    }

    // ship
    ctx.fillStyle = themeHsl(stage, { l: 55 })
    ctx.beginPath()
    ctx.moveTo(ship.x, W - W * 0.11)
    ctx.lineTo(ship.x + ship.w / 2, W - W * 0.05)
    ctx.lineTo(ship.x - ship.w / 2, W - W * 0.05)
    ctx.closePath()
    ctx.fill()
    ctx.fillRect(ship.x - ship.w * 0.09, W - W * 0.135, ship.w * 0.18, W * 0.03)

    // projectiles
    ctx.fillStyle = themeHsl(stage, { shift: 60, s: 85, l: 60 })
    for (const b of bullets) ctx.fillRect(b.x - 1.5, b.y, 3, W * 0.035)
    ctx.fillStyle = themeHsl(stage, { shift: 0, s: 75, l: 55 })
    for (const b of bombs) ctx.fillRect(b.x - 1.5, b.y, 3, W * 0.03)

    if (!started && !over) {
      ctx.fillStyle = dark ? 'rgba(255,255,255,0.75)' : 'rgba(0,0,0,0.6)'
      ctx.font = `600 ${Math.max(12, W * 0.034)}px "Microsoft Yahei", sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('←→ 移动 · 空格开火', W / 2, W * 0.55)
    }
  }

  const onKeyDown = (e) => {
    if (['ArrowLeft', 'a', 'A'].includes(e.key)) {
      e.preventDefault()
      holdLeft = true
      started = true
    } else if (['ArrowRight', 'd', 'D'].includes(e.key)) {
      e.preventDefault()
      holdRight = true
      started = true
    } else if (e.key === ' ' || e.key === 'ArrowUp') {
      e.preventDefault()
      shoot()
    }
  }
  const onKeyUp = (e) => {
    if (['ArrowLeft', 'a', 'A'].includes(e.key)) holdLeft = false
    if (['ArrowRight', 'd', 'D'].includes(e.key)) holdRight = false
  }
  const onPointer = (e) => {
    const rect = surface.canvas.getBoundingClientRect()
    ship.x = clamp(e.clientX - rect.left, ship.w / 2, W - ship.w / 2)
    if (e.type === 'pointerdown') shoot()
  }

  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('keyup', onKeyUp)
  surface.canvas.addEventListener('pointerdown', onPointer)
  surface.canvas.addEventListener('pointermove', onPointer)

  reset()

  return {
    restart: reset,
    destroy() {
      stopLoop()
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      surface.canvas.removeEventListener('pointerdown', onPointer)
      surface.canvas.removeEventListener('pointermove', onPointer)
      surface.destroy()
    },
  }
}
