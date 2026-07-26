// Classic "Heng Dao Li Ma" layout on a 4x5 board.
// Goal: slide Cao Cao (the 2x2 block) down to the bottom exit.
const LAYOUT = [
  { id: 'cao', name: '曹操', x: 1, y: 0, w: 2, h: 2, kind: 'boss' },
  { id: 'zhang', name: '张飞', x: 0, y: 0, w: 1, h: 2, kind: 'tall' },
  { id: 'zhao', name: '赵云', x: 3, y: 0, w: 1, h: 2, kind: 'tall' },
  { id: 'ma', name: '马超', x: 0, y: 2, w: 1, h: 2, kind: 'tall' },
  { id: 'huang', name: '黄忠', x: 3, y: 2, w: 1, h: 2, kind: 'tall' },
  { id: 'guan', name: '关羽', x: 1, y: 2, w: 2, h: 1, kind: 'wide' },
  { id: 's1', name: '兵', x: 0, y: 4, w: 1, h: 1, kind: 'small' },
  { id: 's2', name: '兵', x: 1, y: 3, w: 1, h: 1, kind: 'small' },
  { id: 's3', name: '兵', x: 2, y: 3, w: 1, h: 1, kind: 'small' },
  { id: 's4', name: '兵', x: 3, y: 4, w: 1, h: 1, kind: 'small' },
]

const COLS = 4
const ROWS = 5

export function mount(stage, api) {
  const viewport = stage.querySelector('[data-role="viewport"]')
  viewport.innerHTML = '<div class="kl-board"></div>'
  const board = viewport.querySelector('.kl-board')

  let pieces = []
  let steps = 0
  let selected = null
  let over = false

  const occupancy = (exclude) => {
    const grid = Array.from({ length: ROWS }, () => Array(COLS).fill(null))
    for (const p of pieces) {
      if (p.id === exclude) continue
      for (let dy = 0; dy < p.h; dy++)
        for (let dx = 0; dx < p.w; dx++) grid[p.y + dy][p.x + dx] = p.id
    }
    return grid
  }

  const canMove = (p, dx, dy) => {
    const nx = p.x + dx
    const ny = p.y + dy
    if (nx < 0 || ny < 0 || nx + p.w > COLS || ny + p.h > ROWS) return false
    const grid = occupancy(p.id)
    for (let y = 0; y < p.h; y++)
      for (let x = 0; x < p.w; x++) {
        if (grid[ny + y][nx + x]) return false
      }
    return true
  }

  const reset = () => {
    pieces = LAYOUT.map((p) => ({ ...p }))
    steps = 0
    selected = null
    over = false
    api.setScore(0)
    api.hideOverlay()
    render()
  }

  const render = () => {
    board.innerHTML = ''
    for (const p of pieces) {
      const el = document.createElement('button')
      el.type = 'button'
      el.className = `kl-piece ${p.kind}` + (selected === p.id ? ' sel' : '')
      el.dataset.id = p.id
      el.textContent = p.name
      el.style.left = `${(p.x / COLS) * 100}%`
      el.style.top = `${(p.y / ROWS) * 100}%`
      el.style.width = `${(p.w / COLS) * 100}%`
      el.style.height = `${(p.h / ROWS) * 100}%`
      board.appendChild(el)
    }
    const exit = document.createElement('div')
    exit.className = 'kl-exit'
    board.appendChild(exit)
  }

  const tryMove = (p, dx, dy) => {
    if (!canMove(p, dx, dy)) return false
    p.x += dx
    p.y += dy
    steps++
    api.setScore(steps)
    render()
    const cao = pieces.find((q) => q.id === 'cao')
    if (cao.x === 1 && cao.y === 3) {
      over = true
      api.gameOver('曹操逃出来了！', `${steps} 步过关`)
    }
    return true
  }

  const onClick = (e) => {
    if (over) return
    const el = e.target.closest('.kl-piece')
    if (!el) {
      selected = null
      render()
      return
    }
    const id = el.dataset.id
    const p = pieces.find((q) => q.id === id)

    if (selected === id) {
      // Second click on the same piece: slide it to its only free direction
      const dirs = [[0, 1], [0, -1], [-1, 0], [1, 0]].filter(([dx, dy]) => canMove(p, dx, dy))
      if (dirs.length === 1) tryMove(p, dirs[0][0], dirs[0][1])
      return
    }
    selected = id
    render()
  }

  // Drag / swipe a selected piece in a direction
  let startPos = null
  const onDown = (e) => {
    const el = e.target.closest('.kl-piece')
    if (!el) return
    startPos = { x: e.clientX, y: e.clientY, id: el.dataset.id }
  }
  const onUp = (e) => {
    if (!startPos || over) {
      startPos = null
      return
    }
    const dx = e.clientX - startPos.x
    const dy = e.clientY - startPos.y
    const p = pieces.find((q) => q.id === startPos.id)
    startPos = null
    if (!p) return
    if (Math.abs(dx) < 18 && Math.abs(dy) < 18) return
    if (Math.abs(dx) > Math.abs(dy)) tryMove(p, dx > 0 ? 1 : -1, 0)
    else tryMove(p, 0, dy > 0 ? 1 : -1)
  }

  const onKey = (e) => {
    if (over || !selected) return
    const map = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] }
    const d = map[e.key]
    if (!d) return
    e.preventDefault()
    tryMove(pieces.find((q) => q.id === selected), d[0], d[1])
  }

  board.addEventListener('click', onClick)
  board.addEventListener('pointerdown', onDown)
  window.addEventListener('pointerup', onUp)
  window.addEventListener('keydown', onKey)
  reset()

  return {
    restart: reset,
    destroy() {
      board.removeEventListener('click', onClick)
      board.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('keydown', onKey)
    },
  }
}
