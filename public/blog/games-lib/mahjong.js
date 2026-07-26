import { shuffle } from './core.js'

const FACES = ['🀇', '🀈', '🀉', '🀊', '🀋', '🀌', '🀍', '🀎', '🀏', '🀐', '🀑', '🀒', '🀓', '🀔', '🀕', '🀖', '🀗', '🀘']

// Three stacked layers; each entry is [col, row] on a half-step grid
const LAYOUT = [
  // bottom layer: 8x5
  ...Array.from({ length: 5 }, (_, r) => Array.from({ length: 8 }, (_, c) => [c, r, 0])).flat(),
  // middle layer: 6x3 inset
  ...Array.from({ length: 3 }, (_, r) => Array.from({ length: 6 }, (_, c) => [c + 1, r + 1, 1])).flat(),
  // top layer: 4x1
  ...Array.from({ length: 1 }, (_, r) => Array.from({ length: 4 }, (_, c) => [c + 2, r + 2, 2])).flat(),
]

export function mount(stage, api) {
  const viewport = stage.querySelector('[data-role="viewport"]')
  viewport.innerHTML = '<div class="mj-board"></div>'
  const board = viewport.querySelector('.mj-board')

  let tiles = []
  let selected = null
  let left = 0
  let seconds = 0
  let ticker = 0
  let over = false

  const setTime = api.addHudItem('用时', '0s')
  api.addHudButton('提示', () => hint())

  const stopTimer = () => {
    clearInterval(ticker)
    ticker = 0
  }

  const build = () => {
    // Pair up faces to exactly fill the layout
    const slots = LAYOUT.length - (LAYOUT.length % 2)
    const pairs = slots / 2
    const deck = []
    for (let i = 0; i < pairs; i++) {
      const face = FACES[i % FACES.length]
      deck.push(face, face)
    }
    const mixed = shuffle(deck)
    tiles = LAYOUT.slice(0, slots).map(([c, r, z], i) => ({
      id: i,
      c, r, z,
      face: mixed[i],
      gone: false,
    }))
  }

  const covered = (t) =>
    tiles.some(
      (o) =>
        !o.gone &&
        o.z === t.z + 1 &&
        Math.abs(o.c - t.c) < 1 &&
        Math.abs(o.r - t.r) < 1
    )

  const freeSide = (t) => {
    const blockedLeft = tiles.some((o) => !o.gone && o.z === t.z && o.r === t.r && o.c === t.c - 1)
    const blockedRight = tiles.some((o) => !o.gone && o.z === t.z && o.r === t.r && o.c === t.c + 1)
    return !blockedLeft || !blockedRight
  }

  const selectable = (t) => !t.gone && !covered(t) && freeSide(t)

  const reset = () => {
    stopTimer()
    build()
    selected = null
    left = tiles.length
    seconds = 0
    over = false
    api.setScore(left)
    setTime('0s')
    api.hideOverlay()
    render()
    ticker = setInterval(() => {
      seconds++
      setTime(`${seconds}s`)
    }, 1000)
  }

  const render = () => {
    board.innerHTML = ''
    const maxC = Math.max(...LAYOUT.map((l) => l[0])) + 1
    const maxR = Math.max(...LAYOUT.map((l) => l[1])) + 1
    board.style.setProperty('--mj-cols', String(maxC))
    board.style.setProperty('--mj-rows', String(maxR))

    // draw bottom layers first so upper tiles overlap correctly
    for (const t of [...tiles].sort((a, b) => a.z - b.z || a.r - b.r || a.c - b.c)) {
      if (t.gone) continue
      const el = document.createElement('button')
      el.type = 'button'
      el.className = 'mj-tile'
      el.dataset.id = String(t.id)
      el.textContent = t.face
      el.style.left = `calc(${(t.c / maxC) * 100}% + ${t.z * 4}px)`
      el.style.top = `calc(${(t.r / maxR) * 100}% - ${t.z * 5}px)`
      el.style.width = `${(1 / maxC) * 100}%`
      el.style.height = `${(1 / maxR) * 100}%`
      el.style.zIndex = String(t.z * 10 + t.r)
      if (!selectable(t)) el.classList.add('locked')
      if (selected === t.id) el.classList.add('sel')
      board.appendChild(el)
    }
  }

  const findPair = () => {
    const free = tiles.filter(selectable)
    for (let i = 0; i < free.length; i++)
      for (let j = i + 1; j < free.length; j++) {
        if (free[i].face === free[j].face) return [free[i], free[j]]
      }
    return null
  }

  const hint = () => {
    const pair = findPair()
    if (!pair) return
    pair.forEach((t) => {
      const el = board.querySelector(`[data-id="${t.id}"]`)
      el?.classList.add('hint')
      setTimeout(() => el?.classList.remove('hint'), 1100)
    })
  }

  const onClick = (e) => {
    const el = e.target.closest('.mj-tile')
    if (!el || over) return
    const id = Number(el.dataset.id)
    const t = tiles.find((x) => x.id === id)
    if (!t || !selectable(t)) return

    if (selected === null) {
      selected = id
      render()
      return
    }
    if (selected === id) {
      selected = null
      render()
      return
    }

    const first = tiles.find((x) => x.id === selected)
    if (first && first.face === t.face) {
      first.gone = true
      t.gone = true
      left -= 2
      api.setScore(left)
      selected = null
      render()

      if (left === 0) {
        over = true
        stopTimer()
        api.gameOver('全部消除！', `用时 ${seconds} 秒`, { won: true })
      } else if (!findPair()) {
        over = true
        stopTimer()
        api.gameOver('没有可消的牌了', `还剩 ${left} 张`, { record: false })
      }
    } else {
      selected = id
      render()
    }
  }

  board.addEventListener('click', onClick)
  reset()

  return {
    restart: reset,
    destroy() {
      stopTimer()
      board.removeEventListener('click', onClick)
    },
  }
}
