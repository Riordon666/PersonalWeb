import { randInt } from './core.js'

const N = 8
const KINDS = 6
const MOVES = 25

export function mount(stage, api) {
  const viewport = stage.querySelector('[data-role="viewport"]')
  viewport.innerHTML = '<div class="m3-board"></div>'
  const board = viewport.querySelector('.m3-board')

  let grid = []
  let score = 0
  let movesLeft = MOVES
  let selected = null
  let busy = false
  let over = false
  let timers = []

  const setMoves = api.addHudItem('剩余步数', MOVES)
  const setCombo = api.addHudItem('连锁', 0)

  const later = (fn, ms) => {
    const t = setTimeout(fn, ms)
    timers.push(t)
    return t
  }
  const clearTimers = () => {
    timers.forEach(clearTimeout)
    timers = []
  }

  const at = (x, y) => (grid[y] && grid[y][x] !== undefined ? grid[y][x] : -1)

  const findMatches = () => {
    const hits = new Set()
    for (let y = 0; y < N; y++)
      for (let x = 0; x < N - 2; x++) {
        const v = at(x, y)
        if (v >= 0 && v === at(x + 1, y) && v === at(x + 2, y)) {
          let k = x
          while (at(k, y) === v) hits.add(`${k++},${y}`)
        }
      }
    for (let x = 0; x < N; x++)
      for (let y = 0; y < N - 2; y++) {
        const v = at(x, y)
        if (v >= 0 && v === at(x, y + 1) && v === at(x, y + 2)) {
          let k = y
          while (at(x, k) === v) hits.add(`${x},${k++}`)
        }
      }
    return hits
  }

  const fillBoard = () => {
    grid = Array.from({ length: N }, () => Array.from({ length: N }, () => randInt(0, KINDS - 1)))
    // Re-roll until the opening board has no freebies but does have a move
    let guard = 0
    while ((findMatches().size || !hasMove()) && guard++ < 200) {
      grid = Array.from({ length: N }, () => Array.from({ length: N }, () => randInt(0, KINDS - 1)))
    }
  }

  const swap = (a, b) => {
    const tmp = grid[a.y][a.x]
    grid[a.y][a.x] = grid[b.y][b.x]
    grid[b.y][b.x] = tmp
  }

  const hasMove = () => {
    for (let y = 0; y < N; y++)
      for (let x = 0; x < N; x++) {
        for (const [dx, dy] of [[1, 0], [0, 1]]) {
          const nx = x + dx
          const ny = y + dy
          if (nx >= N || ny >= N) continue
          swap({ x, y }, { x: nx, y: ny })
          const found = findMatches().size > 0
          swap({ x, y }, { x: nx, y: ny })
          if (found) return true
        }
      }
    return false
  }

  const reset = () => {
    clearTimers()
    fillBoard()
    score = 0
    movesLeft = MOVES
    selected = null
    busy = false
    over = false
    api.setScore(0)
    setMoves(MOVES)
    setCombo(0)
    api.hideOverlay()
    render()
  }

  const render = (popping = new Set()) => {
    board.innerHTML = ''
    for (let y = 0; y < N; y++)
      for (let x = 0; x < N; x++) {
        const el = document.createElement('button')
        el.type = 'button'
        el.className = 'm3-gem'
        el.dataset.x = String(x)
        el.dataset.y = String(y)
        const v = grid[y][x]
        if (v < 0) el.classList.add('empty')
        else {
          el.style.setProperty('--gem-hue', String(v * 58))
          el.dataset.kind = String(v)
        }
        if (selected && selected.x === x && selected.y === y) el.classList.add('sel')
        if (popping.has(`${x},${y}`)) el.classList.add('pop')
        board.appendChild(el)
      }
  }

  const collapse = () => {
    for (let x = 0; x < N; x++) {
      const column = []
      for (let y = N - 1; y >= 0; y--) {
        if (grid[y][x] >= 0) column.push(grid[y][x])
      }
      for (let y = N - 1, i = 0; y >= 0; y--, i++) {
        grid[y][x] = i < column.length ? column[i] : randInt(0, KINDS - 1)
      }
    }
  }

  const resolve = (chain = 0) => {
    const hits = findMatches()
    if (!hits.size) {
      setCombo(0)
      busy = false
      if (movesLeft <= 0) {
        over = true
        api.gameOver('步数用完', `得分 ${score}`)
      } else if (!hasMove()) {
        // Reshuffle instead of dead-ending the player
        fillBoard()
        render()
      }
      return
    }

    setCombo(chain + 1)
    score += hits.size * 10 * (chain + 1)
    api.setScore(score)
    render(hits)

    later(() => {
      hits.forEach((k) => {
        const [x, y] = k.split(',').map(Number)
        grid[y][x] = -1
      })
      render()
      later(() => {
        collapse()
        render()
        later(() => resolve(chain + 1), 130)
      }, 110)
    }, 190)
  }

  const trySwap = (a, b) => {
    if (busy || over) return
    const adjacent = Math.abs(a.x - b.x) + Math.abs(a.y - b.y) === 1
    if (!adjacent) {
      selected = b
      render()
      return
    }
    busy = true
    swap(a, b)
    if (!findMatches().size) {
      // illegal swap: bounce back
      swap(a, b)
      selected = null
      render()
      board.classList.add('shake')
      later(() => board.classList.remove('shake'), 300)
      busy = false
      return
    }
    movesLeft--
    setMoves(movesLeft)
    selected = null
    render()
    later(() => resolve(0), 120)
  }

  const onClick = (e) => {
    const el = e.target.closest('.m3-gem')
    if (!el || busy || over) return
    const pos = { x: Number(el.dataset.x), y: Number(el.dataset.y) }
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
    trySwap(selected, pos)
  }

  board.addEventListener('click', onClick)
  reset()

  return {
    restart: reset,
    destroy() {
      clearTimers()
      board.removeEventListener('click', onClick)
    },
  }
}
