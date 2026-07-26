import { randInt } from './core.js'

const DURATION = 30

export function mount(stage, api) {
  const viewport = stage.querySelector('[data-role="viewport"]')
  viewport.innerHTML = '<div class="aim-field"></div>'
  const field = viewport.querySelector('.aim-field')

  let hits = 0
  let shots = 0
  let times = []
  let spawnAt = 0
  let timeLeft = DURATION
  let ticker = 0
  let running = false
  let target = null

  const setAcc = api.addHudItem('命中率', '—')
  const setAvg = api.addHudItem('平均反应', '—')
  const setTime = api.addHudItem('剩余', `${DURATION}s`)

  const stopTimer = () => {
    clearInterval(ticker)
    ticker = 0
  }

  const spawn = () => {
    if (!running) return
    field.innerHTML = ''
    const size = Math.max(26, 62 - hits * 0.9)
    const rect = field.getBoundingClientRect()
    const maxX = Math.max(0, rect.width - size)
    const maxY = Math.max(0, rect.height - size)
    target = document.createElement('button')
    target.type = 'button'
    target.className = 'aim-target'
    target.style.width = `${size}px`
    target.style.height = `${size}px`
    target.style.left = `${randInt(0, Math.floor(maxX))}px`
    target.style.top = `${randInt(0, Math.floor(maxY))}px`
    field.appendChild(target)
    spawnAt = performance.now()
  }

  const reset = () => {
    stopTimer()
    hits = 0
    shots = 0
    times = []
    timeLeft = DURATION
    running = true
    api.setScore(0)
    setAcc('—')
    setAvg('—')
    setTime(`${DURATION}s`)
    api.hideOverlay()
    spawn()
    ticker = setInterval(() => {
      timeLeft--
      setTime(`${timeLeft}s`)
      if (timeLeft <= 0) finish()
    }, 1000)
  }

  const finish = () => {
    running = false
    stopTimer()
    field.innerHTML = ''
    const acc = shots ? Math.round((hits / shots) * 100) : 0
    const avg = times.length ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : 0
    api.gameOver('时间到', `命中 ${hits} · 命中率 ${acc}% · 平均 ${avg}ms`)
  }

  const onClick = (e) => {
    if (!running) return
    shots++
    const isTarget = e.target.closest('.aim-target')
    if (isTarget) {
      hits++
      times.push(performance.now() - spawnAt)
      api.setScore(hits)
      const avg = Math.round(times.reduce((a, b) => a + b, 0) / times.length)
      setAvg(`${avg}ms`)
      spawn()
    }
    setAcc(`${Math.round((hits / shots) * 100)}%`)
  }

  field.addEventListener('pointerdown', onClick)
  reset()

  return {
    restart: reset,
    destroy() {
      stopTimer()
      running = false
      field.removeEventListener('pointerdown', onClick)
    },
  }
}
