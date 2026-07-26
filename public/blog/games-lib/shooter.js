import { themeHsl, isDark, fitCanvas, gameLoop, clamp, randInt } from './core.js'

export function mount(stage, api) {
  const viewport = stage.querySelector('[data-role="viewport"]')

  let W = 400
  let ship = { x: 200, y: 320, r: 12, cooldown: 0, power: 1 }
  let bullets = []
  let enemies = []
  let ebullets = []
  let drops = []
  let stars = []
  let boss = null
  let score = 0
  let lives = 3
  let wave = 1
  let spawnAcc = 0
  let waveTimer = 0
  let over = false
  let started = false
  let invulUntil = 0
  const keys = { left: false, right: false, up: false, down: false }

  const setLives = api.addHudItem('生命', '❤❤❤')
  const setWave = api.addHudItem('波次', 1)

  const surface = fitCanvas(viewport, (px) => {
    W = px
    ship.r = px * 0.032
    ship.x = clamp(ship.x, ship.r, W - ship.r)
    ship.y = clamp(ship.y, W * 0.5, W - ship.r * 2)
    draw()
  })
  const { ctx, canvas } = surface

  const reset = () => {
    ship = { x: W / 2, y: W * 0.82, r: W * 0.032, cooldown: 0, power: 1 }
    bullets = []
    enemies = []
    ebullets = []
    drops = []
    boss = null
    score = 0
    lives = 3
    wave = 1
    spawnAcc = 0
    waveTimer = 0
    over = false
    started = false
    invulUntil = 0
    stars = Array.from({ length: 40 }, () => ({
      x: Math.random() * W,
      y: Math.random() * W,
      s: Math.random() * 1.6 + 0.4,
    }))
    api.setScore(0)
    setLives('❤❤❤')
    setWave(1)
    api.hideOverlay()
    draw()
  }

  const spawnEnemy = () => {
    const hp = 1 + Math.floor(wave / 3)
    enemies.push({
      x: randInt(Math.floor(W * 0.1), Math.floor(W * 0.9)),
      y: -W * 0.05,
      r: W * 0.028,
      hp,
      maxHp: hp,
      vx: (Math.random() - 0.5) * W * 0.0025,
      vy: W * 0.0028 + wave * W * 0.00016,
      fireAt: performance.now() + randInt(600, 2200),
    })
  }

  const spawnBoss = () => {
    boss = {
      x: W / 2,
      y: -W * 0.15,
      r: W * 0.11,
      hp: 40 + wave * 16,
      maxHp: 40 + wave * 16,
      dir: 1,
      fireAt: performance.now() + 900,
      entering: true,
    }
  }

  const hurt = () => {
    if (performance.now() < invulUntil) return
    invulUntil = performance.now() + 1400
    lives--
    ship.power = 1
    setLives('❤'.repeat(Math.max(0, lives)) || '—')
    if (lives <= 0) {
      over = true
      api.gameOver('被击落了', `得分 ${score} · 第 ${wave} 波`)
    }
  }

  const addScore = (n) => {
    score += n
    api.setScore(score)
  }

  const stopLoop = gameLoop((dt) => {
    if (over || !started) {
      draw()
      return
    }
    const k = dt / 16.7
    const now = performance.now()

    for (const s of stars) {
      s.y += s.s * 0.9 * k
      if (s.y > W) {
        s.y = -2
        s.x = Math.random() * W
      }
    }

    // movement
    const sp = W * 0.0115 * k
    if (keys.left) ship.x -= sp
    if (keys.right) ship.x += sp
    if (keys.up) ship.y -= sp
    if (keys.down) ship.y += sp
    ship.x = clamp(ship.x, ship.r, W - ship.r)
    ship.y = clamp(ship.y, W * 0.42, W - ship.r * 1.5)

    // autofire
    ship.cooldown -= dt
    if (ship.cooldown <= 0) {
      ship.cooldown = 165
      if (ship.power === 1) bullets.push({ x: ship.x, y: ship.y - ship.r, vx: 0 })
      else if (ship.power === 2) {
        bullets.push({ x: ship.x - ship.r * 0.6, y: ship.y - ship.r, vx: 0 })
        bullets.push({ x: ship.x + ship.r * 0.6, y: ship.y - ship.r, vx: 0 })
      } else {
        bullets.push({ x: ship.x, y: ship.y - ship.r, vx: 0 })
        bullets.push({ x: ship.x - ship.r * 0.7, y: ship.y, vx: -W * 0.004 })
        bullets.push({ x: ship.x + ship.r * 0.7, y: ship.y, vx: W * 0.004 })
      }
    }

    for (const b of bullets) {
      b.y -= W * 0.019 * k
      b.x += (b.vx || 0) * k
    }
    bullets = bullets.filter((b) => b.y > -10 && b.x > -10 && b.x < W + 10)

    // waves
    waveTimer += dt
    if (!boss) {
      spawnAcc += dt
      const every = Math.max(340, 1000 - wave * 60)
      if (spawnAcc >= every) {
        spawnAcc = 0
        spawnEnemy()
      }
      if (waveTimer > 14000) {
        waveTimer = 0
        spawnBoss()
      }
    }

    // enemies
    for (const e of enemies) {
      e.x += e.vx * k * 16.7
      e.y += e.vy * k * 16.7
      if (e.x < e.r || e.x > W - e.r) e.vx *= -1
      if (now > e.fireAt) {
        e.fireAt = now + randInt(1200, 3000)
        const dx = ship.x - e.x
        const dy = ship.y - e.y
        const d = Math.hypot(dx, dy) || 1
        ebullets.push({ x: e.x, y: e.y, vx: (dx / d) * W * 0.006, vy: (dy / d) * W * 0.006 })
      }
    }
    enemies = enemies.filter((e) => e.y < W + e.r * 2)

    if (boss) {
      if (boss.entering) {
        boss.y += W * 0.003 * k * 16.7
        if (boss.y >= W * 0.2) boss.entering = false
      } else {
        boss.x += boss.dir * W * 0.0035 * k * 16.7
        if (boss.x < boss.r || boss.x > W - boss.r) boss.dir *= -1
        if (now > boss.fireAt) {
          boss.fireAt = now + 750
          // radial burst
          for (let i = 0; i < 7; i++) {
            const a = Math.PI * (0.15 + (i / 6) * 0.7)
            ebullets.push({
              x: boss.x,
              y: boss.y + boss.r * 0.5,
              vx: Math.cos(a) * W * 0.0052,
              vy: Math.sin(a) * W * 0.0052,
            })
          }
        }
      }
    }

    for (const b of ebullets) {
      b.x += b.vx * k * 16.7
      b.y += b.vy * k * 16.7
    }
    ebullets = ebullets.filter((b) => b.y < W + 12 && b.y > -12 && b.x > -12 && b.x < W + 12)

    // bullet vs enemy
    bullets = bullets.filter((b) => {
      for (const e of enemies) {
        if (e.hp > 0 && Math.hypot(e.x - b.x, e.y - b.y) < e.r + 3) {
          e.hp--
          if (e.hp <= 0) {
            addScore(10 * e.maxHp)
            if (Math.random() < 0.14) drops.push({ x: e.x, y: e.y, kind: Math.random() < 0.6 ? 'P' : 'H' })
          }
          return false
        }
      }
      if (boss && !boss.entering && Math.hypot(boss.x - b.x, boss.y - b.y) < boss.r) {
        boss.hp--
        if (boss.hp <= 0) {
          addScore(500 * wave)
          boss = null
          wave++
          setWave(wave)
          ebullets = []
        }
        return false
      }
      return true
    })
    enemies = enemies.filter((e) => e.hp > 0)

    // drops
    for (const d of drops) d.y += W * 0.0035 * k * 16.7
    drops = drops.filter((d) => {
      if (Math.hypot(d.x - ship.x, d.y - ship.y) < ship.r + W * 0.02) {
        if (d.kind === 'P') ship.power = Math.min(3, ship.power + 1)
        else {
          lives = Math.min(5, lives + 1)
          setLives('❤'.repeat(lives))
        }
        return false
      }
      return d.y < W + 10
    })

    // player hit
    for (const b of ebullets) {
      if (Math.hypot(b.x - ship.x, b.y - ship.y) < ship.r) {
        hurt()
        b.y = W + 999
        break
      }
    }
    for (const e of enemies) {
      if (Math.hypot(e.x - ship.x, e.y - ship.y) < e.r + ship.r * 0.8) {
        hurt()
        e.hp = 0
      }
    }
    enemies = enemies.filter((e) => e.hp > 0)
    ebullets = ebullets.filter((b) => b.y < W + 12)

    draw()
  })

  const draw = () => {
    const dark = isDark()
    ctx.clearRect(0, 0, W, W)
    ctx.fillStyle = dark ? 'rgba(8,10,16,0.5)' : 'rgba(0,0,0,0.04)'
    ctx.fillRect(0, 0, W, W)

    ctx.fillStyle = dark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.18)'
    for (const s of stars) ctx.fillRect(s.x, s.y, s.s, s.s * 2)

    // enemies
    for (const e of enemies) {
      ctx.fillStyle = themeHsl(stage, { shift: 190, s: 60, l: 55 })
      ctx.beginPath()
      ctx.moveTo(e.x, e.y + e.r)
      ctx.lineTo(e.x + e.r, e.y - e.r * 0.7)
      ctx.lineTo(e.x - e.r, e.y - e.r * 0.7)
      ctx.closePath()
      ctx.fill()
      if (e.maxHp > 1) {
        ctx.fillStyle = 'rgba(255,255,255,0.75)'
        ctx.fillRect(e.x - e.r, e.y - e.r * 1.2, (e.r * 2 * e.hp) / e.maxHp, 2.5)
      }
    }

    if (boss) {
      ctx.fillStyle = themeHsl(stage, { shift: 320, s: 65, l: 52 })
      ctx.beginPath()
      ctx.roundRect(boss.x - boss.r, boss.y - boss.r * 0.6, boss.r * 2, boss.r * 1.2, boss.r * 0.3)
      ctx.fill()
      ctx.fillStyle = themeHsl(stage, { shift: 320, s: 70, l: 38 })
      ctx.beginPath()
      ctx.arc(boss.x, boss.y + boss.r * 0.3, boss.r * 0.34, 0, Math.PI * 2)
      ctx.fill()
      // hp bar
      ctx.fillStyle = 'rgba(0,0,0,0.25)'
      ctx.fillRect(W * 0.1, W * 0.045, W * 0.8, 7)
      ctx.fillStyle = themeHsl(stage, { shift: 340, s: 78, l: 55 })
      ctx.fillRect(W * 0.1, W * 0.045, W * 0.8 * (boss.hp / boss.maxHp), 7)
    }

    // drops
    for (const d of drops) {
      ctx.fillStyle = d.kind === 'P' ? themeHsl(stage, { shift: 60, s: 85, l: 58 }) : 'hsl(348,75%,58%)'
      ctx.beginPath()
      ctx.roundRect(d.x - W * 0.022, d.y - W * 0.016, W * 0.044, W * 0.032, 4)
      ctx.fill()
      ctx.fillStyle = '#fff'
      ctx.font = `700 ${W * 0.024}px sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(d.kind === 'P' ? '强' : '♥', d.x, d.y)
    }

    // bullets
    ctx.fillStyle = themeHsl(stage, { shift: 50, s: 90, l: 62 })
    for (const b of bullets) {
      ctx.beginPath()
      ctx.roundRect(b.x - 2, b.y - W * 0.02, 4, W * 0.04, 2)
      ctx.fill()
    }
    ctx.fillStyle = themeHsl(stage, { shift: 350, s: 80, l: 60 })
    for (const b of ebullets) {
      ctx.beginPath()
      ctx.arc(b.x, b.y, W * 0.011, 0, Math.PI * 2)
      ctx.fill()
    }

    // ship
    const blinking = performance.now() < invulUntil && Math.floor(performance.now() / 90) % 2 === 0
    if (!blinking) {
      ctx.fillStyle = themeHsl(stage, { l: 58 })
      ctx.beginPath()
      ctx.moveTo(ship.x, ship.y - ship.r * 1.3)
      ctx.lineTo(ship.x + ship.r, ship.y + ship.r * 0.8)
      ctx.lineTo(ship.x, ship.y + ship.r * 0.35)
      ctx.lineTo(ship.x - ship.r, ship.y + ship.r * 0.8)
      ctx.closePath()
      ctx.fill()
      ctx.fillStyle = themeHsl(stage, { shift: 40, s: 90, l: 65 })
      ctx.beginPath()
      ctx.ellipse(ship.x, ship.y + ship.r * 0.9, ship.r * 0.26, ship.r * 0.5, 0, 0, Math.PI * 2)
      ctx.fill()
    }

    if (!started && !over) {
      ctx.fillStyle = dark ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.65)'
      ctx.font = `600 ${Math.max(12, W * 0.033)}px "Microsoft Yahei", sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('方向键 / 拖动移动，自动开火', W / 2, W * 0.35)
    }
  }

  const setKey = (e, on) => {
    const k = e.key
    if (['ArrowLeft', 'a', 'A'].includes(k)) keys.left = on
    else if (['ArrowRight', 'd', 'D'].includes(k)) keys.right = on
    else if (['ArrowUp', 'w', 'W'].includes(k)) keys.up = on
    else if (['ArrowDown', 's', 'S'].includes(k)) keys.down = on
    else return false
    e.preventDefault()
    if (on) started = true
    return true
  }
  const onKeyDown = (e) => setKey(e, true)
  const onKeyUp = (e) => setKey(e, false)
  const onPointer = (e) => {
    const rect = canvas.getBoundingClientRect()
    ship.x = clamp(e.clientX - rect.left, ship.r, W - ship.r)
    ship.y = clamp(e.clientY - rect.top, W * 0.42, W - ship.r * 1.5)
    started = true
  }

  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('keyup', onKeyUp)
  canvas.addEventListener('pointerdown', onPointer)
  canvas.addEventListener('pointermove', (e) => {
    if (e.buttons || e.pointerType === 'touch') onPointer(e)
  })

  reset()

  return {
    restart: reset,
    destroy() {
      stopLoop()
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      canvas.removeEventListener('pointerdown', onPointer)
      surface.destroy()
    },
  }
}
