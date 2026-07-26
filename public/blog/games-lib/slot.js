import { randInt } from './core.js'

const SYMBOLS = ['🍒', '🍋', '🔔', '⭐', '💎', '7️⃣']
// Payout multiplier for three of a kind, by symbol index
const TRIPLE = [4, 6, 10, 16, 30, 60]
const PAIR = 1

export function mount(stage, api) {
  const viewport = stage.querySelector('[data-role="viewport"]')
  viewport.innerHTML = `
    <div class="sl-wrap">
      <div class="sl-machine">
        <div class="sl-window">
          ${[0, 1, 2].map((i) => `<div class="sl-reel" data-reel="${i}"><div class="sl-strip"></div></div>`).join('')}
        </div>
        <div class="sl-payline"></div>
      </div>
      <div class="sl-result">按下拉杆试试手气</div>
      <div class="sl-bets">
        ${[5, 10, 25].map((b) => `<button class="sl-bet" type="button" data-bet="${b}">押 ${b}</button>`).join('')}
        <button class="sl-lever" type="button" data-act="spin">拉杆</button>
      </div>
    </div>
  `
  const reels = [...viewport.querySelectorAll('.sl-reel')]
  const resultEl = viewport.querySelector('.sl-result')

  let credits = 100
  let bet = 10
  let spinning = false
  let timers = []
  let bestCredits = 100

  const setBet = api.addHudItem('押注', bet)
  const setSpins = api.addHudItem('转数', 0)
  let spins = 0

  const later = (fn, ms) => {
    const t = setTimeout(fn, ms)
    timers.push(t)
    return t
  }
  const clearTimers = () => {
    timers.forEach(clearTimeout)
    timers = []
  }

  const fillStrip = (reel, finalIdx) => {
    const strip = reel.querySelector('.sl-strip')
    // 12 spinning symbols then the resting one, so the stop reads naturally
    const seq = Array.from({ length: 12 }, () => SYMBOLS[randInt(0, SYMBOLS.length - 1)])
    seq.push(SYMBOLS[finalIdx])
    strip.innerHTML = seq.map((s) => `<div class="sl-sym">${s}</div>`).join('')
    strip.style.transition = 'none'
    strip.style.transform = 'translateY(0)'
    return strip
  }

  const reset = () => {
    clearTimers()
    credits = 100
    bet = 10
    spins = 0
    spinning = false
    api.setScore(credits)
    setBet(bet)
    setSpins(0)
    api.hideOverlay()
    resultEl.textContent = '按下拉杆试试手气'
    resultEl.className = 'sl-result'
    reels.forEach((r, i) => {
      const strip = fillStrip(r, i)
      strip.style.transform = `translateY(-${12 * 100}%)`
    })
    viewport.querySelectorAll('.sl-bet').forEach((b) => {
      b.classList.toggle('active', Number(b.dataset.bet) === bet)
    })
  }

  const spin = () => {
    if (spinning) return
    if (credits < bet) {
      resultEl.textContent = '筹码不够了，重新开始吧'
      resultEl.className = 'sl-result lose'
      return
    }
    spinning = true
    credits -= bet
    spins++
    setSpins(spins)
    api.setScore(credits)
    resultEl.textContent = '转动中…'
    resultEl.className = 'sl-result'

    const finals = [randInt(0, 5), randInt(0, 5), randInt(0, 5)]
    reels.forEach((reel, i) => {
      const strip = fillStrip(reel, finals[i])
      // Force layout so the transition actually animates from the top
      void strip.offsetHeight
      strip.style.transition = `transform ${900 + i * 320}ms cubic-bezier(0.15, 0.7, 0.2, 1)`
      strip.style.transform = `translateY(-${12 * 100}%)`
    })

    later(() => settle(finals), 900 + 2 * 320 + 120)
  }

  const settle = (finals) => {
    const [a, b, c] = finals
    let payout = 0
    let label = ''

    if (a === b && b === c) {
      payout = bet * TRIPLE[a]
      label = `三连 ${SYMBOLS[a]}${SYMBOLS[a]}${SYMBOLS[a]}！×${TRIPLE[a]}`
    } else if (a === b || b === c || a === c) {
      payout = bet * PAIR
      label = '两个相同，回本'
    } else {
      label = '没中，再来一次'
    }

    credits += payout
    api.setScore(credits)
    bestCredits = Math.max(bestCredits, credits)
    resultEl.textContent = payout ? `${label}  +${payout}` : label
    resultEl.className = `sl-result ${payout > bet ? 'win' : payout ? '' : 'lose'}`
    spinning = false

    if (credits <= 0) {
      api.gameOver('筹码见底', `转了 ${spins} 次，最高到过 ${bestCredits} 筹码`, { record: false })
    }
  }

  const onClick = (e) => {
    const betBtn = e.target.closest('.sl-bet')
    if (betBtn) {
      bet = Number(betBtn.dataset.bet)
      setBet(bet)
      viewport.querySelectorAll('.sl-bet').forEach((b) => b.classList.toggle('active', b === betBtn))
      return
    }
    if (e.target.closest('[data-act="spin"]')) spin()
  }

  viewport.addEventListener('click', onClick)
  reset()

  return {
    restart: reset,
    destroy() {
      clearTimers()
      viewport.removeEventListener('click', onClick)
    },
  }
}
