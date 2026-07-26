import { shuffle } from './core.js'

const LEVELS = { easy: { holes: 40, label: '简单' }, mid: { holes: 50, label: '中等' }, hard: { holes: 56, label: '困难' } }
const ORDER = ['easy', 'mid', 'hard']

export function mount(stage, api) {
  const viewport = stage.querySelector('[data-role="viewport"]')
  viewport.innerHTML = `
    <div class="su-wrap">
      <div class="su-board"></div>
      <div class="su-pad">
        ${[1, 2, 3, 4, 5, 6, 7, 8, 9]
          .map((d) => `<button class="su-key" type="button" data-d="${d}">${d}</button>`)
          .join('')}
        <button class="su-key" type="button" data-act="erase">⌫</button>
        <button class="su-key toggle" type="button" data-act="note">候选</button>
      </div>
    </div>
  `
  const boardEl = viewport.querySelector('.su-board')
  const padEl = viewport.querySelector('.su-pad')

  let solution = []
  let puzzle = []
  let given = []
  let notes = []
  let selected = null
  let noteMode = false
  let levelKey = 'easy'
  let seconds = 0
  let ticker = 0
  let over = false

  const setMistakes = api.addHudItem('错误', 0)
  let mistakes = 0
  const diffBtn = api.addHudButton(LEVELS[levelKey].label, () => {
    levelKey = ORDER[(ORDER.indexOf(levelKey) + 1) % ORDER.length]
    diffBtn.textContent = LEVELS[levelKey].label
    reset()
  })

  const stopTimer = () => {
    clearInterval(ticker)
    ticker = 0
  }

  const boxIndex = (r, c) => Math.floor(r / 3) * 3 + Math.floor(c / 3)

  const canPlace = (g, r, c, v) => {
    for (let i = 0; i < 9; i++) {
      if (g[r][i] === v || g[i][c] === v) return false
    }
    const br = Math.floor(r / 3) * 3
    const bc = Math.floor(c / 3) * 3
    for (let i = 0; i < 3; i++)
      for (let j = 0; j < 3; j++) if (g[br + i][bc + j] === v) return false
    return true
  }

  const fill = (g) => {
    for (let r = 0; r < 9; r++)
      for (let c = 0; c < 9; c++) {
        if (g[r][c]) continue
        for (const v of shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9])) {
          if (canPlace(g, r, c, v)) {
            g[r][c] = v
            if (fill(g)) return true
            g[r][c] = 0
          }
        }
        return false
      }
    return true
  }

  // Count solutions up to a cap, to guarantee the dug puzzle stays unique
  const countSolutions = (g, cap = 2) => {
    for (let r = 0; r < 9; r++)
      for (let c = 0; c < 9; c++) {
        if (g[r][c]) continue
        let total = 0
        for (let v = 1; v <= 9; v++) {
          if (!canPlace(g, r, c, v)) continue
          g[r][c] = v
          total += countSolutions(g, cap - total)
          g[r][c] = 0
          if (total >= cap) return total
        }
        return total
      }
    return 1
  }

  const generate = () => {
    const full = Array.from({ length: 9 }, () => Array(9).fill(0))
    fill(full)
    solution = full.map((row) => row.slice())

    const work = full.map((row) => row.slice())
    let holes = 0
    const target = LEVELS[levelKey].holes
    for (const idx of shuffle([...Array(81).keys()])) {
      if (holes >= target) break
      const r = Math.floor(idx / 9)
      const c = idx % 9
      if (!work[r][c]) continue
      const backup = work[r][c]
      work[r][c] = 0
      if (countSolutions(work.map((row) => row.slice())) !== 1) {
        work[r][c] = backup
      } else {
        holes++
      }
    }
    puzzle = work.map((row) => row.slice())
    given = work.map((row) => row.map((v) => v !== 0))
    notes = Array.from({ length: 9 }, () => Array.from({ length: 9 }, () => new Set()))
  }

  const reset = () => {
    stopTimer()
    boardEl.innerHTML = '<div class="su-loading">生成中…</div>'
    // Generation is synchronous but can take a moment; yield so the
    // placeholder actually paints first
    setTimeout(() => {
      generate()
      selected = null
      mistakes = 0
      seconds = 0
      over = false
      noteMode = false
      padEl.querySelector('[data-act="note"]').classList.remove('on')
      api.setScore(0)
      setMistakes(0)
      api.hideOverlay()
      render()
      ticker = setInterval(() => {
        seconds++
        api.setScore(seconds)
      }, 1000)
    }, 20)
  }

  const conflictsAt = (r, c) => {
    const v = puzzle[r][c]
    if (!v) return false
    for (let i = 0; i < 9; i++) {
      if (i !== c && puzzle[r][i] === v) return true
      if (i !== r && puzzle[i][c] === v) return true
    }
    const br = Math.floor(r / 3) * 3
    const bc = Math.floor(c / 3) * 3
    for (let i = 0; i < 3; i++)
      for (let j = 0; j < 3; j++) {
        const rr = br + i
        const cc = bc + j
        if ((rr !== r || cc !== c) && puzzle[rr][cc] === v) return true
      }
    return false
  }

  const render = () => {
    boardEl.innerHTML = ''
    const selVal = selected ? puzzle[selected.r][selected.c] : 0
    for (let r = 0; r < 9; r++)
      for (let c = 0; c < 9; c++) {
        const el = document.createElement('button')
        el.type = 'button'
        el.className = 'su-cell'
        el.dataset.r = String(r)
        el.dataset.c = String(c)
        if (c % 3 === 2 && c !== 8) el.classList.add('br')
        if (r % 3 === 2 && r !== 8) el.classList.add('bb')
        if (given[r][c]) el.classList.add('given')
        if (selected && selected.r === r && selected.c === c) el.classList.add('sel')
        else if (
          selected &&
          (selected.r === r || selected.c === c || boxIndex(r, c) === boxIndex(selected.r, selected.c))
        ) {
          el.classList.add('peer')
        }
        const v = puzzle[r][c]
        if (v) {
          if (selVal && v === selVal) el.classList.add('same')
          if (conflictsAt(r, c)) el.classList.add('bad')
          el.textContent = String(v)
        } else if (notes[r][c].size) {
          el.classList.add('has-notes')
          el.innerHTML = `<span class="su-notes">${[...Array(9).keys()]
            .map((i) => `<i>${notes[r][c].has(i + 1) ? i + 1 : ''}</i>`)
            .join('')}</span>`
        }
        boardEl.appendChild(el)
      }
  }

  const checkWin = () => {
    for (let r = 0; r < 9; r++)
      for (let c = 0; c < 9; c++) if (puzzle[r][c] !== solution[r][c]) return false
    return true
  }

  const place = (d) => {
    if (!selected || over) return
    const { r, c } = selected
    if (given[r][c]) return

    if (noteMode && d) {
      if (notes[r][c].has(d)) notes[r][c].delete(d)
      else notes[r][c].add(d)
      render()
      return
    }

    if (!d) {
      puzzle[r][c] = 0
      notes[r][c].clear()
      render()
      return
    }

    puzzle[r][c] = d
    notes[r][c].clear()
    if (d !== solution[r][c]) {
      mistakes++
      setMistakes(mistakes)
    }
    render()

    if (checkWin()) {
      over = true
      stopTimer()
      api.gameOver('完成！', `${LEVELS[levelKey].label} · ${seconds} 秒 · ${mistakes} 次错误`)
    }
  }

  const onBoard = (e) => {
    const el = e.target.closest('.su-cell')
    if (!el || over) return
    selected = { r: Number(el.dataset.r), c: Number(el.dataset.c) }
    render()
  }

  const onPad = (e) => {
    const key = e.target.closest('.su-key')
    if (!key) return
    if (key.dataset.act === 'note') {
      noteMode = !noteMode
      key.classList.toggle('on', noteMode)
      return
    }
    if (key.dataset.act === 'erase') return place(0)
    place(Number(key.dataset.d))
  }

  const onKey = (e) => {
    if (over) return
    if (/^[1-9]$/.test(e.key)) place(Number(e.key))
    else if (e.key === 'Backspace' || e.key === 'Delete' || e.key === '0') place(0)
    else if (selected && e.key.startsWith('Arrow')) {
      e.preventDefault()
      const d = { ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1] }[e.key]
      selected = {
        r: Math.max(0, Math.min(8, selected.r + d[0])),
        c: Math.max(0, Math.min(8, selected.c + d[1])),
      }
      render()
    }
  }

  boardEl.addEventListener('click', onBoard)
  padEl.addEventListener('click', onPad)
  window.addEventListener('keydown', onKey)
  reset()

  return {
    restart: reset,
    destroy() {
      stopTimer()
      boardEl.removeEventListener('click', onBoard)
      padEl.removeEventListener('click', onPad)
      window.removeEventListener('keydown', onKey)
    },
  }
}
