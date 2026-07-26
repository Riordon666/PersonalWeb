import { themeHsl, isDark, fitCanvas, gameLoop, randInt } from './core.js'

const N = 15 // grid cells per side
const EMPTY = 0
const BRICK = 1
const STEEL = 2

export function mount(stage, api) {
  const viewport = stage.querySelector('[data-role="viewport"]')

  let W = 400
  let cell = 26
  let grid = []
  let player = null
  let enemies = []
  let shots = []
  let base = { gx: 7, gy: 13, alive: true }
  let kills = 0
  let lives = 3
  let over = false
  let started = false
  let spawnAcc = 0
  let invulUntil = 0
  const keys = { up: false, down: false, left: false, right: false }

  const setLives = api.addHudItem('生命', '❤❤❤')
  const setEnemies = api.addHudItem('场上敌人', 0)

  const surface = fitCanvas(viewport, (px) => {
    W = px
    cell = px / N
    draw()
  })
  const { ctx } = surface

  const inBounds = (gx, gy) => gx >= 0 && gy >= 0 && gx < N && gy < N

  const buildMap = () => {
    grid = Array.from({ length: N }, () => Array(N).fill(EMPTY))
    // scattered brick clusters
    for (let i = 0; i < 30; i++) {
      const gx = randInt(1, N - 2)
      const gy = randInt(3, N - 3)
      for (let dy = 0; dy < 2; dy++)
        for (let dx = 0; dx < 2; dx++) {
          if (inBounds(gx + dx, gy + dy)) grid[gy + dy][gx + dx] = BRICK
        }
    }
    // a few indestructible blocks
    for (let i = 0; i < 6; i++) {
      grid[randInt(4, N - 5)][randInt(1, N - 2)] = STEEL
    }
    // base bunker
    base = { gx: Math.floor(N / 2), gy: N - 2, alive: true }
    for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [-1, -1], [1, -1]]) {
      if (inBounds(base.gx + dx, base.gy + dy)) grid[base.gy + dy][base.gx + dx] = BRICK
    }
    grid[base.gy][base.gx] = EMPTY
    // clear spawn areas
    for (const [gx, gy] of [[1, 1], [N - 2, 1], [Math.floor(N / 2), 1], [base.gx, base.gy - 2]]) {
      for (let dy = -1; dy <= 1; dy++)
        for (let dx = -1; dx <= 1; dx++) {
          if (inBounds(gx + dx, gy + dy)) grid[gy + dy][gx + dx] = EMPTY
        }
    }
  }

  const tankAt = (x, y, exclude) => {
    const all = [player, ...enemies].filter((t) => t && t !== exclude && t.alive !== false)
    return all.find((t) => Math.abs(t.x - x) < cell * 0.85 && Math.abs(t.y - y) < cell * 0.85)
  }

  const solidAt = (x, y) => {
    const gx = Math.floor(x / cell)
    const gy = Math.floor(y / cell)
    if (!inBounds(gx, gy)) return true
    return grid[gy][gx] !== EMPTY
  }

  const canMoveTo = (t, nx, ny) => {
    const half = cell * 0.4
    for (const [dx, dy] of [[-half, -half], [half, -half], [-half, half], [half, half]]) {
      if (solidAt(nx + dx, ny + dy)) return false
    }
    if (tankAt(nx, ny, t)) return false
    return true
  }

  const spawnEnemy = () => {
    if (enemies.length >= 4) return
    const spots = [[1, 1], [N - 2, 1], [Math.floor(N / 2), 1]]
    const [gx, gy] = spots[randInt(0, spots.length - 1)]
    const x = gx * cell + cell / 2
    const y = gy * cell + cell / 2
    if (tankAt(x, y)) return
    enemies.push({
      x, y,
      dir: 'down',
      cooldown: randInt(600, 1600),
      turnAt: 0,
      speed: 0.055 + Math.random() * 0.02,
    })
  }

  const reset = () => {
    buildMap()
    player = {
      x: (base.gx - 2) * cell + cell / 2,
      y: (N - 2) * cell + cell / 2,
      dir: 'up',
      cooldown: 0,
    }
    enemies = []
    shots = []
    kills = 0
    lives = 3
    over = false
    started = false
    spawnAcc = 0
    invulUntil = 0
    api.setScore(0)
    setLives('❤❤❤')
    setEnemies(0)
    api.hideOverlay()
    draw()
  }

  const DIRV = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }

  const fire = (t, fromPlayer) => {
    if (t.cooldown > 0) return
    t.cooldown = fromPlayer ? 380 : 900
    const [dx, dy] = DIRV[t.dir]
    shots.push({
      x: t.x + dx * cell * 0.5,
      y: t.y + dy * cell * 0.5,
      dx, dy,
      fromPlayer,
    })
  }

  const hurtPlayer = () => {
    if (performance.now() < invulUntil) return
    invulUntil = performance.now() + 1600
    lives--
    setLives('❤'.repeat(Math.max(0, lives)) || '—')
    player.x = (base.gx - 2) * cell + cell / 2
    player.y = (N - 2) * cell + cell / 2
    if (lives <= 0) {
      over = true
      api.gameOver('坦克全毁', `击毁 ${kills} 辆敌方坦克`)
    }
  }

  const stopLoop = gameLoop((dt) => {
    if (over || !started) {
      draw()
      return
    }
    const k = dt / 16.7
    const now = performance.now()

    player.cooldown = Math.max(0, player.cooldown - dt)
    const psp = cell * 0.075 * k
    let ndir = null
    if (keys.up) ndir = 'up'
    else if (keys.down) ndir = 'down'
    else if (keys.left) ndir = 'left'
    else if (keys.right) ndir = 'right'
    if (ndir) {
      player.dir = ndir
      const [dx, dy] = DIRV[ndir]
      const nx = player.x + dx * psp
      const ny = player.y + dy * psp
      if (canMoveTo(player, nx, ny)) {
        player.x = nx
        player.y = ny
      }
    }

    // enemy spawns
    spawnAcc += dt
    if (spawnAcc > 2600) {
      spawnAcc = 0
      spawnEnemy()
    }
    setEnemies(enemies.length)

    // enemy AI: walk, turn when blocked, shoot toward base/player
    for (const e of enemies) {
      e.cooldown = Math.max(0, e.cooldown - dt)
      const [dx, dy] = DIRV[e.dir]
      const sp = cell * e.speed * k
      const nx = e.x + dx * sp
      const ny = e.y + dy * sp
      if (canMoveTo(e, nx, ny) && now > e.turnAt) {
        e.x = nx
        e.y = ny
      } else {
        // prefer heading toward the base
        const wantX = base.gx * cell + cell / 2 - e.x
        const wantY = base.gy * cell + cell / 2 - e.y
        const opts = Math.abs(wantX) > Math.abs(wantY)
          ? [wantX > 0 ? 'right' : 'left', wantY > 0 ? 'down' : 'up']
          : [wantY > 0 ? 'down' : 'up', wantX > 0 ? 'right' : 'left']
        const all = [...opts, 'up', 'down', 'left', 'right']
        for (const d of all) {
          const [ddx, ddy] = DIRV[d]
          if (canMoveTo(e, e.x + ddx * sp * 2, e.y + ddy * sp * 2)) {
            e.dir = d
            break
          }
        }
        e.turnAt = now + 120
      }
      // fire when roughly aligned with player or base
      const alignedPlayer = Math.abs(e.x - player.x) < cell * 0.7 || Math.abs(e.y - player.y) < cell * 0.7
      if (e.cooldown === 0 && (alignedPlayer || Math.random() < 0.008)) fire(e, false)
    }

    // shots
    const ssp = cell * 0.19 * k
    for (const s of shots) {
      s.x += s.dx * ssp
      s.y += s.dy * ssp
    }
    shots = shots.filter((s) => {
      const gx = Math.floor(s.x / cell)
      const gy = Math.floor(s.y / cell)
      if (!inBounds(gx, gy)) return false

      if (grid[gy][gx] === BRICK) {
        grid[gy][gx] = EMPTY
        return false
      }
      if (grid[gy][gx] === STEEL) return false

      if (base.alive && gx === base.gx && gy === base.gy) {
        base.alive = false
        over = true
        api.gameOver('基地被摧毁', `击毁 ${kills} 辆敌方坦克`)
        return false
      }

      if (s.fromPlayer) {
        const hit = enemies.find((e) => Math.hypot(e.x - s.x, e.y - s.y) < cell * 0.45)
        if (hit) {
          enemies = enemies.filter((e) => e !== hit)
          kills++
          api.setScore(kills)
          return false
        }
      } else if (Math.hypot(player.x - s.x, player.y - s.y) < cell * 0.45) {
        hurtPlayer()
        return false
      }
      return true
    })

    draw()
  })

  const drawTank = (t, color, isPlayer) => {
    const s = cell * 0.78
    ctx.save()
    ctx.translate(t.x, t.y)
    const rot = { up: 0, right: Math.PI / 2, down: Math.PI, left: -Math.PI / 2 }[t.dir]
    ctx.rotate(rot)
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.roundRect(-s / 2, -s / 2, s, s, s * 0.2)
    ctx.fill()
    ctx.fillStyle = isDark() ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.5)'
    ctx.fillRect(-s * 0.42, -s * 0.5, s * 0.16, s)
    ctx.fillRect(s * 0.26, -s * 0.5, s * 0.16, s)
    ctx.fillStyle = color
    ctx.fillRect(-s * 0.09, -s * 0.95, s * 0.18, s * 0.5)
    ctx.restore()
  }

  const draw = () => {
    const dark = isDark()
    ctx.clearRect(0, 0, W, W)
    ctx.fillStyle = dark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.05)'
    ctx.fillRect(0, 0, W, W)

    for (let gy = 0; gy < N; gy++)
      for (let gx = 0; gx < N; gx++) {
        const v = grid[gy][gx]
        if (v === EMPTY) continue
        const x = gx * cell
        const y = gy * cell
        if (v === BRICK) {
          ctx.fillStyle = themeHsl(stage, { shift: 20, s: 45, l: dark ? 38 : 52 })
          ctx.fillRect(x, y, cell, cell)
          ctx.fillStyle = dark ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.35)'
          ctx.fillRect(x, y + cell * 0.45, cell, 1.5)
          ctx.fillRect(x + cell * 0.45, y, 1.5, cell * 0.45)
          ctx.fillRect(x + cell * 0.2, y + cell * 0.45, 1.5, cell * 0.55)
        } else {
          ctx.fillStyle = dark ? '#7d828f' : '#9aa0ad'
          ctx.fillRect(x + 1, y + 1, cell - 2, cell - 2)
        }
      }

    // base
    if (base.alive) {
      ctx.fillStyle = themeHsl(stage, { shift: 50, s: 85, l: 55 })
      const x = base.gx * cell
      const y = base.gy * cell
      ctx.beginPath()
      ctx.moveTo(x + cell / 2, y + cell * 0.12)
      ctx.lineTo(x + cell * 0.9, y + cell * 0.9)
      ctx.lineTo(x + cell * 0.1, y + cell * 0.9)
      ctx.closePath()
      ctx.fill()
    }

    for (const e of enemies) drawTank(e, themeHsl(stage, { shift: 190, s: 55, l: 55 }), false)

    const blinking = performance.now() < invulUntil && Math.floor(performance.now() / 100) % 2 === 0
    if (player && !blinking) drawTank(player, themeHsl(stage, { l: 52 }), true)

    ctx.fillStyle = themeHsl(stage, { shift: 55, s: 90, l: 60 })
    for (const s of shots) {
      ctx.beginPath()
      ctx.arc(s.x, s.y, cell * 0.11, 0, Math.PI * 2)
      ctx.fill()
    }

    if (!started && !over) {
      ctx.fillStyle = dark ? 'rgba(0,0,0,0.55)' : 'rgba(255,255,255,0.6)'
      ctx.fillRect(0, W * 0.42, W, W * 0.16)
      ctx.fillStyle = dark ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.7)'
      ctx.font = `600 ${Math.max(12, W * 0.033)}px "Microsoft Yahei", sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('方向键移动 · 空格开炮 · 守住基地', W / 2, W * 0.5)
    }
  }

  const setKey = (e, on) => {
    const k = e.key
    if (['ArrowUp', 'w', 'W'].includes(k)) keys.up = on
    else if (['ArrowDown', 's', 'S'].includes(k)) keys.down = on
    else if (['ArrowLeft', 'a', 'A'].includes(k)) keys.left = on
    else if (['ArrowRight', 'd', 'D'].includes(k)) keys.right = on
    else if (k === ' ') {
      e.preventDefault()
      if (on) {
        started = true
        if (player) fire(player, true)
      }
      return
    } else return
    e.preventDefault()
    if (on) started = true
  }

  const onKeyDown = (e) => setKey(e, true)
  const onKeyUp = (e) => setKey(e, false)
  const onTap = (e) => {
    started = true
    if (!player) return
    const rect = surface.canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const dx = x - player.x
    const dy = y - player.y
    // Tap far away to move that way, tap near the tank to shoot
    if (Math.hypot(dx, dy) < cell) {
      fire(player, true)
      return
    }
    player.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up'
    keys.up = keys.down = keys.left = keys.right = false
    keys[player.dir] = true
    setTimeout(() => {
      keys[player.dir] = false
    }, 260)
  }

  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('keyup', onKeyUp)
  surface.canvas.addEventListener('pointerdown', onTap)

  reset()

  return {
    restart: reset,
    destroy() {
      stopLoop()
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      surface.canvas.removeEventListener('pointerdown', onTap)
      surface.destroy()
    },
  }
}
