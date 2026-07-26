import { themeHsl, isDark, fitCanvas, gameLoop, randInt } from './core.js'

export function mount(stage, api) {
  const viewport = stage.querySelector('[data-role="viewport"]')

  let W = 400
  let blocks = []
  let player = { x: 0, y: 0, vx: 0, vy: 0, air: false }
  let charging = false
  let chargeStart = 0
  let power = 0
  let score = 0
  let combo = 0
  let over = false
  let camX = 0
  let camTarget = 0

  const setCombo = api.addHudItem('连击', 0)

  const surface = fitCanvas(viewport, (px) => {
    W = px
    draw()
  })
  const { ctx } = surface

  const BLOCK_W = () => W * 0.19
  const BLOCK_H = () => W * 0.13
  const GROUND = () => W * 0.68
  const P_SIZE = () => W * 0.055

  const addBlock = () => {
    const last = blocks[blocks.length - 1]
    const gap = randInt(Math.floor(W * 0.24), Math.floor(W * 0.44))
    blocks.push({ x: last.x + BLOCK_W() + gap, w: BLOCK_W() * (0.8 + Math.random() * 0.5) })
  }

  const reset = () => {
    blocks = [{ x: W * 0.12, w: BLOCK_W() }]
    for (let i = 0; i < 4; i++) addBlock()
    player = { x: blocks[0].x + blocks[0].w / 2, y: GROUND(), vx: 0, vy: 0, air: false }
    charging = false
    power = 0
    score = 0
    combo = 0
    over = false
    camX = 0
    camTarget = 0
    api.setScore(0)
    setCombo(0)
    api.hideOverlay()
    draw()
  }

  const startCharge = () => {
    if (over || player.air) return
    charging = true
    chargeStart = performance.now()
  }

  const release = () => {
    if (!charging || over) return
    charging = false
    const held = Math.min(1100, performance.now() - chargeStart)
    const p = held / 1100
    power = 0
    player.vx = W * 0.006 + p * W * 0.021
    player.vy = -(W * 0.012 + p * W * 0.017)
    player.air = true
  }

  const land = () => {
    const size = P_SIZE()
    const target = blocks.find((b) => player.x > b.x && player.x < b.x + b.w)
    if (!target) {
      over = true
      api.gameOver('没踩稳', `得分 ${score}`)
      return
    }
    player.y = GROUND()
    player.vx = 0
    player.vy = 0
    player.air = false

    // Landing near the center is worth more and builds a combo
    const center = target.x + target.w / 2
    const offset = Math.abs(player.x - center) / (target.w / 2)
    if (offset < 0.24) {
      combo++
      score += 2 + combo
    } else {
      combo = 0
      score += 1
    }
    api.setScore(score)
    setCombo(combo)

    // keep the runway stocked and scroll the camera
    while (blocks.length < 6) addBlock()
    const idx = blocks.indexOf(target)
    if (idx > 1) blocks.splice(0, idx - 1)
    camTarget = Math.max(0, player.x - W * 0.32)
  }

  const stopLoop = gameLoop((dt) => {
    const k = Math.min(2.4, dt / 16.7)
    camX += (camTarget - camX) * Math.min(1, 0.12 * k)

    if (charging) power = Math.min(1, (performance.now() - chargeStart) / 1100)

    if (!over && player.air) {
      player.x += player.vx * k
      player.vy += W * 0.0011 * k
      player.y += player.vy * k
      if (player.vy > 0 && player.y >= GROUND()) land()
      if (player.y > W * 1.4) {
        over = true
        api.gameOver('掉下去了', `得分 ${score}`)
      }
    }
    draw()
  })

  const draw = () => {
    const dark = isDark()
    ctx.clearRect(0, 0, W, W)
    ctx.fillStyle = dark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)'
    ctx.fillRect(0, 0, W, W)

    ctx.save()
    ctx.translate(-camX, 0)

    const bh = BLOCK_H()
    blocks.forEach((b, i) => {
      ctx.fillStyle = themeHsl(stage, { shift: i * 14, l: dark ? 44 : 56 })
      ctx.beginPath()
      ctx.roundRect(b.x, GROUND(), b.w, bh, 6)
      ctx.fill()
      // center marker
      ctx.fillStyle = 'rgba(255,255,255,0.35)'
      ctx.fillRect(b.x + b.w / 2 - 1, GROUND() + 4, 2, bh * 0.32)
    })

    // player, squashed while charging
    const size = P_SIZE()
    const squash = charging ? 1 - power * 0.34 : 1
    ctx.fillStyle = themeHsl(stage, { shift: 40, s: 75, l: 56 })
    ctx.beginPath()
    ctx.roundRect(
      player.x - size / 2,
      player.y - size * squash,
      size,
      size * squash,
      size * 0.25
    )
    ctx.fill()

    ctx.restore()

    // power meter
    if (charging) {
      const barW = W * 0.5
      ctx.fillStyle = dark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.1)'
      ctx.beginPath()
      ctx.roundRect(W / 2 - barW / 2, W * 0.08, barW, 10, 5)
      ctx.fill()
      ctx.fillStyle = themeHsl(stage, { shift: power * 90, s: 80, l: 55 })
      ctx.beginPath()
      ctx.roundRect(W / 2 - barW / 2, W * 0.08, barW * power, 10, 5)
      ctx.fill()
    }

    if (!over && score === 0 && !player.air && !charging) {
      ctx.fillStyle = dark ? 'rgba(255,255,255,0.72)' : 'rgba(0,0,0,0.6)'
      ctx.font = `600 ${Math.max(12, W * 0.034)}px "Microsoft Yahei", sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('按住蓄力，松开起跳', W / 2, W * 0.3)
    }
  }

  const onDown = (e) => {
    e.preventDefault()
    startCharge()
  }
  const onUp = (e) => {
    e.preventDefault()
    release()
  }
  const onKeyDown = (e) => {
    if (e.key === ' ' && !e.repeat) {
      e.preventDefault()
      startCharge()
    }
  }
  const onKeyUp = (e) => {
    if (e.key === ' ') {
      e.preventDefault()
      release()
    }
  }

  viewport.addEventListener('pointerdown', onDown)
  window.addEventListener('pointerup', onUp)
  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('keyup', onKeyUp)

  reset()

  return {
    restart: reset,
    destroy() {
      stopLoop()
      viewport.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      surface.destroy()
    },
  }
}
