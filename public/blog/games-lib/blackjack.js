import { shuffle } from './core.js'

const SUITS = ['♠', '♥', '♦', '♣']
const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']

export function mount(stage, api) {
  const viewport = stage.querySelector('[data-role="viewport"]')
  viewport.innerHTML = `
    <div class="bj-wrap">
      <div class="bj-row">
        <div class="bj-label">庄家 <b class="bj-dealer-score">?</b></div>
        <div class="bj-hand bj-dealer"></div>
      </div>
      <div class="bj-message"></div>
      <div class="bj-row">
        <div class="bj-label">你 <b class="bj-player-score">0</b></div>
        <div class="bj-hand bj-player"></div>
      </div>
      <div class="bj-actions">
        <button class="game-btn primary" type="button" data-act="hit">要牌</button>
        <button class="game-btn" type="button" data-act="stand">停牌</button>
        <button class="game-btn" type="button" data-act="double">加倍</button>
        <button class="game-btn" type="button" data-act="deal">下一局</button>
      </div>
      <div class="bj-bets">
        ${[10, 25, 50].map((b) => `<button class="bj-bet" type="button" data-bet="${b}">押 ${b}</button>`).join('')}
      </div>
    </div>
  `
  const dealerEl = viewport.querySelector('.bj-dealer')
  const playerEl = viewport.querySelector('.bj-player')
  const dealerScoreEl = viewport.querySelector('.bj-dealer-score')
  const playerScoreEl = viewport.querySelector('.bj-player-score')
  const msgEl = viewport.querySelector('.bj-message')

  let deck = []
  let player = []
  let dealer = []
  let chips = 200
  let bet = 25
  let phase = 'betting' // betting | player | dealer | done
  let hideHole = true
  let rounds = 0
  let timer = 0

  const setBet = api.addHudItem('押注', bet)
  const setRounds = api.addHudItem('局数', 0)

  const newDeck = () => {
    const cards = []
    // Two decks, reshuffled when low
    for (let d = 0; d < 2; d++)
      for (const s of SUITS) for (const r of RANKS) cards.push({ s, r })
    return shuffle(cards)
  }

  const valueOf = (hand) => {
    let total = 0
    let aces = 0
    for (const c of hand) {
      if (c.r === 'A') {
        aces++
        total += 11
      } else if (['J', 'Q', 'K'].includes(c.r)) total += 10
      else total += Number(c.r)
    }
    while (total > 21 && aces) {
      total -= 10
      aces--
    }
    return total
  }

  const draw = () => {
    if (deck.length < 12) deck = newDeck()
    return deck.pop()
  }

  const reset = () => {
    clearTimeout(timer)
    deck = newDeck()
    chips = 200
    bet = 25
    rounds = 0
    api.setScore(chips)
    setBet(bet)
    setRounds(0)
    api.hideOverlay()
    deal()
  }

  const deal = () => {
    if (chips < bet) {
      msgEl.textContent = '筹码不够了，重新开始吧'
      phase = 'done'
      api.gameOver('筹码见底', `打了 ${rounds} 局`, { record: false })
      render()
      return
    }
    player = [draw(), draw()]
    dealer = [draw(), draw()]
    hideHole = true
    phase = 'player'
    msgEl.textContent = ''
    msgEl.className = 'bj-message'
    render()

    if (valueOf(player) === 21) {
      // natural blackjack pays 3:2
      hideHole = false
      const dealerBJ = valueOf(dealer) === 21
      settle(dealerBJ ? 'push' : 'blackjack')
    }
  }

  const settle = (result) => {
    phase = 'done'
    rounds++
    setRounds(rounds)
    let delta = 0
    let text = ''
    if (result === 'blackjack') {
      delta = Math.round(bet * 1.5)
      text = 'Blackjack！'
    } else if (result === 'win') {
      delta = bet
      text = '你赢了'
    } else if (result === 'push') {
      delta = 0
      text = '平局'
    } else if (result === 'bust') {
      delta = -bet
      text = '爆了'
    } else {
      delta = -bet
      text = '庄家赢'
    }
    chips += delta
    api.setScore(chips)
    msgEl.textContent = `${text}${delta ? `  ${delta > 0 ? '+' : ''}${delta}` : ''}`
    msgEl.className = `bj-message ${delta > 0 ? 'win' : delta < 0 ? 'lose' : ''}`
    render()

    if (chips <= 0) {
      api.gameOver('筹码输光了', `打了 ${rounds} 局`, { record: false })
    }
  }

  const dealerPlay = () => {
    phase = 'dealer'
    hideHole = false
    render()
    const tick = () => {
      // Dealer must hit until 17
      if (valueOf(dealer) < 17) {
        dealer.push(draw())
        render()
        timer = setTimeout(tick, 520)
        return
      }
      const d = valueOf(dealer)
      const p = valueOf(player)
      if (d > 21 || p > d) settle('win')
      else if (p === d) settle('push')
      else settle('lose')
    }
    timer = setTimeout(tick, 520)
  }

  const hit = (isDouble = false) => {
    if (phase !== 'player') return
    player.push(draw())
    render()
    const v = valueOf(player)
    if (v > 21) {
      hideHole = false
      settle('bust')
    } else if (isDouble || v === 21) {
      dealerPlay()
    }
  }

  const render = () => {
    const cardHtml = (c, hidden) =>
      hidden
        ? '<div class="bj-card facedown"></div>'
        : `<div class="bj-card ${c.s === '♥' || c.s === '♦' ? 'red' : ''}"><span>${c.r}</span><b>${c.s}</b></div>`

    playerEl.innerHTML = player.map((c) => cardHtml(c, false)).join('')
    dealerEl.innerHTML = dealer.map((c, i) => cardHtml(c, hideHole && i === 1)).join('')
    playerScoreEl.textContent = String(valueOf(player))
    dealerScoreEl.textContent = hideHole ? '?' : String(valueOf(dealer))

    viewport.querySelectorAll('[data-act]').forEach((b) => {
      const act = b.dataset.act
      if (act === 'deal') b.disabled = phase !== 'done'
      else if (act === 'double') b.disabled = phase !== 'player' || player.length !== 2 || chips < bet * 2
      else b.disabled = phase !== 'player'
    })
    viewport.querySelectorAll('.bj-bet').forEach((b) => {
      b.classList.toggle('active', Number(b.dataset.bet) === bet)
      b.disabled = phase === 'player' || phase === 'dealer'
    })
  }

  const onClick = (e) => {
    const betBtn = e.target.closest('.bj-bet')
    if (betBtn && !betBtn.disabled) {
      bet = Number(betBtn.dataset.bet)
      setBet(bet)
      render()
      return
    }
    const act = e.target.closest('[data-act]')?.dataset.act
    if (!act) return
    if (act === 'hit') hit()
    else if (act === 'stand') {
      if (phase === 'player') dealerPlay()
    } else if (act === 'double') {
      if (phase === 'player' && player.length === 2 && chips >= bet * 2) {
        bet *= 2
        setBet(bet)
        hit(true)
      }
    } else if (act === 'deal') {
      // Halve a doubled bet back for the next round
      if (bet > 50) bet = 50
      setBet(bet)
      deal()
    }
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
