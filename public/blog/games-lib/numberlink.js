import { shuffle } from './core.js'

// Hand-made boards: each entry lists endpoint pairs for one puzzle.
// Every board is solvable and fills the grid.
const PUZZLES = [
  {
    n: 5,
    pairs: [
      [[0, 0], [4, 1]],
      [[0, 1], [3, 1]],
      [[0, 2], [3, 2]],
      [[0, 4], [3, 3]],
      [[4, 4], [1, 4]],
    ],
  },
  {
    n: 5,
    pairs: [
      [[0, 0], [2, 2]],
      [[1, 0], [4, 3]],
      [[0, 4], [4, 4]],
      [[2, 0], [3, 3]],
    ],
  },
  {
    n: 6,
    pairs: [
      [[0, 0], [5, 0]],
      [[0, 1], [4, 1]],
      [[0, 2], [3, 2]],
      [[0, 3], [2, 3]],
      [[0, 5], [5, 5]],
    ],
  },
  {
    n: 7,
    pairs: [
      [[0, 0], [6, 6]],
      [[6, 0], [0, 6]],
      [[3, 0], [3, 6]],
      [[0, 3], [6, 3]],
      [[1, 1], [5, 5]],
    ],
  },
]

const COLORS = [0, 45, 90, 150, 200, 260, 310]

export function mount(stage, api) {
  const viewport = stage.querySelector('[data-role="viewport"]')
  viewport.innerHTML = '<div class="nl-board"></div>'
  const board = viewport.querySelector('.nl-board')

  let puzzleIdx = 0
  let N = 5
  let endpoints = [] // [{color, a:[x,y], b:[x,y]}]
  let paths = [] // paths[color] = [[x,y], ...]
  let drawing = null // {color, path}
  let solved = 0
  let over = false

  const setPuzzle = api.addHudItem('题目', 1)
  const setDone = api.addHudItem('已连', '0/0')
  api.addHudButton('换一题', () => {
    puzzleIdx = (puzzleIdx + 1) % PUZZLES.length
    load()
  })

  const load = () => {
    const p = PUZZLES[puzzleIdx]
    N = p.n
    endpoints = p.pairs.map((pair, i) => ({ color: i, a: pair[0], b: pair[1] }))
    paths = endpoints.map(() => [])
    drawing = null
    over = false
    api.setScore(solved)
    setPuzzle(puzzleIdx + 1)
    setDone(`0/${endpoints.length}`)
    api.hideOverlay()
    render()
  }

  const reset = () => {
    solved = 0
    puzzleIdx = 0
    load()
  }

  const key = (x, y) => `${x},${y}`

  const endpointAt = (x, y) =>
    endpoints.find(
      (e) => (e.a[0] === x && e.a[1] === y) || (e.b[0] === x && e.b[1] === y)
    )

  const occupantAt = (x, y) => {
    for (let i = 0; i < paths.length; i++) {
      if (paths[i].some(([px, py]) => px === x && py === y)) return i
    }
    return -1
  }

  const isComplete = (i) => {
    const path = paths[i]
    if (path.length < 2) return false
    const e = endpoints[i]
    const first = path[0]
    const last = path[path.length - 1]
    const matches = (p, q) => p[0] === q[0] && p[1] === q[1]
    return (
      (matches(first, e.a) && matches(last, e.b)) ||
      (matches(first, e.b) && matches(last, e.a))
    )
  }

  const completedCount = () => paths.filter((_, i) => isComplete(i)).length

  const allFilled = () => {
    const used = new Set()
    paths.forEach((p) => p.forEach(([x, y]) => used.add(key(x, y))))
    return used.size === N * N
  }

  const checkWin = () => {
    const done = completedCount()
    setDone(`${done}/${endpoints.length}`)
    if (done === endpoints.length && allFilled()) {
      over = true
      solved++
      api.setScore(solved)
      api.gameOver('全部连通！', `第 ${puzzleIdx + 1} 题完成，点「换一题」继续`)
    }
  }

  const render = () => {
    board.style.setProperty('--nl-n', String(N))
    board.innerHTML = ''
    for (let y = 0; y < N; y++)
      for (let x = 0; x < N; x++) {
        const el = document.createElement('div')
        el.className = 'nl-cell'
        el.dataset.x = String(x)
        el.dataset.y = String(y)

        const owner = occupantAt(x, y)
        if (owner >= 0) {
          el.classList.add('used')
          el.style.setProperty('--nl-hue', String(COLORS[owner % COLORS.length]))
          const path = paths[owner]
          const idx = path.findIndex(([px, py]) => px === x && py === y)
          const prev = path[idx - 1]
          const next = path[idx + 1]
          const dirs = []
          for (const nb of [prev, next]) {
            if (!nb) continue
            if (nb[0] === x - 1) dirs.push('w')
            else if (nb[0] === x + 1) dirs.push('e')
            else if (nb[1] === y - 1) dirs.push('n')
            else if (nb[1] === y + 1) dirs.push('s')
          }
          dirs.forEach((d) => el.classList.add(`c-${d}`))
        }

        const ep = endpointAt(x, y)
        if (ep) {
          el.classList.add('endpoint')
          el.style.setProperty('--nl-hue', String(COLORS[ep.color % COLORS.length]))
          if (isComplete(ep.color)) el.classList.add('done')
        }
        board.appendChild(el)
      }
  }

  const cellFrom = (e) => {
    const el = document.elementFromPoint(e.clientX, e.clientY)?.closest?.('.nl-cell')
    if (!el) return null
    return { x: Number(el.dataset.x), y: Number(el.dataset.y) }
  }

  const onDown = (e) => {
    if (over) return
    const c = cellFrom(e)
    if (!c) return
    e.preventDefault()
    const ep = endpointAt(c.x, c.y)
    const owner = occupantAt(c.x, c.y)

    if (ep) {
      // Starting from an endpoint always restarts that color's path
      paths[ep.color] = [[c.x, c.y]]
      drawing = { color: ep.color }
    } else if (owner >= 0) {
      // Grabbing mid-path truncates it there and continues
      const idx = paths[owner].findIndex(([px, py]) => px === c.x && py === c.y)
      paths[owner] = paths[owner].slice(0, idx + 1)
      drawing = { color: owner }
    } else return

    render()
  }

  const onMove = (e) => {
    if (!drawing || over) return
    const c = cellFrom(e)
    if (!c) return
    const path = paths[drawing.color]
    const last = path[path.length - 1]
    if (!last) return
    if (last[0] === c.x && last[1] === c.y) return
    // only orthogonal single steps
    const dist = Math.abs(last[0] - c.x) + Math.abs(last[1] - c.y)
    if (dist !== 1) return

    // stepping back retracts the path
    const prev = path[path.length - 2]
    if (prev && prev[0] === c.x && prev[1] === c.y) {
      path.pop()
      render()
      return
    }

    const owner = occupantAt(c.x, c.y)
    if (owner >= 0 && owner !== drawing.color) {
      // crossing another color trims that one
      const idx = paths[owner].findIndex(([px, py]) => px === c.x && py === c.y)
      paths[owner] = paths[owner].slice(0, idx)
    }
    const ep = endpointAt(c.x, c.y)
    if (ep && ep.color !== drawing.color) return

    path.push([c.x, c.y])
    render()

    if (ep && ep.color === drawing.color && path.length > 1) {
      drawing = null
      checkWin()
    }
  }

  const onUp = () => {
    if (!drawing) return
    drawing = null
    render()
    checkWin()
  }

  board.addEventListener('pointerdown', onDown)
  window.addEventListener('pointermove', onMove)
  window.addEventListener('pointerup', onUp)
  reset()

  return {
    restart: () => load(),
    destroy() {
      board.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
    },
  }
}
