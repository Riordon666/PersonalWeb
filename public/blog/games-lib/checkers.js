const N = 8

export function mount(stage, api) {
  const viewport = stage.querySelector('[data-role="viewport"]')
  viewport.innerHTML = '<div class="ck-board"></div>'
  const board = viewport.querySelector('.ck-board')

  // 0 empty, 1 player man, 2 ai man, 3 player king, 4 ai king
  let grid = []
  let selected = null
  let legal = []
  let turn = 1
  let over = false
  let aiTimer = 0
  let chainFrom = null

  const setTurn = api.addHudItem('回合', '你')
  const setAi = api.addHudItem('AI 棋子', 12)

  const isPlayer = (v) => v === 1 || v === 3
  const isAi = (v) => v === 2 || v === 4
  const isKing = (v) => v === 3 || v === 4
  const ownerOf = (v) => (isPlayer(v) ? 1 : isAi(v) ? 2 : 0)
  const inB = (x, y) => x >= 0 && y >= 0 && x < N && y < N

  const reset = () => {
    clearTimeout(aiTimer)
    grid = Array.from({ length: N }, () => Array(N).fill(0))
    for (let y = 0; y < 3; y++)
      for (let x = 0; x < N; x++) if ((x + y) % 2 === 1) grid[y][x] = 2
    for (let y = N - 3; y < N; y++)
      for (let x = 0; x < N; x++) if ((x + y) % 2 === 1) grid[y][x] = 1
    selected = null
    legal = []
    chainFrom = null
    turn = 1
    over = false
    api.setScore(12)
    setTurn('你')
    setAi(12)
    api.hideOverlay()
    render()
  }

  const dirsFor = (v) => {
    if (isKing(v)) return [[-1, -1], [1, -1], [-1, 1], [1, 1]]
    // players move up the board, AI moves down
    return isPlayer(v) ? [[-1, -1], [1, -1]] : [[-1, 1], [1, 1]]
  }

  const movesFrom = (g, x, y) => {
    const v = g[y][x]
    if (!v) return { jumps: [], steps: [] }
    const jumps = []
    const steps = []
    for (const [dx, dy] of dirsFor(v)) {
      const mx = x + dx
      const my = y + dy
      const jx = x + dx * 2
      const jy = y + dy * 2
      if (!inB(mx, my)) continue
      if (!g[my][mx]) {
        if (inB(mx, my)) steps.push({ from: [x, y], to: [mx, my], jump: null })
      } else if (
        ownerOf(g[my][mx]) !== ownerOf(v) &&
        inB(jx, jy) &&
        !g[jy][jx]
      ) {
        jumps.push({ from: [x, y], to: [jx, jy], jump: [mx, my] })
      }
    }
    return { jumps, steps }
  }

  const allMoves = (g, player) => {
    const jumps = []
    const steps = []
    for (let y = 0; y < N; y++)
      for (let x = 0; x < N; x++) {
        if (ownerOf(g[y][x]) !== player) continue
        const m = movesFrom(g, x, y)
        jumps.push(...m.jumps)
        steps.push(...m.steps)
      }
    // Capturing is mandatory in checkers
    return jumps.length ? jumps : steps
  }

  const applyMove = (g, mv) => {
    const [fx, fy] = mv.from
    const [tx, ty] = mv.to
    const v = g[fy][fx]
    g[fy][fx] = 0
    g[ty][tx] = v
    if (mv.jump) g[mv.jump[1]][mv.jump[0]] = 0
    // promotion
    if (v === 1 && ty === 0) g[ty][tx] = 3
    if (v === 2 && ty === N - 1) g[ty][tx] = 4
    return g
  }

  const cloneGrid = (g) => g.map((r) => r.slice())

  const countPieces = (g, player) => {
    let n = 0
    for (const row of g) for (const v of row) if (ownerOf(v) === player) n += isKing(v) ? 2 : 1
    return n
  }

  const evaluate = (g) => {
    let s = 0
    for (let y = 0; y < N; y++)
      for (let x = 0; x < N; x++) {
        const v = g[y][x]
        if (!v) continue
        const base = isKing(v) ? 30 : 10
        // advancement bonus toward promotion
        const adv = isKing(v) ? 0 : isAi(v) ? y : N - 1 - y
        const val = base + adv * 0.6 + (x === 0 || x === N - 1 ? 1.5 : 0)
        s += isAi(v) ? val : -val
      }
    return s
  }

  const minimax = (g, depth, player, alpha, beta) => {
    const moves = allMoves(g, player)
    if (!moves.length) return { score: player === 2 ? -9999 : 9999 }
    if (depth === 0) return { score: evaluate(g) }

    let best = null
    for (const mv of moves) {
      const next = applyMove(cloneGrid(g), mv)
      const { score } = minimax(next, depth - 1, player === 2 ? 1 : 2, alpha, beta)
      if (!best || (player === 2 ? score > best.score : score < best.score)) best = { score, mv }
      if (player === 2) alpha = Math.max(alpha, score)
      else beta = Math.min(beta, score)
      if (beta <= alpha) break
    }
    return best
  }

  const finish = () => {
    over = true
    const mine = countPieces(grid, 1)
    const theirs = countPieces(grid, 2)
    const won = theirs === 0 || (mine > 0 && !allMoves(grid, 2).length)
    api.gameOver(won ? '你赢了！' : 'AI 获胜', `你 ${mine} : ${theirs} AI`, { won })
  }

  const afterMove = () => {
    api.setScore(countPieces(grid, 1))
    setAi(countPieces(grid, 2))
    if (!countPieces(grid, 1) || !allMoves(grid, 1).length) return finish()
    if (!countPieces(grid, 2) || !allMoves(grid, 2).length) return finish()
  }

  const aiTurn = () => {
    setTurn('AI')
    render()
    aiTimer = setTimeout(() => {
      let guard = 0
      // AI keeps jumping while chains are available
      while (guard++ < 12) {
        const moves = allMoves(grid, 2)
        if (!moves.length) break
        const { mv } = minimax(cloneGrid(grid), 4, 2, -Infinity, Infinity)
        const chosen = mv || moves[0]
        applyMove(grid, chosen)
        render()
        if (!chosen.jump) break
        const more = movesFrom(grid, chosen.to[0], chosen.to[1]).jumps
        if (!more.length) break
      }
      turn = 1
      chainFrom = null
      setTurn('你')
      render()
      afterMove()
    }, 340)
  }

  const render = () => {
    board.innerHTML = ''
    const targets = new Set(legal.map((m) => `${m.to[0]},${m.to[1]}`))
    for (let y = 0; y < N; y++)
      for (let x = 0; x < N; x++) {
        const cell = document.createElement('button')
        cell.type = 'button'
        cell.className = 'ck-cell' + ((x + y) % 2 ? ' dark' : ' light')
        cell.dataset.x = String(x)
        cell.dataset.y = String(y)
        if (selected && selected[0] === x && selected[1] === y) cell.classList.add('sel')
        if (targets.has(`${x},${y}`)) cell.classList.add('target')
        const v = grid[y][x]
        if (v) {
          const piece = document.createElement('span')
          piece.className = `ck-piece ${isPlayer(v) ? 'me' : 'ai'}${isKing(v) ? ' king' : ''}`
          cell.appendChild(piece)
        }
        board.appendChild(cell)
      }
  }

  const onClick = (e) => {
    if (over || turn !== 1) return
    const cell = e.target.closest('.ck-cell')
    if (!cell) return
    const x = Number(cell.dataset.x)
    const y = Number(cell.dataset.y)

    const move = legal.find((m) => m.to[0] === x && m.to[1] === y)
    if (move) {
      applyMove(grid, move)
      // Continue a jump chain if this piece can capture again
      const more = move.jump ? movesFrom(grid, x, y).jumps : []
      if (more.length) {
        chainFrom = [x, y]
        selected = [x, y]
        legal = more
        render()
        api.setScore(countPieces(grid, 1))
        setAi(countPieces(grid, 2))
        return
      }
      selected = null
      legal = []
      chainFrom = null
      render()
      api.setScore(countPieces(grid, 1))
      setAi(countPieces(grid, 2))
      if (!allMoves(grid, 2).length || !countPieces(grid, 2)) return finish()
      turn = 2
      aiTurn()
      return
    }

    if (chainFrom) return

    if (ownerOf(grid[y][x]) === 1) {
      const available = allMoves(grid, 1)
      const mine = available.filter((m) => m.from[0] === x && m.from[1] === y)
      if (!mine.length) {
        selected = null
        legal = []
      } else {
        selected = [x, y]
        legal = mine
      }
      render()
    }
  }

  board.addEventListener('click', onClick)
  reset()

  return {
    restart: reset,
    destroy() {
      clearTimeout(aiTimer)
      board.removeEventListener('click', onClick)
    },
  }
}
