import { themeHsl, isDark, fitCanvas, gameLoop } from './core.js'

const N = 40

const PATTERNS = {
  滑翔机: [[1, 0], [2, 1], [0, 2], [1, 2], [2, 2]],
  轻量飞船: [[0, 0], [3, 0], [4, 1], [0, 2], [4, 2], [1, 3], [2, 3], [3, 3], [4, 3]],
  脉冲星: [
    [2, 0], [3, 0], [4, 0], [8, 0], [9, 0], [10, 0],
    [0, 2], [5, 2], [7, 2], [12, 2],
    [0, 3], [5, 3], [7, 3], [12, 3],
    [0, 4], [5, 4], [7, 4], [12, 4],
    [2, 5], [3, 5], [4, 5], [8, 5], [9, 5], [10, 5],
    [2, 7], [3, 7], [4, 7], [8, 7], [9, 7], [10, 7],
    [0, 8], [5, 8], [7, 8], [12, 8],
    [0, 9], [5, 9], [7, 9], [12, 9],
    [0, 10], [5, 10], [7, 10], [12, 10],
    [2, 12], [3, 12], [4, 12], [8, 12], [9, 12], [10, 12],
  ],
  高斯帕机枪: [
    [24, 0], [22, 1], [24, 1], [12, 2], [13, 2], [20, 2], [21, 2], [34, 2], [35, 2],
    [11, 3], [15, 3], [20, 3], [21, 3], [34, 3], [35, 3],
    [0, 4], [1, 4], [10, 4], [16, 4], [20, 4], [21, 4],
    [0, 5], [1, 5], [10, 5], [14, 5], [16, 5], [17, 5], [22, 5], [24, 5],
    [10, 6], [16, 6], [24, 6],
    [11, 7], [15, 7],
    [12, 8], [13, 8],
  ],
}

export function mount(stage, api) {
  const viewport = stage.querySelector('[data-role="viewport"]')

  let W = 400
  let cell = 10
  let grid = []
  let running = false
  let acc = 0
  let stepMs = 120
  let generation = 0
  let peak = 0
  let painting = 0 // 0 none, 1 draw, -1 erase

  const setGen = api.addHudItem('世代', 0)
  const playBtn = api.addHudButton('播放', () => {
    running = !running
    playBtn.textContent = running ? '暂停' : '播放'
  })
  api.addHudButton('图案', () => {
    const names = Object.keys(PATTERNS)
    const name = names[Math.floor(Math.random() * names.length)]
    stamp(name)
  })
  const speedBtn = api.addHudButton('速度 1×', () => {
    stepMs = stepMs === 120 ? 60 : stepMs === 60 ? 240 : 120
    speedBtn.textContent = `速度 ${stepMs === 60 ? '2' : stepMs === 120 ? '1' : '0.5'}×`
  })

  const surface = fitCanvas(viewport, (px) => {
    W = px
    cell = px / N
    draw()
  })
  const { ctx, canvas } = surface

  const blank = () => Array.from({ length: N }, () => Array(N).fill(0))

  const alive = () => grid.flat().reduce((a, b) => a + b, 0)

  const stamp = (name) => {
    const cells = PATTERNS[name]
    const maxX = Math.max(...cells.map((c) => c[0]))
    const maxY = Math.max(...cells.map((c) => c[1]))
    const ox = Math.floor((N - maxX) / 2)
    const oy = Math.floor((N - maxY) / 2)
    grid = blank()
    for (const [x, y] of cells) {
      const gx = ox + x
      const gy = oy + y
      if (gx >= 0 && gy >= 0 && gx < N && gy < N) grid[gy][gx] = 1
    }
    generation = 0
    setGen(0)
    api.setScore(alive())
    draw()
  }

  const randomFill = () => {
    grid = blank()
    for (let y = 0; y < N; y++)
      for (let x = 0; x < N; x++) grid[y][x] = Math.random() < 0.22 ? 1 : 0
  }

  const reset = () => {
    randomFill()
    generation = 0
    peak = alive()
    running = true
    playBtn.textContent = '暂停'
    acc = 0
    api.setScore(peak)
    setGen(0)
    api.hideOverlay()
    draw()
  }

  const step = () => {
    const next = blank()
    for (let y = 0; y < N; y++) {
      for (let x = 0; x < N; x++) {
        let n = 0
        for (let dy = -1; dy <= 1; dy++)
          for (let dx = -1; dx <= 1; dx++) {
            if (!dx && !dy) continue
            // Wrap at the edges so gliders keep travelling
            const nx = (x + dx + N) % N
            const ny = (y + dy + N) % N
            n += grid[ny][nx]
          }
        next[y][x] = grid[y][x] ? (n === 2 || n === 3 ? 1 : 0) : n === 3 ? 1 : 0
      }
    }
    grid = next
    generation++
    setGen(generation)
    const count = alive()
    peak = Math.max(peak, count)
    api.setScore(peak)
  }

  const stopLoop = gameLoop((dt) => {
    if (running) {
      acc += dt
      while (acc >= stepMs) {
        acc -= stepMs
        step()
      }
    }
    draw()
  })

  const draw = () => {
    const dark = isDark()
    ctx.clearRect(0, 0, W, W)
    ctx.fillStyle = dark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)'
    ctx.fillRect(0, 0, W, W)

    ctx.strokeStyle = dark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'
    ctx.lineWidth = 1
    for (let i = 1; i < N; i++) {
      ctx.beginPath()
      ctx.moveTo(i * cell, 0)
      ctx.lineTo(i * cell, W)
      ctx.moveTo(0, i * cell)
      ctx.lineTo(W, i * cell)
      ctx.stroke()
    }

    for (let y = 0; y < N; y++)
      for (let x = 0; x < N; x++) {
        if (!grid[y][x]) continue
        // Tint by position so the colony reads as a gradient
        ctx.fillStyle = themeHsl(stage, {
          shift: ((x + y) / (N * 2)) * 60,
          s: 65,
          l: dark ? 60 : 52,
        })
        ctx.fillRect(x * cell + 0.5, y * cell + 0.5, cell - 1, cell - 1)
      }
  }

  const cellFromEvent = (e) => {
    const rect = canvas.getBoundingClientRect()
    const x = Math.floor(((e.clientX - rect.left) / rect.width) * N)
    const y = Math.floor(((e.clientY - rect.top) / rect.height) * N)
    if (x < 0 || y < 0 || x >= N || y >= N) return null
    return { x, y }
  }

  const onDown = (e) => {
    const c = cellFromEvent(e)
    if (!c) return
    e.preventDefault()
    painting = grid[c.y][c.x] ? -1 : 1
    grid[c.y][c.x] = painting > 0 ? 1 : 0
    draw()
  }
  const onMove = (e) => {
    if (!painting) return
    const c = cellFromEvent(e)
    if (!c) return
    grid[c.y][c.x] = painting > 0 ? 1 : 0
    draw()
  }
  const onUp = () => {
    painting = 0
  }

  canvas.addEventListener('pointerdown', onDown)
  canvas.addEventListener('pointermove', onMove)
  window.addEventListener('pointerup', onUp)

  reset()

  return {
    restart: reset,
    destroy() {
      stopLoop()
      canvas.removeEventListener('pointerdown', onDown)
      canvas.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      surface.destroy()
    },
  }
}
