import { themeHsl, isDark, fitCanvas, gameLoop } from './core.js'

const LANES = 4
const KEYS = ['d', 'f', 'j', 'k']
const FREQ = [261.6, 329.6, 392.0, 523.3]

// A simple looping chart: [beat, lane]
const CHART = []
;(() => {
  const pattern = [0, 2, 1, 3, 0, 1, 2, 3, 2, 0, 3, 1]
  for (let bar = 0; bar < 24; bar++) {
    for (let i = 0; i < 4; i++) {
      const beat = bar * 4 + i
      CHART.push([beat, pattern[(bar * 4 + i) % pattern.length]])
      // add off-beat notes as the song progresses
      if (bar > 5 && i % 2 === 1) CHART.push([beat + 0.5, (pattern[(bar + i) % pattern.length] + 2) % LANES])
      if (bar > 13 && i === 2) CHART.push([beat + 0.25, (pattern[(bar * 2 + i) % pattern.length] + 1) % LANES])
    }
  }
})()

const BPM = 108
const BEAT_MS = 60000 / BPM
const APPROACH_MS = 1500

export function mount(stage, api) {
  const viewport = stage.querySelector('[data-role="viewport"]')

  let W = 400
  let notes = []
  let elapsed = 0
  let started = false
  let over = false
  let score = 0
  let combo = 0
  let maxCombo = 0
  let counts = { perfect: 0, good: 0, miss: 0 }
  let hits = []
  let audio = null

  const setCombo = api.addHudItem('连击', 0)
  const setJudge = api.addHudItem('判定', '—')

  const surface = fitCanvas(viewport, (px) => {
    W = px
    draw()
  })
  const { ctx, canvas } = surface

  const HIT_Y = () => W * 0.84

  const tone = (lane) => {
    try {
      if (!audio) audio = new (window.AudioContext || window.webkitAudioContext)()
      if (audio.state === 'suspended') audio.resume()
      const osc = audio.createOscillator()
      const gain = audio.createGain()
      osc.type = 'triangle'
      osc.frequency.value = FREQ[lane]
      gain.gain.setValueAtTime(0.001, audio.currentTime)
      gain.gain.exponentialRampToValueAtTime(0.18, audio.currentTime + 0.01)
      gain.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + 0.22)
      osc.connect(gain).connect(audio.destination)
      osc.start()
      osc.stop(audio.currentTime + 0.26)
    } catch {}
  }

  const reset = () => {
    notes = CHART.map(([beat, lane]) => ({
      time: beat * BEAT_MS + 2200,
      lane,
      hit: false,
      missed: false,
    })).sort((a, b) => a.time - b.time)
    elapsed = 0
    started = false
    over = false
    score = 0
    combo = 0
    maxCombo = 0
    counts = { perfect: 0, good: 0, miss: 0 }
    hits = []
    api.setScore(0)
    setCombo(0)
    setJudge('—')
    api.hideOverlay()
    draw()
  }

  const judge = (lane) => {
    if (over) return
    if (!started) {
      started = true
      return
    }
    // Closest un-hit note in this lane
    let best = null
    let bestDelta = Infinity
    for (const n of notes) {
      if (n.lane !== lane || n.hit || n.missed) continue
      const delta = Math.abs(n.time - elapsed)
      if (delta < bestDelta) {
        bestDelta = delta
        best = n
      }
    }
    if (!best || bestDelta > 180) {
      combo = 0
      setCombo(0)
      setJudge('Miss')
      counts.miss++
      hits.push({ lane, t: 0, kind: 'miss' })
      return
    }

    best.hit = true
    tone(lane)
    let kind
    if (bestDelta <= 65) {
      kind = 'perfect'
      score += 100
      counts.perfect++
    } else {
      kind = 'good'
      score += 50
      counts.good++
    }
    combo++
    maxCombo = Math.max(maxCombo, combo)
    score += Math.min(combo, 50)
    api.setScore(score)
    setCombo(combo)
    setJudge(kind === 'perfect' ? 'Perfect' : 'Good')
    hits.push({ lane, t: 0, kind })
  }

  const stopLoop = gameLoop((dt) => {
    if (over) {
      draw()
      return
    }
    if (started) {
      elapsed += dt
      for (const n of notes) {
        if (!n.hit && !n.missed && elapsed - n.time > 180) {
          n.missed = true
          counts.miss++
          combo = 0
          setCombo(0)
          setJudge('Miss')
        }
      }
      if (notes.every((n) => n.hit || n.missed)) {
        over = true
        const total = counts.perfect + counts.good + counts.miss
        const acc = total ? Math.round(((counts.perfect + counts.good * 0.5) / total) * 100) : 0
        api.gameOver(
          '演奏结束',
          `得分 ${score} · 准确率 ${acc}% · 最高连击 ${maxCombo}（P${counts.perfect}/G${counts.good}/M${counts.miss}）`
        )
      }
    }
    hits = hits.filter((h) => (h.t += dt) < 320)
    draw()
  })

  const draw = () => {
    const dark = isDark()
    ctx.clearRect(0, 0, W, W)
    ctx.fillStyle = dark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.03)'
    ctx.fillRect(0, 0, W, W)

    const lw = W / LANES
    ctx.strokeStyle = dark ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.06)'
    ctx.lineWidth = 1
    for (let i = 1; i < LANES; i++) {
      ctx.beginPath()
      ctx.moveTo(i * lw, 0)
      ctx.lineTo(i * lw, W)
      ctx.stroke()
    }

    // hit flashes
    for (const h of hits) {
      const alpha = (1 - h.t / 320) * 0.45
      ctx.fillStyle =
        h.kind === 'miss'
          ? `hsla(4, 75%, 55%, ${alpha})`
          : themeHsl(stage, { shift: h.kind === 'perfect' ? 40 : 0, l: 60, alpha })
      ctx.fillRect(h.lane * lw, 0, lw, W)
    }

    const hy = HIT_Y()
    // notes
    for (const n of notes) {
      if (n.hit || n.missed) continue
      const p = 1 - (n.time - elapsed) / APPROACH_MS
      if (p < -0.1 || p > 1.25) continue
      const y = p * hy
      ctx.fillStyle = themeHsl(stage, { shift: n.lane * 42, s: 70, l: 58 })
      ctx.beginPath()
      ctx.roundRect(n.lane * lw + lw * 0.1, y - W * 0.022, lw * 0.8, W * 0.044, 7)
      ctx.fill()
    }

    // hit line
    ctx.strokeStyle = themeHsl(stage, { l: 55, alpha: 0.75 })
    ctx.lineWidth = 4
    ctx.beginPath()
    ctx.moveTo(0, hy)
    ctx.lineTo(W, hy)
    ctx.stroke()

    // key labels
    ctx.fillStyle = dark ? 'rgba(255,255,255,0.4)' : 'rgba(0,0,0,0.32)'
    ctx.font = `700 ${W * 0.042}px "Helvetica Neue", sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    KEYS.forEach((k, i) => ctx.fillText(k.toUpperCase(), i * lw + lw / 2, W * 0.93))

    if (combo >= 5 && !over) {
      ctx.fillStyle = themeHsl(stage, { l: dark ? 70 : 45, alpha: 0.85 })
      ctx.font = `800 ${W * 0.1}px "Helvetica Neue", sans-serif`
      ctx.fillText(String(combo), W / 2, W * 0.3)
      ctx.font = `600 ${W * 0.032}px "Microsoft Yahei", sans-serif`
      ctx.fillText('COMBO', W / 2, W * 0.38)
    }

    if (!started && !over) {
      ctx.fillStyle = dark ? 'rgba(255,255,255,0.82)' : 'rgba(0,0,0,0.68)'
      ctx.font = `600 ${Math.max(12, W * 0.034)}px "Microsoft Yahei", sans-serif`
      ctx.fillText('按 D F J K 或点击轨道开始', W / 2, W * 0.5)
    }
  }

  const onKey = (e) => {
    const idx = KEYS.indexOf(e.key.toLowerCase())
    if (idx === -1) return
    e.preventDefault()
    judge(idx)
  }
  const onPointer = (e) => {
    e.preventDefault()
    const rect = canvas.getBoundingClientRect()
    const lane = Math.floor(((e.clientX - rect.left) / rect.width) * LANES)
    judge(Math.max(0, Math.min(LANES - 1, lane)))
  }

  window.addEventListener('keydown', onKey)
  canvas.addEventListener('pointerdown', onPointer)

  reset()

  return {
    restart: reset,
    destroy() {
      stopLoop()
      window.removeEventListener('keydown', onKey)
      canvas.removeEventListener('pointerdown', onPointer)
      if (audio) audio.close().catch(() => {})
      surface.destroy()
    },
  }
}
