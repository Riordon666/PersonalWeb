import { randInt } from './core.js'

const SIZES = [5, 10, 15]

export function mount(stage, api) {
  const viewport = stage.querySelector('[data-role="viewport"]')
  viewport.innerHTML = '<div class="ng-wrap"><div class="ng-grid"></div></div>'
  const wrap = viewport.querySelector('.ng-wrap')
  const gridEl = viewport.querySelector('.ng-grid')

  let N = 10
  let solution = []
  let marks = [] // 0 blank, 1 filled, 2 crossed
  let rowClues = []
  let colClues = []
  let seconds = 0
  let ticker = 0
  let over = false
  let painting = null

  const setLeft = api.addHudItem('剩余格', 0)
  const sizeBtn = api.addHudButton(`${N}×${N}`, () => {
    N = SIZES[(SIZES.indexOf(N) + 1) % SIZES.length]
    sizeBtn.textContent = `${N}×${N}`
    reset()
  })

  const stopTimer = () => {
    clearInterval(ticker)
    ticker = 0
  }

  const cluesOf = (line) => {
    const out = []
    let run = 0
    for (const v of line) {
      if (v) run++
      else if (run) {
        out.push(run)
        run = 0
      }
    }
    if (run) out.push(run)
    return out.length ? out : [0]
  }

  const generate = () => {
    // Bias toward connected shapes so puzzles look like pictures
    solution = Array.from({ length: N }, () => Array(N).fill(0))
    const blobs = Math.max(2, Math.round(N / 2.5))
    for (let b = 0; b < blobs; b++) {
      let x = randInt(0, N - 1)
      let y = randInt(0, N - 1)
      const len = randInt(N, N * 2.2)
      for (let i = 0; i < len; i++) {
        solution[y][x] = 1
        const dir = randInt(0, 3)
        if (dir === 0 && y > 0) y--
        else if (dir === 1 && y < N - 1) y++
        else if (dir === 2 && x > 0) x--
        else if (x < N - 1) x++
      }
    }
    // Guard against an empty or completely full board
    const filled = solution.flat().filter(Boolean).length
    if (filled < N || filled > N * N - N) return generate()

    rowClues = solution.map(cluesOf)
    colClues = []
    for (let c = 0; c < N; c++) colClues.push(cluesOf(solution.map((r) => r[c])))
  }

  const remaining = () =>
    solution.flat().filter(Boolean).length -
    solution.flat().filter((v, i) => v && marks[Math.floor(i / N)][i % N] === 1).length

  const reset = () => {
    stopTimer()
    generate()
    marks = Array.from({ length: N }, () => Array(N).fill(0))
    seconds = 0
    over = false
    api.setScore(0)
    setLeft(remaining())
    api.hideOverlay()
    render()
    ticker = setInterval(() => {
      seconds++
      api.setScore(seconds)
    }, 1000)
  }

  const maxRowClues = () => Math.max(...rowClues.map((c) => c.length))
  const maxColClues = () => Math.max(...colClues.map((c) => c.length))

  const render = () => {
    const rc = maxRowClues()
    const cc = maxColClues()
    gridEl.style.setProperty('--ng-n', String(N))
    gridEl.style.setProperty('--ng-rc', String(rc))
    gridEl.style.setProperty('--ng-cc', String(cc))
    gridEl.innerHTML = ''

    // corner
    const corner = document.createElement('div')
    corner.className = 'ng-corner'
    corner.style.gridArea = `1 / 1 / span ${cc} / span ${rc}`
    gridEl.appendChild(corner)

    // column clues
    for (let c = 0; c < N; c++) {
      const el = document.createElement('div')
      el.className = 'ng-clue col'
      el.style.gridArea = `1 / ${rc + c + 1} / span ${cc} / span 1`
      el.innerHTML = colClues[c].map((v) => `<i>${v}</i>`).join('')
      gridEl.appendChild(el)
    }
    // row clues
    for (let r = 0; r < N; r++) {
      const el = document.createElement('div')
      el.className = 'ng-clue row'
      el.style.gridArea = `${cc + r + 1} / 1 / span 1 / span ${rc}`
      el.innerHTML = rowClues[r].map((v) => `<i>${v}</i>`).join('')
      gridEl.appendChild(el)
    }
    // cells
    for (let r = 0; r < N; r++)
      for (let c = 0; c < N; c++) {
        const el = document.createElement('button')
        el.type = 'button'
        el.className = 'ng-cell'
        if (marks[r][c] === 1) el.classList.add('fill')
        if (marks[r][c] === 2) el.classList.add('cross')
        if (c % 5 === 4 && c !== N - 1) el.classList.add('br')
        if (r % 5 === 4 && r !== N - 1) el.classList.add('bb')
        el.dataset.r = String(r)
        el.dataset.c = String(c)
        el.style.gridArea = `${cc + r + 1} / ${rc + c + 1} / span 1 / span 1`
        gridEl.appendChild(el)
      }
  }

  const checkWin = () => {
    for (let r = 0; r < N; r++)
      for (let c = 0; c < N; c++) {
        if (solution[r][c] === 1 && marks[r][c] !== 1) return false
        if (solution[r][c] === 0 && marks[r][c] === 1) return false
      }
    return true
  }

  const apply = (r, c, value) => {
    if (over || marks[r][c] === value) return
    marks[r][c] = value
    setLeft(remaining())
    render()
    if (checkWin()) {
      over = true
      stopTimer()
      api.gameOver('画出来了！', `${N}×${N} 用时 ${seconds} 秒`)
    }
  }

  const onDown = (e) => {
    const el = e.target.closest('.ng-cell')
    if (!el || over) return
    e.preventDefault()
    const r = Number(el.dataset.r)
    const c = Number(el.dataset.c)
    const isRight = e.button === 2
    const cur = marks[r][c]
    // Drag paints whichever state the first cell flips to
    painting = isRight ? (cur === 2 ? 0 : 2) : cur === 1 ? 0 : 1
    apply(r, c, painting)
  }
  const onMove = (e) => {
    if (painting === null || over) return
    const el = document.elementFromPoint(e.clientX, e.clientY)?.closest?.('.ng-cell')
    if (!el) return
    apply(Number(el.dataset.r), Number(el.dataset.c), painting)
  }
  const onUp = () => {
    painting = null
  }
  const onContext = (e) => {
    if (e.target.closest('.ng-cell')) e.preventDefault()
  }

  gridEl.addEventListener('pointerdown', onDown)
  window.addEventListener('pointermove', onMove)
  window.addEventListener('pointerup', onUp)
  gridEl.addEventListener('contextmenu', onContext)
  reset()

  return {
    restart: reset,
    destroy() {
      stopTimer()
      gridEl.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      gridEl.removeEventListener('contextmenu', onContext)
    },
  }
}
