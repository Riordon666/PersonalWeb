import { randInt } from './core.js'

const DURATION = 60

export function mount(stage, api) {
  const viewport = stage.querySelector('[data-role="viewport"]')
  viewport.innerHTML = `
    <div class="wk-wrap">
      <div class="wk-board">
        ${[...Array(9).keys()]
          .map((i) => `<div class="wk-hole" data-hole="${i}"><button class="wk-mole" type="button">🐹</button></div>`)
          .join('')}
      </div>
    </div>
  `
  const holes = [...viewport.querySelectorAll('.wk-hole')]

  let score = 0
  let combo = 0
  let timeLeft = DURATION
  let running = false
  let timers = []
  let ticker = 0

  const setTime = api.addHudItem('剩余', `${DURATION}s`)
  const setCombo = api.addHudItem('连击', 0)

  const later = (fn, ms) => {
    const t = setTimeout(fn, ms)
    timers.push(t)
    return t
  }
  const clearAll = () => {
    timers.forEach(clearTimeout)
    timers = []
    clearInterval(ticker)
    ticker = 0
  }

  const upTime = () => {
    const progress = 1 - timeLeft / DURATION
    return Math.max(480, 950 - progress * 500)
  }

  const popOne = () => {
    if (!running) return
    const free = holes.filter((h) => !h.classList.contains('up'))
    if (free.length) {
      const hole = free[randInt(0, free.length - 1)]
      const mole = hole.querySelector('.wk-mole')
      const golden = Math.random() < 0.08
      mole.textContent = golden ? '⭐' : '🐹'
      mole.dataset.golden = golden ? '1' : ''
      hole.classList.add('up')
      later(() => {
        if (hole.classList.contains('up')) {
          hole.classList.remove('up')
          combo = 0
          setCombo(0)
        }
      }, upTime())
    }
    // second concurrent mole in the last half
    const delay = timeLeft < DURATION / 2 ? upTime() * 0.55 : upTime() * 0.95
    later(popOne, delay)
  }

  const reset = () => {
    clearAll()
    holes.forEach((h) => h.classList.remove('up'))
    score = 0
    combo = 0
    timeLeft = DURATION
    running = true
    api.setScore(0)
    setTime(`${DURATION}s`)
    setCombo(0)
    api.hideOverlay()

    ticker = setInterval(() => {
      timeLeft--
      setTime(`${timeLeft}s`)
      if (timeLeft <= 0) {
        running = false
        clearAll()
        holes.forEach((h) => h.classList.remove('up'))
        api.gameOver('时间到', `打中 ${score} 分`)
      }
    }, 1000)

    later(popOne, 600)
    later(popOne, 1400)
  }

  const onHit = (e) => {
    const mole = e.target.closest('.wk-mole')
    if (!mole || !running) return
    const hole = mole.closest('.wk-hole')
    if (!hole.classList.contains('up')) return
    hole.classList.remove('up')
    combo++
    const golden = mole.dataset.golden === '1'
    const gained = (golden ? 3 : 1) + (combo >= 5 ? 1 : 0)
    score += gained
    api.setScore(score)
    setCombo(combo)

    const pop = document.createElement('span')
    pop.className = 'wk-pop'
    pop.textContent = `+${gained}`
    hole.appendChild(pop)
    later(() => pop.remove(), 600)
  }

  viewport.addEventListener('click', onHit)
  reset()

  return {
    restart: reset,
    destroy() {
      clearAll()
      viewport.removeEventListener('click', onHit)
    },
  }
}
