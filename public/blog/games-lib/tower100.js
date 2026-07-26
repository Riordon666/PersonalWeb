import { themeHsl, isDark, fitCanvas, gameLoop, clamp, randInt } from './core.js'

export function mount(stage, api) {
  const viewport = stage.querySelector('[data-role="viewport"]')

  let W = 400
  let player = { x: 200, y: 100, vy: 0, r: 12, onPlat: null }
  let plats = []
  let floor = 0
  let hp = 3
  let scroll = 0
  let over = false
  let started = false
  let holdLeft = false
  let holdRight = false
  let hurtUntil = 0

  const setHp = api.addHudItem('生命', '❤❤❤')

  const surface = fitCanvas(viewport, (px) => {
    W = px
    player.r = px * 0.032
    draw()
  })
  const { ctx, canvas } = surface

  const PLAT_H = () => W * 0.028
  const CEIL = () => W * 0.09
  const scrollSpeed = () => W * 0.0021 + floor * W * 0.000018

  const makePlat = (y) => {
    const kinds = ['normal', 'normal', 'normal', 'spike', 'belt', 'belt']
    const kind = floor < 4 ? 'normal' : kinds[randInt(0, kinds.length - 1)]
    const w = W * (0.24 + Math.random() * 0.12)
    return {
      x: randInt(0, Math.floor(W - w)),
      y,
      w,
      kind,
      dir: Math.random() < 0.5 ? -1 : 1,
      counted: false,
    }
  }

  const reset = () => {
    plats = []
    for (let i = 0; i < 7; i++) plats.push(makePlat(W * 0.3 + i * W * 0.19))
    plats[0].kind = 'normal'
    plats[0].x = W / 2 - plats[0].w / 2
    player = { x: W / 2, y: W * 0.22, vy: 0, r: W * 0.032, onPlat: null }
    floor = 0
    hp = 3
    scroll = 0
    over = false
    started = false
    hurtUntil = 0
    api.setScore(0)
    setHp('❤❤❤')
    api.hideOverlay()
    draw()
  }

  const hurt = (reason) => {
    if (performance.now() < hurtUntil) return
    hurtUntil = performance.now() + 900
    hp--
    setHp('❤'.repeat(Math.max(0, hp)) || '—')
    if (hp <= 0) {
      over = true
      api.gameOver(reason, `下到第 ${floor} 层`)
    }
  }

  const stopLoop = gameLoop((dt) => {
    if (over || !started) {
      draw()
      return
    }
    const k = Math.min(2.4, dt / 16.7)

    // world scrolls upward
    const sp = scrollSpeed() * k
    scroll += sp
    plats.forEach((p) => (p.y -= sp))
    player.y -= sp

    if (holdLeft) player.x -= W * 0.0115 * k
    if (holdRight) player.x += W * 0.0115* k

    player.vy += W * 0.00085 * k
    player.y += player.vy * k
    player.onPlat = null

    for (const p of plats) {
      if (p.kind === 'belt') p.x = clamp(p.x + p.dir * W * 0.0022 * k, 0, W - p.w)
      if (p.x <= 0 || p.x + p.w >= W) p.dir *= -1

      if (
        player.vy >= 0 &&
        player.x + player.r * 0.6 > p.x &&
        player.x - player.r * 0.6 < p.x + p.w &&
        player.y + player.r >= p.y &&
        player.y + player.r <= p.y + PLAT_H() + Math.abs(player.vy) * k + 2
      ) {
        player.y = p.y - player.r
        player.vy = 0
        player.onPlat = p
        if (p.kind === 'spike') hurt('被扎到了')
        if (p.kind === 'belt') player.x += p.dir * W * 0.004 * k
        if (!p.counted) {
          p.counted = true
          floor++
          api.setScore(floor)
        }
        break
      }
    }

    player.x = clamp(player.x, player.r, W - player.r)

    // ceiling crush and bottom fall
    if (player.y - player.r < CEIL()) {
      player.y = CEIL() + player.r
      hurt('被顶到天花板')
    }
    if (player.y - player.r > W) {
      over = true
      api.gameOver('掉出屏幕了', `下到第 ${floor} 层`)
      return
    }

    plats = plats.filter((p) => p.y > -W * 0.1)
    while (plats.length < 7) {
      const lowest = plats.reduce((m, p) => Math.max(m, p.y), 0)
      plats.push(makePlat(lowest + W * 0.19))
    }

    draw()
  })

  const draw = () => {
    const dark = isDark()
    ctx.clearRect(0, 0, W, W)
    ctx.fillStyle = dark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)'
    ctx.fillRect(0, 0, W, W)

    // ceiling with spikes
    const ch = CEIL()
    ctx.fillStyle = themeHsl(stage, { shift: 0, s: 55, l: dark ? 32 : 46 })
    ctx.fillRect(0, 0, W, ch * 0.6)
    ctx.beginPath()
    const teeth = 14
    for (let i = 0; i < teeth; i++) {
      const x = (i / teeth) * W
      ctx.moveTo(x, ch * 0.6)
      ctx.lineTo(x + W / teeth / 2, ch)
      ctx.lineTo(x + W / teeth, ch * 0.6)
    }
    ctx.fill()

    const ph = PLAT_H()
    for (const p of plats) {
      if (p.kind === 'spike') ctx.fillStyle = themeHsl(stage, { shift: 0, s: 70, l: 52 })
      else if (p.kind === 'belt') ctx.fillStyle = themeHsl(stage, { shift: 180, s: 60, l: 52 })
      else ctx.fillStyle = themeHsl(stage, { l: dark ? 46 : 58 })
      ctx.beginPath()
      ctx.roundRect(p.x, p.y, p.w, ph, ph / 2)
      ctx.fill()

      if (p.kind === 'spike') {
        ctx.fillStyle = 'rgba(255,255,255,0.7)'
        ctx.beginPath()
        const n = Math.max(3, Math.floor(p.w / (W * 0.035)))
        for (let i = 0; i < n; i++) {
          const x = p.x + (i / n) * p.w
          ctx.moveTo(x, p.y)
          ctx.lineTo(x + p.w / n / 2, p.y - ph * 0.75)
          ctx.lineTo(x + p.w / n, p.y)
        }
        ctx.fill()
      } else if (p.kind === 'belt') {
        ctx.strokeStyle = 'rgba(255,255,255,0.6)'
        ctx.lineWidth = 2
        for (let i = 0; i < 4; i++) {
          const x = p.x + p.w * (0.15 + i * 0.23)
          ctx.beginPath()
          ctx.moveTo(x, p.y + ph * 0.3)
          ctx.lineTo(x + p.dir * ph * 0.5, p.y + ph * 0.7)
          ctx.stroke()
        }
      }
    }

    // player (blinks while invulnerable)
    const blinking = performance.now() < hurtUntil && Math.floor(performance.now() / 90) % 2 === 0
    if (!blinking) {
      ctx.fillStyle = themeHsl(stage, { shift: 45, s: 78, l: 58 })
      ctx.beginPath()
      ctx.arc(player.x, player.y, player.r, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#fff'
      ctx.beginPath()
      ctx.arc(player.x - player.r * 0.3, player.y - player.r * 0.15, player.r * 0.19, 0, Math.PI * 2)
      ctx.arc(player.x + player.r * 0.3, player.y - player.r * 0.15, player.r * 0.19, 0, Math.PI * 2)
      ctx.fill()
    }

    if (!started && !over) {
      ctx.fillStyle = dark ? 'rgba(255,255,255,0.75)' : 'rgba(0,0,0,0.6)'
      ctx.font = `600 ${Math.max(12, W * 0.034)}px "Microsoft Yahei", sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('←→ / A D 移动，往下踩', W / 2, W * 0.62)
    }
  }

  const onKeyDown = (e) => {
    if (['ArrowLeft', 'a', 'A'].includes(e.key)) {
      e.preventDefault()
      holdLeft = true
      started = true
    } else if (['ArrowRight', 'd', 'D'].includes(e.key)) {
      e.preventDefault()
      holdRight = true
      started = true
    }
  }
  const onKeyUp = (e) => {
    if (['ArrowLeft', 'a', 'A'].includes(e.key)) holdLeft = false
    if (['ArrowRight', 'd', 'D'].includes(e.key)) holdRight = false
  }
  const onPointer = (e) => {
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    holdLeft = x < rect.width / 2
    holdRight = !holdLeft
    started = true
  }
  const onPointerUp = () => {
    holdLeft = false
    holdRight = false
  }

  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('keyup', onKeyUp)
  canvas.addEventListener('pointerdown', onPointer)
  canvas.addEventListener('pointermove', (e) => {
    if (holdLeft || holdRight) onPointer(e)
  })
  window.addEventListener('pointerup', onPointerUp)

  reset()

  return {
    restart: reset,
    destroy() {
      stopLoop()
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      canvas.removeEventListener('pointerdown', onPointer)
      window.removeEventListener('pointerup', onPointerUp)
      surface.destroy()
    },
  }
}
