import { themeHsl, isDark, fitCanvas, gameLoop, clamp, randInt } from './core.js'

const LANES = 4

export function mount(stage, api) {
  const viewport = stage.querySelector('[data-role="viewport"]')

  let W = 400
  let carX = 200
  let targetLane = 1
  let traffic = []
  let dashOffset = 0
  let distance = 0
  let speed = 0
  let over = false
  let started = false
  let spawnAcc = 0
  let nitroUntil = 0

  const setSpeed = api.addHudItem('时速', '0')
  const setDodged = api.addHudItem('躲过', 0)
  let dodged = 0

  const surface = fitCanvas(viewport, (px) => {
    W = px
    carX = laneX(targetLane)
    draw()
  })
  const { ctx, canvas } = surface

  const ROAD_L = () => W * 0.12
  const ROAD_R = () => W * 0.88
  const laneW = () => (ROAD_R() - ROAD_L()) / LANES
  function laneX(i) {
    return ROAD_L() + laneW() * (i + 0.5)
  }
  const CAR_W = () => laneW() * 0.62
  const CAR_H = () => CAR_W() * 1.7

  const reset = () => {
    targetLane = 1
    carX = laneX(1)
    traffic = []
    dashOffset = 0
    distance = 0
    dodged = 0
    speed = W * 0.008
    over = false
    started = false
    spawnAcc = 0
    nitroUntil = 0
    api.setScore(0)
    setSpeed('0')
    setDodged(0)
    api.hideOverlay()
    draw()
  }

  const spawn = () => {
    // Never block every lane at once
    const blocked = randInt(0, LANES - 1)
    for (let i = 0; i < LANES; i++) {
      if (i === blocked) continue
      if (Math.random() < 0.45) {
        traffic.push({
          lane: i,
          y: -CAR_H(),
          hue: randInt(0, 359),
          speedFactor: 0.35 + Math.random() * 0.3,
          passed: false,
        })
      }
    }
    if (Math.random() < 0.12) {
      traffic.push({ lane: blocked, y: -CAR_H() * 2, nitro: true, passed: false })
    }
  }

  const stopLoop = gameLoop((dt) => {
    if (over || !started) {
      draw()
      return
    }
    const k = dt / 16.7
    const boosted = performance.now() < nitroUntil
    speed = Math.min(W * 0.03, speed + W * 0.0000075 * k) * (boosted ? 1.45 : 1)

    distance += speed * k
    api.setScore(Math.floor(distance / 40))
    setSpeed(String(Math.round((speed / W) * 12000)))
    dashOffset = (dashOffset + speed * k * 1.2) % (W * 0.14)

    // steer toward the target lane
    const tx = laneX(targetLane)
    carX += (tx - carX) * Math.min(1, 0.22 * k)

    spawnAcc += dt
    const every = Math.max(420, 1200 - distance / 40)
    if (spawnAcc > every) {
      spawnAcc = 0
      spawn()
    }

    const carY = W * 0.78
    const cw = CAR_W()
    const ch = CAR_H()
    for (const t of traffic) {
      t.y += (speed * (t.nitro ? 0.4 : t.speedFactor + 0.55)) * k * 16.7 * 0.06
    }

    for (const t of traffic) {
      const tx2 = laneX(t.lane)
      const hit =
        Math.abs(tx2 - carX) < cw * 0.9 && t.y + ch > carY && t.y < carY + ch
      if (hit) {
        if (t.nitro) {
          nitroUntil = performance.now() + 2600
          t.y = W + 999
        } else {
          over = true
          api.gameOver('撞车了', `跑了 ${Math.floor(distance / 40)} 米，躲过 ${dodged} 辆车`)
          return
        }
      }
      if (!t.passed && t.y > carY + ch) {
        t.passed = true
        if (!t.nitro) {
          dodged++
          setDodged(dodged)
        }
      }
    }
    traffic = traffic.filter((t) => t.y < W + ch * 2)

    draw()
  })

  const drawCar = (x, y, w, h, color, flip) => {
    ctx.fillStyle = color
    ctx.beginPath()
    ctx.roundRect(x - w / 2, y, w, h, w * 0.22)
    ctx.fill()
    // windshield
    ctx.fillStyle = 'rgba(255,255,255,0.5)'
    ctx.beginPath()
    ctx.roundRect(x - w * 0.32, y + (flip ? h * 0.6 : h * 0.16), w * 0.64, h * 0.24, 3)
    ctx.fill()
    // wheels
    ctx.fillStyle = 'rgba(0,0,0,0.5)'
    ctx.fillRect(x - w * 0.58, y + h * 0.16, w * 0.16, h * 0.22)
    ctx.fillRect(x + w * 0.42, y + h * 0.16, w * 0.16, h * 0.22)
    ctx.fillRect(x - w * 0.58, y + h * 0.62, w * 0.16, h * 0.22)
    ctx.fillRect(x + w * 0.42, y + h * 0.62, w * 0.16, h * 0.22)
  }

  const draw = () => {
    const dark = isDark()
    ctx.clearRect(0, 0, W, W)

    // grass
    ctx.fillStyle = themeHsl(stage, { shift: 120, s: 30, l: dark ? 14 : 82 })
    ctx.fillRect(0, 0, W, W)

    // road
    ctx.fillStyle = dark ? '#2a2d36' : '#4a4e59'
    ctx.fillRect(ROAD_L(), 0, ROAD_R() - ROAD_L(), W)

    // edges
    ctx.fillStyle = '#fff'
    ctx.fillRect(ROAD_L() - 3, 0, 3, W)
    ctx.fillRect(ROAD_R(), 0, 3, W)

    // lane dashes
    ctx.strokeStyle = 'rgba(255,255,255,0.55)'
    ctx.lineWidth = 2.5
    ctx.setLineDash([W * 0.06, W * 0.08])
    ctx.lineDashOffset = -dashOffset
    for (let i = 1; i < LANES; i++) {
      const x = ROAD_L() + laneW() * i
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, W)
      ctx.stroke()
    }
    ctx.setLineDash([])

    const cw = CAR_W()
    const ch = CAR_H()
    for (const t of traffic) {
      if (t.nitro) {
        ctx.fillStyle = themeHsl(stage, { shift: 60, s: 90, l: 58 })
        ctx.beginPath()
        ctx.roundRect(laneX(t.lane) - cw * 0.3, t.y + ch * 0.3, cw * 0.6, cw * 0.6, 6)
        ctx.fill()
        ctx.fillStyle = '#fff'
        ctx.font = `700 ${cw * 0.36}px sans-serif`
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText('N', laneX(t.lane), t.y + ch * 0.3 + cw * 0.3)
      } else {
        drawCar(laneX(t.lane), t.y, cw, ch, `hsl(${t.hue}, 60%, ${dark ? 45 : 55}%)`, true)
      }
    }

    const boosted = performance.now() < nitroUntil
    if (boosted) {
      ctx.fillStyle = themeHsl(stage, { shift: 60, s: 90, l: 60, alpha: 0.5 })
      ctx.fillRect(carX - cw * 0.3, W * 0.78 + ch, cw * 0.6, W * 0.1)
    }
    drawCar(carX, W * 0.78, cw, ch, themeHsl(stage, { l: 55 }), false)

    if (!started && !over) {
      ctx.fillStyle = dark ? 'rgba(0,0,0,0.55)' : 'rgba(255,255,255,0.7)'
      ctx.fillRect(0, W * 0.38, W, W * 0.14)
      ctx.fillStyle = dark ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.7)'
      ctx.font = `600 ${Math.max(12, W * 0.033)}px "Microsoft Yahei", sans-serif`
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText('←→ / A D 变道，捡 N 可加速', W / 2, W * 0.45)
    }
  }

  const steer = (d) => {
    started = true
    targetLane = clamp(targetLane + d, 0, LANES - 1)
  }

  const onKey = (e) => {
    if (['ArrowLeft', 'a', 'A'].includes(e.key)) {
      e.preventDefault()
      steer(-1)
    } else if (['ArrowRight', 'd', 'D'].includes(e.key)) {
      e.preventDefault()
      steer(1)
    } else if (e.key === ' ') {
      e.preventDefault()
      started = true
    }
  }
  const onPointer = (e) => {
    const rect = canvas.getBoundingClientRect()
    steer(e.clientX - rect.left < rect.width / 2 ? -1 : 1)
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
      surface.destroy()
    },
  }
}
