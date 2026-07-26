import { themeHsl, onSwipe, KEY_DIR } from './core.js'

export function mount(stage, api) {
  const viewport = stage.querySelector('[data-role="viewport"]')
  viewport.innerHTML = '<div class="g2048-board"></div>'
  const board = viewport.querySelector('.g2048-board')

  const SIZE = 4
  let grid = []
  let score = 0
  let over = false

  const empty = () => {
    const out = []
    for (let r = 0; r < SIZE; r++)
      for (let c = 0; c < SIZE; c++) if (!grid[r][c]) out.push({ r, c })
    return out
  }

  const addTile = () => {
    const spots = empty()
    if (!spots.length) return
    const { r, c } = spots[Math.floor(Math.random() * spots.length)]
    grid[r][c] = Math.random() < 0.9 ? 2 : 4
  }

  const reset = () => {
    grid = Array.from({ length: SIZE }, () => Array(SIZE).fill(0))
    score = 0
    over = false
    addTile()
    addTile()
    api.setScore(0)
    api.hideOverlay()
    render()
  }

  const render = () => {
    board.innerHTML = ''
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        const v = grid[r][c]
        const tile = document.createElement('div')
        tile.className = 'g2048-tile' + (v ? ' filled' : '')
        if (v) {
          tile.textContent = String(v)
          const rank = Math.log2(v) - 1
          tile.style.background = themeHsl(stage, {
            shift: rank * 12,
            s: Math.min(85, 45 + rank * 6),
            l: Math.max(38, 74 - rank * 5),
          })
          tile.style.color = rank > 3 ? '#fff' : 'rgba(0,0,0,0.72)'
          tile.style.fontSize = v >= 1024 ? '1.35rem' : v >= 128 ? '1.6rem' : '1.9rem'
        }
        board.appendChild(tile)
      }
    }
  }

  const slide = (row) => {
    const vals = row.filter(Boolean)
    const out = []
    for (let i = 0; i < vals.length; i++) {
      if (vals[i] === vals[i + 1]) {
        out.push(vals[i] * 2)
        score += vals[i] * 2
        i++
      } else {
        out.push(vals[i])
      }
    }
    while (out.length < SIZE) out.push(0)
    return out
  }

  const rotate = (g) => g[0].map((_, c) => g.map((row) => row[c]).reverse())

  const move = (dir) => {
    if (over) return
    const before = JSON.stringify(grid)
    // rotate() turns the grid clockwise, which maps "down" (not "up")
    // onto the leftward slide after one turn
    let times = { left: 0, down: 1, right: 2, up: 3 }[dir]
    for (let i = 0; i < times; i++) grid = rotate(grid)
    grid = grid.map(slide)
    for (let i = 0; i < (4 - times) % 4; i++) grid = rotate(grid)

    if (JSON.stringify(grid) === before) return
    addTile()
    api.setScore(score)
    render()

    if (grid.some((row) => row.includes(2048)) && !over) {
      over = true
      api.gameOver('2048！', `拼出来了，得分 ${score}`)
      return
    }
    if (!canMove()) {
      over = true
      api.gameOver('没有可走的了', `最终得分 ${score}`)
    }
  }

  const canMove = () => {
    if (empty().length) return true
    for (let r = 0; r < SIZE; r++)
      for (let c = 0; c < SIZE; c++) {
        if (c + 1 < SIZE && grid[r][c] === grid[r][c + 1]) return true
        if (r + 1 < SIZE && grid[r][c] === grid[r + 1][c]) return true
      }
    return false
  }

  const onKey = (e) => {
    const d = KEY_DIR[e.key]
    if (!d) return
    e.preventDefault()
    move(d)
  }

  const offSwipe = onSwipe(viewport, move)
  window.addEventListener('keydown', onKey)
  reset()

  return {
    restart: reset,
    destroy() {
      window.removeEventListener('keydown', onKey)
      offSwipe()
    },
  }
}
