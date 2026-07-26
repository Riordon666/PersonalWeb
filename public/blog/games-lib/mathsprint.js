import { randInt } from './core.js'

const DURATION = 60

export function mount(stage, api) {
  const viewport = stage.querySelector('[data-role="viewport"]')
  viewport.innerHTML = `
    <div class="ms2-wrap">
      <div class="ms2-question"></div>
      <div class="ms2-answer"></div>
      <div class="ms2-keys">
        ${[1, 2, 3, 4, 5, 6, 7, 8, 9]
          .map((d) => `<button class="ms2-key" type="button" data-d="${d}">${d}</button>`)
          .join('')}
        <button class="ms2-key" type="button" data-act="del">⌫</button>
        <button class="ms2-key" type="button" data-d="0">0</button>
        <button class="ms2-key primary" type="button" data-act="go">✓</button>
      </div>
    </div>
  `
  const qEl = viewport.querySelector('.ms2-question')
  const aEl = viewport.querySelector('.ms2-answer')

  let answer = 0
  let entry = ''
  let correct = 0
  let wrong = 0
  let timeLeft = DURATION
  let ticker = 0
  let over = false

  const setWrong = api.addHudItem('答错', 0)
  const setTime = api.addHudItem('剩余', `${DURATION}s`)

  const stopTimer = () => {
    clearInterval(ticker)
    ticker = 0
  }

  const newQuestion = () => {
    // Difficulty ramps with the number of correct answers
    const tier = Math.min(4, Math.floor(correct / 5))
    const ops = ['+', '-', '×', '÷'].slice(0, tier < 1 ? 2 : tier < 2 ? 3 : 4)
    const op = ops[randInt(0, ops.length - 1)]
    const max = 10 + tier * 12
    let a, b

    if (op === '+') {
      a = randInt(2, max)
      b = randInt(2, max)
      answer = a + b
    } else if (op === '-') {
      a = randInt(2, max)
      b = randInt(1, a)
      answer = a - b
    } else if (op === '×') {
      a = randInt(2, Math.min(12, 4 + tier * 3))
      b = randInt(2, Math.min(12, 4 + tier * 3))
      answer = a * b
    } else {
      b = randInt(2, Math.min(12, 3 + tier * 2))
      answer = randInt(2, Math.min(12, 4 + tier * 2))
      a = b * answer
    }

    qEl.textContent = `${a} ${op} ${b} = ?`
    entry = ''
    renderEntry()
  }

  const renderEntry = () => {
    aEl.textContent = entry || ' '
  }

  const reset = () => {
    stopTimer()
    correct = 0
    wrong = 0
    timeLeft = DURATION
    over = false
    api.setScore(0)
    setWrong(0)
    setTime(`${DURATION}s`)
    api.hideOverlay()
    newQuestion()
    ticker = setInterval(() => {
      timeLeft--
      setTime(`${timeLeft}s`)
      if (timeLeft <= 0) {
        over = true
        stopTimer()
        api.gameOver('时间到', `答对 ${correct} 题 · 答错 ${wrong} 题`)
      }
    }, 1000)
  }

  const submit = () => {
    if (over || entry === '') return
    if (Number(entry) === answer) {
      correct++
      api.setScore(correct)
      // Right answers buy a little more time
      timeLeft = Math.min(DURATION, timeLeft + 1)
      setTime(`${timeLeft}s`)
      qEl.classList.add('right')
      setTimeout(() => qEl.classList.remove('right'), 220)
      newQuestion()
    } else {
      wrong++
      setWrong(wrong)
      timeLeft = Math.max(0, timeLeft - 2)
      setTime(`${timeLeft}s`)
      aEl.classList.add('wrong')
      setTimeout(() => aEl.classList.remove('wrong'), 300)
      entry = ''
      renderEntry()
    }
  }

  const onClick = (e) => {
    const key = e.target.closest('.ms2-key')
    if (!key || over) return
    if (key.dataset.act === 'del') {
      entry = entry.slice(0, -1)
      renderEntry()
    } else if (key.dataset.act === 'go') {
      submit()
    } else if (entry.length < 5) {
      entry += key.dataset.d
      renderEntry()
    }
  }

  const onKey = (e) => {
    if (over) return
    if (/^[0-9]$/.test(e.key)) {
      if (entry.length < 5) {
        entry += e.key
        renderEntry()
      }
    } else if (e.key === 'Backspace') {
      e.preventDefault()
      entry = entry.slice(0, -1)
      renderEntry()
    } else if (e.key === 'Enter') {
      submit()
    }
  }

  viewport.addEventListener('click', onClick)
  window.addEventListener('keydown', onKey)
  reset()

  return {
    restart: reset,
    destroy() {
      stopTimer()
      viewport.removeEventListener('click', onClick)
      window.removeEventListener('keydown', onKey)
    },
  }
}
