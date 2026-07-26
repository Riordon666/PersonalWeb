import { themeHsl, isDark, fitCanvas, gameLoop, clamp, randInt } from './core.js'

const COLS = 11
const COLORS = 5

export function mount(stage, api) {
  const viewport = stage.querySelector('[data-role="viewport"]')

  let W = 400
  let r = 18
  let rows = []
  let shooter = { color: 0, next: 0, angle: -Math.PI / 2 }
  let flying = null
  let score = 0
  let shots = 0
  let over = false

  const setNext = api.addHudItem('下一颗', '●')
  const setRows = api.addHudItem('行数', 0)

  const surface = fitCanvas(viewport, (px) => {
    W = px
    r = px / COLS / 2
    draw()
  })
  const { ctx, canvas } = surface

  const rowOffset = (row) => (row % 2 ? r : 0)
  const cellX = (row, col) => rowOffset(row) + r + col * r * 2
  const cellY = (row) => r + row * r * 1.72
  const colsIn = (row) => (row % 2 ? COLS - 1 : COLS)

  const addRow = (top = true) => {
    const row = Array.from({ length: COLS }, () => randInt(0, COLORS - 1))
    if (top) rows.unshift(row)
    else rows.push(row)
  }

  const reset = () => {
    rows = []
    for (let i = 0; i < 5; i++) addRow(false)
    shooter = { color: randInt(0, COLORS - 1), next: randInt(0, COLORS - 1), angle: -Math.PI / 2 }
    flying = null
    score = 0
    shots = 0
    over = false
    api.setScore(0)
    setNext('●')
    setRows(rows.length)
    api.hideOverlay()
    draw()
  }

  const neighbors = (row, col) => {
    const odd = row % 2
    const out = [
      [row, col - 1],
      [row, col + 1],
      [row - 1, col - (odd ? 0 : 1)],
      [row - 1, col + (odd ? 1 : 0)],
      [row + 1, col - (odd ? 0 : 1)],
      [row + 1, col + (odd ? 1 : 0)],
    ]
    return out.filter(([rr, cc]) => rr >= 0 && rr < rows.length && cc >= 0 && cc < colsIn(rr))
  }

  const cluster = (row, col, matchColor) => {
    const color = rows[row][col]
    const seen = new Set([`${row},${col}`])
    const stack = [[row, col]]
    const out = [[row, col]]
    while (stack.length) {
      const [rr, cc] = stack.pop()
      for (const [nr, nc] of neighbors(rr, cc)) {
        const key = `${nr},${nc}`
        if (seen.has(key)) continue
        const v = rows[nr][nc]
        if (v === null || v === undefined) continue
        if (matchColor && v !== color) continue
        seen.add(key)
        stack.push([nr, nc])
        out.push([nr, nc])
      }
    }
    return out
  }

  const dropFloating = () => {
    const attached = new Set()
    if (rows[0]) {
      for (let c = 0; c < colsIn(0); c++) {
        if (rows[0][c] === null || rows[0][c] === undefined) continue
        for (const [rr, cc] of cluster(0, c, false)) attached.add(`${rr},${cc}`)
      }
    }
    let dropped = 0
    for (let rr = 0; rr < rows.length; rr++)
      for (let cc = 0; cc < colsIn(rr); cc++) {
        const v = rows[rr][cc]
        if (v === null || v === undefined) continue
        if (!attached.has(`${rr},${cc}`)) {
          rows[rr][cc] = null
          dropped++
        }
      }
    return dropped
  }

  const settle = (row, col, color) => {
    if (row >= rows.length) {
      while (rows.length <= row) rows.push(Array(COLS).fill(null))
    }
    rows[row][col] = color

    const group = cluster(row, col, true)
    if (group.length >= 3) {
      for (const [rr, cc] of group) rows[rr][cc] = null
      score += group.length * 10
      const dropped = dropFloating()
      score += dropped * 20
      api.setScore(score)
    }

    // trim empty trailing rows
    while (rows.length && rows[rows.length - 1].every((v) => v === null || v === undefined)) rows.pop()
    setRows(rows.length)

    if (!rows.length) {
      over = true
      api.gameOver('全部清空！', `得分 ${score}`)
      return
    }
    if (cellY(rows.length - 1) > W * 0.82) {
      over = true
      api.gameOver('顶到底线了', `得分 ${score}`)
      return
    }

    shots++
    if (shots % 6 === 0) {
      addRow(true)
      setRows(rows.length)
    }
  }

  const shoot = () => {
    if (flying || over) return
    flying = {
      x: W / 2,
      y: W - r * 2,
      vx: Math.cos(shooter.angle) * W * 0.019,
      vy: Math.sin(shooter.angle) * W * 0.019,
      color: shooter.color,
    }
    shooter.color = shooter.next
    shooter.next = randInt(0, COLORS - 1)
  }

  const stopLoop = gameLoop((dt) => {
    if (over) {
      draw()
      return
    }
    const k = Math.min(2.5, dt / 16.7)

    if (flying) {
      flying.x += flying.vx * k
      flying.y += flying.vy * k
      if (flying.x < r) {
        flying.x = r
        flying.vx = Math.abs(flying.vx)
      }
      if (flying.x > W - r) {
        flying.x = W - r
        flying.vx = -Math.abs(flying.vx)
      }

      let hit = flying.y <= r
      if (!hit) {
        outer: for (let rr = 0; rr < rows.length; rr++)
          for (let cc = 0; cc < colsIn(rr); cc++) {
            const v = rows[rr][cc]
            if (v === null || v === undefined) continue
            if (Math.hypot(cellX(rr, cc) - flying.x, cellY(rr) - flying.y) < r * 1.85) {
              hit = true
              break outer
            }
          }
      }

      if (hit) {
        const row = clamp(Math.round((flying.y - r) / (r * 1.72)), 0, rows.length)
        const col = clamp(Math.round((flying.x - rowOffset(row) - r) / (r * 2)), 0, colsIn(row) - 1)
        const color = flying.color
        flying = null
        settle(row, col, color)
      } else if (flying.y > W + r * 3) {
        flying = null
      }
    }

    draw()
  })

  const bubbleColor = (i) => themeHsl(stage, { shift: i * 68, s: 68, l: 58 })

  const draw = () => {
    const dark = isDark()
    ctx.clearRect(0, 0, W, W)
    ctx.fillStyle = dark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)'
    ctx.fillRect(0, 0, W, W)

    for (let rr = 0; rr < rows.length; rr++)
      for (let cc = 0; cc < colsIn(rr); cc++) {
        const v = rows[rr][cc]
        if (v === null || v === undefined) continue
        ctx.fillStyle = bubbleColor(v)
        ctx.beginPath()
        ctx.arc(cellX(rr, cc), cellY(rr), r * 0.92, 0, Math.PI * 2)
        ctx.fill()
        ctx.fillStyle = 'rgba(255,255,255,0.3)'
        ctx.beginPath()
        ctx.arc(cellX(rr, cc) - r * 0.3, cellY(rr) - r * 0.3, r * 0.26, 0, Math.PI * 2)
        ctx.fill()
      }

    // danger line
    ctx.strokeStyle = 'hsla(4, 75%, 55%, 0.4)'
    ctx.lineWidth = 2
    ctx.setLineDash([6, 6])
    ctx.beginPath()
    ctx.moveTo(0, W * 0.82)
    ctx.lineTo(W, W * 0.82)
    ctx.stroke()
    ctx.setLineDash([])

    // aim guide
    if (!flying && !over) {
      ctx.strokeStyle = dark ? 'rgba(255,255,255,0.28)' : 'rgba(0,0,0,0.22)'
      ctx.lineWidth = 2
      ctx.setLineDash([4, 8])
      ctx.beginPath()
      ctx.moveTo(W / 2, W - r * 2)
      ctx.lineTo(W / 2 + Math.cos(shooter.angle) * W * 0.5, W - r * 2 + Math.sin(shooter.angle) * W * 0.5)
      ctx.stroke()
      ctx.setLineDash([])
    }

    // shooter
    ctx.fillStyle = bubbleColor(shooter.color)
    ctx.beginPath()
    ctx.arc(W / 2, W - r * 2, r * 0.95, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = bubbleColor(shooter.next)
    ctx.beginPath()
    ctx.arc(W / 2 + r * 2.6, W - r * 1.4, r * 0.6, 0, Math.PI * 2)
    ctx.fill()

    if (flying) {
      ctx.fillStyle = bubbleColor(flying.color)
      ctx.beginPath()
      ctx.arc(flying.x, flying.y, r * 0.92, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  const aimAt = (e) => {
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    const dx = x - W / 2
    const dy = y - (W - r * 2)
    // Clamp so the player can't shoot downward
    shooter.angle = clamp(Math.atan2(dy, dx), -Math.PI * 0.92, -Math.PI * 0.08)
  }

  const onMove = (e) => aimAt(e)
  const onDown = (e) => {
    aimAt(e)
    shoot()
  }
  const onKey = (e) => {
    if (e.key === 'ArrowLeft') shooter.angle = clamp(shooter.angle - 0.07, -Math.PI * 0.92, -Math.PI * 0.08)
    else if (e.key === 'ArrowRight') shooter.angle = clamp(shooter.angle + 0.07, -Math.PI * 0.92, -Math.PI * 0.08)
    else if (e.key === ' ') {
      e.preventDefault()
      shoot()
    } else return
    e.preventDefault()
  }

  canvas.addEventListener('pointermove', onMove)
  canvas.addEventListener('pointerdown', onDown)
  window.addEventListener('keydown', onKey)

  reset()

  return {
    restart: reset,
    destroy() {
      stopLoop()
      canvas.removeEventListener('pointermove', onMove)
      canvas.removeEventListener('pointerdown', onDown)
      window.removeEventListener('keydown', onKey)
      surface.destroy()
    },
  }
}
