import { randInt } from './core.js'

const LEVELS = {
  easy: { w: 9, h: 9, mines: 10, label: '初级' },
  hard: { w: 16, h: 16, mines: 40, label: '进阶' },
}

export function mount(stage, api) {
  const viewport = stage.querySelector('[data-role="viewport"]')
  viewport.innerHTML = '<div class="ms-board"></div>'
  const board = viewport.querySelector('.ms-board')

  let levelKey = 'easy'
  let W = 9
  let H = 9
  let M = 10
  let mines = new Set()
  let revealed = new Set()
  let flags = new Set()
  let placed = false
  let over = false
  let seconds = 0
  let ticker = 0
  let pressTimer = 0
  let suppressClick = false

  const setMinesLeft = api.addHudItem('剩余雷', LEVELS[levelKey].mines)
  const levelBtn = api.addHudButton(LEVELS[levelKey === 'easy' ? 'hard' : 'easy'].label, () => {
    levelKey = levelKey === 'easy' ? 'hard' : 'easy'
    levelBtn.textContent = LEVELS[levelKey === 'easy' ? 'hard' : 'easy'].label
    reset()
  })

  const idx = (x, y) => y * W + x
  const neighbors = (x, y) => {
    const out = []
    for (let dy = -1; dy <= 1; dy++)
      for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy) continue
        const nx = x + dx
        const ny = y + dy
        if (nx >= 0 && ny >= 0 && nx < W && ny < H) out.push([nx, ny])
      }
    return out
  }

  const stopTimer = () => {
    clearInterval(ticker)
    ticker = 0
  }

  const startTimer = () => {
    if (ticker) return
    ticker = setInterval(() => {
      seconds++
      api.setScore(seconds)
    }, 1000)
  }

  const reset = () => {
    const lv = LEVELS[levelKey]
    W = lv.w
    H = lv.h
    M = lv.mines
    mines = new Set()
    revealed = new Set()
    flags = new Set()
    placed = false
    over = false
    seconds = 0
    stopTimer()
    api.setScore(0)
    setMinesLeft(M)
    api.hideOverlay()
    board.style.setProperty('--ms-w', String(W))
    board.classList.toggle('large', W > 9)
    render()
  }

  const placeMines = (sx, sy) => {
    const safe = new Set([idx(sx, sy), ...neighbors(sx, sy).map(([x, y]) => idx(x, y))])
    while (mines.size < M) {
      const i = randInt(0, W * H - 1)
      if (!safe.has(i)) mines.add(i)
    }
    placed = true
    startTimer()
  }

  const countAround = (x, y) => neighbors(x, y).filter(([nx, ny]) => mines.has(idx(nx, ny))).length

  const reveal = (x, y) => {
    const stack = [[x, y]]
    while (stack.length) {
      const [cx, cy] = stack.pop()
      const i = idx(cx, cy)
      if (revealed.has(i) || flags.has(i)) continue
      revealed.add(i)
      if (countAround(cx, cy) === 0 && !mines.has(i)) {
        neighbors(cx, cy).forEach(([nx, ny]) => {
          if (!revealed.has(idx(nx, ny))) stack.push([nx, ny])
        })
      }
    }
  }

  const lose = (hitIdx) => {
    over = true
    stopTimer()
    mines.forEach((i) => revealed.add(i))
    render(hitIdx)
    api.gameOver('踩到雷了', `用时 ${seconds} 秒`, { record: false })
  }

  const checkWin = () => {
    if (revealed.size === W * H - M) {
      over = true
      stopTimer()
      // Reveal-flag remaining mines for a tidy final board
      mines.forEach((i) => flags.add(i))
      setMinesLeft(0)
      render()
      api.gameOver('扫雷成功', `用时 ${seconds} 秒（${LEVELS[levelKey].label}）`)
      return true
    }
    return false
  }

  const open = (x, y) => {
    if (over) return
    const i = idx(x, y)
    if (flags.has(i)) return
    if (!placed) placeMines(x, y)
    if (mines.has(i)) return lose(i)

    if (revealed.has(i)) {
      // Chord: open neighbors when flags match the number
      const n = countAround(x, y)
      const around = neighbors(x, y)
      const flagged = around.filter(([nx, ny]) => flags.has(idx(nx, ny))).length
      if (n > 0 && flagged === n) {
        for (const [nx, ny] of around) {
          const ni = idx(nx, ny)
          if (flags.has(ni) || revealed.has(ni)) continue
          if (mines.has(ni)) return lose(ni)
          reveal(nx, ny)
        }
      }
    } else {
      reveal(x, y)
    }
    if (!checkWin()) render()
  }

  const toggleFlag = (x, y) => {
    if (over) return
    const i = idx(x, y)
    if (revealed.has(i)) return
    if (flags.has(i)) flags.delete(i)
    else flags.add(i)
    setMinesLeft(M - flags.size)
    render()
  }

  const render = (hitIdx = -1) => {
    board.innerHTML = ''
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const i = idx(x, y)
        const el = document.createElement('button')
        el.type = 'button'
        el.className = 'ms-cell'
        el.dataset.x = String(x)
        el.dataset.y = String(y)
        if (revealed.has(i)) {
          el.classList.add('open')
          if (mines.has(i)) {
            el.classList.add('mine')
            if (i === hitIdx) el.classList.add('boom')
            el.textContent = '✸'
          } else {
            const n = countAround(x, y)
            if (n) {
              el.textContent = String(n)
              el.dataset.n = String(n)
            }
          }
        } else if (flags.has(i)) {
          el.classList.add('flag')
          el.textContent = '⚑'
        }
        board.appendChild(el)
      }
    }
  }

  // Desktop: left click open, right click flag. Mobile: tap open, long-press flag.
  const onClick = (e) => {
    const el = e.target.closest('.ms-cell')
    if (!el) return
    if (suppressClick) {
      suppressClick = false
      return
    }
    open(Number(el.dataset.x), Number(el.dataset.y))
  }
  const onContext = (e) => {
    const el = e.target.closest('.ms-cell')
    if (!el) return
    e.preventDefault()
    toggleFlag(Number(el.dataset.x), Number(el.dataset.y))
  }
  const onTouchStart = (e) => {
    const el = e.target.closest('.ms-cell')
    if (!el) return
    pressTimer = setTimeout(() => {
      suppressClick = true
      toggleFlag(Number(el.dataset.x), Number(el.dataset.y))
      if (navigator.vibrate) navigator.vibrate(30)
    }, 420)
  }
  const cancelPress = () => clearTimeout(pressTimer)

  board.addEventListener('click', onClick)
  board.addEventListener('contextmenu', onContext)
  board.addEventListener('touchstart', onTouchStart, { passive: true })
  board.addEventListener('touchend', cancelPress, { passive: true })
  board.addEventListener('touchmove', cancelPress, { passive: true })

  reset()

  return {
    restart: reset,
    destroy() {
      stopTimer()
      clearTimeout(pressTimer)
      board.removeEventListener('click', onClick)
      board.removeEventListener('contextmenu', onContext)
      board.removeEventListener('touchstart', onTouchStart)
      board.removeEventListener('touchend', cancelPress)
      board.removeEventListener('touchmove', cancelPress)
    },
  }
}
