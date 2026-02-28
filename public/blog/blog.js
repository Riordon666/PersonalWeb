// Blog page interactions

document.addEventListener('DOMContentLoaded', async () => {
  const sidebar = document.querySelector('.sidebar')
  const toggle = document.querySelector('.nav-toggle')

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
    if (target instanceof Node && !sidebar.contains(target) && (!toggle || !toggle.contains(target))) {
      setOpen(false)
    }
  })

  // Theme and Background Management
  const root = document.documentElement
  const STORAGE_KEY = 'blog-theme-hsl'
  const BG_STORAGE_KEY = 'blog-theme-bg'

  const clamp = (v, min, max) => Math.max(min, Math.min(max, v))

  let bgState = {
    mode: 'color',
    image: '',
    blur: 0,
    opacity: 1
  }

  const applyBgState = (state) => {
    bgState = state
    document.body.setAttribute('data-theme-mode', state.mode)
    // Clear background image when in color mode
    const bgImage = state.mode === 'color' ? 'none' : (state.image ? `url("${state.image}")` : 'none')
    root.style.setProperty('--bg-image', bgImage)
    root.style.setProperty('--bg-blur', `${state.blur}px`)
    root.style.setProperty('--bg-opacity', state.opacity)
    // Save with timestamp
    localStorage.setItem(BG_STORAGE_KEY, JSON.stringify({ ...state, timestamp: Date.now() }))
  }

  const loadBgState = async () => {
    try {
      // Load config for defaults
      let config = { defaultMode: 'color', defaultImage: 1, defaultBlur: 0, defaultOpacity: 1 }
      try {
        const resp = await fetch('/blog/background-config.json')
        if (resp.ok) config = await resp.json()
      } catch (e) { /* use defaults */ }

      // Build default image path
      const files = await fetch('/blog/backgrounds.json').then(r => r.ok ? r.json() : []).catch(() => [])
      const defaultImage = files[config.defaultImage - 1] || ''

      // Check localStorage for user settings with 2-day expiration
      const TWO_DAYS_MS = 2 * 24 * 60 * 60 * 1000
      const raw = localStorage.getItem(BG_STORAGE_KEY)
      let useDefaults = true

      if (raw) {
        const saved = JSON.parse(raw)
        // Check if settings are still valid (within 2 days)
        if (saved.timestamp && (Date.now() - saved.timestamp) < TWO_DAYS_MS) {
          useDefaults = false
          applyBgState({
            mode: saved.mode,
            image: saved.image || defaultImage,
            blur: saved.blur ?? config.defaultBlur,
            opacity: saved.opacity ?? config.defaultOpacity
          })
        }
      }

      if (useDefaults) {
        // No valid saved state, use config defaults
        applyBgState({
          mode: config.defaultMode || 'color',
          image: defaultImage,
          blur: config.defaultBlur,
          opacity: config.defaultOpacity
        })
      }

      if (!document.querySelector('.site-background')) {
        const bg = document.createElement('div')
        bg.className = 'site-background'
        document.body.prepend(bg)
      }
    } catch (e) { console.error('Failed to load bg state', e) }
  }

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

  setTheme(getTheme())
  await loadBgState()
  if (!document.querySelector('.site-background')) {
    const bg = document.createElement('div')
    bg.className = 'site-background'
    document.body.prepend(bg)
  }

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
    else[r, g, b] = [c, 0, x]
    return {
      r: Math.round((r + m) * 255),
      g: Math.round((g + m) * 255),
      b: Math.round((b + m) * 255),
    }
  }

  const createPaletteModal = async (initial) => {
    const modal = document.createElement('div')
    modal.className = 'palette-modal'

    // Fetch backgrounds from JSON
    let backgrounds = []
    try {
      const resp = await fetch('/blog/backgrounds.json')
      if (resp.ok) {
        backgrounds = await resp.json()
      }
    } catch (e) {
      console.warn('Failed to load backgrounds:', e)
    }

    // Show first 8 images, 9th slot is "view more" button (3x3 grid)
    const previewImages = backgrounds.slice(0, 8)
    const hasMore = backgrounds.length > 8
    const isColorMode = bgState.mode === 'color'

    modal.innerHTML = `
      <div class="palette-card" role="dialog" aria-modal="true" aria-label="palette">
        <div class="palette-header">
          <div class="mode-switch">
            <button class="mode-btn ${isColorMode ? 'active' : ''}" data-mode="color">纯色</button>
            <button class="mode-btn ${!isColorMode ? 'active' : ''}" data-mode="image">图片</button>
          </div>
        </div>
        <div class="palette-content">
          ${isColorMode ? `
            <div class="color-pane active">
              <div class="wheel-wrap">
                <canvas class="palette-wheel" width="240" height="240"></canvas>
                <div class="wheel-knob" aria-hidden="true"></div>
              </div>
              <input class="palette-light" type="range" min="20" max="80" value="${Math.round(initial.l)}" aria-label="light" />
            </div>
          ` : `
            <div class="image-pane active">
              <div class="bg-grid">
                ${backgrounds.length > 0 ? `
                  ${previewImages.map(src => `
                    <div class="bg-item ${bgState.image === src ? 'active' : ''}" 
                         style="background-image: url('${src}')" 
                         data-src="${src}"></div>
                  `).join('')}
                  ${hasMore ? `
                    <div class="bg-item bg-more" data-action="view-more">
                      <span class="bg-more-text">+${backgrounds.length - 8}</span>
                      <span class="bg-more-label">查看更多</span>
                    </div>
                  ` : ''}
                ` : '<div class="bg-empty">暂无背景图片，请添加到 public/blog/backgrounds/ 文件夹</div>'}
              </div>
              <div class="bg-controls">
                <div class="setting-row">
                  <div class="setting-label"><span>虚化程度</span><span id="val-blur">${bgState.blur}px</span></div>
                  <input class="setting-slider" id="input-blur" type="range" min="0" max="20" value="${bgState.blur}" />
                </div>
                <div class="setting-row">
                  <div class="setting-label"><span>背景亮度</span><span id="val-opacity">${Math.round(bgState.opacity * 100)}%</span></div>
                  <input class="setting-slider" id="input-opacity" type="range" min="10" max="100" value="${bgState.opacity * 100}" />
                </div>
              </div>
            </div>
          `}
        </div>
        <div class="palette-footer">
          <button class="palette-btn-close" type="button">关闭</button>
        </div>
      </div>
    `

    // Store backgrounds for later use
    modal._backgrounds = backgrounds
    return modal
  }

  // Fullscreen image picker modal with lazy loading
  const createImagePickerModal = (backgrounds) => {
    const picker = document.createElement('div')
    picker.className = 'image-picker-modal'
    picker.innerHTML = `
      <div class="image-picker-content">
        <div class="image-picker-header">
          <h3>选择背景图片</h3>
          <button class="image-picker-close" type="button" aria-label="close">×</button>
        </div>
        <div class="image-picker-grid">
          ${backgrounds.map(src => `
            <div class="image-picker-item ${bgState.image === src ? 'active' : ''}" 
                 data-src="${src}"></div>
          `).join('')}
        </div>
      </div>
    `

    // Lazy load images
    setTimeout(() => {
      const items = picker.querySelectorAll('.image-picker-item')
      items.forEach(item => {
        const src = item.dataset.src
        if (src) {
          const img = new Image()
          img.onload = () => {
            item.style.backgroundImage = `url('${src}')`
          }
          img.src = src
        }
      })
    }, 50)

    return picker
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
  const openPalette = async () => {
    if (paletteEl) return
    let theme = getTheme()
    paletteEl = await createPaletteModal(theme)
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
      if (wheel && knob) {
        drawWheel(wheel, theme.l)
        positionKnob(knob, wheel, theme.h, theme.s)
      }
      setTheme(theme)
    }

    redraw()

    // Mode Switching - rebuild modal with new mode
    const modeBtns = paletteEl.querySelectorAll('.mode-btn')
    modeBtns.forEach(btn => {
      btn.addEventListener('click', async () => {
        const newMode = btn.dataset.mode
        applyBgState({ ...bgState, mode: newMode })
        // Rebuild modal
        paletteEl.remove()
        paletteEl = null
        await openPalette()
      })
    })

    // Background selection (only in image mode)
    const bgItems = paletteEl.querySelectorAll('.bg-item')
    bgItems.forEach(item => {
      item.addEventListener('click', () => {
        // Check if it's the "view more" button
        if (item.dataset.action === 'view-more') {
          openImagePicker(paletteEl._backgrounds)
          return
        }
        bgItems.forEach(i => i.classList.remove('active'))
        item.classList.add('active')
        applyBgState({ ...bgState, image: item.dataset.src, mode: 'image' })
      })
    })

    // Blur slider
    const blurInput = paletteEl.querySelector('#input-blur')
    const blurVal = paletteEl.querySelector('#val-blur')
    blurInput?.addEventListener('input', () => {
      const v = blurInput.value
      blurVal.textContent = `${v}px`
      applyBgState({ ...bgState, blur: Number(v) })
    })

    // Opacity slider
    const opacityInput = paletteEl.querySelector('#input-opacity')
    const opacityVal = paletteEl.querySelector('#val-opacity')
    opacityInput?.addEventListener('input', () => {
      const v = opacityInput.value
      opacityVal.textContent = `${v}%`
      applyBgState({ ...bgState, opacity: Number(v) / 100 })
    })

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

    wheel?.addEventListener('mousedown', start)
    window.addEventListener('mousemove', move)
    window.addEventListener('mouseup', end)
    wheel?.addEventListener('touchstart', start, { passive: true })
    window.addEventListener('touchmove', move, { passive: true })
    window.addEventListener('touchend', end)

    light?.addEventListener('input', () => {
      theme = { ...theme, l: Number(light.value) }
      redraw()
    })

    // Bottom close button
    const footerCloseBtn = paletteEl.querySelector('.palette-btn-close')
    footerCloseBtn?.addEventListener('click', close)

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

  // Fullscreen image picker
  let imagePickerEl = null
  const openImagePicker = (backgrounds) => {
    if (imagePickerEl) return
    imagePickerEl = createImagePickerModal(backgrounds)
    document.body.appendChild(imagePickerEl)

    const close = () => {
      if (!imagePickerEl) return
      imagePickerEl.remove()
      imagePickerEl = null
    }

    const closeBtn = imagePickerEl.querySelector('.image-picker-close')
    closeBtn?.addEventListener('click', (e) => {
      e.stopPropagation()
      close()
    })
    imagePickerEl.addEventListener('click', (e) => {
      if (e.target === imagePickerEl) close()
    })
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') close()
    }, { once: true })

    // Image selection in picker
    const items = imagePickerEl.querySelectorAll('.image-picker-item')
    items.forEach(item => {
      item.addEventListener('click', () => {
        items.forEach(i => i.classList.remove('active'))
        item.classList.add('active')
        applyBgState({ ...bgState, image: item.dataset.src, mode: 'image' })

        // Update palette modal's preview grid
        const paletteItems = paletteEl?.querySelectorAll('.bg-item')
        if (paletteItems) {
          paletteItems.forEach(i => {
            if (i.dataset.src === item.dataset.src) {
              i.classList.add('active')
            } else {
              i.classList.remove('active')
            }
          })
        }

        close()
      })
    })
  }

  const openSearch = () => {
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

  // Post enhancements
  const runPostEnhancements = () => {
    if (!isPostPage) return

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

    const tocRoot = document.querySelector('.post-toc-inner')
    const content = document.querySelector('.post-content')
    if (!tocRoot || !content) return

    const headings = Array.from(content.querySelectorAll('h2, h3'))
    if (headings.length === 0) {
      const tocAside = document.querySelector('.post-toc')
      if (tocAside) tocAside.style.display = 'none'
      return
    }

    const slugify = (s) =>
      s.toLowerCase().trim().replace(/\s+/g, '-').replace(/[^a-z0-9\u4e00-\u9fa5\-]/g, '')

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
        history.pushState(null, '', `#${id}`)
      })
      tocRoot.appendChild(a)
      return { heading: h, link: a }
    })

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

  // SPA Navigation
  const initLinks = () => {
    document.querySelectorAll('a').forEach(a => {
      const href = a.getAttribute('href')
      if (!href || !href.startsWith('/blog/') || a.getAttribute('target') === '_blank') return

      a.onclick = async (e) => {
        e.preventDefault()
        const targetUrl = a.href
        if (targetUrl === window.location.href) return

        try {
          const resp = await fetch(targetUrl)
          const html = await resp.text()
          const parser = new DOMParser()
          const doc = parser.parseFromString(html, 'text/html')

          document.title = doc.title
          const newMain = doc.querySelector('.main')
          const currentMain = document.querySelector('.main')
          if (newMain && currentMain) {
            currentMain.innerHTML = newMain.innerHTML

            const currentPath = new URL(targetUrl).pathname
            document.querySelectorAll('.nav-item').forEach(nav => {
              const navPath = new URL(nav.href, window.location.origin).pathname
              nav.classList.toggle('active', navPath === currentPath)
            })

            const isPost = Boolean(doc.querySelector('.post'))
            document.body.setAttribute('data-page', isPost ? 'post' : '')
            if (!isPost) {
              document.documentElement.classList.add('nav-open')
              if (sidebar) sidebar.setAttribute('data-open', 'true')
            } else {
              document.documentElement.classList.remove('nav-open')
              if (sidebar) sidebar.setAttribute('data-open', 'false')
            }

            runPostEnhancements()
            initLinks()
            attachGlobalListeners()

            history.pushState(null, '', targetUrl)
            window.scrollTo(0, 0)
          }
        } catch (err) {
          console.error('Navigation failed:', err)
          window.location.href = targetUrl
        }
      }
    })
  }

  const attachGlobalListeners = () => {
    const paletteBtn = document.querySelector('.palette-btn')
    if (paletteBtn) {
      paletteBtn.onclick = openPalette
    }
    const searchBtn = document.querySelector('.search')
    if (searchBtn) {
      searchBtn.onclick = openSearch
    }
  }

  window.onpopstate = () => {
    window.location.reload()
  }

  initLinks()
  attachGlobalListeners()
  runPostEnhancements()
})
