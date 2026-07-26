import { shuffle } from './core.js'

const COLS = 8
const ROWS = 7
const SYMBOLS = ['🍎', '🍊', '🍋', '🍇', '🍓', '🥝', '🍑', '🍒', '🥥', '🍍', '🌽', '🍄', '🌶️', '🥕']

export function mount(stage, api) {
  const viewport = stage.querySelector('[data-role="viewport"]')
  viewport.innerHTML = '<div class="on-board"></div><svg class="on-lines"></svg>'
  const board = viewport.querySelector('.on-board')
  const linesEl = viewport.querySelector('.on-lines')

  // Padded grid so paths may travel one cell outside the board
  const W = COLS + 2
  const H = ROWS + 2

  let grid = []
  let selected = null
  let left = 0
  let cleared = 0
  let seconds = 0
  let ticker = 0
  let over = false
  let lineTimer = 0

  const setLeftHud = api.addHudItem('用时', '0s')
  api.addHudButton('提示', () => showHint())
  api.addHudButton('洗牌', () => {
    reshuffle()
    render()
  })

  const stopTimer = () => {
    clearInterval(ticker)
    ticker = 0
  }

  const idx = (x, y) => y * W + x
  const val = (x, y) => (x >= 0 && y >= 0 && x < W && y < H ? grid[idx(x, y)] : null)

  const buildTiles = () => {
    const total = COLS * ROWS
    const pairCount = total / 2
    const list = []
    for (let i = 0; i < pairCount; i++) {
      const sym = SYMBOLS[i % SYMBOLS.length]
      list.push(sym, sym)
    }
    return shuffle(list)
  }

  const layout = (tiles) => {
    grid = Array(W * H).fill(null)
    let i = 0
    for (let y = 1; y <= ROWS; y++)
      for (let x = 1; x <= COLS; x++) grid[idx(x, y)] = tiles[i++]
  }

  const reshuffle = () => {
    const remaining = []
    for (let y = 1; y <= ROWS; y++)
      for (let x = 1; x <= COLS; x++) {
        const v = val(x, y)
        if (v) remaining.push(v)
      }
    const mixed = shuffle(remaining)
    let i = 0
    for (let y = 1; y <= ROWS; y++)
      for (let x = 1; x <= COLS; x++) {
        if (val(x, y)) grid[idx(x, y)] = mixed[i++]
      }
    if (!findAnyPair()) reshuffle()
  }

  // Path search: at most two turns, travelling through empty cells
  const findPath = (a, b) => {
    if (val(a.x, a.y) !== val(b.x, b.y) || (a.x === b.x && a.y === b.y)) return null

    const passable = (x, y) =>
      x >= 0 && y >= 0 && x < W && y < H && (!val(x, y) || (x === b.x && y === b.y))

    const DIRS = [[0, -1], [0, 1], [-1, 0], [1, 0]]
    // best[y][x][dir] = fewest turns to reach that cell arriving via dir
    const best = Array.from({ length: H }, () =>
      Array.from({ length: W }, () => Array(4).fill(Infinity))
    )
    const queue = []

    DIRS.forEach(([dx, dy], d) => {
      const nx = a.x + dx
      const ny = a.y + dy
      if (!passable(nx, ny)) return
      best[ny][nx][d] = 0
      queue.push({ x: nx, y: ny, d, turns: 0, path: [a, { x: nx, y: ny }] })
    })

    while (queue.length) {
      queue.sort((p, q) => p.turns - q.turns)
      const cur = queue.shift()
      if (cur.x === b.x && cur.y === b.y) return cur.path

      DIRS.forEach(([dx, dy], d) => {
        const turns = cur.turns + (d === cur.d ? 0 : 1)
        if (turns > 2) return
        const nx = cur.x + dx
        const ny = cur.y + dy
        if (!passable(nx, ny)) return
        if (best[ny][nx][d] <= turns) return
        best[ny][nx][d] = turns
        const path = d === cur.d ? [...cur.path.slice(0, -1), { x: nx, y: ny }] : [...cur.path, { x: nx, y: ny }]
        queue.push({ x: nx, y: ny, d, turns, path })
      })
    }
    return null
  }

  const findAnyPair = () => {
    const cells = []
    for (let y = 1; y <= ROWS; y++)
      for (let x = 1; x <= COLS; x++) if (val(x, y)) cells.push({ x, y })
    for (let i = 0; i < cells.length; i++)
      for (let j = i + 1; j < cells.length; j++) {
        if (val(cells[i].x, cells[i].y) !== val(cells[j].x, cells[j].y)) continue
        if (findPath(cells[i], cells[j])) return [cells[i], cells[j]]
      }
    return null
  }

  const reset = () => {
    stopTimer()
    clearTimeout(lineTimer)
    layout(buildTiles())
    if (!findAnyPair()) reshuffle()
    selected = null
    left = COLS * ROWS
    seconds = 0
    over = false
    api.setScore(left)
    setLeftHud('0s')
    api.hideOverlay()
    render()
    ticker = setInterval(() => {
      seconds++
      setLeftHud(`${seconds}s`)
    }, 1000)
  }

  const render = () => {
    board.style.setProperty('--on-cols', String(COLS))
    board.style.setProperty('--on-rows', String(ROWS))
    board.innerHTML = ''
    for (let y = 1; y <= ROWS; y++)
      for (let x = 1; x <= COLS; x++) {
        const el = document.createElement('button')
        el.type = 'button'
        el.className = 'on-tile'
        el.dataset.x = String(x)
        el.dataset.y = String(y)
        const v = val(x, y)
        if (!v) el.classList.add('gone')
        else el.textContent = v
        if (selected && selected.x === x && selected.y === y) el.classList.add('sel')
        board.appendChild(el)
      }
  }

  const drawPath = (path) => {
    const rect = board.getBoundingClientRect()
    const cw = rect.width / COLS
    const ch = rect.height / ROWS
    linesEl.setAttribute('viewBox', `0 0 ${rect.width} ${rect.height}`)
    linesEl.style.width = `${rect.width}px`
    linesEl.style.height = `${rect.height}px`
    const pts = path
      .map((p) => `${(p.x - 1 + 0.5) * cw},${(p.y - 1 + 0.5) * ch}`)
      .join(' ')
    linesEl.innerHTML = `<polyline points="${pts}" />`
    clearTimeout(lineTimer)
    lineTimer = setTimeout(() => (linesEl.innerHTML = ''), 400)
  }

  const showHint = () => {
    const pair = findAnyPair()
    if (!pair) return
    const [a, b] = pair
    board
      .querySelector(`[data-x="${a.x}"][data-y="${a.y}"]`)
      ?.classList.add('hint')
    board
      .querySelector(`[data-x="${b.x}"][data-y="${b.y}"]`)
      ?.classList.add('hint')
    setTimeout(() => board.querySelectorAll('.hint').forEach((el) => el.classList.remove('hint')), 1100)
  }

  const onClick = (e) => {
    const el = e.target.closest('.on-tile')
    if (!el || over) return
    const pos = { x: Number(el.dataset.x), y: Number(el.dataset.y) }
    if (!val(pos.x, pos.y)) return

    if (!selected) {
      selected = pos
      render()
      return
    }
    if (selected.x === pos.x && selected.y === pos.y) {
      selected = null
      render()
      return
    }

    const path = findPath(selected, pos)
    if (path) {
      drawPath(path)
      grid[idx(selected.x, selected.y)] = null
      grid[idx(pos.x, pos.y)] = null
      left -= 2
      api.setScore(left)
      selected = null
      render()

      if (left === 0) {
        over = true
        stopTimer()
        cleared++
        api.gameOver('全部消除！', `用时 ${seconds} 秒`, { won: true })
      } else if (!findAnyPair()) {
        reshuffle()
        render()
      }
    } else {
      selected = pos
      render()
    }
  }

  board.addEventListener('click', onClick)
  reset()

  return {
    restart: reset,
    destroy() {
      stopTimer()
      clearTimeout(lineTimer)
      board.removeEventListener('click', onClick)
    },
  }
}
