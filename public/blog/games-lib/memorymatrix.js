import { shuffle } from './core.js'

export function mount(stage, api) {
  const viewport = stage.querySelector('[data-role="viewport"]')
  viewport.innerHTML = '<div class="mm-wrap"><div class="mm-board"></div><div class="mm-hint"></div></div>'
  const board = viewport.querySelector('.mm-board')
  const hint = viewport.querySelector('.mm-hint')

  let level = 1
  let size = 3
  let pattern = new Set()
  let found = new Set()
  let lives = 3
  let phase = 'show' // show | input | over
  let timers = []

  const setLives = api.addHudItem('生命', '❤❤❤')

  const later = (fn, ms) => {
    const t = setTimeout(fn, ms)
    timers.push(t)
    return t
  }
  const clearTimers = () => {
    timers.forEach(clearTimeout)
    timers = []
  }

  // Grid grows every few levels; lit cells scale with the grid
  const configFor = (lv) => {
    const s = Math.min(6, 3 + Math.floor((lv - 1) / 3))
    const count = Math.min(s * s - 2, 3 + lv - 1)
    return { s, count }
  }

  const buildLevel = () => {
    const cfg = configFor(level)
    size = cfg.s
    const cells = shuffle([...Array(size * size).keys()])
    pattern = new Set(cells.slice(0, cfg.count))
    found = new Set()
    phase = 'show'
    hint.textContent = `记住 ${cfg.count} 个方格`
    render(true)
    later(() => {
      phase = 'input'
      hint.textContent = '请点出刚才的位置'
      render(false)
    }, 900 + cfg.count * 220)
  }

  const reset = () => {
    clearTimers()
    level = 1
    lives = 3
    api.setScore(0)
    setLives('❤❤❤')
    api.hideOverlay()
    buildLevel()
  }

  const render = (reveal) => {
    board.style.setProperty('--mm-size', String(size))
    board.innerHTML = ''
    for (let i = 0; i < size * size; i++) {
      const el = document.createElement('button')
      el.type = 'button'
      el.className = 'mm-cell'
      el.dataset.i = String(i)
      if (reveal && pattern.has(i)) el.classList.add('lit')
      if (!reveal && found.has(i)) el.classList.add('hit')
      board.appendChild(el)
    }
  }

  const onClick = (e) => {
    if (phase !== 'input') return
    const el = e.target.closest('.mm-cell')
    if (!el) return
    const i = Number(el.dataset.i)
    if (found.has(i)) return

    if (pattern.has(i)) {
      found.add(i)
      el.classList.add('hit')
      if (found.size === pattern.size) {
        phase = 'show'
        level++
        api.setScore(level - 1)
        hint.textContent = '✓ 下一关'
        later(buildLevel, 700)
      }
    } else {
      el.classList.add('miss')
      lives--
      setLives('❤'.repeat(Math.max(0, lives)) || '—')
      if (lives <= 0) {
        phase = 'over'
        // Reveal the answer so the player sees what they missed
        pattern.forEach((p) => board.querySelector(`[data-i="${p}"]`)?.classList.add('lit'))
        hint.textContent = ''
        api.gameOver('记错了', `通过 ${level - 1} 关`)
      }
    }
  }

  board.addEventListener('click', onClick)
  reset()

  return {
    restart: reset,
    destroy() {
      clearTimers()
      board.removeEventListener('click', onClick)
    },
  }
}
