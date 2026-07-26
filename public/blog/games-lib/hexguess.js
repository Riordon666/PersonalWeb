import { randInt, shuffle } from './core.js'

const ROUNDS = 10

const toHex = (r, g, b) =>
  '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('').toUpperCase()

export function mount(stage, api) {
  const viewport = stage.querySelector('[data-role="viewport"]')
  viewport.innerHTML = `
    <div class="hx-wrap">
      <div class="hx-swatch"></div>
      <div class="hx-question">这个颜色的 HEX 是？</div>
      <div class="hx-options"></div>
      <div class="hx-feedback"></div>
    </div>
  `
  const swatch = viewport.querySelector('.hx-swatch')
  const optionsEl = viewport.querySelector('.hx-options')
  const feedbackEl = viewport.querySelector('.hx-feedback')

  let round = 0
  let correct = 0
  let answer = ''
  let locked = false
  let timer = 0

  const setRound = api.addHudItem('题目', `0/${ROUNDS}`)

  // Nudge one channel so the decoys stay plausible but distinguishable
  const nudge = (v, amount) => Math.max(0, Math.min(255, v + amount))

  const newRound = () => {
    if (round >= ROUNDS) {
      const pct = Math.round((correct / ROUNDS) * 100)
      api.gameOver(
        pct >= 80 ? '色感惊人' : pct >= 50 ? '还不错' : '再练练',
        `${ROUNDS} 题答对 ${correct} 题（${pct}%）`
      )
      return
    }
    round++
    setRound(`${round}/${ROUNDS}`)
    locked = false
    feedbackEl.textContent = ''
    feedbackEl.className = 'hx-feedback'

    const r = randInt(20, 235)
    const g = randInt(20, 235)
    const b = randInt(20, 235)
    answer = toHex(r, g, b)
    swatch.style.background = answer

    // Decoys get harder as the round number climbs
    const spread = Math.max(18, 70 - round * 5)
    const decoys = [
      toHex(nudge(r, randInt(spread, spread * 2) * (Math.random() < 0.5 ? -1 : 1)), g, b),
      toHex(r, nudge(g, randInt(spread, spread * 2) * (Math.random() < 0.5 ? -1 : 1)), b),
      toHex(
        nudge(r, randInt(-spread, spread)),
        nudge(g, randInt(-spread, spread)),
        nudge(b, randInt(spread, spread * 2) * (Math.random() < 0.5 ? -1 : 1))
      ),
    ]

    const opts = shuffle([answer, ...new Set(decoys.filter((d) => d !== answer))].slice(0, 4))
    optionsEl.innerHTML = opts
      .map((o) => `<button class="hx-option" type="button" data-hex="${o}">${o}</button>`)
      .join('')
  }

  const reset = () => {
    clearTimeout(timer)
    round = 0
    correct = 0
    api.setScore(0)
    setRound(`0/${ROUNDS}`)
    api.hideOverlay()
    newRound()
  }

  const onClick = (e) => {
    const btn = e.target.closest('.hx-option')
    if (!btn || locked) return
    locked = true
    const picked = btn.dataset.hex

    optionsEl.querySelectorAll('.hx-option').forEach((b) => {
      if (b.dataset.hex === answer) b.classList.add('right')
      else if (b === btn) b.classList.add('wrong')
      b.style.setProperty('--opt-color', b.dataset.hex)
      b.classList.add('revealed')
    })

    if (picked === answer) {
      correct++
      api.setScore(correct)
      feedbackEl.textContent = '✓ 对了'
      feedbackEl.className = 'hx-feedback ok'
    } else {
      feedbackEl.textContent = `✗ 正确答案 ${answer}`
      feedbackEl.className = 'hx-feedback bad'
    }

    timer = setTimeout(newRound, 900)
  }

  viewport.addEventListener('click', onClick)
  reset()

  return {
    restart: reset,
    destroy() {
      clearTimeout(timer)
      viewport.removeEventListener('click', onClick)
    },
  }
}
