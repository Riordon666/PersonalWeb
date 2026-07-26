export function mount(stage, api) {
  const viewport = stage.querySelector('[data-role="viewport"]')
  viewport.innerHTML = `
    <div class="hn-board">
      ${[0, 1, 2]
        .map((i) => `<div class="hn-peg" data-peg="${i}"><div class="hn-rod"></div><div class="hn-base"></div></div>`)
        .join('')}
    </div>
  `
  const boardEl = viewport.querySelector('.hn-board')

  let discs = 4
  let pegs = [[], [], []]
  let selected = null
  let steps = 0
  let over = false

  const setBest = api.addHudItem('最优', 15)
  const sizeBtn = api.addHudButton(`${discs} 层`, () => {
    discs = discs >= 7 ? 3 : discs + 1
    sizeBtn.textContent = `${discs} 层`
    reset()
  })

  const reset = () => {
    pegs = [[], [], []]
    for (let i = discs; i >= 1; i--) pegs[0].push(i)
    selected = null
    steps = 0
    over = false
    api.setScore(0)
    setBest(Math.pow(2, discs) - 1)
    api.hideOverlay()
    render()
  }

  const render = () => {
    boardEl.querySelectorAll('.hn-peg').forEach((pegEl, pi) => {
      pegEl.querySelectorAll('.hn-disc').forEach((d) => d.remove())
      pegEl.classList.toggle('selected', selected === pi)
      pegs[pi].forEach((size, di) => {
        const d = document.createElement('div')
        d.className = 'hn-disc'
        // Widths fan out from 42% to 96% regardless of disc count
        d.style.width = `${42 + (size / discs) * 54}%`
        d.style.bottom = `${8 + di * 11}%`
        d.style.setProperty('--disc-shift', String((size / discs) * 90))
        if (di === pegs[pi].length - 1 && selected === pi) d.classList.add('lifted')
        d.textContent = String(size)
        pegEl.appendChild(d)
      })
    })
  }

  const onClick = (e) => {
    if (over) return
    const pegEl = e.target.closest('.hn-peg')
    if (!pegEl) return
    const pi = Number(pegEl.dataset.peg)

    if (selected === null) {
      if (!pegs[pi].length) return
      selected = pi
      render()
      return
    }
    if (selected === pi) {
      selected = null
      render()
      return
    }

    const from = pegs[selected]
    const to = pegs[pi]
    const disc = from[from.length - 1]
    const target = to[to.length - 1]
    if (target !== undefined && target < disc) {
      // illegal: flash the peg
      pegEl.classList.add('deny')
      setTimeout(() => pegEl.classList.remove('deny'), 320)
      selected = null
      render()
      return
    }

    from.pop()
    to.push(disc)
    steps++
    selected = null
    api.setScore(steps)
    render()

    if (pegs[2].length === discs) {
      over = true
      const best = Math.pow(2, discs) - 1
      api.gameOver(
        steps === best ? '最优解！' : '搬完了',
        `${steps} 步（最优 ${best} 步 · ${discs} 层）`
      )
    }
  }

  boardEl.addEventListener('click', onClick)
  reset()

  return {
    restart: reset,
    destroy() {
      boardEl.removeEventListener('click', onClick)
    },
  }
}
