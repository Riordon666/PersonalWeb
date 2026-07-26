import { randInt } from './core.js'

const ROUNDS = 5

export function mount(stage, api) {
  const viewport = stage.querySelector('[data-role="viewport"]')
  viewport.innerHTML = `
    <button class="rx-area" type="button">
      <span class="rx-title">点击开始</span>
      <span class="rx-sub">共 ${ROUNDS} 轮，取平均反应时间</span>
    </button>
  `
  const area = viewport.querySelector('.rx-area')
  const titleEl = viewport.querySelector('.rx-title')
  const subEl = viewport.querySelector('.rx-sub')

  const setRound = api.addHudItem('轮次', `0/${ROUNDS}`)

  let phase = 'idle' // idle | wait | go | done
  let results = []
  let goAt = 0
  let timer = 0

  const rating = (ms) => {
    if (ms < 200) return '电竞级反应'
    if (ms < 250) return '相当敏捷'
    if (ms < 320) return '正常人类水平'
    if (ms < 420) return '刚睡醒？'
    return '建议补个觉'
  }

  const show = (title, sub, cls) => {
    titleEl.textContent = title
    subEl.textContent = sub
    area.className = `rx-area ${cls || ''}`
  }

  const startRound = () => {
    phase = 'wait'
    show('等它变绿…', '变绿的瞬间立刻点击', 'waiting')
    timer = setTimeout(() => {
      phase = 'go'
      goAt = performance.now()
      show('点！', '', 'go')
    }, randInt(1200, 3200))
  }

  const reset = () => {
    clearTimeout(timer)
    phase = 'idle'
    results = []
    api.setScore(0)
    setRound(`0/${ROUNDS}`)
    api.hideOverlay()
    show('点击开始', `共 ${ROUNDS} 轮，取平均反应时间`, '')
  }

  const onClick = () => {
    if (phase === 'idle') {
      startRound()
    } else if (phase === 'wait') {
      clearTimeout(timer)
      show('抢跑了！', '等变绿再点，点击重试本轮', 'early')
      phase = 'idle-retry'
    } else if (phase === 'idle-retry') {
      startRound()
    } else if (phase === 'go') {
      const ms = Math.round(performance.now() - goAt)
      results.push(ms)
      api.setScore(ms)
      setRound(`${results.length}/${ROUNDS}`)
      if (results.length >= ROUNDS) {
        phase = 'done'
        const avg = Math.round(results.reduce((a, b) => a + b, 0) / results.length)
        api.setScore(avg)
        show(`${avg} ms`, results.join(' / '), 'result')
        api.gameOver(`平均 ${avg} ms`, `${rating(avg)} · 各轮：${results.join(' / ')} ms`)
      } else {
        phase = 'idle-retry'
        show(`${ms} ms`, `第 ${results.length} 轮 · 点击继续`, 'result')
      }
    }
  }

  area.addEventListener('click', onClick)
  reset()

  return {
    restart: reset,
    destroy() {
      clearTimeout(timer)
      area.removeEventListener('click', onClick)
    },
  }
}
