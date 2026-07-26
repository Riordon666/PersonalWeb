import { randInt } from './core.js'

const N = 5

export function mount(stage, api) {
  const viewport = stage.querySelector('[data-role="viewport"]')
  viewport.innerHTML = '<div class="lo-board"></div>'
  const board = viewport.querySelector('.lo-board')

  let grid = []
  let steps = 0
  let over = false
  let shuffleCount = 6

  const setLit = api.addHudItem('亮灯', 0)
  const diffBtn = api.addHudButton(`难度 ${shuffleCount}`, () => {
    shuffleCount = shuffleCount >= 14 ? 4 : shuffleCount + 2
    diffBtn.textContent = `难度 ${shuffleCount}`
    reset()
  })

  const toggle = (g, x, y) => {
    const flip = (cx, cy) => {
      if (cx >= 0 && cy >= 0 && cx < N && cy < N) g[cy][cx] = !g[cy][cx]
    }
    flip(x, y)
    flip(x - 1, y)
    flip(x + 1, y)
    flip(x, y - 1)
    flip(x, y + 1)
  }

  const litCount = () => grid.flat().filter(Boolean).length

  const reset = () => {
    grid = Array.from({ length: N }, () => Array(N).fill(false))
    // Shuffling by applying legal moves guarantees the board is solvable
    const used = new Set()
    while (used.size < shuffleCount) {
      const x = randInt(0, N - 1)
      const y = randInt(0, N - 1)
      const key = `${x},${y}`
      if (used.has(key)) continue
      used.add(key)
      toggle(grid, x, y)
    }
    if (litCount() === 0) return reset()
    steps = 0
    over = false
    api.setScore(0)
    setLit(litCount())
    api.hideOverlay()
    render()
  }

  const render = () => {
    board.innerHTML = ''
    for (let y = 0; y < N; y++)
      for (let x = 0; x < N; x++) {
        const el = document.createElement('button')
        el.type = 'button'
        el.className = 'lo-cell' + (grid[y][x] ? ' on' : '')
        el.dataset.x = String(x)
        el.dataset.y = String(y)
        board.appendChild(el)
      }
  }

  const onClick = (e) => {
    if (over) return
    const el = e.target.closest('.lo-cell')
    if (!el) return
    toggle(grid, Number(el.dataset.x), Number(el.dataset.y))
    steps++
    api.setScore(steps)
    setLit(litCount())
    render()
    if (litCount() === 0) {
      over = true
      api.gameOver('全部熄灭！', `${steps} 步完成（难度 ${shuffleCount}）`)
    }
  }

  board.addEventListener('click', onClick)
  reset()

  return {
    restart: reset,
    destroy() {
      board.removeEventListener('click', onClick)
    },
  }
}
