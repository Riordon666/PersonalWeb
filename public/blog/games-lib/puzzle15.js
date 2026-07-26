export function mount(stage, api) {
  const viewport = stage.querySelector('[data-role="viewport"]')
  viewport.innerHTML = '<div class="p15-board"></div>'
  const board = viewport.querySelector('.p15-board')

  const N = 4
  let tiles = [] // tiles[i] = value at position i; 0 = blank
  let steps = 0
  let seconds = 0
  let ticker = 0
  let over = false

  const setTime = api.addHudItem('用时', '0s')

  const stopTimer = () => {
    clearInterval(ticker)
    ticker = 0
  }
  const startTimer = () => {
    if (ticker || over) return
    ticker = setInterval(() => {
      seconds++
      setTime(`${seconds}s`)
    }, 1000)
  }

  const solvedTiles = () => [...Array(N * N - 1).keys()].map((i) => i + 1).concat(0)

  const blankIndex = () => tiles.indexOf(0)

  const movableFrom = (blank) => {
    const out = []
    const bx = blank % N
    const by = Math.floor(blank / N)
    if (bx > 0) out.push(blank - 1)
    if (bx < N - 1) out.push(blank + 1)
    if (by > 0) out.push(blank - N)
    if (by < N - 1) out.push(blank + N)
    return out
  }

  const shuffleBoard = () => {
    tiles = solvedTiles()
    let prev = -1
    // Random walk from the solved state — always solvable by construction
    for (let i = 0; i < 300; i++) {
      const blank = blankIndex()
      const options = movableFrom(blank).filter((p) => p !== prev)
      const pick = options[Math.floor(Math.random() * options.length)]
      prev = blank
      ;[tiles[blank], tiles[pick]] = [tiles[pick], tiles[blank]]
    }
  }

  const reset = () => {
    stopTimer()
    shuffleBoard()
    steps = 0
    seconds = 0
    over = false
    api.setScore(0)
    setTime('0s')
    api.hideOverlay()
    render()
  }

  const isSolved = () => tiles.every((v, i) => v === solvedTiles()[i])

  const tryMove = (pos) => {
    if (over) return
    const blank = blankIndex()
    if (!movableFrom(blank).includes(pos)) return
    startTimer()
    ;[tiles[blank], tiles[pos]] = [tiles[pos], tiles[blank]]
    steps++
    api.setScore(steps)
    render()
    if (isSolved()) {
      over = true
      stopTimer()
      api.gameOver('拼好了！', `${steps} 步 · ${seconds} 秒`)
    }
  }

  const render = () => {
    if (!board.childElementCount) {
      // build once; afterwards only positions change (for CSS transitions)
      for (let v = 1; v < N * N; v++) {
        const el = document.createElement('button')
        el.type = 'button'
        el.className = 'p15-tile'
        el.textContent = String(v)
        el.dataset.v = String(v)
        el.addEventListener('click', () => tryMove(tiles.indexOf(v)))
        board.appendChild(el)
      }
    }
    for (const el of board.children) {
      const v = Number(el.dataset.v)
      const pos = tiles.indexOf(v)
      const x = pos % N
      const y = Math.floor(pos / N)
      el.style.transform = `translate(${x * 100}%, ${y * 100}%)`
      el.classList.toggle('correct', solvedTiles()[pos] === v)
    }
  }

  // Arrow keys slide the tile next to the blank in that direction
  const onKey = (e) => {
    const map = {
      ArrowUp: N,      // tile below the blank moves up
      ArrowDown: -N,   // tile above the blank moves down
      ArrowLeft: 1,    // tile right of the blank moves left
      ArrowRight: -1,  // tile left of the blank moves right
    }
    const delta = map[e.key]
    if (delta === undefined) return
    e.preventDefault()
    const blank = blankIndex()
    const pos = blank + delta
    const bx = blank % N
    if (Math.abs(delta) === 1 && Math.floor(pos / N) !== Math.floor(blank / N)) return
    if (pos < 0 || pos >= N * N) return
    if (Math.abs(delta) === 1 && ((delta === 1 && bx === N - 1) || (delta === -1 && bx === 0))) return
    tryMove(pos)
  }

  window.addEventListener('keydown', onKey)
  reset()

  return {
    restart: reset,
    destroy() {
      stopTimer()
      window.removeEventListener('keydown', onKey)
    },
  }
}
