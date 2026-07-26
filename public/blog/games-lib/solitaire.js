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
    <div class="sol-wrap">
      <div class="sol-top">
        <div class="sol-stock" data-pile="stock"></div>
        <div class="sol-waste" data-pile="waste"></div>
        <div class="sol-spacer"></div>
        ${[0, 1, 2, 3].map((i) => `<div class="sol-foundation" data-pile="foundation" data-i="${i}"></div>`).join('')}
      </div>
      <div class="sol-tableau"></div>
    </div>
  `
  const stockEl = viewport.querySelector('[data-pile="stock"]')
  const wasteEl = viewport.querySelector('[data-pile="waste"]')
  const tableauEl = viewport.querySelector('.sol-tableau')

  let stock = []
  let waste = []
  let foundations = [[], [], [], []]
  let piles = []
  let selection = null // {from:'waste'|'pile', pileIdx, cardIdx}
  let score = 0
  let moves = 0
  let over = false

  const setMoves = api.addHudItem('步数', 0)
  api.addHudButton('自动收牌', () => autoCollect())

  const rankVal = (r) => RANKS.indexOf(r) + 1

  const reset = () => {
    const deck = shuffle(
      SUITS.flatMap((su) => RANKS.map((r) => ({ r, ...su, up: false })))
    )
    piles = []
    let i = 0
    for (let p = 0; p < 7; p++) {
      const pile = []
      for (let c = 0; c <= p; c++) {
        const card = deck[i++]
        card.up = c === p
        pile.push(card)
      }
      piles.push(pile)
    }
    stock = deck.slice(i).map((c) => ({ ...c, up: false }))
    waste = []
    foundations = [[], [], [], []]
    selection = null
    score = 0
    moves = 0
    over = false
    api.setScore(0)
    setMoves(0)
    api.hideOverlay()
    render()
  }

  const canStack = (card, onto) => {
    if (!onto) return card.r === 'K'
    return onto.red !== card.red && rankVal(onto.r) === rankVal(card.r) + 1
  }

  const canFound = (card, pile) => {
    if (!pile.length) return card.r === 'A'
    const top = pile[pile.length - 1]
    return top.s === card.s && rankVal(card.r) === rankVal(top.r) + 1
  }

  const bump = (n) => {
    score = Math.max(0, score + n)
    api.setScore(score)
    moves++
    setMoves(moves)
  }

  const checkWin = () => {
    if (foundations.every((f) => f.length === 13)) {
      over = true
      api.gameOver('通关！', `${moves} 步，得分 ${score}`)
    }
  }

  const flipTop = (pile) => {
    if (pile.length && !pile[pile.length - 1].up) {
      pile[pile.length - 1].up = true
      bump(5)
    }
  }

  const drawFromStock = () => {
    if (over) return
    if (!stock.length) {
      if (!waste.length) return
      stock = waste.reverse().map((c) => ({ ...c, up: false }))
      waste = []
      bump(-2)
    } else {
      // Draw one at a time — friendlier on a phone
      const card = stock.pop()
      card.up = true
      waste.push(card)
      moves++
      setMoves(moves)
    }
    selection = null
    render()
  }

  const selectedCards = () => {
    if (!selection) return []
    if (selection.from === 'waste') return waste.slice(-1)
    return piles[selection.pileIdx].slice(selection.cardIdx)
  }

  const removeSelected = () => {
    if (selection.from === 'waste') waste.pop()
    else piles[selection.pileIdx].splice(selection.cardIdx)
  }

  const tryMoveTo = (target) => {
    const cards = selectedCards()
    if (!cards.length) return false

    if (target.kind === 'foundation') {
      if (cards.length !== 1) return false
      const f = foundations[target.i]
      if (!canFound(cards[0], f)) return false
      removeSelected()
      f.push(cards[0])
      bump(10)
      if (selection.from === 'pile') flipTop(piles[selection.pileIdx])
      return true
    }

    const pile = piles[target.i]
    const top = pile.length ? pile[pile.length - 1] : null
    if (top && !top.up) return false
    if (!canStack(cards[0], top)) return false
    removeSelected()
    pile.push(...cards)
    bump(selection.from === 'waste' ? 5 : 0)
    if (selection.from === 'pile') flipTop(piles[selection.pileIdx])
    return true
  }

  const autoCollect = () => {
    if (over) return
    let moved = true
    let guard = 0
    while (moved && guard++ < 60) {
      moved = false
      for (let p = 0; p < piles.length; p++) {
        const pile = piles[p]
        if (!pile.length) continue
        const card = pile[pile.length - 1]
        if (!card.up) continue
        for (let f = 0; f < 4; f++) {
          if (canFound(card, foundations[f])) {
            pile.pop()
            foundations[f].push(card)
            bump(10)
            flipTop(pile)
            moved = true
            break
          }
        }
      }
      if (waste.length) {
        const card = waste[waste.length - 1]
        for (let f = 0; f < 4; f++) {
          if (canFound(card, foundations[f])) {
            waste.pop()
            foundations[f].push(card)
            bump(10)
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
    c.up
      ? `<div class="sol-card${c.red ? ' red' : ''}${extra}"><span>${c.r}</span><b>${c.s}</b></div>`
      : `<div class="sol-card facedown${extra}"></div>`

  const render = () => {
    stockEl.innerHTML = stock.length
      ? '<div class="sol-card facedown"></div>'
      : '<div class="sol-empty">↻</div>'
    wasteEl.innerHTML = waste.length
      ? cardHtml(waste[waste.length - 1], selection?.from === 'waste' ? ' sel' : '')
      : '<div class="sol-empty"></div>'

    viewport.querySelectorAll('[data-pile="foundation"]').forEach((el, i) => {
      const f = foundations[i]
      el.innerHTML = f.length
        ? cardHtml(f[f.length - 1])
        : `<div class="sol-empty">${SUITS[i].s}</div>`
    })

    tableauEl.innerHTML = ''
    piles.forEach((pile, i) => {
      const col = document.createElement('div')
      col.className = 'sol-pile'
      col.dataset.pile = 'tableau'
      col.dataset.i = String(i)
      if (!pile.length) col.innerHTML = '<div class="sol-empty"></div>'
      pile.forEach((c, ci) => {
        const isSel =
          selection?.from === 'pile' && selection.pileIdx === i && ci >= selection.cardIdx
        const wrap = document.createElement('div')
        wrap.className = 'sol-slot'
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
    const stockHit = e.target.closest('[data-pile="stock"]')
    if (stockHit) return drawFromStock()

    const wasteHit = e.target.closest('[data-pile="waste"]')
    if (wasteHit) {
      if (!waste.length) return
      selection = selection?.from === 'waste' ? null : { from: 'waste' }
      render()
      return
    }

    const foundHit = e.target.closest('[data-pile="foundation"]')
    if (foundHit) {
      if (!selection) return
      if (tryMoveTo({ kind: 'foundation', i: Number(foundHit.dataset.i) })) {
        selection = null
        render()
        checkWin()
      }
      return
    }

    const pileHit = e.target.closest('[data-pile="tableau"]')
    if (!pileHit) return
    const pileIdx = Number(pileHit.dataset.i)

    if (selection) {
      if (tryMoveTo({ kind: 'tableau', i: pileIdx })) {
        selection = null
        render()
        checkWin()
        return
      }
    }

    const slot = e.target.closest('.sol-slot')
    const pile = piles[pileIdx]
    if (!pile.length) {
      selection = null
      render()
      return
    }
    const cardIdx = slot ? Number(slot.dataset.card) : pile.length - 1
    if (!pile[cardIdx].up) return
    if (selection?.from === 'pile' && selection.pileIdx === pileIdx && selection.cardIdx === cardIdx) {
      selection = null
    } else {
      selection = { from: 'pile', pileIdx, cardIdx }
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
