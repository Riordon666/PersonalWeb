/**
 * Riordon's Personal Website - Main JavaScript
 * Converted from original main.js to ES Module
 */

import { siteConfig } from '../../site.config.js'

// ========================================
// Global Variables & Utilities
// ========================================

window.hiddenProperty =
  'hidden' in document
    ? 'hidden'
    : 'webkitHidden' in document
    ? 'webkitHidden'
    : 'mozHidden' in document
    ? 'mozHidden'
    : null

window.DIRECTIONS = {
  UP: 'UP',
  DOWN: 'DOWN',
  LEFT: 'LEFT',
  RIGHT: 'RIGHT',
  UNDIRECTED: 'UNDIRECTED',
}

window.isPhone =
  /Mobile|Android|iOS|iPhone|iPad|iPod|Windows Phone|KFAPWI/i.test(
    navigator.userAgent
  )

// ========================================
// GridAnimation Class
// ========================================

class GridAnimation {
  constructor(canvas, options = {}) {
    this.canvas = canvas
    this.ctx = canvas.getContext('2d')
    this.options = {
      direction: options.direction || 'right',
      speed: options.speed || 1,
      borderColor: options.borderColor || 'rgba(255, 255, 255, 0.05)',
      squareSize: options.squareSize || 40,
      hoverFillColor: options.hoverFillColor || 'rgba(255, 255, 255, 0.6)',
      hoverShadowColor: options.hoverShadowColor || 'rgba(255, 255, 255, 0.3)',
      transitionDuration: options.transitionDuration || 200,
      trailDuration: options.trailDuration || 1000,
      specialBlockColor: options.specialBlockColor || 'rgba(255, 100, 100, 0.8)',
      specialHoverColor: options.specialHoverColor || 'rgba(100, 255, 100, 0.8)',
      snakeHeadColor: options.snakeHeadColor || 'rgba(255, 255, 255, 0.9)',
      snakeTailColor: options.snakeTailColor || 'rgba(100, 100, 255, 0.3)',
      snakeGradientStops: options.snakeGradientStops || 5,
      snakeColorDecay: options.snakeColorDecay || 0.7,
      touchSensitivity: options.touchSensitivity || 1.0,
      vibrationEnabled: options.vibrationEnabled || false,
      ...options,
    }

    this.gridOffset = { x: 0, y: 0 }
    this.hoveredSquare = null
    this.animationFrame = null
    this.currentOpacity = 0
    this.targetOpacity = 0
    this.lastTimestamp = 0
    this.hoverRadius = 3
    this.trailSquares = new Map()
    this.specialBlock = null
    this.specialBlockTimer = null
    this.isSpecialBlockHovered = false
    this.snakeBody = []
    this.shouldGrow = false
  }

  init() {
    this.resizeCanvas()
    this.setupEventListeners()

    if (isPhone) {
      this.optimizeForMobile()
    }

    this.animate()

    if (isPhone) {
      setTimeout(() => {
        this.createSpecialBlock()
      }, 500)
    } else {
      this.createSpecialBlock()
    }

    document.addEventListener(
      visibilityChangeEvent,
      this.handleVisibilityChange.bind(this)
    )
  }

  optimizeForMobile() {
    const canvas = this.canvas
    const ctx = canvas.getContext('2d')

    const startTime = performance.now()
    for (let i = 0; i < 1000; i++) {
      ctx.fillRect(0, 0, 1, 1)
    }
    const endTime = performance.now()
    const performanceScore = endTime - startTime

    if (performanceScore > 10) {
      this.options.squareSize = Math.max(this.options.squareSize * 1.5, 60)
      this.options.speed *= 0.7
      this.options.trailDuration *= 0.5
    } else if (performanceScore > 5) {
      this.options.squareSize = Math.max(this.options.squareSize * 1.2, 50)
      this.options.speed *= 0.8
    }
  }

  resizeCanvas() {
    const dpr = window.devicePixelRatio || 1
    const displayWidth = this.canvas.offsetWidth
    const displayHeight = this.canvas.offsetHeight

    this.canvas.width = Math.floor(displayWidth * dpr)
    this.canvas.height = Math.floor(displayHeight * dpr)

    this.canvas.style.width = `${displayWidth}px`
    this.canvas.style.height = `${displayHeight}px`

    this.ctx.scale(dpr, dpr)
  }

  setupEventListeners() {
    window.addEventListener('resize', () => this.resizeCanvas())
    this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e))
    this.canvas.addEventListener('mouseleave', () => this.handleMouseLeave())

    if (isPhone) {
      this.setupTouchEvents()
    }

    if (isPhone && window.orientation !== undefined) {
      window.addEventListener('orientationchange', () => {
        setTimeout(() => {
          this.resizeCanvas()
          this.createSpecialBlock()
        }, 300)
      })
    }
  }

  setupTouchEvents() {
    let touchStartPos = null
    let touchMovePos = null
    let isTouching = false
    let lastTouchTime = 0
    let touchCount = 0

    this.handleTouchStart = (e) => {
      e.preventDefault()
      const now = Date.now()

      if (now - lastTouchTime < 16) {
        return
      }
      lastTouchTime = now

      if (e.touches.length === 1) {
        const touch = e.touches[0]
        const rect = this.canvas.getBoundingClientRect()
        touchStartPos = {
          x: touch.clientX - rect.left,
          y: touch.clientY - rect.top,
          time: now,
        }
        isTouching = true
        touchCount++

        this.handleTouchMove(touchStartPos.x, touchStartPos.y)

        if (!this.hoveredSquare) {
          this.targetOpacity = 0.8 * this.options.touchSensitivity
        }

        if (this.options.vibrationEnabled && navigator.vibrate) {
          navigator.vibrate(10)
        }
      }
    }

    this.handleTouchMoveEvent = (e) => {
      e.preventDefault()
      if (isTouching && e.touches.length === 1) {
        const touch = e.touches[0]
        const rect = this.canvas.getBoundingClientRect()
        touchMovePos = {
          x: touch.clientX - rect.left,
          y: touch.clientY - rect.top,
        }

        this.handleTouchMove(touchMovePos.x, touchMovePos.y)
      }
    }

    this.handleTouchEndEvent = (e) => {
      e.preventDefault()
      const now = Date.now()

      if (touchStartPos && now - touchStartPos.time < 300) {
        touchCount++
        if (touchCount === 2) {
          this.resetSnake()
          touchCount = 0

          if (this.options.vibrationEnabled && navigator.vibrate) {
            navigator.vibrate([50, 50, 50])
          }
          return
        }
      } else {
        touchCount = 0
      }

      isTouching = false
      touchStartPos = null
      touchMovePos = null

      this.handleTouchEnd()
    }

    this.handleTouchCancel = (e) => {
      e.preventDefault()
      isTouching = false
      touchStartPos = null
      touchMovePos = null
    }

    this.canvas.addEventListener('touchstart', this.handleTouchStart, {
      passive: false,
    })
    this.canvas.addEventListener('touchmove', this.handleTouchMoveEvent, {
      passive: false,
    })
    this.canvas.addEventListener('touchend', this.handleTouchEndEvent, {
      passive: false,
    })
    this.canvas.addEventListener('touchcancel', this.handleTouchCancel, {
      passive: false,
    })
  }

  handleTouchMove(x, y) {
    const startX =
      Math.floor(this.gridOffset.x / this.options.squareSize) *
      this.options.squareSize
    const startY =
      Math.floor(this.gridOffset.y / this.options.squareSize) *
      this.options.squareSize

    const hoveredSquareX = Math.floor(
      (x + this.gridOffset.x - startX) / this.options.squareSize
    )
    const hoveredSquareY = Math.floor(
      (y + this.gridOffset.y - startY) / this.options.squareSize
    )

    if (
      this.hoveredSquare?.x !== hoveredSquareX ||
      this.hoveredSquare?.y !== hoveredSquareY
    ) {
      if (this.hoveredSquare) {
        this.snakeBody.unshift({
          x: this.hoveredSquare.x,
          y: this.hoveredSquare.y,
        })

        if (!this.shouldGrow && this.snakeBody.length > 0) {
          this.snakeBody.pop()
        }
        this.shouldGrow = false
      }

      this.hoveredSquare = { x: hoveredSquareX, y: hoveredSquareY }
      this.targetOpacity = 0.8 * this.options.touchSensitivity

      if (
        this.specialBlock &&
        hoveredSquareX === this.specialBlock.x &&
        hoveredSquareY === this.specialBlock.y
      ) {
        this.shouldGrow = true
        this.createSpecialBlock()

        if (this.options.vibrationEnabled && navigator.vibrate) {
          navigator.vibrate(100)
        }
      }
    }
  }

  handleTouchEnd() {
    if (this.hoveredSquare) {
      this.snakeBody.unshift({
        x: this.hoveredSquare.x,
        y: this.hoveredSquare.y,
      })

      if (!this.shouldGrow && this.snakeBody.length > 0) {
        this.snakeBody.pop()
      }
      this.shouldGrow = false

      const startX =
        Math.floor(this.gridOffset.x / this.options.squareSize) *
        this.options.squareSize
      const startY =
        Math.floor(this.gridOffset.y / this.options.squareSize) *
        this.options.squareSize
      const key = `${this.hoveredSquare.x},${this.hoveredSquare.y}`
      this.trailSquares.set(key, {
        x: this.hoveredSquare.x * this.options.squareSize + startX,
        y: this.hoveredSquare.y * this.options.squareSize + startY,
        opacity: 0.8,
      })
    }

    if (this.hoveredSquare) {
      this.targetOpacity = 0.4
    }
  }

  resetSnake() {
    this.snakeBody = []
    this.hoveredSquare = null
    this.targetOpacity = 0

    this.trailSquares.clear()

    this.createSpecialBlock()

    if (this.options.vibrationEnabled && navigator.vibrate) {
      navigator.vibrate(200)
    }
  }

  handleMouseMove(event) {
    const rect = this.canvas.getBoundingClientRect()
    const mouseX = event.clientX - rect.left
    const mouseY = event.clientY - rect.top

    const startX =
      Math.floor(this.gridOffset.x / this.options.squareSize) *
      this.options.squareSize
    const startY =
      Math.floor(this.gridOffset.y / this.options.squareSize) *
      this.options.squareSize

    const hoveredSquareX = Math.floor(
      (mouseX + this.gridOffset.x - startX) / this.options.squareSize
    )
    const hoveredSquareY = Math.floor(
      (mouseY + this.gridOffset.y - startY) / this.options.squareSize
    )

    if (
      this.hoveredSquare?.x !== hoveredSquareX ||
      this.hoveredSquare?.y !== hoveredSquareY
    ) {
      if (this.hoveredSquare) {
        this.snakeBody.unshift({
          x: this.hoveredSquare.x,
          y: this.hoveredSquare.y,
        })

        if (!this.shouldGrow && this.snakeBody.length > 0) {
          this.snakeBody.pop()
        }
        this.shouldGrow = false
      }

      this.hoveredSquare = { x: hoveredSquareX, y: hoveredSquareY }
      this.targetOpacity = 0.6

      if (
        this.specialBlock &&
        hoveredSquareX === this.specialBlock.x &&
        hoveredSquareY === this.specialBlock.y
      ) {
        this.shouldGrow = true
        this.createSpecialBlock()
      }
    }
  }

  handleMouseLeave() {
    if (this.hoveredSquare) {
      const startX =
        Math.floor(this.gridOffset.x / this.options.squareSize) *
        this.options.squareSize
      const startY =
        Math.floor(this.gridOffset.y / this.options.squareSize) *
        this.options.squareSize
      const key = `${this.hoveredSquare.x},${this.hoveredSquare.y}`
      this.trailSquares.set(key, {
        x: this.hoveredSquare.x * this.options.squareSize + startX,
        y: this.hoveredSquare.y * this.options.squareSize + startY,
        opacity: 0.6,
      })
    }
    this.hoveredSquare = null
    this.targetOpacity = 0
  }

  createSpecialBlock() {
    if (this.specialBlockTimer) {
      clearTimeout(this.specialBlockTimer)
    }

    const dpr = window.devicePixelRatio || 1

    const numSquaresX = Math.ceil(
      this.canvas.width / dpr / this.options.squareSize
    )
    const numSquaresY = Math.ceil(
      this.canvas.height / dpr / this.options.squareSize
    )

    let newX, newY
    do {
      newX = 1 + Math.floor(Math.random() * (numSquaresX - 2))
      newY = 1 + Math.floor(Math.random() * (numSquaresY - 2))
    } while (
      this.snakeBody.some((segment) => segment.x === newX && segment.y === newY)
    )

    this.specialBlock = {
      x: newX,
      y: newY,
      color: this.options.specialBlockColor,
      initialOffset: { ...this.gridOffset },
    }
  }

  drawGrid() {
    const dpr = window.devicePixelRatio || 1

    this.ctx.setTransform(1, 0, 0, 1, 0, 0)
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)

    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0)

    const startX =
      Math.floor(this.gridOffset.x / this.options.squareSize) *
      this.options.squareSize
    const startY =
      Math.floor(this.gridOffset.y / this.options.squareSize) *
      this.options.squareSize

    this.ctx.lineWidth = isPhone ? 1.0 : 0.5

    if (isPhone) {
      this.ctx.translate(0.5, 0.5)
    }

    // Draw snake body
    this.snakeBody.forEach((segment, index) => {
      const squareX = Math.round(
        segment.x * this.options.squareSize +
          startX -
          this.gridOffset.x % this.options.squareSize
      )
      const squareY = Math.round(
        segment.y * this.options.squareSize +
          startY -
          this.gridOffset.y % this.options.squareSize
      )

      this.ctx.shadowColor = this.options.hoverShadowColor
      this.ctx.shadowBlur = 15
      this.ctx.shadowOffsetX = 0
      this.ctx.shadowOffsetY = 0

      if (index === 0) {
        this.ctx.fillStyle = this.options.snakeHeadColor
      } else {
        const gradientFactor = Math.pow(this.options.snakeColorDecay, index)

        const headColorMatch = this.options.snakeHeadColor.match(
          /rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([.\d]+))?\)/
        )
        const tailColorMatch = this.options.snakeTailColor.match(
          /rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*([.\d]+))?\)/
        )

        if (headColorMatch && tailColorMatch) {
          const headR = parseInt(headColorMatch[1])
          const headG = parseInt(headColorMatch[2])
          const headB = parseInt(headColorMatch[3])
          const headA = headColorMatch[4] ? parseFloat(headColorMatch[4]) : 1

          const tailR = parseInt(tailColorMatch[1])
          const tailG = parseInt(tailColorMatch[2])
          const tailB = parseInt(tailColorMatch[3])
          const tailA = tailColorMatch[4] ? parseFloat(tailColorMatch[4]) : 1

          const r = Math.round(headR + (tailR - headR) * (1 - gradientFactor))
          const g = Math.round(headG + (tailG - headG) * (1 - gradientFactor))
          const b = Math.round(headB + (tailB - headB) * (1 - gradientFactor))
          const a = headA + (tailA - headA) * (1 - gradientFactor)

          this.ctx.fillStyle = `rgba(${r}, ${g}, ${b}, ${a})`
        } else {
          const opacity = Math.max(0.2, gradientFactor)
          this.ctx.fillStyle = `rgba(255, 255, 255, ${opacity})`
        }
      }

      this.ctx.fillRect(
        squareX,
        squareY,
        this.options.squareSize,
        this.options.squareSize
      )

      this.ctx.shadowColor = 'transparent'
      this.ctx.shadowBlur = 0
    })

    // Draw grid and special blocks
    for (
      let x = startX;
      x < this.canvas.width + this.options.squareSize;
      x += this.options.squareSize
    ) {
      for (
        let y = startY;
        y < this.canvas.height + this.options.squareSize;
        y += this.options.squareSize
      ) {
        const squareX = Math.round(x - (this.gridOffset.x % this.options.squareSize))
        const squareY = Math.round(y - (this.gridOffset.y % this.options.squareSize))
        const gridX = Math.floor((x - startX) / this.options.squareSize)
        const gridY = Math.floor((y - startY) / this.options.squareSize)

        // Draw food
        if (
          this.specialBlock &&
          gridX === this.specialBlock.x &&
          gridY === this.specialBlock.y
        ) {
          this.ctx.shadowColor = 'rgba(255, 255, 255, 0.5)'
          this.ctx.shadowBlur = 20
          this.ctx.fillStyle = this.specialBlock.color
          this.ctx.fillRect(
            squareX,
            squareY,
            this.options.squareSize,
            this.options.squareSize
          )
          this.ctx.shadowColor = 'transparent'
          this.ctx.shadowBlur = 0
        }

        // Draw hovered square
        if (
          this.hoveredSquare &&
          gridX === this.hoveredSquare.x &&
          gridY === this.hoveredSquare.y
        ) {
          this.ctx.shadowColor = this.options.hoverShadowColor
          this.ctx.shadowBlur = 15
          this.ctx.shadowOffsetX = 0
          this.ctx.shadowOffsetY = 0

          const color = this.options.hoverFillColor.replace(
            '0.6',
            this.currentOpacity.toString()
          )
          this.ctx.fillStyle = color
          this.ctx.fillRect(
            squareX,
            squareY,
            this.options.squareSize,
            this.options.squareSize
          )

          this.ctx.shadowColor = 'transparent'
          this.ctx.shadowBlur = 0
        }

        this.ctx.strokeStyle = this.options.borderColor
        this.ctx.strokeRect(
          squareX,
          squareY,
          this.options.squareSize,
          this.options.squareSize
        )
      }
    }

    if (isPhone) {
      this.ctx.translate(-0.5, -0.5)
    }

    // Vignette effect
    const gradient = this.ctx.createRadialGradient(
      this.canvas.width / dpr / 2,
      this.canvas.height / dpr / 2,
      0,
      this.canvas.width / dpr / 2,
      this.canvas.height / dpr / 2,
      Math.sqrt(
        Math.pow(this.canvas.width / dpr, 2) +
          Math.pow(this.canvas.height / dpr, 2)
      ) / 2
    )
    gradient.addColorStop(0, 'rgba(6, 6, 6, 0)')
    gradient.addColorStop(1, '#060606')

    this.ctx.fillStyle = gradient
    this.ctx.fillRect(0, 0, this.canvas.width / dpr, this.canvas.height / dpr)
  }

  updateAnimation(timestamp) {
    if (!this.lastTimestamp) {
      this.lastTimestamp = timestamp
    }

    const deltaTime = timestamp - this.lastTimestamp
    this.lastTimestamp = timestamp

    if (this.currentOpacity !== this.targetOpacity) {
      const progress = Math.min(deltaTime / this.options.transitionDuration, 1)
      this.currentOpacity =
        this.currentOpacity +
        (this.targetOpacity - this.currentOpacity) * progress
    }

    for (const [key, square] of this.trailSquares) {
      square.opacity -= deltaTime / this.options.trailDuration
      if (square.opacity <= 0) {
        this.trailSquares.delete(key)
      }
    }

    const dpr = window.devicePixelRatio || 1

    const effectiveSpeed = Math.max(
      isPhone ? this.options.speed * 0.8 : this.options.speed,
      0
    )

    const moveAmount = isPhone
      ? Math.round(effectiveSpeed * 100) / 100
      : effectiveSpeed

    switch (this.options.direction) {
      case 'right':
        this.gridOffset.x =
          (this.gridOffset.x - moveAmount + this.options.squareSize) %
          this.options.squareSize
        break
      case 'left':
        this.gridOffset.x =
          (this.gridOffset.x + moveAmount + this.options.squareSize) %
          this.options.squareSize
        break
      case 'up':
        this.gridOffset.y =
          (this.gridOffset.y + moveAmount + this.options.squareSize) %
          this.options.squareSize
        break
      case 'down':
        this.gridOffset.y =
          (this.gridOffset.y - moveAmount + this.options.squareSize) %
          this.options.squareSize
        break
      case 'diagonal':
        this.gridOffset.x =
          (this.gridOffset.x - moveAmount + this.options.squareSize) %
          this.options.squareSize
        this.gridOffset.y =
          (this.gridOffset.y - moveAmount + this.options.squareSize) %
          this.options.squareSize
        break
    }

    if (this.specialBlock) {
      const startX =
        Math.floor(this.gridOffset.x / this.options.squareSize) *
        this.options.squareSize
      const startY =
        Math.floor(this.gridOffset.y / this.options.squareSize) *
        this.options.squareSize
      const foodX = Math.round(
        this.specialBlock.x * this.options.squareSize +
          startX -
          this.gridOffset.x % this.options.squareSize
      )
      const foodY = Math.round(
        this.specialBlock.y * this.options.squareSize +
          startY -
          this.gridOffset.y % this.options.squareSize
      )

      if (
        foodX < -this.options.squareSize ||
        foodX > this.canvas.width / dpr ||
        foodY < -this.options.squareSize ||
        foodY > this.canvas.height / dpr
      ) {
        this.createSpecialBlock()
      }
    }

    this.drawGrid()
    this.animationFrame = requestAnimationFrame((timestamp) =>
      this.updateAnimation(timestamp)
    )
  }

  animate() {
    this.animationFrame = requestAnimationFrame((timestamp) =>
      this.updateAnimation(timestamp)
    )
  }

  handleVisibilityChange() {
    if (document[hiddenProperty]) {
      if (this.animationFrame) {
        cancelAnimationFrame(this.animationFrame)
        this.animationFrame = null
      }
    } else {
      if (!this.animationFrame) {
        this.lastTimestamp = 0
        this.animate()
      }
    }
  }

  destroy() {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame)
    }
    window.removeEventListener('resize', () => this.resizeCanvas())
    this.canvas.removeEventListener('mousemove', (e) => this.handleMouseMove(e))
    this.canvas.removeEventListener('mouseleave', () => this.handleMouseLeave())

    if (isPhone && this.handleTouchStart) {
      this.canvas.removeEventListener('touchstart', this.handleTouchStart)
      this.canvas.removeEventListener('touchmove', this.handleTouchMoveEvent)
      this.canvas.removeEventListener('touchend', this.handleTouchEndEvent)
      this.canvas.removeEventListener('touchcancel', this.handleTouchCancel)
    }

    document.removeEventListener(
      visibilityChangeEvent,
      this.handleVisibilityChange.bind(this)
    )

    if (isPhone && window.orientation !== undefined) {
      window.removeEventListener('orientationchange', () => {})
    }
  }
}

// ========================================
// Page Functions
// ========================================

function getMoveDirection(startx, starty, endx, endy) {
  if (!isPhone) {
    return
  }

  const angx = endx - startx
  const angy = endy - starty

  if (Math.abs(angx) < 2 && Math.abs(angy) < 2) {
    return DIRECTIONS.UNDIRECTED
  }

  const getAngle = (angx, angy) => (Math.atan2(angy, angx) * 180) / Math.PI

  const angle = getAngle(angx, angy)
  if (angle >= -135 && angle <= -45) {
    return DIRECTIONS.UP
  } else if (angle > 45 && angle < 135) {
    return DIRECTIONS.DOWN
  } else if ((angle >= 135 && angle <= 180) || (angle >= -180 && angle < -135)) {
    return DIRECTIONS.LEFT
  } else if (angle >= -45 && angle <= 45) {
    return DIRECTIONS.RIGHT
  }

  return DIRECTIONS.UNDIRECTED
}

function loadIntro() {
  if (document[hiddenProperty] || loadIntro.loaded) {
    return
  }

  setTimeout(() => {
    $('.wrap').classList.add('in')
    setTimeout(() => {
      $('.content-subtitle').innerHTML = `<span>${[...window.subtitle].join(
        '</span><span>'
      )}</span>`
    }, 270)
  }, 0)
  loadIntro.loaded = true
}

function switchPage() {
  if (switchPage.switched) {
    return
  }
  const DOM = {
    intro: $('.content-intro'),
    path: $('.shape-wrap path'),
    shape: $('svg.shape'),
  }
  DOM.shape.style.transformOrigin = '50% 0%'

  anime({
    targets: DOM.intro,
    duration: 1100,
    easing: 'easeInOutSine',
    translateY: '-200vh',
  })

  anime({
    targets: DOM.shape,
    scaleY: [
      {
        value: [0.8, 1.8],
        duration: 550,
        easing: 'easeInQuad',
      },
      {
        value: 1,
        duration: 550,
        easing: 'easeOutQuad',
      },
    ],
  })
  anime({
    targets: DOM.path,
    duration: 1100,
    easing: 'easeOutQuad',
    d: DOM.path.getAttribute('pathdata:id'),
    complete: function (anim) {
      const bgCanvas = document.getElementById('background')
      if (bgCanvas && window.backgroundAnimationID) {
        cancelAnimationFrame(window.backgroundAnimationID)
        bgCanvas.parentElement.removeChild(bgCanvas)
      }
    },
  })

  switchPage.switched = true
}

function loadMain() {
  if (loadMain.loaded) {
    return
  }
  setTimeout(() => {
    $('.card-inner').classList.add('in')
    setTimeout(() => {
      const canvas = document.getElementById('gridCanvas')
      if (canvas) {
        const gridAnimation = new GridAnimation(canvas, {
          direction: 'diagonal',
          speed: isPhone ? 0.03 : 0.05,
          borderColor: isPhone
            ? 'rgba(255, 255, 255, 0.2)'
            : 'rgba(255, 255, 255, 0.1)',
          squareSize: isPhone ? 50 : 40,
          hoverFillColor: 'rgba(255, 255, 255, 0.8)',
          hoverShadowColor: 'rgba(255, 255, 255, 0.8)',
          transitionDuration: isPhone ? 150 : 200,
          trailDuration: isPhone ? 2000 : 1500,
          specialBlockColor: 'rgba(100, 255, 152, 0.8)',
          specialHoverColor: 'rgba(29, 202, 29, 0.8)',
          snakeHeadColor: 'rgba(255, 255, 255, 0.95)',
          snakeTailColor: 'rgba(218, 231, 255, 0.25)',
          snakeColorDecay: 0.85,
          touchSensitivity: isPhone ? 1.2 : 1.0,
          vibrationEnabled: isPhone,
        })
        gridAnimation.init()
      }
    }, 1100)
  }, 400)
  loadMain.loaded = true
}

function loadAll() {
  if (loadAll.loaded) {
    return
  }
  switchPage()
  loadMain()
  loadAll.loaded = true
}

// ========================================
// Initialize Application
// ========================================

function initApp() {
  // Apply config to DOM
  const config = siteConfig
  
  // Update page title
  document.title = config.head.title
  document.getElementById('page-title').textContent = config.head.title
  
  // Update meta description
  document.getElementById('meta-description').setAttribute('content', config.head.description)
  
  // Update intro section
  document.getElementById('intro-title').textContent = config.intro.title
  document.getElementById('intro-subtitle').setAttribute('original-content', config.intro.subtitle)
  document.getElementById('enter-btn').textContent = config.intro.enter
  
  // Update main section
  document.getElementById('avatar').src = config.main.avatar.link
  document.getElementById('avatar').width = config.main.avatar.width
  document.getElementById('avatar').height = config.main.avatar.height
  document.getElementById('main-name').textContent = config.main.name
  document.getElementById('signature').textContent = config.main.signature
  
  // Set global variables for animations
  window.subtitle = config.intro.subtitle
  window.signature = config.main.signature
  
  // Setup event listeners
  window.visibilityChangeEvent = hiddenProperty.replace(/hidden/i, 'visibilitychange')
  window.addEventListener(visibilityChangeEvent, loadIntro)
  window.addEventListener('DOMContentLoaded', loadIntro)
  
  const enterEl = $('.enter')
  enterEl.addEventListener('click', loadAll)
  enterEl.addEventListener('touchenter', loadAll)
  
  function handleScrollEvent(e) {
    const deltaY = e.deltaY || e.wheelDelta * -1 || e.detail
    if (deltaY > 0) {
      loadAll()
    }
  }
  
  document.body.addEventListener('wheel', handleScrollEvent, { passive: true })
  document.body.addEventListener('mousewheel', handleScrollEvent, { passive: true })
  document.body.addEventListener('DOMMouseScroll', handleScrollEvent, { passive: true })
  
  $('.arrow').addEventListener('mouseenter', loadAll)
  
  if (isPhone) {
    document.addEventListener(
      'touchstart',
      function (e) {
        window.startx = e.touches[0].pageX
        window.starty = e.touches[0].pageY
      },
      { passive: true }
    )
    document.addEventListener(
      'touchend',
      function (e) {
        let endx, endy
        endx = e.changedTouches[0].pageX
        endy = e.changedTouches[0].pageY
  
        const direction = getMoveDirection(window.startx, window.starty, endx, endy)
        if (direction !== DIRECTIONS.UP) {
          return
        }
        loadAll()
      },
      { passive: true }
    )
  }
}

// Run initialization
initApp()

// Export for use in other modules
export { GridAnimation, loadIntro, switchPage, loadMain, loadAll }
