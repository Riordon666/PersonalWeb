export function mount(stage, api) {
  const viewport = stage.querySelector('[data-role="viewport"]')
  viewport.innerHTML = `
    <div class="simon-wrap">
      <div class="simon-board">
        ${[0, 1, 2, 3]
          .map((i) => `<button class="simon-pad" type="button" data-pad="${i}" style="--pad:${i}"></button>`)
          .join('')}
        <div class="simon-center"><span class="simon-status">准备…</span></div>
      </div>
    </div>
  `
  const pads = [...viewport.querySelectorAll('.simon-pad')]
  const statusEl = viewport.querySelector('.simon-status')
  const boardEl = viewport.querySelector('.simon-board')

  const FREQ = [329.6, 392.0, 493.9, 587.3]
  let audio = null
  let sequence = []
  let inputPos = 0
  let phase = 'idle' // idle | playing | input | over
  let timers = []

  const later = (fn, ms) => {
    const t = setTimeout(fn, ms)
    timers.push(t)
    return t
  }
  const clearTimers = () => {
    timers.forEach(clearTimeout)
    timers = []
  }

  const tone = (i, dur = 0.28) => {
    try {
      if (!audio) audio = new (window.AudioContext || window.webkitAudioContext)()
      if (audio.state === 'suspended') audio.resume()
      const osc = audio.createOscillator()
      const gain = audio.createGain()
      osc.type = 'sine'
      osc.frequency.value = FREQ[i]
      gain.gain.setValueAtTime(0.001, audio.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.22, audio.currentTime + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + dur)
      osc.connect(gain).connect(audio.destination)
      osc.start()
      osc.stop(audio.currentTime + dur + 0.05)
    } catch {}
  }

  const flash = (i, ms) => {
    pads[i].classList.add('lit')
    tone(i, ms / 1000)
    later(() => pads[i].classList.remove('lit'), ms)
  }

  const setStatus = (t) => {
    statusEl.textContent = t
  }

  const playback = () => {
    phase = 'playing'
    boardEl.classList.add('locked')
    setStatus(`第 ${sequence.length} 轮`)
    const beat = Math.max(280, 620 - sequence.length * 22)
    sequence.forEach((padIdx, i) => {
      later(() => flash(padIdx, beat * 0.62), 600 + i * beat)
    })
    later(() => {
      phase = 'input'
      inputPos = 0
      boardEl.classList.remove('locked')
      setStatus('你来')
    }, 600 + sequence.length * beat)
  }

  const nextRound = () => {
    sequence.push(Math.floor(Math.random() * 4))
    api.setScore(sequence.length - 1)
    playback()
  }

  const reset = () => {
    clearTimers()
    sequence = []
    inputPos = 0
    phase = 'idle'
    api.setScore(0)
    api.hideOverlay()
    boardEl.classList.add('locked')
    setStatus('准备…')
    later(nextRound, 700)
  }

  const onPad = (e) => {
    const el = e.target.closest('.simon-pad')
    if (!el || phase !== 'input') return
    const i = Number(el.dataset.pad)
    flash(i, 220)
    if (i === sequence[inputPos]) {
      inputPos++
      if (inputPos === sequence.length) {
        api.setScore(sequence.length)
        setStatus('✓')
        boardEl.classList.add('locked')
        later(nextRound, 700)
      }
    } else {
      phase = 'over'
      boardEl.classList.add('locked')
      setStatus('✗')
      api.gameOver('记错了', `完整复现了 ${sequence.length - 1} 轮`)
    }
  }

  boardEl.addEventListener('click', onPad)
  reset()

  return {
    restart: reset,
    destroy() {
      clearTimers()
      boardEl.removeEventListener('click', onPad)
      if (audio) audio.close().catch(() => {})
    },
  }
}
