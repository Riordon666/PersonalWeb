import { shuffle } from './core.js'

const LEN = 4

export function mount(stage, api) {
  const viewport = stage.querySelector('[data-role="viewport"]')
  viewport.innerHTML = `
    <div class="bc-wrap">
      <div class="bc-log"></div>
      <div class="bc-input" role="group" aria-label="输入"></div>
      <div class="bc-keys">
        ${[1, 2, 3, 4, 5, 6, 7, 8, 9, 0]
          .map((d) => `<button class="bc-key" type="button" data-d="${d}">${d}</button>`)
          .join('')}
        <button class="bc-key wide" type="button" data-act="del">删除</button>
        <button class="bc-key wide primary" type="button" data-act="go">确认</button>
      </div>
    </div>
  `
  const logEl = viewport.querySelector('.bc-log')
  const inputEl = viewport.querySelector('.bc-input')

  let secret = []
  let entry = []
  let tries = 0
  let over = false

  const reset = () => {
    // Unique digits, first one non-zero
    let pool = shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8, 9])
    while (pool[0] === 0) pool = shuffle(pool)
    secret = pool.slice(0, LEN)
    entry = []
    tries = 0
    over = false
    api.setScore(0)
    api.hideOverlay()
    logEl.innerHTML = '<div class="bc-tip">猜一个 4 位不重复数字。A = 数字和位置都对，B = 数字对但位置错。</div>'
    renderEntry()
  }

  const renderEntry = () => {
    inputEl.innerHTML = ''
    for (let i = 0; i < LEN; i++) {
      const slot = document.createElement('div')
      slot.className = 'bc-slot' + (entry[i] !== undefined ? ' filled' : '')
      slot.textContent = entry[i] !== undefined ? String(entry[i]) : ''
      inputEl.appendChild(slot)
    }
  }

  const judge = (guess) => {
    let a = 0
    let b = 0
    guess.forEach((d, i) => {
      if (d === secret[i]) a++
      else if (secret.includes(d)) b++
    })
    return { a, b }
  }

  const submit = () => {
    if (over) return
    if (entry.length !== LEN) {
      flashInput('请输入 4 位数字')
      return
    }
    if (new Set(entry).size !== LEN) {
      flashInput('数字不能重复')
      return
    }

    const { a, b } = judge(entry)
    tries++
    api.setScore(tries)

    const row = document.createElement('div')
    row.className = 'bc-row'
    row.innerHTML = `
      <span class="bc-guess">${entry.join('')}</span>
      <span class="bc-result"><b>${a}</b>A <b>${b}</b>B</span>
    `
    if (a === LEN) row.classList.add('win')
    logEl.appendChild(row)
    logEl.scrollTop = logEl.scrollHeight

    entry = []
    renderEntry()

    if (a === LEN) {
      over = true
      api.gameOver('猜中了！', `${tries} 次猜出 ${secret.join('')}`)
    } else if (tries >= 10) {
      over = true
      api.gameOver('次数用完', `答案是 ${secret.join('')}`, { record: false })
    }
  }

  const flashInput = (msg) => {
    inputEl.classList.add('shake')
    setTimeout(() => inputEl.classList.remove('shake'), 320)
    const tip = document.createElement('div')
    tip.className = 'bc-tip warn'
    tip.textContent = msg
    logEl.appendChild(tip)
    logEl.scrollTop = logEl.scrollHeight
    setTimeout(() => tip.remove(), 1400)
  }

  const onClick = (e) => {
    const key = e.target.closest('.bc-key')
    if (!key || over) return
    if (key.dataset.act === 'del') {
      entry.pop()
      renderEntry()
      return
    }
    if (key.dataset.act === 'go') {
      submit()
      return
    }
    if (entry.length < LEN) {
      entry.push(Number(key.dataset.d))
      renderEntry()
    }
  }

  const onKey = (e) => {
    if (over) return
    if (/^[0-9]$/.test(e.key)) {
      if (entry.length < LEN) {
        entry.push(Number(e.key))
        renderEntry()
      }
    } else if (e.key === 'Backspace') {
      e.preventDefault()
      entry.pop()
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
      viewport.removeEventListener('click', onClick)
      window.removeEventListener('keydown', onKey)
    },
  }
}
