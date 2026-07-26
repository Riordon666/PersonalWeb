// Answers are common 5-letter words; guesses are checked against the
// union of answers + extras so reasonable attempts aren't rejected.
const ANSWERS = [
  'about', 'above', 'actor', 'admit', 'adopt', 'after', 'again', 'agent', 'alarm', 'album',
  'alive', 'allow', 'alone', 'along', 'alter', 'angle', 'angry', 'apart', 'apple', 'apply',
  'arena', 'argue', 'arise', 'array', 'aside', 'asset', 'audio', 'audit', 'avoid', 'award',
  'aware', 'badly', 'baker', 'basic', 'beach', 'began', 'begin', 'being', 'below', 'bench',
  'birth', 'black', 'blame', 'blank', 'blind', 'block', 'blood', 'board', 'boost', 'booth',
  'bound', 'brain', 'brand', 'brave', 'bread', 'break', 'breed', 'brief', 'bring', 'broad',
  'broke', 'brown', 'build', 'built', 'buyer', 'cable', 'carry', 'catch', 'cause', 'chain',
  'chair', 'chart', 'chase', 'cheap', 'check', 'chest', 'chief', 'child', 'china', 'chose',
  'civil', 'claim', 'class', 'clean', 'clear', 'click', 'climb', 'clock', 'close', 'cloud',
  'coach', 'coast', 'could', 'count', 'court', 'cover', 'craft', 'crash', 'cream', 'crime',
  'cross', 'crowd', 'crown', 'curve', 'cycle', 'daily', 'dance', 'dated', 'dealt', 'death',
  'debut', 'delay', 'depth', 'doing', 'doubt', 'dozen', 'draft', 'drama', 'drawn', 'dream',
  'dress', 'drink', 'drive', 'drove', 'dying', 'eager', 'early', 'earth', 'eight', 'elite',
  'empty', 'enemy', 'enjoy', 'enter', 'entry', 'equal', 'error', 'event', 'every', 'exact',
  'exist', 'extra', 'faith', 'false', 'fault', 'fiber', 'field', 'fifth', 'fifty', 'fight',
  'final', 'first', 'fixed', 'flash', 'fleet', 'floor', 'fluid', 'focus', 'force', 'forth',
  'forty', 'forum', 'found', 'frame', 'frank', 'fraud', 'fresh', 'front', 'fruit', 'fully',
  'funny', 'giant', 'given', 'glass', 'globe', 'going', 'grace', 'grade', 'grand', 'grant',
  'grass', 'great', 'green', 'gross', 'group', 'grown', 'guard', 'guess', 'guest', 'guide',
  'happy', 'harsh', 'heart', 'heavy', 'hence', 'horse', 'hotel', 'house', 'human', 'ideal',
  'image', 'imply', 'index', 'inner', 'input', 'issue', 'joint', 'judge', 'known', 'label',
  'large', 'laser', 'later', 'laugh', 'layer', 'learn', 'lease', 'least', 'leave', 'legal',
  'level', 'light', 'limit', 'links', 'lives', 'local', 'logic', 'loose', 'lower', 'lucky',
  'lunch', 'magic', 'major', 'maker', 'march', 'match', 'maybe', 'mayor', 'meant', 'media',
  'metal', 'might', 'minor', 'minus', 'mixed', 'model', 'money', 'month', 'moral', 'motor',
  'mount', 'mouse', 'mouth', 'movie', 'music', 'needs', 'never', 'newly', 'night', 'noise',
  'north', 'noted', 'novel', 'nurse', 'occur', 'ocean', 'offer', 'often', 'order', 'other',
  'ought', 'paint', 'panel', 'paper', 'party', 'peace', 'phase', 'phone', 'photo', 'piece',
  'pilot', 'pitch', 'place', 'plain', 'plane', 'plant', 'plate', 'point', 'pound', 'power',
  'press', 'price', 'pride', 'prime', 'print', 'prior', 'prize', 'proof', 'proud', 'prove',
  'queen', 'quick', 'quiet', 'quite', 'radio', 'raise', 'range', 'rapid', 'ratio', 'reach',
  'ready', 'realm', 'rebel', 'refer', 'relax', 'reply', 'right', 'rival', 'river', 'robot',
  'rough', 'round', 'route', 'royal', 'rural', 'scale', 'scene', 'scope', 'score', 'sense',
  'serve', 'seven', 'shall', 'shape', 'share', 'sharp', 'sheet', 'shelf', 'shell', 'shift',
  'shine', 'shirt', 'shock', 'shoot', 'short', 'shown', 'sight', 'silly', 'since', 'sixth',
  'sixty', 'sized', 'skill', 'sleep', 'slide', 'small', 'smart', 'smile', 'smoke', 'solid',
  'solve', 'sorry', 'sound', 'south', 'space', 'spare', 'speak', 'speed', 'spend', 'spent',
  'split', 'spoke', 'sport', 'staff', 'stage', 'stake', 'stand', 'start', 'state', 'steam',
  'steel', 'stick', 'still', 'stock', 'stone', 'stood', 'store', 'storm', 'story', 'strip',
  'stuck', 'study', 'stuff', 'style', 'sugar', 'suite', 'super', 'sweet', 'table', 'taken',
  'taste', 'taxes', 'teach', 'teeth', 'thank', 'theft', 'their', 'theme', 'there', 'these',
  'thick', 'thing', 'think', 'third', 'those', 'three', 'threw', 'throw', 'tight', 'times',
  'tired', 'title', 'today', 'topic', 'total', 'touch', 'tough', 'tower', 'track', 'trade',
  'train', 'treat', 'trend', 'trial', 'tried', 'tries', 'truck', 'truly', 'trust', 'truth',
  'twice', 'under', 'undue', 'union', 'unity', 'until', 'upper', 'upset', 'urban', 'usage',
  'usual', 'valid', 'value', 'video', 'virus', 'visit', 'vital', 'voice', 'waste', 'watch',
  'water', 'wheel', 'where', 'which', 'while', 'white', 'whole', 'whose', 'woman', 'women',
  'world', 'worry', 'worse', 'worst', 'worth', 'would', 'wound', 'write', 'wrong', 'wrote',
  'yield', 'young', 'youth',
]

const VALID = new Set(ANSWERS)
const ROWS = 6
const LEN = 5

const KEY_ROWS = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm']

export function mount(stage, api) {
  const viewport = stage.querySelector('[data-role="viewport"]')
  viewport.innerHTML = `
    <div class="wd-wrap">
      <div class="wd-grid"></div>
      <div class="wd-msg"></div>
      <div class="wd-keyboard"></div>
    </div>
  `
  const gridEl = viewport.querySelector('.wd-grid')
  const msgEl = viewport.querySelector('.wd-msg')
  const kbEl = viewport.querySelector('.wd-keyboard')

  let answer = ''
  let guesses = []
  let current = ''
  let over = false
  let keyState = {}
  let msgTimer = 0

  const setLeft = api.addHudItem('剩余机会', ROWS)

  const reset = () => {
    answer = ANSWERS[Math.floor(Math.random() * ANSWERS.length)]
    guesses = []
    current = ''
    over = false
    keyState = {}
    api.setScore(0)
    setLeft(ROWS)
    api.hideOverlay()
    msgEl.textContent = ''
    renderGrid()
    renderKeyboard()
  }

  // Two-pass scoring so duplicate letters are marked the way Wordle does
  const scoreGuess = (guess) => {
    const marks = Array(LEN).fill('absent')
    const pool = {}
    for (let i = 0; i < LEN; i++) {
      if (guess[i] === answer[i]) marks[i] = 'correct'
      else pool[answer[i]] = (pool[answer[i]] || 0) + 1
    }
    for (let i = 0; i < LEN; i++) {
      if (marks[i] === 'correct') continue
      if (pool[guess[i]] > 0) {
        marks[i] = 'present'
        pool[guess[i]]--
      }
    }
    return marks
  }

  const renderGrid = () => {
    gridEl.innerHTML = ''
    for (let r = 0; r < ROWS; r++) {
      const row = document.createElement('div')
      row.className = 'wd-row'
      const guess = guesses[r]
      for (let c = 0; c < LEN; c++) {
        const tile = document.createElement('div')
        tile.className = 'wd-tile'
        if (guess) {
          tile.textContent = guess.word[c].toUpperCase()
          tile.classList.add(guess.marks[c], 'filled')
          tile.style.transitionDelay = `${c * 60}ms`
        } else if (r === guesses.length && current[c]) {
          tile.textContent = current[c].toUpperCase()
          tile.classList.add('typed')
        }
        row.appendChild(tile)
      }
      gridEl.appendChild(row)
    }
  }

  const renderKeyboard = () => {
    kbEl.innerHTML = ''
    KEY_ROWS.forEach((letters, i) => {
      const row = document.createElement('div')
      row.className = 'wd-krow'
      if (i === 2) {
        const enter = document.createElement('button')
        enter.type = 'button'
        enter.className = 'wd-key wide'
        enter.dataset.act = 'enter'
        enter.textContent = '确认'
        row.appendChild(enter)
      }
      for (const ch of letters) {
        const key = document.createElement('button')
        key.type = 'button'
        key.className = 'wd-key' + (keyState[ch] ? ` ${keyState[ch]}` : '')
        key.dataset.ch = ch
        key.textContent = ch.toUpperCase()
        row.appendChild(key)
      }
      if (i === 2) {
        const del = document.createElement('button')
        del.type = 'button'
        del.className = 'wd-key wide'
        del.dataset.act = 'del'
        del.textContent = '⌫'
        row.appendChild(del)
      }
      kbEl.appendChild(row)
    })
  }

  const flash = (text) => {
    clearTimeout(msgTimer)
    msgEl.textContent = text
    msgEl.classList.add('show')
    msgTimer = setTimeout(() => msgEl.classList.remove('show'), 1400)
  }

  const submit = () => {
    if (over) return
    if (current.length !== LEN) return flash('还差几个字母')
    if (!VALID.has(current)) return flash('词库里没有这个词')

    const marks = scoreGuess(current)
    guesses.push({ word: current, marks })

    // Key colors only ever get better, never downgraded
    const rank = { absent: 0, present: 1, correct: 2 }
    current.split('').forEach((ch, i) => {
      const nextMark = marks[i]
      if (!keyState[ch] || rank[nextMark] > rank[keyState[ch]]) keyState[ch] = nextMark
    })

    const won = current === answer
    current = ''
    setLeft(ROWS - guesses.length)
    renderGrid()
    renderKeyboard()

    if (won) {
      over = true
      api.setScore(guesses.length)
      api.gameOver('猜中了！', `${guesses.length} 次猜出 ${answer.toUpperCase()}`, { won: true })
    } else if (guesses.length >= ROWS) {
      over = true
      api.gameOver('没猜出来', `答案是 ${answer.toUpperCase()}`, { record: false })
    }
  }

  const typeLetter = (ch) => {
    if (over || current.length >= LEN) return
    current += ch
    renderGrid()
  }

  const onClick = (e) => {
    const key = e.target.closest('.wd-key')
    if (!key) return
    if (key.dataset.act === 'enter') submit()
    else if (key.dataset.act === 'del') {
      current = current.slice(0, -1)
      renderGrid()
    } else if (key.dataset.ch) typeLetter(key.dataset.ch)
  }

  const onKey = (e) => {
    if (over) return
    if (e.key === 'Enter') submit()
    else if (e.key === 'Backspace') {
      e.preventDefault()
      current = current.slice(0, -1)
      renderGrid()
    } else if (/^[a-zA-Z]$/.test(e.key)) typeLetter(e.key.toLowerCase())
  }

  kbEl.addEventListener('click', onClick)
  window.addEventListener('keydown', onKey)
  reset()

  return {
    restart: reset,
    destroy() {
      clearTimeout(msgTimer)
      kbEl.removeEventListener('click', onClick)
      window.removeEventListener('keydown', onKey)
    },
  }
}
