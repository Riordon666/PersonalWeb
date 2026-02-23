// Blog page interactions (placeholder)
// Later: search, sidebar collapse, archives/tags filtering

document.addEventListener('DOMContentLoaded', () => {
  const sidebar = document.querySelector('.sidebar')
  const toggle = document.querySelector('.nav-toggle')

  const isPostPage = Boolean(document.querySelector('.post'))
  if (isPostPage) {
    document.body.setAttribute('data-page', 'post')
    // post page: sidebar collapsed by default
    document.documentElement.classList.remove('nav-open')
    if (sidebar) sidebar.setAttribute('data-open', 'false')
  }

  const setOpen = (open) => {
    if (!sidebar) return
    sidebar.setAttribute('data-open', open ? 'true' : 'false')
    document.documentElement.classList.toggle('nav-open', open)
  }

  if (toggle && sidebar) {
    toggle.addEventListener('click', () => {
      const open = sidebar.getAttribute('data-open') === 'true'
      setOpen(!open)
    })
  }

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') setOpen(false)
  })

  document.addEventListener('click', (e) => {
    if (!sidebar) return
    const open = sidebar.getAttribute('data-open') === 'true'
    if (!open) return
    const target = e.target
    if (target instanceof Node && !sidebar.contains(target)) {
      setOpen(false)
    }
  })

  const runPostEnhancements = () => {
    if (!isPostPage) return

    // Typing animation for title
    const titleEl = document.querySelector('.post-h1')
    if (titleEl) {
      const full = titleEl.textContent || ''
      titleEl.textContent = ''
      titleEl.classList.add('typing')
      let i = 0
      const tick = () => {
        i += 1
        titleEl.textContent = full.slice(0, i)
        if (i < full.length) requestAnimationFrame(tick)
        else titleEl.classList.remove('typing')
      }
      requestAnimationFrame(tick)
    }

    // Build TOC from headings
    const tocRoot = document.querySelector('.post-toc-inner')
    const content = document.querySelector('.post-content')
    if (!tocRoot || !content) return

    const headings = Array.from(content.querySelectorAll('h2, h3'))
    if (headings.length === 0) return

    const slugify = (s) =>
      s
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9\u4e00-\u9fa5\-]/g, '')

    const used = new Map()
    const ensureId = (el) => {
      let id = el.id
      if (id) return id
      const base = slugify(el.textContent || 'section') || 'section'
      const n = (used.get(base) || 0) + 1
      used.set(base, n)
      id = n === 1 ? base : `${base}-${n}`
      el.id = id
      return id
    }

    tocRoot.innerHTML = ''
    const items = headings.map((h) => {
      const id = ensureId(h)
      const a = document.createElement('a')
      a.className = 'toc-item'
      a.href = `#${id}`
      a.textContent = h.textContent || ''
      a.setAttribute('data-level', h.tagName === 'H3' ? '3' : '2')
      a.addEventListener('click', (e) => {
        e.preventDefault()
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
      })
      tocRoot.appendChild(a)
      return { heading: h, link: a }
    })

    // Active section highlight
    const io = new IntersectionObserver(
      (entries) => {
        for (const ent of entries) {
          if (!ent.isIntersecting) continue
          for (const it of items) it.link.classList.remove('active')
          const match = items.find((it) => it.heading === ent.target)
          match?.link.classList.add('active')
          break
        }
      },
      { root: null, threshold: 0.2, rootMargin: '-20% 0px -70% 0px' }
    )

    for (const it of items) io.observe(it.heading)
  }

  const root = document.documentElement
  const STORAGE_KEY = 'blog-theme-hsl'

  const clamp = (v, min, max) => Math.max(min, Math.min(max, v))

  const setTheme = ({ h, s, l }) => {
    root.style.setProperty('--theme-h', String(Math.round(h)))
    root.style.setProperty('--theme-s', `${Math.round(s)}%`)
    root.style.setProperty('--theme-l', `${Math.round(l)}%`)
    root.style.setProperty('--theme-color', `hsl(${Math.round(h)}, ${Math.round(s)}%, ${Math.round(l)}%)`)
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ h, s, l }))
  }

  const getTheme = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return { h: 210, s: 75, l: 65 }
      const v = JSON.parse(raw)
      if (typeof v.h !== 'number' || typeof v.s !== 'number' || typeof v.l !== 'number') {
        return { h: 210, s: 75, l: 65 }
      }
      return { h: v.h, s: v.s, l: v.l }
    } catch {
      return { h: 210, s: 75, l: 65 }
    }
  }

  // Apply persisted theme on load
  setTheme(getTheme())

  const hslToRgb = (h, s, l) => {
    s /= 100
    l /= 100
    const c = (1 - Math.abs(2 * l - 1)) * s
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
    const m = l - c / 2
    let r = 0, g = 0, b = 0
    if (0 <= h && h < 60) [r, g, b] = [c, x, 0]
    else if (60 <= h && h < 120) [r, g, b] = [x, c, 0]
    else if (120 <= h && h < 180) [r, g, b] = [0, c, x]
    else if (180 <= h && h < 240) [r, g, b] = [0, x, c]
    else if (240 <= h && h < 300) [r, g, b] = [x, 0, c]
    else [r, g, b] = [c, 0, x]
    return {
      r: Math.round((r + m) * 255),
      g: Math.round((g + m) * 255),
      b: Math.round((b + m) * 255),
    }
  }

  const rgbToHsl = (r, g, b) => {
    r /= 255
    g /= 255
    b /= 255
    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    const d = max - min
    let h = 0
    if (d !== 0) {
      if (max === r) h = ((g - b) / d) % 6
      else if (max === g) h = (b - r) / d + 2
      else h = (r - g) / d + 4
      h *= 60
      if (h < 0) h += 360
    }
    const l = (max + min) / 2
    const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1))
    return { h, s: s * 100, l: l * 100 }
  }

  const createPaletteModal = (initial) => {
    const modal = document.createElement('div')
    modal.className = 'palette-modal'
    modal.innerHTML = `
      <div class="palette-card" role="dialog" aria-modal="true" aria-label="palette">
        <div class="palette-title">RGB调色实验室</div>
        <div class="palette-body">
          <div class="wheel-wrap">
            <canvas class="palette-wheel" width="220" height="220"></canvas>
            <div class="wheel-knob" aria-hidden="true"></div>
          </div>
          <input class="palette-light" type="range" min="20" max="80" value="${Math.round(initial.l)}" aria-label="light" />
        </div>
        <button class="palette-close" type="button" aria-label="close">×</button>
      </div>
    `
    return modal
  }

  const drawWheel = (canvas, lightness) => {
    const ctx = canvas.getContext('2d')
    const { width, height } = canvas
    const cx = width / 2
    const cy = height / 2
    const r = Math.min(cx, cy) - 2

    const img = ctx.createImageData(width, height)
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const dx = x - cx
        const dy = y - cy
        const dist = Math.sqrt(dx * dx + dy * dy)
        const idx = (y * width + x) * 4
        if (dist > r) {
          img.data[idx + 3] = 0
          continue
        }
        const sat = (dist / r) * 100
        let hue = (Math.atan2(dy, dx) * 180) / Math.PI
        hue = (hue + 360) % 360
        const rgb = hslToRgb(hue, sat, lightness)
        img.data[idx] = rgb.r
        img.data[idx + 1] = rgb.g
        img.data[idx + 2] = rgb.b
        img.data[idx + 3] = 255
      }
    }
    ctx.putImageData(img, 0, 0)
    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, Math.PI * 2)
    ctx.strokeStyle = 'rgba(0,0,0,0.08)'
    ctx.lineWidth = 2
    ctx.stroke()
  }

  const positionKnob = (knob, canvas, h, s) => {
    const cx = canvas.width / 2
    const cy = canvas.height / 2
    const r = Math.min(cx, cy) - 2
    const rad = (h * Math.PI) / 180
    const dist = (clamp(s, 0, 100) / 100) * r
    const x = cx + Math.cos(rad) * dist
    const y = cy + Math.sin(rad) * dist
    knob.style.transform = `translate(${x - 8}px, ${y - 8}px)`
  }

  let paletteEl = null
  const openPalette = () => {
    if (paletteEl) return
    let theme = getTheme()
    paletteEl = createPaletteModal(theme)
    document.body.appendChild(paletteEl)

    const close = () => {
      if (!paletteEl) return
      paletteEl.remove()
      paletteEl = null
    }

    const closeBtn = paletteEl.querySelector('.palette-close')
    const wheel = paletteEl.querySelector('.palette-wheel')
    const knob = paletteEl.querySelector('.wheel-knob')
    const light = paletteEl.querySelector('.palette-light')

    const redraw = () => {
      drawWheel(wheel, theme.l)
      positionKnob(knob, wheel, theme.h, theme.s)
      setTheme(theme)
    }

    redraw()

    const pickAt = (clientX, clientY) => {
      const rect = wheel.getBoundingClientRect()
      const x = clamp(clientX - rect.left, 0, rect.width)
      const y = clamp(clientY - rect.top, 0, rect.height)
      const scaleX = wheel.width / rect.width
      const scaleY = wheel.height / rect.height
      const px = x * scaleX
      const py = y * scaleY
      const cx = wheel.width / 2
      const cy = wheel.height / 2
      const dx = px - cx
      const dy = py - cy
      const dist = Math.sqrt(dx * dx + dy * dy)
      const r = Math.min(cx, cy) - 2
      const sat = clamp((dist / r) * 100, 0, 100)
      let hue = (Math.atan2(dy, dx) * 180) / Math.PI
      hue = (hue + 360) % 360
      theme = { ...theme, h: hue, s: sat }
      redraw()
    }

    let dragging = false
    const start = (e) => {
      dragging = true
      const p = e.touches ? e.touches[0] : e
      pickAt(p.clientX, p.clientY)
    }
    const move = (e) => {
      if (!dragging) return
      const p = e.touches ? e.touches[0] : e
      pickAt(p.clientX, p.clientY)
    }
    const end = () => {
      dragging = false
    }

    wheel.addEventListener('mousedown', start)
    window.addEventListener('mousemove', move)
    window.addEventListener('mouseup', end)
    wheel.addEventListener('touchstart', start, { passive: true })
    window.addEventListener('touchmove', move, { passive: true })
    window.addEventListener('touchend', end)

    light.addEventListener('input', () => {
      theme = { ...theme, l: Number(light.value) }
      redraw()
    })

    closeBtn?.addEventListener('click', close)
    paletteEl.addEventListener('click', (e) => {
      if (e.target === paletteEl) close()
    })

    document.addEventListener(
      'keydown',
      (e) => {
        if (e.key === 'Escape') close()
      },
      { once: true }
    )
  }

  const paletteBtn = document.querySelector('.palette-btn')
  if (paletteBtn) {
    paletteBtn.addEventListener('click', openPalette)
  }

  runPostEnhancements()

  // Search functionality
  const searchBtn = document.querySelector('.search')
  if (searchBtn) {
    searchBtn.addEventListener('click', openSearch)
  }

  function openSearch() {
    const existing = document.querySelector('.search-modal')
    if (existing) return

    const modal = document.createElement('div')
    modal.className = 'search-modal'
    modal.innerHTML = `
      <div class="search-card" role="dialog" aria-modal="true" aria-label="search">
        <div class="search-header">
          <input class="search-input" type="text" placeholder="搜索文章..." autofocus />
          <button class="search-close" type="button" aria-label="close">×</button>
        </div>
        <div class="search-results"></div>
      </div>
    `
    document.body.appendChild(modal)

    const input = modal.querySelector('.search-input')
    const results = modal.querySelector('.search-results')
    const closeBtn = modal.querySelector('.search-close')

    const close = () => modal.remove()

    closeBtn.addEventListener('click', close)
    modal.addEventListener('click', (e) => {
      if (e.target === modal) close()
    })
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') close()
    }, { once: true })

    // Get all posts data from page
    const posts = Array.from(document.querySelectorAll('.post-item, .post-card')).map(el => ({
      title: el.querySelector('.post-title, h2')?.textContent || '',
      excerpt: el.querySelector('.post-excerpt, p')?.textContent || '',
      href: el.querySelector('a')?.href || '',
      date: el.querySelector('.post-date')?.textContent || ''
    }))

    input.addEventListener('input', () => {
      const q = input.value.trim().toLowerCase()
      if (!q) {
        results.innerHTML = ''
        return
      }

      const filtered = posts.filter(p => 
        p.title.toLowerCase().includes(q) || 
        p.excerpt.toLowerCase().includes(q)
      )

      if (filtered.length === 0) {
        results.innerHTML = '<div class="search-empty">未找到相关文章</div>'
        return
      }

      results.innerHTML = filtered.map(p => `
        <a class="search-result" href="${p.href}">
          <div class="search-result-title">${p.title}</div>
          ${p.excerpt ? `<div class="search-result-excerpt">${p.excerpt.slice(0, 80)}...</div>` : ''}
          ${p.date ? `<div class="search-result-date">${p.date}</div>` : ''}
        </a>
      `).join('')
    })

    input.focus()
  }
})
