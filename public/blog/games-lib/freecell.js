import { shuffle } from './core.js'

const SUITS = [
  { s: '♠', red: false },
  { s: '♥', red: true },
  { s: '♦', red: true },
  { s: '♣', red: false },
]
const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']

export function mount(stage, api) {
  const viewport = stage.querySelector('[data-role="viewport"]')
  viewport.innerHTML = `
    <div class="fc-wrap">
      <div class="fc-top">
        ${[0, 1, 2, 3].map((i) => `<div class="fc-free" data-pile="free" data-i="${i}"></div>`).join('')}
        <div class="fc-spacer"></div>
        ${[0, 1, 2, 3].map((i) => `<div class="fc-foundation" data-pile="foundation" data-i="${i}"></div>`).join('')}
      </div>
      <div class="fc-tableau"></div>
    </div>
  `
  const tableauEl = viewport.querySelector('.fc-tableau')

  let free = [null, null, null, null]
  let foundations = [[], [], [], []]
  let piles = []
  let selection = null
  let moves = 0
  let wins = 0
  let over = false

  const setFreeHud = api.addHudItem('空位', 4)
  api.addHudButton('自动收牌', () => autoCollect())

  const rankVal = (r) => RANKS.indexOf(r) + 1

  const reset = () => {
    const deck = shuffle(SUITS.flatMap((su) => RANKS.map((r) => ({ r, ...su }))))
    piles = Array.from({ length: 8 }, () => [])
    deck.forEach((c, i) => piles[i % 8].push(c))
    free = [null, null, null, null]
    foundations = [[], [], [], []]
    selection = null
    moves = 0
    over = false
    api.setScore(0)
    setFreeHud(4)
    api.hideOverlay()
    render()
  }

  const canStack = (card, onto) => {
    if (!onto) return true
    return onto.red !== card.red && rankVal(onto.r) === rankVal(card.r) + 1
  }

  const canFound = (card, pile) => {
    if (!pile.length) return card.r === 'A'
    const top = pile[pile.length - 1]
    return top.s === card.s && rankVal(card.r) === rankVal(top.r) + 1
  }

  // A run is movable only if enough free cells + empty columns exist
  const maxMovable = (targetEmpty) => {
    const freeCells = free.filter((f) => !f).length
    const emptyCols = piles.filter((p) => !p.length).length - (targetEmpty ? 1 : 0)
    return (freeCells + 1) * Math.pow(2, Math.max(0, emptyCols))
  }

  const isRun = (cards) => {
    for (let i = 1; i < cards.length; i++) {
      if (!canStack(cards[i], cards[i - 1])) return false
    }
    return true
  }

  const bump = () => {
    moves++
    api.setScore(moves)
    setFreeHud(free.filter((f) => !f).length)
  }

  const checkWin = () => {
    if (foundations.every((f) => f.length === 13)) {
      over = true
      wins++
      api.gameOver('通关！', `${moves} 步完成`, { won: true })
    }
  }

  const selectedCards = () => {
    if (!selection) return []
    if (selection.from === 'free') return free[selection.i] ? [free[selection.i]] : []
    return piles[selection.i].slice(selection.cardIdx)
  }

  const removeSelected = () => {
    if (selection.from === 'free') free[selection.i] = null
    else piles[selection.i].splice(selection.cardIdx)
  }

  const tryMoveTo = (target) => {
    const cards = selectedCards()
    if (!cards.length) return false

    if (target.kind === 'free') {
      if (cards.length !== 1 || free[target.i]) return false
      removeSelected()
      free[target.i] = cards[0]
      bump()
      return true
    }
    if (target.kind === 'foundation') {
      if (cards.length !== 1) return false
      if (!canFound(cards[0], foundations[target.i])) return false
      removeSelected()
      foundations[target.i].push(cards[0])
      bump()
      return true
    }

    const pile = piles[target.i]
    const top = pile.length ? pile[pile.length - 1] : null
    if (!canStack(cards[0], top)) return false
    if (!isRun(cards)) return false
    if (cards.length > maxMovable(!pile.length)) return false
    removeSelected()
    pile.push(...cards)
    bump()
    return true
  }

  const autoCollect = () => {
    if (over) return
    let moved = true
    let guard = 0
    while (moved && guard++ < 80) {
      moved = false
      for (let i = 0; i < 4; i++) {
        const c = free[i]
        if (!c) continue
        for (let f = 0; f < 4; f++) {
          if (canFound(c, foundations[f])) {
            free[i] = null
            foundations[f].push(c)
            bump()
            moved = true
            break
          }
        }
      }
      for (const pile of piles) {
        if (!pile.length) continue
        const c = pile[pile.length - 1]
        for (let f = 0; f < 4; f++) {
          if (canFound(c, foundations[f])) {
            pile.pop()
            foundations[f].push(c)
            bump()
            moved = true
            break
          }
        }
      }
    }
    selection = null
    render()
    checkWin()
  }

  const cardHtml = (c, extra = '') =>
    `<div class="fc-card${c.red ? ' red' : ''}${extra}"><span>${c.r}</span><b>${c.s}</b></div>`

  const render = () => {
    viewport.querySelectorAll('[data-pile="free"]').forEach((el, i) => {
      el.innerHTML = free[i]
        ? cardHtml(free[i], selection?.from === 'free' && selection.i === i ? ' sel' : '')
        : '<div class="fc-empty"></div>'
    })
    viewport.querySelectorAll('[data-pile="foundation"]').forEach((el, i) => {
      const f = foundations[i]
      el.innerHTML = f.length ? cardHtml(f[f.length - 1]) : `<div class="fc-empty">${SUITS[i].s}</div>`
    })

    tableauEl.innerHTML = ''
    piles.forEach((pile, i) => {
      const col = document.createElement('div')
      col.className = 'fc-pile'
      col.dataset.pile = 'tableau'
      col.dataset.i = String(i)
      if (!pile.length) col.innerHTML = '<div class="fc-empty"></div>'
      pile.forEach((c, ci) => {
        const isSel = selection?.from === 'pile' && selection.i === i && ci >= selection.cardIdx
        const wrap = document.createElement('div')
        wrap.className = 'fc-slot'
        wrap.style.top = `${ci * 6}%`
        wrap.dataset.card = String(ci)
        wrap.innerHTML = cardHtml(c, isSel ? ' sel' : '')
        col.appendChild(wrap)
      })
      tableauEl.appendChild(col)
    })
  }

  const onClick = (e) => {
    if (over) return

    const freeHit = e.target.closest('[data-pile="free"]')
    if (freeHit) {
      const i = Number(freeHit.dataset.i)
      if (selection && tryMoveTo({ kind: 'free', i })) {
        selection = null
        render()
        return
      }
      if (free[i]) {
        selection = selection?.from === 'free' && selection.i === i ? null : { from: 'free', i }
        render()
      }
      return
    }

    const foundHit = e.target.closest('[data-pile="foundation"]')
    if (foundHit) {
      if (selection && tryMoveTo({ kind: 'foundation', i: Number(foundHit.dataset.i) })) {
        selection = null
        render()
        checkWin()
      }
      return
    }

    const pileHit = e.target.closest('[data-pile="tableau"]')
    if (!pileHit) return
    const i = Number(pileHit.dataset.i)

    if (selection && tryMoveTo({ kind: 'tableau', i })) {
      selection = null
      render()
      checkWin()
      return
    }

    const pile = piles[i]
    if (!pile.length) {
      selection = null
      render()
      return
    }
    const slot = e.target.closest('.fc-slot')
    const cardIdx = slot ? Number(slot.dataset.card) : pile.length - 1
    if (selection?.from === 'pile' && selection.i === i && selection.cardIdx === cardIdx) {
      selection = null
    } else {
      selection = { from: 'pile', i, cardIdx }
    }
    render()
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
