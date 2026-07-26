const LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
]

export function mount(stage, api) {
  const viewport = stage.querySelector('[data-role="viewport"]')
  viewport.innerHTML = '<div class="ttt-board"></div>'
  const board = viewport.querySelector('.ttt-board')

  let cells = Array(9).fill(0) // 0 empty, 1 player(X), 2 ai(O)
  let moves = 0
  let over = false
  let lock = false
  let timer = 0
  let playerFirst = true

  const setTurn = api.addHudItem('回合', '你')
  const sideBtn = api.addHudButton('AI 先手', () => {
    playerFirst = !playerFirst
    sideBtn.textContent = playerFirst ? 'AI 先手' : '我先手'
    reset()
  })

  const winnerOf = (b) => {
    for (const [a, c, d] of LINES) {
      if (b[a] && b[a] === b[c] && b[a] === b[d]) return { who: b[a], line: [a, c, d] }
    }
    return b.every(Boolean) ? { who: 0, line: null } : null
  }

  // Perfect play: depth-aware minimax so the AI wins as fast as it can
  // and stalls a loss as long as possible.
  const minimax = (b, turn, depth) => {
    const res = winnerOf(b)
    if (res) {
      if (res.who === 2) return { score: 10 - depth }
      if (res.who === 1) return { score: depth - 10 }
      return { score: 0 }
    }
    let best = null
    for (let i = 0; i < 9; i++) {
      if (b[i]) continue
      b[i] = turn
      const { score } = minimax(b, turn === 2 ? 1 : 2, depth + 1)
      b[i] = 0
      if (
        !best ||
        (turn === 2 ? score > best.score : score < best.score)
      ) {
        best = { score, index: i }
      }
    }
    return best
  }

  const finish = (res) => {
    over = true
    render(res.line)
    if (res.who === 1) api.gameOver('你赢了！', `${moves} 手拿下`, { won: true })
    else if (res.who === 2) api.gameOver('AI 获胜', '再来一局？')
    else api.gameOver('平局', '势均力敌')
  }

  const place = (i, who) => {
    cells[i] = who
    moves++
    api.setScore(moves)
    const res = winnerOf(cells)
    render()
    if (res) {
      finish(res)
      return true
    }
    return false
  }

  const aiTurn = () => {
    lock = true
    setTurn('AI')
    render()
    timer = setTimeout(() => {
      const { index } = minimax(cells.slice(), 2, 0)
      if (index === undefined || over) return
      if (!place(index, 2)) {
        lock = false
        setTurn('你')
        render()
      }
    }, 320)
  }

  const reset = () => {
    clearTimeout(timer)
    cells = Array(9).fill(0)
    moves = 0
    over = false
    lock = false
    api.setScore(0)
    api.hideOverlay()
    setTurn(playerFirst ? '你' : 'AI')
    render()
    if (!playerFirst) aiTurn()
  }

  const render = (winLine = null) => {
    board.innerHTML = ''
    cells.forEach((v, i) => {
      const el = document.createElement('button')
      el.type = 'button'
      el.className = 'ttt-cell'
      el.dataset.i = String(i)
      if (v) {
        el.classList.add(v === 1 ? 'x' : 'o')
        el.textContent = v === 1 ? '✕' : '○'
      }
      if (winLine?.includes(i)) el.classList.add('win')
      if (!v && !over && !lock) el.classList.add('open')
      board.appendChild(el)
    })
  }

  const onClick = (e) => {
    if (over || lock) return
    const el = e.target.closest('.ttt-cell')
    if (!el) return
    const i = Number(el.dataset.i)
    if (cells[i]) return
    if (!place(i, 1)) aiTurn()
  }

  board.addEventListener('click', onClick)
  reset()

  return {
    restart: reset,
    destroy() {
      clearTimeout(timer)
      board.removeEventListener('click', onClick)
    },
  }
}
