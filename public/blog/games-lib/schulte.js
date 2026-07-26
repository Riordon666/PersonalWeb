import { shuffle } from './core.js'

const N = 5

export function mount(stage, api) {
  const viewport = stage.querySelector('[data-role="viewport"]')
  viewport.innerHTML = '<div class="sc-board"></div>'
  const board = viewport.querySelector('.sc-board')

  let order = []
  let next = 1
  let started = false
  let over = false
  let startTime = 0
  let ticker = 0
  let misses = 0

  const setNext = api.addHudItem('下一个', 1)
  const setMiss = api.addHudItem('点错', 0)

  const stopTimer = () => {
    clearInterval(ticker)
    ticker = 0
  }

  const elapsed = () => (startTime ? (Date.now() - startTime) / 1000 : 0)

  const reset = () => {
    stopTimer()
    order = shuffle([...Array(N * N).keys()].map((i) => i + 1))
    next = 1
    misses = 0
    started = false
    over = false
    startTime = 0
    api.setScore(0)
    setNext(1)
    setMiss(0)
    api.hideOverlay()
    render()
  }

  const render = () => {
    board.innerHTML = ''
    order.forEach((v) => {
      const el = document.createElement('button')
      el.type = 'button'
      el.className = 'sc-cell' + (v < next ? ' done' : '')
      el.dataset.v = String(v)
      el.textContent = String(v)
      board.appendChild(el)
    })
  }

  const onClick = (e) => {
    if (over) return
    const el = e.target.closest('.sc-cell')
    if (!el) return
    const v = Number(el.dataset.v)

    if (!started) {
      started = true
      startTime = Date.now()
      ticker = setInterval(() => api.setScore(elapsed().toFixed(1)), 100)
    }

    if (v !== next) {
      misses++
      setMiss(misses)
      el.classList.add('wrong')
      setTimeout(() => el.classList.remove('wrong'), 260)
      return
    }

    el.classList.add('done')
    next++
    setNext(next > N * N ? '✓' : next)

    if (next > N * N) {
      over = true
      stopTimer()
      // Each miss adds a one-second penalty
      const total = Number((elapsed() + misses).toFixed(1))
      api.setScore(total)
      api.gameOver('完成！', `${elapsed().toFixed(1)} 秒 + ${misses} 次点错罚时 = ${total} 秒`)
    }
  }

  board.addEventListener('click', onClick)
  reset()

  return {
    restart: reset,
    destroy() {
      stopTimer()
      board.removeEventListener('click', onClick)
    },
  }
}
