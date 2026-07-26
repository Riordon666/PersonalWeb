const N = 8
const DIRS = [
  [-1, -1], [0, -1], [1, -1],
  [-1, 0], [1, 0],
  [-1, 1], [0, 1], [1, 1],
]

// Positional weights: corners rule, X/C squares hurt
const WEIGHTS = [
  [100, -24, 12, 6, 6, 12, -24, 100],
  [-24, -40, -4, -3, -3, -4, -40, -24],
  [12, -4, 4, 2, 2, 4, -4, 12],
  [6, -3, 2, 1, 1, 2, -3, 6],
  [6, -3, 2, 1, 1, 2, -3, 6],
  [12, -4, 4, 2, 2, 4, -4, 12],
  [-24, -40, -4, -3, -3, -4, -40, -24],
  [100, -24, 12, 6, 6, 12, -24, 100],
]

export function mount(stage, api) {
  const viewport = stage.querySelector('[data-role="viewport"]')
  viewport.innerHTML = '<div class="rv-board"></div>'
  const board = viewport.querySelector('.rv-board')

  let grid = [] // 0 empty, 1 player, 2 ai
  let over = false
  let thinking = false
  let aiTimer = 0

  const setAiCount = api.addHudItem('AI 棋子', 2)

  const inBoard = (x, y) => x >= 0 && y >= 0 && x < N && y < N

  const flipsFor = (x, y, who) => {
    if (grid[y][x]) return []
    const opp = who === 1 ? 2 : 1
    const all = []
    for (const [dx, dy] of DIRS) {
      const line = []
      let cx = x + dx
      let cy = y + dy
      while (inBoard(cx, cy) && grid[cy][cx] === opp) {
        line.push([cx, cy])
        cx += dx
        cy += dy
      }
      if (line.length && inBoard(cx, cy) && grid[cy][cx] === who) all.push(...line)
    }
    return all
  }

  const legalMoves = (who) => {
    const out = []
    for (let y = 0; y < N; y++)
      for (let x = 0; x < N; x++) {
        const f = flipsFor(x, y, who)
        if (f.length) out.push({ x, y, flips: f })
      }
    return out
  }

  const counts = () => {
    let p = 0
    let a = 0
    grid.flat().forEach((v) => {
      if (v === 1) p++
      else if (v === 2) a++
    })
    return { p, a }
  }

  const reset = () => {
    clearTimeout(aiTimer)
    grid = Array.from({ length: N }, () => Array(N).fill(0))
    grid[3][3] = 2
    grid[4][4] = 2
    grid[3][4] = 1
    grid[4][3] = 1
    over = false
    thinking = false
    api.hideOverlay()
    render()
  }

  const finish = () => {
    over = true
    const { p, a } = counts()
    const title = p > a ? '你赢了！' : p < a ? 'AI 获胜' : '平局'
    api.gameOver(title, `你 ${p} : ${a} AI`, { won: p > a })
  }

  const apply = (move, who) => {
    grid[move.y][move.x] = who
    for (const [fx, fy] of move.flips) grid[fy][fx] = who
    render(move)
  }

  const afterMove = () => {
    const { p, a } = counts()
    api.setScore(p)
    setAiCount(a)
    if (p + a === N * N || p === 0 || a === 0) return finish()

    const aiMoves = legalMoves(2)
    const playerMoves = legalMoves(1)
    if (thinking) {
      // player just moved → AI's turn
      if (aiMoves.length) {
        aiTimer = setTimeout(aiMove, 420)
      } else if (playerMoves.length) {
        thinking = false
        render()
      } else finish()
    } else {
      // AI just moved → player's turn
      if (playerMoves.length) {
        render()
      } else if (aiMoves.length) {
        thinking = true
        aiTimer = setTimeout(aiMove, 420)
      } else finish()
    }
  }

  const aiMove = () => {
    const moves = legalMoves(2)
    if (!moves.length) {
      thinking = false
      afterMove()
      return
    }
    let best = moves[0]
    let bestScore = -Infinity
    for (const m of moves) {
      const s = WEIGHTS[m.y][m.x] * 3 + m.flips.length
      if (s > bestScore) {
        bestScore = s
        best = m
      }
    }
    apply(best, 2)
    thinking = false
    afterMove()
  }

  const onClick = (e) => {
    if (over || thinking) return
    const cellEl = e.target.closest('.rv-cell')
    if (!cellEl) return
    const x = Number(cellEl.dataset.x)
    const y = Number(cellEl.dataset.y)
    const flips = flipsFor(x, y, 1)
    if (!flips.length) return
    thinking = true
    apply({ x, y, flips }, 1)
    afterMove()
  }

  const render = (lastMove = null) => {
    const hints = !over && !thinking ? legalMoves(1) : []
    const hintSet = new Set(hints.map((m) => m.y * N + m.x))
    const flipSet = lastMove ? new Set(lastMove.flips.map(([fx, fy]) => fy * N + fx)) : new Set()

    board.innerHTML = ''
    for (let y = 0; y < N; y++)
      for (let x = 0; x < N; x++) {
        const cell = document.createElement('button')
        cell.type = 'button'
        cell.className = 'rv-cell'
        cell.dataset.x = String(x)
        cell.dataset.y = String(y)
        const v = grid[y][x]
        if (v) {
          const disc = document.createElement('span')
          disc.className = `rv-disc ${v === 1 ? 'player' : 'ai'}`
          if (flipSet.has(y * N + x)) disc.classList.add('flipping')
          if (lastMove && lastMove.x === x && lastMove.y === y) disc.classList.add('placed')
          cell.appendChild(disc)
        } else if (hintSet.has(y * N + x)) {
          cell.classList.add('hint')
        }
        board.appendChild(cell)
      }
  }

  board.addEventListener('click', onClick)
  reset()
  api.setScore(2)

  return {
    restart: reset,
    destroy() {
      clearTimeout(aiTimer)
      board.removeEventListener('click', onClick)
    },
  }
}
