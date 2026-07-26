const TEXTS = [
  'the quick brown fox jumps over the lazy dog while the sun sets behind the hills',
  'code is read much more often than it is written so clarity always beats cleverness',
  'a good design is not when there is nothing left to add but nothing left to take away',
  'premature optimization is the root of all evil in programming as we know it today',
  'simplicity is the ultimate sophistication and it takes real effort to get there',
  'talk is cheap show me the code said the kernel maintainer to the eager contributor',
  'the best time to plant a tree was twenty years ago the second best time is now',
  'programs must be written for people to read and only incidentally for machines to run',
]

export function mount(stage, api) {
  const viewport = stage.querySelector('[data-role="viewport"]')
  viewport.innerHTML = `
    <div class="tp-wrap">
      <div class="tp-text" tabindex="0"></div>
      <div class="tp-hint">直接开始打字（可点这里聚焦）</div>
    </div>
  `
  const textEl = viewport.querySelector('.tp-text')
  const hintEl = viewport.querySelector('.tp-hint')

  let target = ''
  let typed = ''
  let startAt = 0
  let ticker = 0
  let over = false
  let errorsTotal = 0

  const setAcc = api.addHudItem('正确率', '100%')
  const setTime = api.addHudItem('用时', '0.0s')

  const stopTimer = () => {
    clearInterval(ticker)
    ticker = 0
  }

  const elapsed = () => (startAt ? (Date.now() - startAt) / 1000 : 0)

  const wpm = () => {
    const secs = elapsed()
    if (secs < 0.5) return 0
    // Standard: a "word" is five characters
    return Math.round((typed.length / 5 / secs) * 60)
  }

  const reset = () => {
    stopTimer()
    target = TEXTS[Math.floor(Math.random() * TEXTS.length)]
    typed = ''
    startAt = 0
    errorsTotal = 0
    over = false
    api.setScore(0)
    setAcc('100%')
    setTime('0.0s')
    api.hideOverlay()
    hintEl.textContent = '直接开始打字（可点这里聚焦）'
    render()
  }

  const render = () => {
    const frag = document.createDocumentFragment()
    for (let i = 0; i < target.length; i++) {
      const span = document.createElement('span')
      span.textContent = target[i] === ' ' ? ' ' : target[i]
      if (i < typed.length) {
        span.className = typed[i] === target[i] ? 'ok' : 'bad'
      } else if (i === typed.length) {
        span.className = 'cursor'
      }
      frag.appendChild(span)
    }
    textEl.innerHTML = ''
    textEl.appendChild(frag)
  }

  const finish = () => {
    over = true
    stopTimer()
    const correct = [...typed].filter((c, i) => c === target[i]).length
    const acc = Math.round((correct / target.length) * 100)
    const speed = wpm()
    api.setScore(speed)
    api.gameOver('完成！', `${speed} WPM · 正确率 ${acc}% · ${elapsed().toFixed(1)} 秒`)
  }

  const onKey = (e) => {
    if (over) return
    if (e.metaKey || e.ctrlKey || e.altKey) return

    if (e.key === 'Backspace') {
      e.preventDefault()
      typed = typed.slice(0, -1)
      render()
      return
    }
    if (e.key.length !== 1) return
    e.preventDefault()

    if (!startAt) {
      startAt = Date.now()
      hintEl.textContent = ''
      ticker = setInterval(() => {
        setTime(`${elapsed().toFixed(1)}s`)
        api.setScore(wpm())
      }, 100)
    }

    if (e.key !== target[typed.length]) errorsTotal++
    typed += e.key

    const correct = [...typed].filter((c, i) => c === target[i]).length
    setAcc(`${Math.round((correct / typed.length) * 100)}%`)
    render()

    if (typed.length >= target.length) finish()
  }

  window.addEventListener('keydown', onKey)
  reset()

  return {
    restart: reset,
    destroy() {
      stopTimer()
      window.removeEventListener('keydown', onKey)
    },
  }
}
