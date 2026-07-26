const MOVES = [
  { id: 0, name: '石头', icon: '✊' },
  { id: 1, name: '布', icon: '✋' },
  { id: 2, name: '剪刀', icon: '✌️' },
]
// beats[a] = the move that a defeats
const BEATS = { 0: 2, 1: 0, 2: 1 }

export function mount(stage, api) {
  const viewport = stage.querySelector('[data-role="viewport"]')
  viewport.innerHTML = `
    <div class="rps-wrap">
      <div class="rps-arena">
        <div class="rps-side"><div class="rps-hand" data-role="ai">🤖</div><span>AI</span></div>
        <div class="rps-verdict">出拳吧</div>
        <div class="rps-side"><div class="rps-hand" data-role="me">🙂</div><span>你</span></div>
      </div>
      <div class="rps-buttons">
        ${MOVES.map((m) => `<button class="rps-btn" type="button" data-m="${m.id}"><span>${m.icon}</span>${m.name}</button>`).join('')}
      </div>
      <div class="rps-note"></div>
    </div>
  `
  const aiHand = viewport.querySelector('[data-role="ai"]')
  const myHand = viewport.querySelector('[data-role="me"]')
  const verdict = viewport.querySelector('.rps-verdict')
  const note = viewport.querySelector('.rps-note')

  let wins = 0
  let losses = 0
  let draws = 0
  let history = []
  // Markov table: counts[prev][next]
  let counts = [
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
  ]
  let busy = false

  const setRecord = api.addHudItem('战绩', '0-0-0')
  const setRounds = api.addHudItem('回合', 0)

  const reset = () => {
    wins = 0
    losses = 0
    draws = 0
    history = []
    counts = [
      [0, 0, 0],
      [0, 0, 0],
      [0, 0, 0],
    ]
    busy = false
    api.setScore(0)
    setRecord('0-0-0')
    setRounds(0)
    verdict.textContent = '出拳吧'
    verdict.className = 'rps-verdict'
    note.textContent = ''
    aiHand.textContent = '🤖'
    myHand.textContent = '🙂'
  }

  // Predict the player's next move from their last one, then counter it
  const aiPick = () => {
    if (history.length < 3) return Math.floor(Math.random() * 3)
    const prev = history[history.length - 1]
    const row = counts[prev]
    const total = row[0] + row[1] + row[2]
    if (!total) return Math.floor(Math.random() * 3)
    let predicted = 0
    for (let i = 1; i < 3; i++) if (row[i] > row[predicted]) predicted = i
    // Occasionally play randomly so the AI isn't itself exploitable
    if (Math.random() < 0.15) return Math.floor(Math.random() * 3)
    // The move that beats `predicted`
    return Number(Object.keys(BEATS).find((k) => BEATS[k] === predicted))
  }

  const play = (mine) => {
    if (busy) return
    busy = true
    const ai = aiPick()

    if (history.length) {
      counts[history[history.length - 1]][mine]++
    }
    history.push(mine)

    myHand.textContent = MOVES[mine].icon
    aiHand.textContent = '❓'
    verdict.textContent = '…'
    verdict.className = 'rps-verdict'

    setTimeout(() => {
      aiHand.textContent = MOVES[ai].icon
      let result
      if (mine === ai) {
        draws++
        result = 'draw'
        verdict.textContent = '平局'
      } else if (BEATS[mine] === ai) {
        wins++
        result = 'win'
        verdict.textContent = '你赢'
      } else {
        losses++
        result = 'lose'
        verdict.textContent = 'AI 赢'
      }
      verdict.className = `rps-verdict ${result}`
      setRecord(`${wins}-${losses}-${draws}`)
      setRounds(history.length)
      api.setScore(wins - losses)

      if (history.length >= 5) {
        note.textContent =
          wins - losses > 2
            ? '你摸清它了'
            : losses - wins > 2
            ? 'AI 正在读你的习惯，换套路试试'
            : '势均力敌'
      }

      if (history.length >= 20) {
        api.gameOver(
          wins > losses ? '你赢了这一局！' : wins < losses ? 'AI 略胜一筹' : '打平',
          `20 回合：${wins} 胜 ${losses} 负 ${draws} 平`
        )
      }
      busy = false
    }, 420)
  }

  const onClick = (e) => {
    const btn = e.target.closest('.rps-btn')
    if (!btn) return
    play(Number(btn.dataset.m))
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
