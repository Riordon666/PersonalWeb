import { KEY_DIR, onSwipe } from './core.js'

// # wall, . goal, $ box, * box on goal, @ player, + player on goal
const LEVELS = [
  [
    '  #####',
    '###   #',
    '#.@$  #',
    '### $.#',
    '#.##$ #',
    '# # . ##',
    '#$ *$$.#',
    '#   .  #',
    '########',
  ],
  [
    '############',
    '#..  #     #',
    '#..  # $  ##',
    '#..  #$  ##',
    '#..    $ #',
    '#..  # $ #',
    '#..  #$  #',
    '#    #   #',
    '##########',
  ],
  [
    '########',
    '#     ##',
    '# $$   #',
    '# $ #  #',
    '#. .#@ #',
    '#..    #',
    '########',
  ],
  [
    '  ####  ',
    '###  ###',
    '#     .#',
    '# $$$ .#',
    '#.@   .#',
    '########',
  ],
  [
    '#########',
    '#       #',
    '# $#$#$ #',
    '# ..@.. #',
    '#   #   #',
    '#########',
  ],
]

export function mount(stage, api) {
  const viewport = stage.querySelector('[data-role="viewport"]')
  viewport.innerHTML = '<div class="sk-board"></div>'
  const board = viewport.querySelector('.sk-board')

  let level = 0
  let grid = []
  let goals = new Set()
  let player = { x: 0, y: 0 }
  let steps = 0
  let cleared = 0
  let history = []
  let over = false
  let cols = 0
  let rows = 0

  const setLevelHud = api.addHudItem('关卡', 1)
  const setBoxes = api.addHudItem('归位', '0/0')
  api.addHudButton('撤销', () => undo())
  const nextBtn = api.addHudButton('下一关', () => {
    level = (level + 1) % LEVELS.length
    load()
  })

  const load = () => {
    const raw = LEVELS[level]
    rows = raw.length
    cols = Math.max(...raw.map((r) => r.length))
    grid = []
    goals = new Set()
    for (let y = 0; y < rows; y++) {
      const row = []
      for (let x = 0; x < cols; x++) {
        const ch = raw[y][x] || ' '
        if (ch === '.' || ch === '*' || ch === '+') goals.add(`${x},${y}`)
        if (ch === '@' || ch === '+') player = { x, y }
        row.push(ch === '#' ? '#' : ch === '$' || ch === '*' ? '$' : ' ')
      }
      grid.push(row)
    }
    steps = 0
    history = []
    over = false
    api.setScore(0)
    setLevelHud(level + 1)
    updateBoxHud()
    api.hideOverlay()
    render()
  }

  const reset = () => {
    cleared = 0
    level = 0
    load()
  }

  const boxesOnGoal = () => {
    let n = 0
    for (let y = 0; y < rows; y++)
      for (let x = 0; x < cols; x++) {
        if (grid[y][x] === '$' && goals.has(`${x},${y}`)) n++
      }
    return n
  }

  const totalBoxes = () => {
    let n = 0
    for (const row of grid) for (const c of row) if (c === '$') n++
    return n
  }

  const updateBoxHud = () => setBoxes(`${boxesOnGoal()}/${totalBoxes()}`)

  const render = () => {
    board.style.setProperty('--sk-cols', String(cols))
    board.style.setProperty('--sk-rows', String(rows))
    board.innerHTML = ''
    for (let y = 0; y < rows; y++)
      for (let x = 0; x < cols; x++) {
        const el = document.createElement('div')
        const ch = grid[y][x]
        const isGoal = goals.has(`${x},${y}`)
        el.className = 'sk-cell'
        if (ch === '#') el.classList.add('wall')
        else {
          el.classList.add('floor')
          if (isGoal) el.classList.add('goal')
          if (ch === '$') el.classList.add(isGoal ? 'box-done' : 'box')
          if (player.x === x && player.y === y) el.classList.add('player')
        }
        board.appendChild(el)
      }
  }

  const at = (x, y) => (grid[y] && grid[y][x]) || '#'

  const move = (dir) => {
    if (over) return
    const [dx, dy] = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[dir]
    const nx = player.x + dx
    const ny = player.y + dy
    const target = at(nx, ny)
    if (target === '#') return

    const snapshot = { grid: grid.map((r) => r.slice()), player: { ...player }, steps }

    if (target === '$') {
      const bx = nx + dx
      const by = ny + dy
      if (at(bx, by) !== ' ') return
      grid[ny][nx] = ' '
      grid[by][bx] = '$'
    }
    player = { x: nx, y: ny }
    steps++
    history.push(snapshot)
    if (history.length > 200) history.shift()
    api.setScore(steps)
    updateBoxHud()
    render()

    if (boxesOnGoal() === totalBoxes()) {
      over = true
      cleared++
      api.setScore(cleared)
      api.gameOver('通关！', `第 ${level + 1} 关用了 ${steps} 步 · 点「下一关」继续`)
    }
  }

  const undo = () => {
    const prev = history.pop()
    if (!prev) return
    grid = prev.grid
    player = prev.player
    steps = prev.steps
    over = false
    api.hideOverlay()
    api.setScore(steps)
    updateBoxHud()
    render()
  }

  const onKey = (e) => {
    const d = KEY_DIR[e.key]
    if (d) {
      e.preventDefault()
      move(d)
    } else if (e.key === 'z' || e.key === 'Z') {
      undo()
    }
  }

  const offSwipe = onSwipe(viewport, move)
  window.addEventListener('keydown', onKey)
  reset()

  return {
    restart: () => load(),
    destroy() {
      window.removeEventListener('keydown', onKey)
      offSwipe()
    },
  }
}
