import { themeHsl, isDark, fitCanvas } from './core.js'

const N = 15
const DIRS = [
  [1, 0],
  [0, 1],
  [1, 1],
  [1, -1],
]

export function mount(stage, api) {
  const viewport = stage.querySelector('[data-role="viewport"]')

  let cell = 24
  let margin = 20
  // Initialized here because fitCanvas draws once synchronously,
  // before reset() has run. 0 empty, 1 player, 2 ai.
  let grid = Array.from({ length: N }, () => Array(N).fill(0))
  let moves = 0
  let over = false
  let thinking = false
  let lastMove = null
  let aiTimer = 0

  const surface = fitCanvas(viewport, (px) => {
    margin = Math.floor(px * 0.055)
    cell = (px - margin * 2) / (N - 1)
    draw()
  })
  const { ctx } = surface

  const reset = () => {
    clearTimeout(aiTimer)
    grid = Array.from({ length: N }, () => Array(N).fill(0))
    moves = 0
    over = false
    thinking = false
    lastMove = null
    api.setScore(0)
    api.hideOverlay()
    draw()
  }

  const inBoard = (x, y) => x >= 0 && y >= 0 && x < N && y < N

  const countLine = (x, y, dx, dy, who) => {
    let n = 1
    let openEnds = 0
    for (const s of [-1, 1]) {
      let cx = x + dx * s
      let cy = y + dy * s
      while (inBoard(cx, cy) && grid[cy][cx] === who) {
        n++
        cx += dx * s
        cy += dy * s
      }
      if (inBoard(cx, cy) && grid[cy][cx] === 0) openEnds++
    }
    return { n, openEnds }
  }

  const isWin = (x, y, who) =>
    DIRS.some(([dx, dy]) => countLine(x, y, dx, dy, who).n >= 5)

  // Pattern score for placing `who` at (x,y)
  const evalPoint = (x, y, who) => {
    let total = 0
    for (const [dx, dy] of DIRS) {
      const { n, openEnds } = countLine(x, y, dx, dy, who)
      if (n >= 5) total += 10000000
      else if (n === 4) total += openEnds === 2 ? 1000000 : 100000
      else if (n === 3) total += openEnds === 2 ? 50000 : 1000
      else if (n === 2) total += openEnds === 2 ? 500 : 100
      else total += openEnds > 0 ? 10 : 1
    }
    return total
  }

  const candidates = () => {
    const set = new Set()
    let any = false
    for (let y = 0; y < N; y++)
      for (let x = 0; x < N; x++) {
        if (!grid[y][x]) continue
        any = true
        for (let dy = -2; dy <= 2; dy++)
          for (let dx = -2; dx <= 2; dx++) {
            const nx = x + dx
            const ny = y + dy
            if (inBoard(nx, ny) && !grid[ny][nx]) set.add(ny * N + nx)
          }
      }
    if (!any) return [Math.floor(N / 2) * N + Math.floor(N / 2)]
    return [...set]
  }

  const aiMove = () => {
    let bestScore = -1
    let best = null
    for (const i of candidates()) {
      const x = i % N
      const y = Math.floor(i / N)
      // Offense plus slightly weighted defense
      const s = evalPoint(x, y, 2) + evalPoint(x, y, 1) * 0.9
      if (s > bestScore) {
        bestScore = s
        best = { x, y }
      }
    }
    if (!best) return endGame('平局', '棋盘满了')
    place(best.x, best.y, 2)
    if (over) return
    thinking = false
    draw()
  }

  const endGame = (title, text, won = false) => {
    over = true
    api.gameOver(title, text, { won })
  }

  const place = (x, y, who) => {
    grid[y][x] = who
    lastMove = { x, y, who }
    moves++
    api.setScore(moves)
    draw()
    if (isWin(x, y, who)) {
      endGame(who === 1 ? '你赢了！' : 'AI 获胜', `共 ${moves} 手`, who === 1)
      return
    }
    if (moves >= N * N) endGame('平局', '棋盘满了')
  }

  const onClick = (e) => {
    if (over || thinking) return
    const rect = surface.canvas.getBoundingClientRect()
    const x = Math.round((e.clientX - rect.left - margin) / cell)
    const y = Math.round((e.clientY - rect.top - margin) / cell)
    if (!inBoard(x, y) || grid[y][x]) return
    place(x, y, 1)
    if (over) return
    thinking = true
    draw()
    aiTimer = setTimeout(aiMove, 260)
  }

  const stone = (x, y, who, ghost = false) => {
    const cx = margin + x * cell
    const cy = margin + y * cell
    const r = cell * 0.42
    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, Math.PI * 2)
    if (who === 1) {
      ctx.fillStyle = themeHsl(stage, { l: 55, alpha: ghost ? 0.4 : 1 })
    } else {
      ctx.fillStyle = isDark() ? '#e8e9ee' : '#33363f'
    }
    ctx.shadowColor = 'rgba(0,0,0,0.3)'
    ctx.shadowBlur = ghost ? 0 : 4
    ctx.shadowOffsetY = 1
    ctx.fill()
    ctx.shadowColor = 'transparent'
    ctx.shadowBlur = 0
    ctx.shadowOffsetY = 0
  }

  const draw = () => {
    const px = surface.size()
    ctx.clearRect(0, 0, px, px)

    // wooden-ish board tinted by theme
    ctx.fillStyle = themeHsl(stage, { shift: 0, s: 22, l: isDark() ? 22 : 88, alpha: 1 })
    ctx.beginPath()
    ctx.roundRect(0, 0, px, px, 12)
    ctx.fill()

    ctx.strokeStyle = isDark() ? 'rgba(255,255,255,0.28)' : 'rgba(0,0,0,0.4)'
    ctx.lineWidth = 1
    for (let i = 0; i < N; i++) {
      const p = margin + i * cell
      ctx.beginPath()
      ctx.moveTo(margin, p)
      ctx.lineTo(px - margin, p)
      ctx.stroke()
      ctx.beginPath()
      ctx.moveTo(p, margin)
      ctx.lineTo(p, px - margin)
      ctx.stroke()
    }

    // star points
    ctx.fillStyle = isDark() ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.5)'
    for (const [sx, sy] of [[3, 3], [11, 3], [3, 11], [11, 11], [7, 7]]) {
      ctx.beginPath()
      ctx.arc(margin + sx * cell, margin + sy * cell, 3, 0, Math.PI * 2)
      ctx.fill()
    }

    for (let y = 0; y < N; y++)
      for (let x = 0; x < N; x++) {
        if (grid[y][x]) stone(x, y, grid[y][x])
      }

    if (lastMove) {
      const cx = margin + lastMove.x * cell
      const cy = margin + lastMove.y * cell
      ctx.strokeStyle = lastMove.who === 1 ? '#fff' : themeHsl(stage, { l: 60 })
      ctx.lineWidth = 2
      ctx.strokeRect(cx - 4, cy - 4, 8, 8)
    }

    if (thinking && !over) {
      ctx.fillStyle = isDark() ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.45)'
      ctx.font = `600 ${Math.max(11, px * 0.028)}px "Microsoft Yahei", sans-serif`
      ctx.textAlign = 'right'
      ctx.textBaseline = 'top'
      ctx.fillText('AI 思考中…', px - 12, 8)
    }
  }

  surface.canvas.addEventListener('click', onClick)
  reset()

  return {
    restart: reset,
    destroy() {
      clearTimeout(aiTimer)
      surface.canvas.removeEventListener('click', onClick)
      surface.destroy()
    },
  }
}
