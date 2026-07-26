export function mount(stage, api) {
  const viewport = stage.querySelector('[data-role="viewport"]')
  viewport.innerHTML = '<div class="memory-board"></div>'
  const board = viewport.querySelector('.memory-board')

  const SYMBOLS = ['◆', '●', '▲', '★', '✦', '❖', '♦', '✿']
  let cards = []
  let flipped = []
  let matched = 0
  let moves = 0
  let locked = false
  let timer = 0

  const reset = () => {
    clearTimeout(timer)
    cards = [...SYMBOLS, ...SYMBOLS]
      .map((sym, i) => ({ sym, id: i }))
      .sort(() => Math.random() - 0.5)
    flipped = []
    matched = 0
    moves = 0
    locked = false
    api.setScore(0)
    api.hideOverlay()
    render()
  }

  const render = () => {
    board.innerHTML = ''
    cards.forEach((card, idx) => {
      const el = document.createElement('button')
      el.type = 'button'
      el.className = 'memory-card'
      el.dataset.idx = String(idx)
      el.innerHTML = `
        <span class="memory-face cover"></span>
        <span class="memory-face front">${card.sym}</span>
      `
      el.style.setProperty('--card-hue-shift', String((SYMBOLS.indexOf(card.sym) * 18) % 360))
      board.appendChild(el)
    })
  }

  const onClick = (e) => {
    const el = e.target.closest('.memory-card')
    if (!el || locked) return
    if (el.classList.contains('is-flipped') || el.classList.contains('is-matched')) return

    el.classList.add('is-flipped')
    flipped.push(el)
    if (flipped.length < 2) return

    moves++
    api.setScore(moves)
    const [a, b] = flipped
    const same = cards[Number(a.dataset.idx)].sym === cards[Number(b.dataset.idx)].sym

    if (same) {
      a.classList.add('is-matched')
      b.classList.add('is-matched')
      flipped = []
      matched++
      if (matched === SYMBOLS.length) {
        api.gameOver('全部配对完成', `用了 ${moves} 步`)
      }
    } else {
      locked = true
      timer = setTimeout(() => {
        a.classList.remove('is-flipped')
        b.classList.remove('is-flipped')
        flipped = []
        locked = false
      }, 700)
    }
  }

  board.addEventListener('click', onClick)
  reset()

  return {
    restart: reset,
    destroy() {
      clearTimeout(timer)
      board.removeEventListener('click', onClick)
    },
  }
}
