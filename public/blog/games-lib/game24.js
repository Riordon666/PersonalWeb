import { randInt } from './core.js'

const EPS = 1e-6

// Exhaustive check that some order of +,-,*,/ over these values makes 24
const solvable = (nums) => {
  if (nums.length === 1) return Math.abs(nums[0] - 24) < EPS
  for (let i = 0; i < nums.length; i++) {
    for (let j = 0; j < nums.length; j++) {
      if (i === j) continue
      const rest = nums.filter((_, k) => k !== i && k !== j)
      const a = nums[i]
      const b = nums[j]
      const results = [a + b, a - b, a * b]
      if (Math.abs(b) > EPS) results.push(a / b)
      for (const r of results) {
        if (solvable([...rest, r])) return true
      }
    }
  }
  return false
}

const fmt = (v) => {
  if (Math.abs(v - Math.round(v)) < EPS) return String(Math.round(v))
  return v.toFixed(2).replace(/\.?0+$/, '')
}

export function mount(stage, api) {
  const viewport = stage.querySelector('[data-role="viewport"]')
  viewport.innerHTML = `
    <div class="g24-wrap">
      <div class="g24-cards"></div>
      <div class="g24-ops">
        ${['+', '−', '×', '÷'].map((o) => `<button class="g24-op" type="button" data-op="${o}">${o}</button>`).join('')}
      </div>
      <div class="g24-actions">
        <button class="game-btn" type="button" data-act="undo">撤销</button>
        <button class="game-btn" type="button" data-act="skip">换一题</button>
      </div>
      <div class="g24-hint">选两个数字和一个运算符</div>
    </div>
  `
  const cardsEl = viewport.querySelector('.g24-cards')
  const hintEl = viewport.querySelector('.g24-hint')

  let cards = [] // {id, value}
  let history = []
  let selected = []
  let op = null
  let solved = 0
  let skipped = 0
  let nextId = 0

  const setSkipped = api.addHudItem('跳过', 0)

  const newPuzzle = () => {
    let nums
    let guard = 0
    do {
      nums = [randInt(1, 13), randInt(1, 13), randInt(1, 13), randInt(1, 13)]
      guard++
    } while (!solvable(nums) && guard < 500)
    cards = nums.map((v) => ({ id: nextId++, value: v }))
    history = []
    selected = []
    op = null
    hintEl.textContent = '选两个数字和一个运算符'
    render()
  }

  const reset = () => {
    solved = 0
    skipped = 0
    api.setScore(0)
    setSkipped(0)
    api.hideOverlay()
    newPuzzle()
  }

  const render = () => {
    cardsEl.innerHTML = ''
    cards.forEach((c) => {
      const el = document.createElement('button')
      el.type = 'button'
      el.className = 'g24-card' + (selected.includes(c.id) ? ' active' : '')
      el.dataset.id = String(c.id)
      el.textContent = fmt(c.value)
      cardsEl.appendChild(el)
    })
    viewport.querySelectorAll('.g24-op').forEach((b) => {
      b.classList.toggle('active', b.dataset.op === op)
    })
  }

  const tryCombine = () => {
    if (selected.length !== 2 || !op) return
    const a = cards.find((c) => c.id === selected[0])
    const b = cards.find((c) => c.id === selected[1])
    if (!a || !b) return

    let value
    if (op === '+') value = a.value + b.value
    else if (op === '−') value = a.value - b.value
    else if (op === '×') value = a.value * b.value
    else {
      if (Math.abs(b.value) < EPS) {
        hintEl.textContent = '不能除以 0'
        selected = []
        op = null
        render()
        return
      }
      value = a.value / b.value
    }

    history.push(cards.map((c) => ({ ...c })))
    cards = cards.filter((c) => c.id !== a.id && c.id !== b.id)
    cards.push({ id: nextId++, value })
    selected = []
    op = null
    render()

    if (cards.length === 1) {
      if (Math.abs(cards[0].value - 24) < EPS) {
        solved++
        api.setScore(solved)
        hintEl.textContent = '✓ 正好 24！下一题'
        setTimeout(newPuzzle, 850)
      } else {
        hintEl.textContent = `得到 ${fmt(cards[0].value)}，不是 24 — 可以撤销`
      }
    }
  }

  const onClick = (e) => {
    const card = e.target.closest('.g24-card')
    if (card) {
      const id = Number(card.dataset.id)
      if (selected.includes(id)) selected = selected.filter((s) => s !== id)
      else if (selected.length < 2) selected.push(id)
      else selected = [selected[1], id]
      render()
      tryCombine()
      return
    }

    const opBtn = e.target.closest('.g24-op')
    if (opBtn) {
      op = op === opBtn.dataset.op ? null : opBtn.dataset.op
      render()
      tryCombine()
      return
    }

    const act = e.target.closest('[data-act]')?.dataset.act
    if (act === 'undo') {
      if (history.length) {
        cards = history.pop()
        selected = []
        op = null
        hintEl.textContent = '已撤销'
        render()
      }
      return
    }
    if (act === 'skip') {
      skipped++
      setSkipped(skipped)
      newPuzzle()
    }
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
