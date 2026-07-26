// Chinese chess. Board is 9 files x 10 ranks.
// Pieces: uppercase = red (player, bottom), lowercase = black (AI, top).
// K/k 将帅  A/a 士  B/b 象  N/n 马  R/r 车  C/c 炮  P/p 兵卒
const W = 9
const H = 10

const NAMES = {
  K: '帅', A: '仕', B: '相', N: '马', R: '车', C: '炮', P: '兵',
  k: '将', a: '士', b: '象', n: '马', r: '车', c: '炮', p: '卒',
}

const VALUE = { K: 10000, R: 600, C: 300, N: 290, B: 110, A: 110, P: 70 }

const START = [
  'rnbakabnr',
  '         ',
  ' c     c ',
  'p p p p p',
  '         ',
  '         ',
  'P P P P P',
  ' C     C ',
  '         ',
  'RNBAKABNR',
]

export function mount(stage, api) {
  const viewport = stage.querySelector('[data-role="viewport"]')
  viewport.innerHTML = '<div class="xq-board"></div>'
  const board = viewport.querySelector('.xq-board')

  let grid = []
  let selected = null
  let legal = []
  let moves = 0
  let over = false
  let thinking = false
  let aiTimer = 0
  let lastMove = null

  const setTurn = api.addHudItem('回合', '你')

  const isRed = (p) => p && p === p.toUpperCase() && p !== ' '
  const isBlack = (p) => p && p === p.toLowerCase() && p !== ' '
  const at = (g, x, y) => (x >= 0 && y >= 0 && x < W && y < H ? g[y][x] : null)
  const sideOf = (p) => (!p || p === ' ' ? 0 : isRed(p) ? 1 : 2)

  const reset = () => {
    clearTimeout(aiTimer)
    grid = START.map((row) => row.padEnd(W, ' ').split(''))
    selected = null
    legal = []
    moves = 0
    over = false
    thinking = false
    lastMove = null
    api.setScore(0)
    setTurn('你')
    api.hideOverlay()
    render()
  }

  const inPalace = (x, y, side) =>
    x >= 3 && x <= 5 && (side === 1 ? y >= 7 && y <= 9 : y >= 0 && y <= 2)

  const genMoves = (g, side) => {
    const out = []
    const push = (fx, fy, tx, ty) => {
      if (tx < 0 || ty < 0 || tx >= W || ty >= H) return
      if (sideOf(at(g, tx, ty)) === side) return
      out.push({ from: [fx, fy], to: [tx, ty] })
    }

    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++) {
        const p = g[y][x]
        if (sideOf(p) !== side) continue
        const u = p.toUpperCase()

        if (u === 'K') {
          for (const [dx, dy] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
            const tx = x + dx
            const ty = y + dy
            if (inPalace(tx, ty, side)) push(x, y, tx, ty)
          }
        } else if (u === 'A') {
          for (const [dx, dy] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
            const tx = x + dx
            const ty = y + dy
            if (inPalace(tx, ty, side)) push(x, y, tx, ty)
          }
        } else if (u === 'B') {
          for (const [dx, dy] of [[2, 2], [2, -2], [-2, 2], [-2, -2]]) {
            const tx = x + dx
            const ty = y + dy
            // elephants can't cross the river and are blocked at the eye
            if (side === 1 && ty < 5) continue
            if (side === 2 && ty > 4) continue
            if (at(g, x + dx / 2, y + dy / 2) !== ' ') continue
            push(x, y, tx, ty)
          }
        } else if (u === 'N') {
          const legs = [
            [1, 2, 0, 1], [-1, 2, 0, 1], [1, -2, 0, -1], [-1, -2, 0, -1],
            [2, 1, 1, 0], [2, -1, 1, 0], [-2, 1, -1, 0], [-2, -1, -1, 0],
          ]
          for (const [dx, dy, bx, by] of legs) {
            if (at(g, x + bx, y + by) !== ' ') continue
            push(x, y, x + dx, y + dy)
          }
        } else if (u === 'R' || u === 'C') {
          for (const [dx, dy] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
            let jumped = false
            for (let i = 1; i < Math.max(W, H); i++) {
              const tx = x + dx * i
              const ty = y + dy * i
              const cell = at(g, tx, ty)
              if (cell === null) break
              if (u === 'R') {
                if (cell === ' ') push(x, y, tx, ty)
                else {
                  push(x, y, tx, ty)
                  break
                }
              } else {
                if (!jumped) {
                  if (cell === ' ') push(x, y, tx, ty)
                  else jumped = true
                } else if (cell !== ' ') {
                  // cannon captures the first piece beyond its screen
                  if (sideOf(cell) !== side) push(x, y, tx, ty)
                  break
                }
              }
            }
          }
        } else if (u === 'P') {
          const fwd = side === 1 ? -1 : 1
          push(x, y, x, y + fwd)
          const crossed = side === 1 ? y <= 4 : y >= 5
          if (crossed) {
            push(x, y, x - 1, y)
            push(x, y, x + 1, y)
          }
        }
      }
    return out
  }

  const findKing = (g, side) => {
    const target = side === 1 ? 'K' : 'k'
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++) if (g[y][x] === target) return [x, y]
    return null
  }

  // Generals may not face each other down an open file
  const kingsFace = (g) => {
    const a = findKing(g, 1)
    const b = findKing(g, 2)
    if (!a || !b || a[0] !== b[0]) return false
    for (let y = Math.min(a[1], b[1]) + 1; y < Math.max(a[1], b[1]); y++) {
      if (g[y][a[0]] !== ' ') return false
    }
    return true
  }

  const inCheck = (g, side) => {
    if (kingsFace(g)) return true
    const king = findKing(g, side)
    if (!king) return true
    const enemy = side === 1 ? 2 : 1
    return genMoves(g, enemy).some((m) => m.to[0] === king[0] && m.to[1] === king[1])
  }

  const applyMove = (g, m) => {
    const next = g.map((r) => r.slice())
    const [fx, fy] = m.from
    const [tx, ty] = m.to
    next[ty][tx] = next[fy][fx]
    next[fy][fx] = ' '
    return next
  }

  const legalMoves = (g, side) =>
    genMoves(g, side).filter((m) => !inCheck(applyMove(g, m), side))

  const evaluate = (g) => {
    let s = 0
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++) {
        const p = g[y][x]
        if (p === ' ') continue
        const u = p.toUpperCase()
        let v = VALUE[u] || 0
        // pawns get stronger past the river
        if (u === 'P') {
          const crossed = isRed(p) ? y <= 4 : y >= 5
          if (crossed) v += 60
        }
        // small centralisation bonus
        v += (4 - Math.abs(4 - x)) * 2
        s += isBlack(p) ? v : -v
      }
    return s
  }

  const search = (g, depth, side, alpha, beta) => {
    const moves = legalMoves(g, side)
    if (!moves.length) return { score: side === 2 ? -50000 : 50000 }
    if (depth === 0) return { score: evaluate(g) }

    // Captures first: much better pruning
    moves.sort((a, b) => {
      const va = VALUE[(at(g, b.to[0], b.to[1]) || ' ').toUpperCase()] || 0
      const vb = VALUE[(at(g, a.to[0], a.to[1]) || ' ').toUpperCase()] || 0
      return va - vb
    })

    let best = null
    for (const m of moves) {
      const next = applyMove(g, m)
      const { score } = search(next, depth - 1, side === 2 ? 1 : 2, alpha, beta)
      if (!best || (side === 2 ? score > best.score : score < best.score)) best = { score, m }
      if (side === 2) alpha = Math.max(alpha, score)
      else beta = Math.min(beta, score)
      if (beta <= alpha) break
    }
    return best
  }

  const endGame = (winnerIsPlayer, reason) => {
    over = true
    api.gameOver(winnerIsPlayer ? '你赢了！' : 'AI 获胜', reason, { won: winnerIsPlayer })
  }

  const afterMove = (side) => {
    moves++
    api.setScore(moves)
    const opponent = side === 1 ? 2 : 1
    if (!legalMoves(grid, opponent).length) {
      endGame(side === 1, inCheck(grid, opponent) ? '将死' : '困毙')
      return true
    }
    return false
  }

  const aiTurn = () => {
    thinking = true
    setTurn('AI 思考中')
    render()
    aiTimer = setTimeout(() => {
      const { m } = search(grid, 3, 2, -Infinity, Infinity)
      const pick = m || legalMoves(grid, 2)[0]
      if (!pick) {
        endGame(true, '黑方无子可动')
        return
      }
      grid = applyMove(grid, pick)
      lastMove = pick
      thinking = false
      setTurn('你')
      render()
      afterMove(2)
    }, 260)
  }

  const render = () => {
    const targets = new Set(legal.map((m) => `${m.to[0]},${m.to[1]}`))
    board.innerHTML = ''
    for (let y = 0; y < H; y++)
      for (let x = 0; x < W; x++) {
        const cell = document.createElement('button')
        cell.type = 'button'
        cell.className = 'xq-point'
        cell.dataset.x = String(x)
        cell.dataset.y = String(y)
        if (y === 4) cell.classList.add('river-top')
        if (y === 5) cell.classList.add('river-bottom')
        if (targets.has(`${x},${y}`)) cell.classList.add('target')
        if (lastMove && ((lastMove.from[0] === x && lastMove.from[1] === y) || (lastMove.to[0] === x && lastMove.to[1] === y))) {
          cell.classList.add('last')
        }
        const p = grid[y][x]
        if (p !== ' ') {
          const piece = document.createElement('span')
          piece.className = `xq-piece ${isRed(p) ? 'red' : 'black'}`
          piece.textContent = NAMES[p] || p
          if (selected && selected[0] === x && selected[1] === y) piece.classList.add('sel')
          cell.appendChild(piece)
        }
        board.appendChild(cell)
      }
  }

  const onClick = (e) => {
    if (over || thinking) return
    const cell = e.target.closest('.xq-point')
    if (!cell) return
    const x = Number(cell.dataset.x)
    const y = Number(cell.dataset.y)

    const move = legal.find((m) => m.to[0] === x && m.to[1] === y)
    if (move) {
      grid = applyMove(grid, move)
      lastMove = move
      selected = null
      legal = []
      render()
      if (afterMove(1)) return
      aiTurn()
      return
    }

    if (sideOf(grid[y][x]) === 1) {
      selected = [x, y]
      legal = legalMoves(grid, 1).filter((m) => m.from[0] === x && m.from[1] === y)
    } else {
      selected = null
      legal = []
    }
    render()
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
