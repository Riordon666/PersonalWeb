import { randInt } from './core.js'

const CATEGORIES = [
  { key: 'ones', name: '一点', hint: '所有 1 的和' },
  { key: 'twos', name: '两点', hint: '所有 2 的和' },
  { key: 'threes', name: '三点', hint: '所有 3 的和' },
  { key: 'fours', name: '四点', hint: '所有 4 的和' },
  { key: 'fives', name: '五点', hint: '所有 5 的和' },
  { key: 'sixes', name: '六点', hint: '所有 6 的和' },
  { key: 'three', name: '三条', hint: '总点数' },
  { key: 'four', name: '四条', hint: '总点数' },
  { key: 'full', name: '葫芦', hint: '25 分' },
  { key: 'small', name: '小顺', hint: '30 分' },
  { key: 'large', name: '大顺', hint: '40 分' },
  { key: 'yahtzee', name: '快艇', hint: '50 分' },
  { key: 'chance', name: '机会', hint: '总点数' },
]

export function mount(stage, api) {
  const viewport = stage.querySelector('[data-role="viewport"]')
  viewport.innerHTML = `
    <div class="yz-wrap">
      <div class="yz-dice"></div>
      <div class="yz-roll">
        <button class="game-btn primary" type="button" data-act="roll">掷骰</button>
        <span class="yz-rolls">剩余 3 次</span>
      </div>
      <div class="yz-sheet"></div>
    </div>
  `
  const diceEl = viewport.querySelector('.yz-dice')
  const sheetEl = viewport.querySelector('.yz-sheet')
  const rollsEl = viewport.querySelector('.yz-rolls')
  const rollBtn = viewport.querySelector('[data-act="roll"]')

  let dice = [1, 1, 1, 1, 1]
  let held = [false, false, false, false, false]
  let rollsLeft = 3
  let scores = {}
  let over = false
  let rolledThisTurn = false

  const setBonus = api.addHudItem('上区', '0/63')

  const counts = () => {
    const c = [0, 0, 0, 0, 0, 0, 0]
    dice.forEach((d) => c[d]++)
    return c
  }

  const sum = () => dice.reduce((a, b) => a + b, 0)

  const scoreFor = (key) => {
    const c = counts()
    const nums = { ones: 1, twos: 2, threes: 3, fours: 4, fives: 5, sixes: 6 }
    if (nums[key]) return c[nums[key]] * nums[key]
    if (key === 'three') return c.some((n) => n >= 3) ? sum() : 0
    if (key === 'four') return c.some((n) => n >= 4) ? sum() : 0
    if (key === 'full') return c.some((n) => n === 3) && c.some((n) => n === 2) ? 25 : 0
    if (key === 'small') {
      const runs = [[1, 2, 3, 4], [2, 3, 4, 5], [3, 4, 5, 6]]
      return runs.some((r) => r.every((v) => c[v] > 0)) ? 30 : 0
    }
    if (key === 'large') {
      const runs = [[1, 2, 3, 4, 5], [2, 3, 4, 5, 6]]
      return runs.some((r) => r.every((v) => c[v] > 0)) ? 40 : 0
    }
    if (key === 'yahtzee') return c.some((n) => n === 5) ? 50 : 0
    if (key === 'chance') return sum()
    return 0
  }

  const upperTotal = () =>
    ['ones', 'twos', 'threes', 'fours', 'fives', 'sixes'].reduce(
      (a, k) => a + (scores[k] ?? 0),
      0
    )

  const grandTotal = () => {
    const base = Object.values(scores).reduce((a, b) => a + (b ?? 0), 0)
    return base + (upperTotal() >= 63 ? 35 : 0)
  }

  const reset = () => {
    dice = [1, 1, 1, 1, 1]
    held = [false, false, false, false, false]
    rollsLeft = 3
    scores = {}
    over = false
    rolledThisTurn = false
    api.setScore(0)
    setBonus('0/63')
    api.hideOverlay()
    render()
  }

  const roll = () => {
    if (rollsLeft <= 0 || over) return
    dice = dice.map((d, i) => (held[i] && rolledThisTurn ? d : randInt(1, 6)))
    rollsLeft--
    rolledThisTurn = true
    render()
  }

  const record = (key) => {
    if (over || scores[key] !== undefined || !rolledThisTurn) return
    scores[key] = scoreFor(key)
    api.setScore(grandTotal())
    setBonus(`${upperTotal()}/63`)

    if (Object.keys(scores).length === CATEGORIES.length) {
      over = true
      const bonus = upperTotal() >= 63 ? '（含 35 上区奖励）' : ''
      api.gameOver('记分表填满了', `总分 ${grandTotal()} ${bonus}`)
      render()
      return
    }
    // next turn
    rollsLeft = 3
    held = [false, false, false, false, false]
    rolledThisTurn = false
    render()
  }

  const PIPS = {
    1: [[50, 50]],
    2: [[28, 28], [72, 72]],
    3: [[28, 28], [50, 50], [72, 72]],
    4: [[28, 28], [72, 28], [28, 72], [72, 72]],
    5: [[28, 28], [72, 28], [50, 50], [28, 72], [72, 72]],
    6: [[28, 26], [72, 26], [28, 50], [72, 50], [28, 74], [72, 74]],
  }

  const render = () => {
    diceEl.innerHTML = dice
      .map(
        (d, i) => `
        <button class="yz-die${held[i] ? ' held' : ''}" type="button" data-die="${i}" aria-label="${d}">
          ${PIPS[d].map(([x, y]) => `<i style="left:${x}%;top:${y}%"></i>`).join('')}
        </button>`
      )
      .join('')

    rollsEl.textContent = over ? '游戏结束' : `剩余 ${rollsLeft} 次`
    rollBtn.disabled = rollsLeft <= 0 || over

    sheetEl.innerHTML = CATEGORIES.map((c) => {
      const done = scores[c.key] !== undefined
      const preview = rolledThisTurn && !done ? scoreFor(c.key) : null
      return `
        <button class="yz-slot${done ? ' done' : ''}${preview ? ' can' : ''}" type="button" data-cat="${c.key}" ${done || !rolledThisTurn ? 'disabled' : ''}>
          <span class="yz-name">${c.name}</span>
          <span class="yz-val">${done ? scores[c.key] : preview !== null ? preview : '—'}</span>
        </button>`
    }).join('')
  }

  const onClick = (e) => {
    const die = e.target.closest('.yz-die')
    if (die) {
      if (!rolledThisTurn || over) return
      const i = Number(die.dataset.die)
      held[i] = !held[i]
      render()
      return
    }
    if (e.target.closest('[data-act="roll"]')) return roll()
    const slot = e.target.closest('.yz-slot')
    if (slot && !slot.disabled) record(slot.dataset.cat)
  }

  viewport.addEventListener('click', onClick)
  reset()

  return {
    restart: reset,
    destroy() {
      viewport.removeEventListener('click', onClick)
    },
  }
}
