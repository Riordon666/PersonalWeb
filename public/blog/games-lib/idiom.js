import { shuffle } from './core.js'

// Small curated idiom set: every entry's last character starts at least one
// other entry, so the chain can always continue.
const IDIOMS = [
  '一心一意', '意气风发', '发愤图强', '强人所难', '难能可贵', '贵人多忘',
  '忘乎所以', '以身作则', '则声不响', '响彻云霄', '霄壤之别', '别开生面',
  '面不改色', '色厉内荏', '荏苒光阴', '阴差阳错', '错综复杂', '杂乱无章',
  '章台杨柳', '柳暗花明', '明察秋毫', '毫不犹豫', '豫备不虞', '虞褚欧颜',
  '颜面扫地', '地大物博', '博览群书', '书香门第', '第一时间', '间不容发',
  '发人深省', '省吃俭用', '用兵如神', '神机妙算', '算无遗策', '策马奔腾',
  '腾云驾雾', '雾里看花', '花团锦簇', '簇拥而上', '上行下效', '效犬马力',
  '心照不宣', '宣威耀武', '武艺超群', '群策群力', '力挽狂澜', '澜倒波随',
  '主客颠倒', '倒背如流', '流连忘返', '返璞归真', '真知灼见', '见微知著',
  '著书立说', '一鸣惊人', '人山人海', '海阔天空', '空前绝后', '后来居上', '上善若水',
  '水到渠成', '成竹在胸', '胸有成竹', '竹报平安', '安居乐业', '业精于勤',
  '勤能补拙', '拙口钝腮', '腮红齿白', '白手起家', '家喻户晓', '晓以大义',
  '义无反顾', '顾名思义', '一举两得', '得心应手', '手到擒来', '来日方长',
  '长驱直入', '入木三分', '分道扬镳', '镳分路扬', '扬长避短', '短兵相接',
  '接二连三', '三心二意', '意味深长', '长年累月', '月落乌啼', '啼笑皆非',
  '非同小可', '可歌可泣', '泣不成声', '声东击西', '西装革履', '履险如夷',
  '夷然自若', '若无其事', '事半功倍', '倍道兼行', '行云流水', '水落石出',
  '出类拔萃', '萃取精华', '华而不实', '实事求是', '是非曲直', '直截了当',
  '当务之急', '急中生智', '智勇双全', '全力以赴', '赴汤蹈火', '火树银花',
  '花好月圆', '圆满成功', '功成名就', '就事论事', '事出有因', '因材施教',
  '教学相长', '长话短说', '说一不二', '二话不说', '说来话长', '长此以往',
  '往事如烟', '烟消云散', '散兵游勇', '勇往直前', '前程似锦', '锦上添花',
]

// Guard against typos sneaking into the list above
const POOL = [...new Set(IDIOMS.filter((w) => /^[一-龥]{4}$/.test(w)))]

const DURATION = 90

export function mount(stage, api) {
  const viewport = stage.querySelector('[data-role="viewport"]')
  viewport.innerHTML = `
    <div class="id-wrap">
      <div class="id-chain"></div>
      <div class="id-prompt">请选择以「<b></b>」开头的成语</div>
      <div class="id-options"></div>
    </div>
  `
  const chainEl = viewport.querySelector('.id-chain')
  const promptEl = viewport.querySelector('.id-prompt b')
  const optionsEl = viewport.querySelector('.id-options')

  let chain = []
  let used = new Set()
  let timeLeft = DURATION
  let ticker = 0
  let over = false

  const setTime = api.addHudItem('剩余', `${DURATION}s`)

  const stopTimer = () => {
    clearInterval(ticker)
    ticker = 0
  }

  const startsWith = (ch) => POOL.filter((w) => w[0] === ch && !used.has(w))

  const buildOptions = () => {
    const head = chain[chain.length - 1].slice(-1)
    promptEl.textContent = head
    const good = shuffle(startsWith(head)).slice(0, 2)

    if (!good.length) {
      over = true
      stopTimer()
      api.gameOver('接不下去了', `一共接了 ${chain.length - 1} 个成语`)
      return
    }

    // Fill the rest with wrong-headed idioms as distractors
    const decoys = shuffle(POOL.filter((w) => w[0] !== head && !used.has(w))).slice(0, 4 - good.length)
    optionsEl.innerHTML = shuffle([...good, ...decoys])
      .map((w) => `<button class="id-option" type="button" data-w="${w}">${w}</button>`)
      .join('')
  }

  const renderChain = () => {
    chainEl.innerHTML = chain
      .slice(-6)
      .map((w, i, arr) => {
        const isLast = i === arr.length - 1
        return `<span class="id-word${isLast ? ' current' : ''}">${w}</span>`
      })
      .join('<span class="id-arrow">→</span>')
    chainEl.scrollLeft = chainEl.scrollWidth
  }

  const reset = () => {
    stopTimer()
    used = new Set()
    const start = POOL[Math.floor(Math.random() * POOL.length)]
    chain = [start]
    used.add(start)
    timeLeft = DURATION
    over = false
    api.setScore(0)
    setTime(`${DURATION}s`)
    api.hideOverlay()
    renderChain()
    buildOptions()
    ticker = setInterval(() => {
      timeLeft--
      setTime(`${timeLeft}s`)
      if (timeLeft <= 0) {
        over = true
        stopTimer()
        api.gameOver('时间到', `接了 ${chain.length - 1} 个成语`)
      }
    }, 1000)
  }

  const onClick = (e) => {
    const btn = e.target.closest('.id-option')
    if (!btn || over) return
    const word = btn.dataset.w
    const head = chain[chain.length - 1].slice(-1)

    if (word[0] !== head) {
      btn.classList.add('wrong')
      setTimeout(() => btn.classList.remove('wrong'), 320)
      timeLeft = Math.max(0, timeLeft - 5)
      setTime(`${timeLeft}s`)
      return
    }

    chain.push(word)
    used.add(word)
    api.setScore(chain.length - 1)
    timeLeft = Math.min(DURATION, timeLeft + 3)
    setTime(`${timeLeft}s`)
    renderChain()
    buildOptions()
  }

  viewport.addEventListener('click', onClick)
  reset()

  return {
    restart: reset,
    destroy() {
      stopTimer()
      viewport.removeEventListener('click', onClick)
    },
  }
}
