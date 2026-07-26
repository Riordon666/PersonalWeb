import { themeHsl, isDark, fitCanvas, gameLoop, clamp } from './core.js'

const TARGET = 7

export function mount(stage, api) {
  const viewport = stage.querySelector('[data-role="viewport"]')

  let W = 400
  let me = { y: 200, h: 70 }
  let ai = { y: 200, h: 70 }
  let ball = { x: 200, y: 200, vx: 0, vy: 0, r: 7 }
  let myScore = 0
  let aiScore = 0
  let started = false
  let over = false
  let rallies = 0
  let holdUp = false
  let holdDown = false

  const setBoard = api.addHudItem('比分', '0 : 0')
  const setRally = api.addHudItem('回合', 0)

  const surface = fitCanvas(viewport, (px) => {
    W = px
    me.h = ai.h = px * 0.19
    ball.r = px * 0.019
    draw()
  })
  const { ctx, canvas } = surface

  const PAD_W = () => W * 0.022
  const baseSpeed = () => W * 0.011

  const serve = (toMe) => {
    ball.x = W / 2
    ball.y = W / 2
    const angle = (Math.random() - 0.5) * 0.6
    const s = baseSpeed()
    ball.vx = (toMe ? -1 : 1) * s * Math.cos(angle)
    ball.vy = s * Math.sin(angle)
    rallies = 0
    setRally(0)
  }

  const reset = () => {
    me = { y: W / 2, h: W * 0.19 }
    ai = { y: W / 2, h: W * 0.19 }
    myScore = 0
    aiScore = 0
    started = false
    over = false
    api.setScore(0)
    setBoard('0 : 0')
    setRally(0)
    api.hideOverlay()
    serve(Math.random() < 0.5)
    draw()
  }

  const point = (toMe) => {
    if (toMe) myScore++
    else aiScore++
    api.setScore(myScore)
    setBoard(`${myScore} : ${aiScore}`)
    if (myScore >= TARGET || aiScore >= TARGET) {
      over = true
      const won = myScore > aiScore
      api.gameOver(won ? '你赢了！' : 'AI 获胜', `${myScore} : ${aiScore}`, { won })
      return
    }
    serve(!toMe)
  }

  const stopLoop = gameLoop((dt) => {
    if (over || !started) {
      draw()
      return
    }
    const k = Math.min(2.5, dt / 16.7)

    if (holdUp) me.y -= W * 0.013 * k
    if (holdDown) me.y += W * 0.013 * k
    me.y = clamp(me.y, me.h / 2, W - me.h / 2)

    // AI tracks the ball with a capped speed, so it's beatable
    const aiSpeed = W * 0.0088
    const target = ball.vx > 0 ? ball.y : W / 2
    if (Math.abs(target - ai.y) > aiSpeed * k) {
      ai.y += Math.sign(target - ai.y) * aiSpeed * k
    }
    ai.y = clamp(ai.y, ai.h / 2, W - ai.h / 2)

    ball.x += ball.vx * k
    ball.y += ball.vy * k

    if (ball.y < ball.r) {
      ball.y = ball.r
      ball.vy = Math.abs(ball.vy)
    }
    if (ball.y > W - ball.r) {
      ball.y = W - ball.r
      ball.vy = -Math.abs(ball.vy)
    }

    const pw = PAD_W()
    const leftX = W * 0.05 + pw
    const rightX = W * 0.95 - pw

    // player paddle (left)
    if (ball.vx < 0 && ball.x - ball.r <= leftX && ball.x > leftX - pw * 2) {
      if (Math.abs(ball.y - me.y) < me.h / 2 + ball.r) {
        const t = (ball.y - me.y) / (me.h / 2)
        const speed = Math.hypot(ball.vx, ball.vy) * 1.045
        const angle = t * 0.9
        ball.vx = Math.abs(speed * Math.cos(angle))
        ball.vy = speed * Math.sin(angle)
        ball.x = leftX + ball.r
        rallies++
        setRally(rallies)
      }
    }

    // ai paddle (right)
    if (ball.vx > 0 && ball.x + ball.r >= rightX && ball.x < rightX + pw * 2) {
      if (Math.abs(ball.y - ai.y) < ai.h / 2 + ball.r) {
        const t = (ball.y - ai.y) / (ai.h / 2)
        const speed = Math.hypot(ball.vx, ball.vy) * 1.045
        const angle = t * 0.9
        ball.vx = -Math.abs(speed * Math.cos(angle))
        ball.vy = speed * Math.sin(angle)
        ball.x = rightX - ball.r
        rallies++
        setRally(rallies)
      }
    }

    if (ball.x < -ball.r * 2) point(false)
    else if (ball.x > W + ball.r * 2) point(true)

    draw()
  })

  const draw = () => {
    const dark = isDark()
    ctx.clearRect(0, 0, W, W)
    ctx.fillStyle = dark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)'
    ctx.fillRect(0, 0, W, W)

    ctx.strokeStyle = dark ? 'rgba(255,255,255,0.16)' : 'rgba(0,0,0,0.14)'
    ctx.lineWidth = 2
    ctx.setLineDash([8, 10])
    ctx.beginPath()
    ctx.moveTo(W / 2, 0)
    ctx.lineTo(W / 2, W)
    ctx.stroke()
    ctx.setLineDash([])

    const pw = PAD_W()
    ctx.fillStyle = themeHsl(stage, { l: 55 })
    ctx.beginPath()
    ctx.roundRect(W * 0.05, me.y - me.h / 2, pw, me.h, pw / 2)
    ctx.fill()
    ctx.fillStyle = dark ? '#c9ccd6' : '#494d59'
    ctx.beginPath()
    ctx.roundRect(W * 0.95 - pw, ai.y - ai.h / 2, pw, ai.h, pw / 2)
    ctx.fill()

    ctx.fillStyle = themeHsl(stage, { shift: 40, s: 80, l: 60 })
    ctx.beginPath()
    ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2)
    ctx.fill()

    ctx.fillStyle = dark ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.18)'
    ctx.font = `800 ${W * 0.14}px "Helvetica Neue", sans-serif`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(String(myScore), W * 0.3, W * 0.16)
    ctx.fillText(String(aiScore), W * 0.7, W * 0.16)

    if (!started && !over) {
      ctx.fillStyle = dark ? 'rgba(255,255,255,0.75)' : 'rgba(0,0,0,0.6)'
      ctx.font = `600 ${Math.max(12, W * 0.033)}px "Microsoft Yahei", sans-serif`
      ctx.fillText(`↑↓ 或拖动控制左侧挡板 · 先到 ${TARGET} 分`, W / 2, W * 0.6)
    }
  }

  const onKeyDown = (e) => {
    if (['ArrowUp', 'w', 'W'].includes(e.key)) {
      e.preventDefault()
      holdUp = true
      started = true
    } else if (['ArrowDown', 's', 'S'].includes(e.key)) {
      e.preventDefault()
      holdDown = true
      started = true
    } else if (e.key === ' ') {
      e.preventDefault()
      started = true
    }
  }
  const onKeyUp = (e) => {
    if (['ArrowUp', 'w', 'W'].includes(e.key)) holdUp = false
    if (['ArrowDown', 's', 'S'].includes(e.key)) holdDown = false
  }
  const onPointer = (e) => {
    const rect = canvas.getBoundingClientRect()
    me.y = clamp(e.clientY - rect.top, me.h / 2, W - me.h / 2)
    started = true
  }

  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('keyup', onKeyUp)
  canvas.addEventListener('pointerdown', onPointer)
  canvas.addEventListener('pointermove', onPointer)

  reset()

  return {
    restart: reset,
    destroy() {
      stopLoop()
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      canvas.removeEventListener('pointerdown', onPointer)
      canvas.removeEventListener('pointermove', onPointer)
      surface.destroy()
    },
  }
}
