import { randInt } from './core.js'

export function mount(stage, api) {
  const viewport = stage.querySelector('[data-role="viewport"]')
  viewport.innerHTML = '<div class="cm-wrap"><div class="cm-board"></div></div>'
  const board = viewport.querySelector('.cm-board')

  let level = 1
  let size = 2
  let oddIndex = 0
  let timeLeft = 30
  let ticker = 0
  let over = false

  const setTime = api.addHudItem('剩余', '30s')

  const stopTimer = () => {
    clearInterval(ticker)
    ticker = 0
  }

  const buildLevel = () => {
    // Grid grows and the color gap narrows as the level climbs
    size = Math.min(7, 2 + Math.floor(level / 2))
    const hue = randInt(0, 359)
    const sat = randInt(55, 75)
    const light = randInt(45, 62)
    const delta = Math.max(2.2, 26 - level * 1.5)

    oddIndex = randInt(0, size * size - 1)
    board.style.setProperty('--cm-size', String(size))
    board.innerHTML = ''
    for (let i = 0; i < size * size; i++) {
      const el = document.createElement('button')
      el.type = 'button'
      el.className = 'cm-cell'
      el.dataset.i = String(i)
      const l = i === oddIndex ? light + delta : light
      el.style.background = `hsl(${hue}, ${sat}%, ${l}%)`
      board.appendChild(el)
    }
  }

  const reset = () => {
    stopTimer()
    level = 1
    timeLeft = 30
    over = false
    api.setScore(0)
    setTime('30s')
    api.hideOverlay()
    buildLevel()
    ticker = setInterval(() => {
      timeLeft--
      setTime(`${timeLeft}s`)
      if (timeLeft <= 0) {
        over = true
        stopTimer()
        api.gameOver('时间到', `到达第 ${level} 关`)
      }
    }, 1000)
  }

  const onClick = (e) => {
    if (over) return
    const el = e.target.closest('.cm-cell')
    if (!el) return
    if (Number(el.dataset.i) === oddIndex) {
      level++
      api.setScore(level - 1)
      timeLeft = Math.min(30, timeLeft + 2)
      setTime(`${timeLeft}s`)
      board.classList.add('right')
      setTimeout(() => board.classList.remove('right'), 200)
      buildLevel()
    } else {
      timeLeft = Math.max(0, timeLeft - 3)
      setTime(`${timeLeft}s`)
      el.classList.add('wrong')
      setTimeout(() => el.classList.remove('wrong'), 260)
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
