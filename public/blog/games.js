// Game dispatcher. blog.js dynamic-imports this file when a page has a
// [data-game] stage; the actual game logic lives in /blog/games-lib/ and
// is loaded per game, so visiting one game never downloads the others.

const GAME_DEFS = {
  // arcade
  snake: { scoreLabel: '得分', best: 'max' },
  tetris: { scoreLabel: '得分', best: 'max' },
  breakout: { scoreLabel: '得分', best: 'max' },
  dino: { scoreLabel: '距离', best: 'max' },
  flappy: { scoreLabel: '通过', best: 'max' },
  doodle: { scoreLabel: '高度', best: 'max' },
  invaders: { scoreLabel: '得分', best: 'max' },
  pong: { scoreLabel: '我方得分', best: 'wins', bestLabel: '胜场' },
  jump: { scoreLabel: '得分', best: 'max' },
  tower100: { scoreLabel: '层数', best: 'max' },
  shooter: { scoreLabel: '得分', best: 'max' },
  tank: { scoreLabel: '击毁', best: 'max' },
  racing: { scoreLabel: '里程', best: 'max' },
  pinball: { scoreLabel: '得分', best: 'max' },

  // puzzle
  '2048': { scoreLabel: '得分', best: 'max' },
  minesweeper: { scoreLabel: '用时', best: 'min', bestLabel: '最快' },
  puzzle15: { scoreLabel: '步数', best: 'min', bestLabel: '最少步' },
  lightsout: { scoreLabel: '步数', best: 'min', bestLabel: '最少步' },
  hanoi: { scoreLabel: '步数', best: 'min', bestLabel: '最少步' },
  game24: { scoreLabel: '解出', best: 'max' },
  bulls: { scoreLabel: '猜测次数', best: 'min', bestLabel: '最少次' },
  sudoku: { scoreLabel: '用时', best: 'min', bestLabel: '最快' },
  sokoban: { scoreLabel: '步数', best: 'max', bestLabel: '通关数' },
  klotski: { scoreLabel: '步数', best: 'min', bestLabel: '最少步' },
  nonogram: { scoreLabel: '用时', best: 'min', bestLabel: '最快' },
  numberlink: { scoreLabel: '关卡', best: 'max' },
  maze: { scoreLabel: '步数', best: 'max', bestLabel: '通关数' },

  // board
  gomoku: { scoreLabel: '手数', best: 'wins', bestLabel: '胜场' },
  reversi: { scoreLabel: '我方棋子', best: 'wins', bestLabel: '胜场' },
  tictactoe: { scoreLabel: '手数', best: 'wins', bestLabel: '胜场' },
  checkers: { scoreLabel: '我方棋子', best: 'wins', bestLabel: '胜场' },
  xiangqi: { scoreLabel: '手数', best: 'wins', bestLabel: '胜场' },
  blackjack: { scoreLabel: '筹码', best: 'max' },
  yahtzee: { scoreLabel: '总分', best: 'max' },
  solitaire: { scoreLabel: '得分', best: 'max' },
  freecell: { scoreLabel: '步数', best: 'wins', bestLabel: '通关数' },

  // match
  match3: { scoreLabel: '得分', best: 'max' },
  onet: { scoreLabel: '剩余牌', best: 'wins', bestLabel: '通关数' },
  bubble: { scoreLabel: '得分', best: 'max' },
  zuma: { scoreLabel: '得分', best: 'max' },
  mahjong: { scoreLabel: '剩余牌', best: 'wins', bestLabel: '通关数' },
  suika: { scoreLabel: '得分', best: 'max' },

  // skill
  memory: { scoreLabel: '步数', best: 'min', bestLabel: '最少步' },
  simon: { scoreLabel: '序列长度', best: 'max' },
  whack: { scoreLabel: '得分', best: 'max' },
  reaction: { scoreLabel: '平均毫秒', best: 'min', bestLabel: '最快' },
  schulte: { scoreLabel: '用时', best: 'min', bestLabel: '最快' },
  memorymatrix: { scoreLabel: '关卡', best: 'max' },
  colormatch: { scoreLabel: '关卡', best: 'max' },
  aim: { scoreLabel: '命中', best: 'max' },
  typing: { scoreLabel: 'WPM', best: 'max' },
  mathsprint: { scoreLabel: '答对', best: 'max' },
  pianotiles: { scoreLabel: '得分', best: 'max' },
  rhythm: { scoreLabel: '得分', best: 'max' },

  // casual
  rps: { scoreLabel: '净胜', best: 'max' },
  slot: { scoreLabel: '筹码', best: 'max' },
  hexguess: { scoreLabel: '答对', best: 'max' },
  wordle: { scoreLabel: '用了几次', best: 'wins', bestLabel: '猜中数' },
  idiom: { scoreLabel: '接龙长度', best: 'max' },
  lifegame: { scoreLabel: '存活细胞', best: 'max', bestLabel: '最多' },
}

const bestKey = (slug) => `blog-game-best-${slug}`

const loadBest = (slug) => {
  try {
    return Number(localStorage.getItem(bestKey(slug))) || 0
  } catch {
    return 0
  }
}

const saveBest = (slug, value) => {
  try {
    localStorage.setItem(bestKey(slug), String(value))
  } catch {}
}

export async function mountGame(stage) {
  const slug = stage.dataset.game
  const def = GAME_DEFS[slug]
  if (!def) return null

  let mod
  try {
    mod = await import(`/blog/games-lib/${slug}.js`)
  } catch (err) {
    console.error(`[games] failed to load module for ${slug}:`, err)
    const viewport = stage.querySelector('[data-role="viewport"]')
    if (viewport) viewport.innerHTML = '<div class="game-loading">游戏加载失败</div>'
    return null
  }
  if (!stage.isConnected) return null

  const scoreEl = stage.querySelector('[data-hud="score"]')
  const bestEl = stage.querySelector('[data-hud="best"]')
  const overlay = stage.querySelector('[data-role="overlay"]')
  const overlayTitle = stage.querySelector('[data-role="overlay-title"]')
  const overlayText = stage.querySelector('[data-role="overlay-text"]')
  const hud = stage.querySelector('.game-hud')
  const hudActions = stage.querySelector('.hud-actions')

  // Labels
  const hudItems = stage.querySelectorAll('.hud-item')
  if (hudItems[0]) hudItems[0].querySelector('.hud-label').textContent = def.scoreLabel
  if (hudItems[1]) hudItems[1].querySelector('.hud-label').textContent = def.bestLabel || '最高'

  let best = loadBest(slug)
  if (bestEl) bestEl.textContent = best ? String(best) : '—'

  const extraNodes = []

  const api = {
    setScore(v) {
      if (scoreEl) scoreEl.textContent = String(v)
    },
    // Adds an extra HUD stat (e.g. remaining mines, countdown, lives).
    // Returns a setter for its value. Removed automatically on teardown.
    addHudItem(label, initial = '') {
      const item = document.createElement('div')
      item.className = 'hud-item'
      item.innerHTML = `<span class="hud-label"></span><span class="hud-value"></span>`
      item.querySelector('.hud-label').textContent = label
      const valueEl = item.querySelector('.hud-value')
      valueEl.textContent = String(initial)
      hud.insertBefore(item, hudActions)
      extraNodes.push(item)
      return (v) => {
        valueEl.textContent = String(v)
      }
    },
    // Adds an extra control button next to "重新开始"
    addHudButton(label, onClick) {
      const btn = document.createElement('button')
      btn.type = 'button'
      btn.className = 'game-btn'
      btn.textContent = label
      btn.addEventListener('click', onClick)
      hudActions.insertBefore(btn, hudActions.firstChild)
      extraNodes.push(btn)
      return btn
    },
    gameOver(title, text, { record = true, won = false } = {}) {
      const current = Number(scoreEl?.textContent) || 0
      if (def.best === 'wins') {
        if (won) {
          best += 1
          saveBest(slug, best)
        }
      } else if (record) {
        const better = def.best === 'min' ? current > 0 && (!best || current < best) : current > best
        if (better) {
          best = current
          saveBest(slug, best)
        }
      }
      if (bestEl) bestEl.textContent = best ? String(best) : '—'
      if (overlayTitle) overlayTitle.textContent = title
      if (overlayText) overlayText.textContent = text
      if (overlay) overlay.hidden = false
    },
    hideOverlay() {
      if (overlay) overlay.hidden = true
    },
  }

  const instance = mod.mount(stage, api)

  const onRestart = (e) => {
    if (!e.target.closest('[data-action="restart"]')) return
    instance.restart()
  }
  stage.addEventListener('click', onRestart)

  return () => {
    stage.removeEventListener('click', onRestart)
    extraNodes.forEach((n) => n.remove())
    instance.destroy()
  }
}
