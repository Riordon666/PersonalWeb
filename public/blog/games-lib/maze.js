import { themeHsl, isDark, fitCanvas, onSwipe, KEY_DIR, randInt } from './core.js'

export function mount(stage, api) {
  const viewport = stage.querySelector('[data-role="viewport"]')

  let W = 400
  let size = 11
  let cell = 30
  let walls = [] // walls[y][x] = {n,s,e,w}
  let player = { x: 0, y: 0 }
  let exitCell = { x: 0, y: 0 }
  let visited = new Set()
  let steps = 0
  let level = 1
  let solved = 0
  let hintPath = null
  let fog = true

  const setLevel = api.addHudItem('关卡', 1)
  const fogBtn = api.addHudButton('关闭迷雾', () => {
    fog = !fog
    fogBtn.textContent = fog ? '关闭迷雾' : '开启迷雾'
    draw()
  })
  api.addHudButton('提示', () => {
    hintPath = solve()
    draw()
    setTimeout(() => {
      hintPath = null
      draw()
    }, 1600)
  })

  const surface = fitCanvas(viewport, (px) => {
    W = px
    cell = px / size
    draw()
  })
  const { ctx } = surface

  // Recursive-backtracker maze: always a perfect maze, so a path exists
  const generate = () => {
    walls = Array.from({ length: size }, () =>
      Array.from({ length: size }, () => ({ n: true, s: true, e: true, w: true }))
    )
    const seen = Array.from({ length: size }, () => Array(size).fill(false))
    const stack = [{ x: 0, y: 0 }]
    seen[0][0] = true

    while (stack.length) {
      const cur = stack[stack.length - 1]
      const options = []
      const { x, y } = cur
      if (y > 0 && !seen[y - 1][x]) options.push(['n', x, y - 1])
      if (y < size - 1 && !seen[y + 1][x]) options.push(['s', x, y + 1])
      if (x < size - 1 && !seen[y][x + 1]) options.push(['e', x + 1, y])
      if (x > 0 && !seen[y][x - 1]) options.push(['w', x - 1, y])

      if (!options.length) {
        stack.pop()
        continue
      }
      const [dir, nx, ny] = options[randInt(0, options.length - 1)]
      walls[y][x][dir] = false
      walls[ny][nx][{ n: 's', s: 'n', e: 'w', w: 'e' }[dir]] = false
      seen[ny][nx] = true
      stack.push({ x: nx, y: ny })
    }
  }

  const neighbors = (x, y) => {
    const out = []
    const w = walls[y][x]
    if (!w.n) out.push([x, y - 1])
    if (!w.s) out.push([x, y + 1])
    if (!w.e) out.push([x + 1, y])
    if (!w.w) out.push([x - 1, y])
    return out
  }

  // BFS from the player to the exit, for the hint overlay
  const solve = () => {
    const prev = new Map()
    const start = `${player.x},${player.y}`
    const queue = [[player.x, player.y]]
    const seen = new Set([start])
    while (queue.length) {
      const [x, y] = queue.shift()
      if (x === exitCell.x && y === exitCell.y) break
      for (const [nx, ny] of neighbors(x, y)) {
        const key = `${nx},${ny}`
        if (seen.has(key)) continue
        seen.add(key)
        prev.set(key, `${x},${y}`)
        queue.push([nx, ny])
      }
    }
    const path = []
    let cur = `${exitCell.x},${exitCell.y}`
    while (cur && cur !== start) {
      const [px, py] = cur.split(',').map(Number)
      path.push([px, py])
      cur = prev.get(cur)
    }
    return path
  }

  const buildLevel = () => {
    size = Math.min(21, 9 + level * 2)
    cell = W / size
    generate()
    player = { x: 0, y: 0 }
    exitCell = { x: size - 1, y: size - 1 }
    visited = new Set(['0,0'])
    steps = 0
    hintPath = null
    api.setScore(0)
    setLevel(level)
    draw()
  }

  const reset = () => {
    level = 1
    solved = 0
    api.hideOverlay()
    buildLevel()
  }

  const move = (dir) => {
    const w = walls[player.y][player.x]
    const map = { up: ['n', 0, -1], down: ['s', 0, 1], left: ['w', -1, 0], right: ['e', 1, 0] }
    const [side, dx, dy] = map[dir]
    if (w[side]) return
    player.x += dx
    player.y += dy
    steps++
    visited.add(`${player.x},${player.y}`)
    api.setScore(steps)

    if (player.x === exitCell.x && player.y === exitCell.y) {
      solved++
      level++
      api.setScore(solved)
      api.gameOver('走出去了！', `第 ${level - 1} 关用了 ${steps} 步，继续下一关`, { record: true })
      // Advance to the next maze once the overlay is dismissed via restart
      setTimeout(() => {
        api.hideOverlay()
        buildLevel()
        api.setScore(solved)
      }, 1200)
      return
    }
    draw()
  }

  const draw = () => {
    const dark = isDark()
    ctx.clearRect(0, 0, W, W)
    ctx.fillStyle = dark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)'
    ctx.fillRect(0, 0, W, W)

    // exit marker
    ctx.fillStyle = themeHsl(stage, { shift: 140, s: 65, l: 52, alpha: 0.75 })
    ctx.fillRect(exitCell.x * cell + cell * 0.2, exitCell.y * cell + cell * 0.2, cell * 0.6, cell * 0.6)

    if (hintPath) {
      ctx.fillStyle = themeHsl(stage, { shift: 60, s: 85, l: 60, alpha: 0.45 })
      for (const [x, y] of hintPath) {
        ctx.fillRect(x * cell + cell * 0.3, y * cell + cell * 0.3, cell * 0.4, cell * 0.4)
      }
    }

    // walls
    ctx.strokeStyle = dark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.6)'
    ctx.lineWidth = Math.max(1.5, cell * 0.09)
    ctx.lineCap = 'round'
    for (let y = 0; y < size; y++)
      for (let x = 0; x < size; x++) {
        const w = walls[y][x]
        const px = x * cell
        const py = y * cell
        ctx.beginPath()
        if (w.n) {
          ctx.moveTo(px, py)
          ctx.lineTo(px + cell, py)
        }
        if (w.w) {
          ctx.moveTo(px, py)
          ctx.lineTo(px, py + cell)
        }
        if (y === size - 1 && w.s) {
          ctx.moveTo(px, py + cell)
          ctx.lineTo(px + cell, py + cell)
        }
        if (x === size - 1 && w.e) {
          ctx.moveTo(px + cell, py)
          ctx.lineTo(px + cell, py + cell)
        }
        ctx.stroke()
      }

    // fog of war: dim everything outside a radius around the player
    if (fog) {
      const radius = cell * 3.2
      const grad = ctx.createRadialGradient(
        player.x * cell + cell / 2,
        player.y * cell + cell / 2,
        radius * 0.35,
        player.x * cell + cell / 2,
        player.y * cell + cell / 2,
        radius
      )
      const shade = dark ? '20, 22, 27' : '246, 244, 242'
      grad.addColorStop(0, `rgba(${shade}, 0)`)
      grad.addColorStop(1, `rgba(${shade}, 0.94)`)
      ctx.fillStyle = grad
      ctx.fillRect(0, 0, W, W)
    }

    // player
    ctx.fillStyle = themeHsl(stage, { l: 55 })
    ctx.beginPath()
    ctx.arc(player.x * cell + cell / 2, player.y * cell + cell / 2, cell * 0.28, 0, Math.PI * 2)
    ctx.fill()
  }

  const onKey = (e) => {
    const d = KEY_DIR[e.key]
    if (!d) return
    e.preventDefault()
    move(d)
  }
  const offSwipe = onSwipe(viewport, move)
  window.addEventListener('keydown', onKey)

  reset()

  return {
    restart: () => {
      api.hideOverlay()
      buildLevel()
      api.setScore(solved)
    },
    destroy() {
      window.removeEventListener('keydown', onKey)
      offSwipe()
      surface.destroy()
    },
  }
}
