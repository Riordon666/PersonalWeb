import { themeHsl, isDark, fitCanvas, gameLoop } from './core.js'

const SHAPES = [
  [[1, 1, 1, 1]], // I
  [
    [1, 1],
    [1, 1],
  ], // O
  [
    [0, 1, 0],
    [1, 1, 1],
  ], // T
  [
    [0, 1, 1],
    [1, 1, 0],
  ], // S
  [
    [1, 1, 0],
    [0, 1, 1],
  ], // Z
  [
    [1, 0, 0],
    [1, 1, 1],
  ], // J
  [
    [0, 0, 1],
    [1, 1, 1],
  ], // L
]

const HUES = [0, 35, 70, 130, 170, 230, 300]
const SPEEDS = [800, 700, 610, 520, 440, 360, 290, 220, 160, 110, 90, 75, 60]

const rotateCW = (m) => m[0].map((_, c) => m.map((row) => row[c]).reverse())

export function mount(stage, api) {
  const viewport = stage.querySelector('[data-role="viewport"]')
  const COLS = 10
  const ROWS = 20

  let cell = 18
  let ox = 0
  let oy = 0
  // Initialized here because fitCanvas draws once synchronously,
  // before reset() has run
  let board = Array.from({ length: ROWS }, () => Array(COLS).fill(0))
  let bag = []
  let piece = null
  let nextIdx = 0
  let score = 0
  let lines = 0
  let level = 1
  let over = false
  let started = false
  let acc = 0

  const setLines = api.addHudItem('行数', 0)
  const setLevel = api.addHudItem('等级', 1)

  const surface = fitCanvas(viewport, (px) => {
    cell = Math.floor(px / 21)
    ox = Math.floor((px - cell * 15.2) / 2)
    oy = Math.floor((px - cell * ROWS) / 2)
    draw()
  })
  const { ctx } = surface

  const pullFromBag = () => {
    if (!bag.length) {
      bag = [0, 1, 2, 3, 4, 5, 6].sort(() => Math.random() - 0.5)
    }
    return bag.pop()
  }

  const spawn = () => {
    const idx = nextIdx
    nextIdx = pullFromBag()
    const shape = SHAPES[idx].map((r) => r.slice())
    piece = { shape, idx, x: Math.floor((COLS - shape[0].length) / 2), y: -1 }
    if (collides(shape, piece.x, piece.y)) {
      over = true
      api.gameOver('游戏结束', `得分 ${score} · 消行 ${lines} · 等级 ${level}`)
    }
  }

  const collides = (shape, x, y) => {
    for (let r = 0; r < shape.length; r++)
      for (let c = 0; c < shape[r].length; c++) {
        if (!shape[r][c]) continue
        const nx = x + c
        const ny = y + r
        if (nx < 0 || nx >= COLS || ny >= ROWS) return true
        if (ny >= 0 && board[ny][nx]) return true
      }
    return false
  }

  const merge = () => {
    piece.shape.forEach((row, r) =>
      row.forEach((v, c) => {
        if (v && piece.y + r >= 0) board[piece.y + r][piece.x + c] = piece.idx + 1
      })
    )
  }

  const clearLines = () => {
    let cleared = 0
    board = board.filter((row) => {
      if (row.every(Boolean)) {
        cleared++
        return false
      }
      return true
    })
    while (board.length < ROWS) board.unshift(Array(COLS).fill(0))
    if (cleared) {
      score += [0, 100, 300, 500, 800][cleared] * level
      lines += cleared
      level = 1 + Math.floor(lines / 10)
      api.setScore(score)
      setLines(lines)
      setLevel(level)
    }
  }

  const tryMove = (dx, dy) => {
    if (over || !piece) return false
    if (collides(piece.shape, piece.x + dx, piece.y + dy)) return false
    piece.x += dx
    piece.y += dy
    return true
  }

  const rotate = () => {
    if (over || !piece) return
    const rotated = rotateCW(piece.shape)
    for (const kick of [0, -1, 1, -2, 2]) {
      if (!collides(rotated, piece.x + kick, piece.y)) {
        piece.shape = rotated
        piece.x += kick
        return
      }
    }
  }

  const lockDown = () => {
    merge()
    clearLines()
    spawn()
  }

  const softDrop = () => {
    if (!tryMove(0, 1)) lockDown()
  }

  const hardDrop = () => {
    if (over || !piece) return
    while (tryMove(0, 1)) {}
    lockDown()
    draw()
  }

  const ghostY = () => {
    let y = piece.y
    while (!collides(piece.shape, piece.x, y + 1)) y++
    return y
  }

  const reset = () => {
    board = Array.from({ length: ROWS }, () => Array(COLS).fill(0))
    bag = []
    nextIdx = pullFromBag()
    score = 0
    lines = 0
    level = 1
    over = false
    started = false
    acc = 0
    api.setScore(0)
    setLines(0)
    setLevel(1)
    api.hideOverlay()
    spawn()
    draw()
  }

  const cellFill = (idx, ghost = false) =>
    themeHsl(stage, {
      shift: HUES[idx],
      s: ghost ? 40 : 70,
      l: ghost ? (isDark() ? 30 : 82) : 58,
      alpha: ghost ? 0.6 : 1,
    })

  const drawCell = (gx, gy, fill, x0 = ox, y0 = oy) => {
    ctx.fillStyle = fill
    ctx.beginPath()
    ctx.roundRect(x0 + gx * cell + 1, y0 + gy * cell + 1, cell - 2, cell - 2, cell * 0.18)
    ctx.fill()
  }

  const draw = () => {
    const px = surface.size()
    ctx.clearRect(0, 0, px, px)

    // board background
    ctx.fillStyle = isDark() ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)'
    ctx.beginPath()
    ctx.roundRect(ox - 3, oy - 3, COLS * cell + 6, ROWS * cell + 6, 8)
    ctx.fill()

    for (let r = 0; r < ROWS; r++)
      for (let c = 0; c < COLS; c++) {
        if (board[r][c]) drawCell(c, r, cellFill(board[r][c] - 1))
      }

    if (piece && !over) {
      const gy = ghostY()
      piece.shape.forEach((row, r) =>
        row.forEach((v, c) => {
          if (!v) return
          if (gy + r >= 0 && gy !== piece.y) drawCell(piece.x + c, gy + r, cellFill(piece.idx, true))
        })
      )
      piece.shape.forEach((row, r) =>
        row.forEach((v, c) => {
          if (v && piece.y + r >= 0) drawCell(piece.x + c, piece.y + r, cellFill(piece.idx))
        })
      )
    }

    // side panel: next piece
    const panelX = ox + COLS * cell + Math.floor(cell * 0.7)
    ctx.fillStyle = isDark() ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.45)'
    ctx.font = `600 ${Math.max(11, cell * 0.6)}px "Helvetica Neue", "Microsoft Yahei", sans-serif`
    ctx.textAlign = 'left'
    ctx.textBaseline = 'top'
    ctx.fillText('下一个', panelX, oy + 2)

    const nshape = SHAPES[nextIdx]
    const nc = cell * 0.8
    nshape.forEach((row, r) =>
      row.forEach((v, c) => {
        if (!v) return
        ctx.fillStyle = cellFill(nextIdx)
        ctx.beginPath()
        ctx.roundRect(panelX + c * nc, oy + cell * 1.2 + r * nc, nc - 2, nc - 2, nc * 0.18)
        ctx.fill()
      })
    )

    if (!started && !over) {
      ctx.fillStyle = isDark() ? 'rgba(10,12,16,0.6)' : 'rgba(255,255,255,0.65)'
      ctx.fillRect(ox, oy + ROWS * cell * 0.42, COLS * cell, cell * 2.4)
      ctx.fillStyle = themeHsl(stage, { l: isDark() ? 72 : 40 })
      ctx.font = `600 ${Math.max(12, cell * 0.62)}px "Helvetica Neue", "Microsoft Yahei", sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('按任意方向键开始', ox + (COLS * cell) / 2, oy + ROWS * cell * 0.42 + cell * 1.2)
    }
  }

  const stopLoop = gameLoop((dt) => {
    if (over || !started) return
    acc += dt
    const speed = SPEEDS[Math.min(level - 1, SPEEDS.length - 1)]
    while (acc >= speed) {
      acc -= speed
      softDrop()
    }
    draw()
  })

  const begin = () => {
    if (!started && !over) {
      started = true
      acc = 0
      draw()
    }
  }

  const onKey = (e) => {
    const k = e.key
    if (['ArrowLeft', 'ArrowRight', 'ArrowDown', 'ArrowUp', ' ', 'a', 'd', 's', 'w', 'A', 'D', 'S', 'W'].includes(k)) {
      e.preventDefault()
    } else return
    begin()
    if (over) return
    if (k === 'ArrowLeft' || k === 'a' || k === 'A') tryMove(-1, 0)
    else if (k === 'ArrowRight' || k === 'd' || k === 'D') tryMove(1, 0)
    else if (k === 'ArrowDown' || k === 's' || k === 'S') softDrop()
    else if (k === 'ArrowUp' || k === 'w' || k === 'W') rotate()
    else if (k === ' ') hardDrop()
    draw()
  }

  // Touch: tap = rotate, horizontal drag = move, fast downward flick = hard drop,
  // slow drag down = soft drop
  let tStart = null
  let tMovedCells = 0
  let tDroppedCells = 0
  const onTouchStart = (e) => {
    const t = e.touches[0]
    tStart = { x: t.clientX, y: t.clientY, time: Date.now() }
    tMovedCells = 0
    tDroppedCells = 0
  }
  const onTouchMove = (e) => {
    if (!tStart) return
    begin()
    const t = e.touches[0]
    const dx = t.clientX - tStart.x
    const dy = t.clientY - tStart.y
    const stepPx = Math.max(18, cell)
    const wantX = Math.trunc(dx / stepPx)
    while (tMovedCells < wantX) {
      tryMove(1, 0)
      tMovedCells++
    }
    while (tMovedCells > wantX) {
      tryMove(-1, 0)
      tMovedCells--
    }
    const wantY = Math.trunc(dy / stepPx)
    while (tDroppedCells < wantY) {
      softDrop()
      tDroppedCells++
    }
    draw()
  }
  const onTouchEnd = (e) => {
    if (!tStart) return
    const t = e.changedTouches[0]
    const dx = t.clientX - tStart.x
    const dy = t.clientY - tStart.y
    const dt = Date.now() - tStart.time
    if (Math.abs(dx) < 12 && Math.abs(dy) < 12 && dt < 260) {
      begin()
      rotate()
      draw()
    } else if (dy > 70 && dt < 260) {
      hardDrop()
    }
    tStart = null
  }

  window.addEventListener('keydown', onKey)
  viewport.addEventListener('touchstart', onTouchStart, { passive: true })
  viewport.addEventListener('touchmove', onTouchMove, { passive: true })
  viewport.addEventListener('touchend', onTouchEnd, { passive: true })

  reset()

  return {
    restart: reset,
    destroy() {
      stopLoop()
      window.removeEventListener('keydown', onKey)
      viewport.removeEventListener('touchstart', onTouchStart)
      viewport.removeEventListener('touchmove', onTouchMove)
      viewport.removeEventListener('touchend', onTouchEnd)
      surface.destroy()
    },
  }
}
