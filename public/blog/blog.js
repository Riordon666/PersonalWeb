// Blog page interactions

// Page Loader
const createPageLoader = () => {
  const loader = document.createElement('div')
  loader.className = 'page-loader'
  loader.innerHTML = `
    <div class="loader">
      <svg height="0" width="0" viewBox="0 0 64 64" class="absolute">
        <defs class="s-xJBuHA073rTt" xmlns="http://www.w3.org/2000/svg">
          <linearGradient class="s-xJBuHA073rTt" gradientUnits="userSpaceOnUse" y2="2" x2="0" y1="62" x1="0" id="b">
            <stop class="s-xJBuHA073rTt" stop-color="#973BED"></stop>
            <stop class="s-xJBuHA073rTt" stop-color="#007CFF" offset="1"></stop>
          </linearGradient>
          <linearGradient class="s-xJBuHA073rTt" gradientUnits="userSpaceOnUse" y2="0" x2="0" y1="64" x1="0" id="c">
            <stop class="s-xJBuHA073rTt" stop-color="#FFC800"></stop>
            <stop class="s-xJBuHA073rTt" stop-color="#F0F" offset="1"></stop>
            <animateTransform repeatCount="indefinite" keySplines=".42,0,.58,1;.42,0,.58,1;.42,0,.58,1;.42,0,.58,1;.42,0,.58,1;.42,0,.58,1;.42,0,.58,1;.42,0,.58,1" keyTimes="0; 0.125; 0.25; 0.375; 0.5; 0.625; 0.75; 0.875; 1" dur="8s" values="0 32 32;-270 32 32;-270 32 32;-540 32 32;-540 32 32;-810 32 32;-810 32 32;-1080 32 32;-1080 32 32" type="rotate" attributeName="gradientTransform"></animateTransform>
          </linearGradient>
          <linearGradient class="s-xJBuHA073rTt" gradientUnits="userSpaceOnUse" y2="2" x2="0" y1="62" x1="0" id="d">
            <stop class="s-xJBuHA073rTt" stop-color="#00E0ED"></stop>
            <stop class="s-xJBuHA073rTt" stop-color="#00DA72" offset="1"></stop>
          </linearGradient>
        </defs>
      </svg>
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 64 64" height="64" width="64" class="inline-block">
        <path stroke-linejoin="round" stroke-linecap="round" stroke-width="8" stroke="url(#b)" d="M 54.722656,3.9726563 A 2.0002,2.0002 0 0 0 54.941406,4 h 5.007813 C 58.955121,17.046124 49.099667,27.677057 36.121094,29.580078 a 2.0002,2.0002 0 0 0 -1.708985,1.978516 V 60 H 29.587891 V 31.558594 A 2.0002,2.0002 0 0 0 27.878906,29.580078 C 14.900333,27.677057 5.0448787,17.046124 4.0507812,4 H 9.28125 c 1.231666,11.63657 10.984383,20.554048 22.6875,20.734375 a 2.0002,2.0002 0 0 0 0.02344,0 c 11.806958,0.04283 21.70649,-9.003371 22.730469,-20.7617187 z" class="dash" id="y" pathLength="360"></path>
      </svg>
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" style="--rotation-duration:0ms; --rotation-direction:normal;" viewBox="0 0 64 64" height="64" width="64" class="inline-block">
        <path stroke-linejoin="round" stroke-linecap="round" stroke-width="10" stroke="url(#c)" d="M 32 32 m 0 -27 a 27 27 0 1 1 0 54 a 27 27 0 1 1 0 -54" class="spin" id="o" pathLength="360"></path>
      </svg>
      <div class="w-2"></div>
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" style="--rotation-duration:0ms; --rotation-direction:normal;" viewBox="0 0 64 64" height="64" width="64" class="inline-block">
        <path stroke-linejoin="round" stroke-linecap="round" stroke-width="8" stroke="url(#d)" d="M 4,4 h 4.6230469 v 25.919922 c -0.00276,11.916203 9.8364941,21.550422 21.7500001,21.296875 11.616666,-0.240651 21.014356,-9.63894 21.253906,-21.25586 a 2.0002,2.0002 0 0 0 0,-0.04102 V 4 H 56.25 v 25.919922 c 0,14.33873 -11.581192,25.919922 -25.919922,25.919922 a 2.0002,2.0002 0 0 0 -0.0293,0 C 15.812309,56.052941 3.998433,44.409961 4,29.919922 Z" class="dash" id="u" pathLength="360"></path>
      </svg>
    </div>
  `
  document.body.appendChild(loader)
  return loader
}

const createTileLoader = () => {
  const loader = document.createElement('div')
  loader.className = 'tile-loader'

  const uid = `tl-${Math.random().toString(36).slice(2, 10)}`
  const idB = `b-${uid}`
  const idC = `c-${uid}`
  const idD = `d-${uid}`

  loader.innerHTML = `
    <div class="loader">
      <svg height="0" width="0" viewBox="0 0 64 64" class="absolute">
        <defs class="s-xJBuHA073rTt" xmlns="http://www.w3.org/2000/svg">
          <linearGradient class="s-xJBuHA073rTt" gradientUnits="userSpaceOnUse" y2="2" x2="0" y1="62" x1="0" id="${idB}">
            <stop class="s-xJBuHA073rTt" stop-color="#973BED"></stop>
            <stop class="s-xJBuHA073rTt" stop-color="#007CFF" offset="1"></stop>
          </linearGradient>
          <linearGradient class="s-xJBuHA073rTt" gradientUnits="userSpaceOnUse" y2="0" x2="0" y1="64" x1="0" id="${idC}">
            <stop class="s-xJBuHA073rTt" stop-color="#FFC800"></stop>
            <stop class="s-xJBuHA073rTt" stop-color="#F0F" offset="1"></stop>
            <animateTransform repeatCount="indefinite" keySplines=".42,0,.58,1;.42,0,.58,1;.42,0,.58,1;.42,0,.58,1;.42,0,.58,1;.42,0,.58,1;.42,0,.58,1;.42,0,.58,1" keyTimes="0; 0.125; 0.25; 0.375; 0.5; 0.625; 0.75; 0.875; 1" dur="8s" values="0 32 32;-270 32 32;-270 32 32;-540 32 32;-540 32 32;-810 32 32;-810 32 32;-1080 32 32;-1080 32 32" type="rotate" attributeName="gradientTransform"></animateTransform>
          </linearGradient>
          <linearGradient class="s-xJBuHA073rTt" gradientUnits="userSpaceOnUse" y2="2" x2="0" y1="62" x1="0" id="${idD}">
            <stop class="s-xJBuHA073rTt" stop-color="#00E0ED"></stop>
            <stop class="s-xJBuHA073rTt" stop-color="#00DA72" offset="1"></stop>
          </linearGradient>
        </defs>
      </svg>
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 64 64" height="64" width="64" class="inline-block">
        <path stroke-linejoin="round" stroke-linecap="round" stroke-width="8" stroke="url(#${idB})" d="M 54.722656,3.9726563 A 2.0002,2.0002 0 0 0 54.941406,4 h 5.007813 C 58.955121,17.046124 49.099667,27.677057 36.121094,29.580078 a 2.0002,2.0002 0 0 0 -1.708985,1.978516 V 60 H 29.587891 V 31.558594 A 2.0002,2.0002 0 0 0 27.878906,29.580078 C 14.900333,27.677057 5.0448787,17.046124 4.0507812,4 H 9.28125 c 1.231666,11.63657 10.984383,20.554048 22.6875,20.734375 a 2.0002,2.0002 0 0 0 0.02344,0 c 11.806958,0.04283 21.70649,-9.003371 22.730469,-20.7617187 z" class="dash" id="y" pathLength="360"></path>
      </svg>
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" style="--rotation-duration:0ms; --rotation-direction:normal;" viewBox="0 0 64 64" height="64" width="64" class="inline-block">
        <path stroke-linejoin="round" stroke-linecap="round" stroke-width="10" stroke="url(#${idC})" d="M 32 32
        m 0 -27
        a 27 27 0 1 1 0 54
        a 27 27 0 1 1 0 -54" class="spin" id="o" pathLength="360"></path>
      </svg>
      <div class="w-2"></div>
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" style="--rotation-duration:0ms; --rotation-direction:normal;" viewBox="0 0 64 64" height="64" width="64" class="inline-block">
        <path stroke-linejoin="round" stroke-linecap="round" stroke-width="8" stroke="url(#${idD})" d="M 4,4 h 4.6230469 v 25.919922 c -0.00276,11.916203 9.8364941,21.550422 21.7500001,21.296875 11.616666,-0.240651 21.014356,-9.63894 21.253906,-21.25586 a 2.0002,2.0002 0 0 0 0,-0.04102 V 4 H 56.25 v 25.919922 c 0,14.33873 -11.581192,25.919922 -25.919922,25.919922 a 2.0002,2.0002 0 0 0 -0.0293,0 C 15.812309,56.052941 3.998433,44.409961 4,29.919922 Z" class="dash" id="u" pathLength="360"></path>
      </svg>
    </div>
  `
  return loader
}

let pageLoader = null
const showLoader = () => {
  // First check if loader already exists in DOM (from PAGE_LOADER_HTML)
  if (!pageLoader) {
    pageLoader = document.querySelector('.page-loader')
  }
  // If still not found, create a new one
  if (!pageLoader) {
    pageLoader = createPageLoader()
  }
  pageLoader.classList.remove('hidden')
}
const hideLoader = () => {
  if (!pageLoader) pageLoader = document.querySelector('.page-loader')
  if (pageLoader) pageLoader.classList.add('hidden')
}

// Track when theme and background are fully loaded
let themeLoadedResolve = null
const themeLoadedPromise = new Promise((resolve) => {
  themeLoadedResolve = resolve
})

// Hide loader only when both conditions are met:
// 1. Minimum 1 second has passed
// 2. Theme and background are fully loaded
window.addEventListener('load', async () => {
  const startTime = Date.now()
  const minDuration = 1000

  // Wait for theme to be fully loaded
  await themeLoadedPromise

  // Ensure minimum display time
  const elapsed = Date.now() - startTime
  const remaining = Math.max(0, minDuration - elapsed)
  if (remaining > 0) {
    await new Promise(r => setTimeout(r, remaining))
  }

  hideLoader()
})

document.addEventListener('DOMContentLoaded', async () => {
  const sidebar = document.querySelector('.sidebar')
  const toggle = document.querySelector('.nav-toggle')

  const showToast = (message) => {
    const el = document.createElement('div')
    el.className = 'toast'
    el.textContent = message
    document.body.appendChild(el)
    requestAnimationFrame(() => el.classList.add('show'))
    window.setTimeout(() => {
      el.classList.remove('show')
      window.setTimeout(() => el.remove(), 220)
    }, 1200)
  }

  const bindCopyActions = () => {
    document.querySelectorAll('[data-copy-text]').forEach((el) => {
      if (el.getAttribute('data-copy-bound') === 'true') return
      el.setAttribute('data-copy-bound', 'true')

      el.addEventListener('click', async (e) => {
        e.preventDefault()
        const text = el.getAttribute('data-copy-text') || ''
        const toast = el.getAttribute('data-copy-toast') || '已复制QQ号'
        if (!text) return
        try {
          await navigator.clipboard.writeText(text)
          showToast(toast)
        } catch {
          const ta = document.createElement('textarea')
          ta.value = text
          ta.setAttribute('readonly', '')
          ta.style.position = 'fixed'
          ta.style.left = '-9999px'
          document.body.appendChild(ta)
          ta.select()
          try {
            document.execCommand('copy')
            showToast(toast)
          } finally {
            ta.remove()
          }
        }
      })
    })
  }

  const setOpen = (open) => {
    if (!sidebar) return
    sidebar.setAttribute('data-open', open ? 'true' : 'false')
    document.documentElement.classList.toggle('nav-open', open)
  }

  const closeSidebar = () => setOpen(false)

  if (toggle && sidebar) {
    toggle.addEventListener('click', () => {
      const open = sidebar.getAttribute('data-open') === 'true'
      setOpen(!open)
    })
  }

  bindCopyActions()

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
    opacity: 1,
    imageOnly: false
  }

  const applyBgState = (state) => {
    bgState = state
    const bodyMode = state.mode === 'image' && state.imageOnly ? 'image-only' : state.mode
    document.body.setAttribute('data-theme-mode', bodyMode)
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
            opacity: saved.opacity ?? config.defaultOpacity,
            imageOnly: saved.imageOnly ?? false
          })
        }
      }

      if (useDefaults) {
        // No valid saved state, use config defaults
        applyBgState({
          mode: config.defaultMode || 'color',
          image: defaultImage,
          blur: config.defaultBlur,
          opacity: config.defaultOpacity,
          imageOnly: config.defaultImageOnly ?? false
        })
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

  // Signal that theme and background are fully loaded
  if (themeLoadedResolve) themeLoadedResolve()

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

    // Show first 7 images, 8th slot is "view more" button (2x4 grid on mobile)
    const isMobile = window.innerWidth <= 768
    const previewCount = isMobile ? 7 : 8
    const previewImages = backgrounds.slice(0, previewCount)
    const hasMore = backgrounds.length > previewCount
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
                         data-src="${src}">
                    </div>
                  `).join('')}
                  ${hasMore ? `
                    <div class="bg-item bg-more" data-action="view-more">
                      <span class="bg-more-text">+${backgrounds.length - previewCount}</span>
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
                <div class="setting-row setting-switch">
                  <div class="setting-label"><span>仅背景图片</span><span>不叠加主题色</span></div>
                  <div class="checkbox-wrapper-5">
                    <div class="check">
                      <input ${bgState.imageOnly ? 'checked' : ''} id="toggle-image-only" type="checkbox">
                      <label for="toggle-image-only"></label>
                    </div>
                  </div>
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
  const createImagePickerModal = async (backgrounds) => {
    // Load thumbnails config
    let thumbsConfig = { dir: '/blog/backgrounds/thumbs/', files: [] }
    try {
      const resp = await fetch('/blog/thumbs.json')
      if (resp.ok) thumbsConfig = await resp.json()
    } catch {}

    const picker = document.createElement('div')
    picker.className = 'image-picker-modal'
    picker.innerHTML = `
      <div class="image-picker-backdrop"></div>
      <div class="image-picker-panel">
        <div class="image-picker-header">
          <div class="image-picker-title">选择背景图片</div>
          <button class="image-picker-close" type="button" aria-label="close">×</button>
        </div>
        <div class="image-picker-grid">
          ${backgrounds.map((src, i) => {
            // Use thumbnail if available, fallback to full image
            const baseName = src.split('/').pop().replace(/\.[^.]+$/, '')
            const thumbFile = thumbsConfig.files.find(f => f.includes(baseName))
            const thumbSrc = thumbFile ? `${thumbsConfig.dir}${thumbFile}` : src
            return `
              <div class="image-picker-item ${bgState.image === src ? 'active' : ''}" 
                   data-src="${src}"
                   data-thumb="${thumbSrc}"></div>
            `
          }).join('')}
        </div>
      </div>
    `

    // Lazy load images with IntersectionObserver for better performance
    // Limit concurrent loads to prevent jank
    const loadQueue = []
    let loadingCount = 0
    const MAX_CONCURRENT = 6

    const processQueue = () => {
      while (loadQueue.length > 0 && loadingCount < MAX_CONCURRENT) {
        const item = loadQueue.shift()
        loadItemNow(item)
      }
    }

    const loadItemNow = (item) => {
      const thumbSrc = item.dataset.thumb
      if (!thumbSrc || item.dataset.loaded) return
      item.dataset.loaded = 'true'
      loadingCount++

      const overlay = createTileLoader()
      item.appendChild(overlay)

      const img = new Image()
      img.onload = () => {
        requestAnimationFrame(() => {
          item.style.backgroundImage = `url('${thumbSrc}')`
          overlay.remove()
          loadingCount--
          processQueue()
        })
      }
      img.onerror = () => {
        overlay.remove()
        loadingCount--
        processQueue()
      }
      img.src = thumbSrc
    }

    const loadItem = (item) => {
      if (item.dataset.loaded) return
      loadQueue.push(item)
      processQueue()
    }

    // Use IntersectionObserver for true lazy loading
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          loadItem(entry.target)
          observer.unobserve(entry.target)
        }
      })
    }, { rootMargin: '100px' })

    requestAnimationFrame(() => {
      const items = picker.querySelectorAll('.image-picker-item')
      items.forEach(item => {
        observer.observe(item)
      })
    })

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

    // Per-tile loader using the global loader markup (scaled)
    const initBgTileLoaders = () => {
      const items = paletteEl.querySelectorAll('.bg-item[data-src]')
      items.forEach((item) => {
        const src = item.dataset.src
        if (!src) return

        const overlay = createTileLoader()
        item.appendChild(overlay)

        const img = new Image()
        img.onload = () => {
          overlay.remove()
        }
        img.onerror = () => {
          overlay.remove()
        }
        img.src = src
      })
    }
    initBgTileLoaders()

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
        const src = item.dataset.src
        if (src) {
          // Show loader while loading new background image
          showLoader()
          const img = new Image()
          img.onload = () => {
            bgItems.forEach(i => i.classList.remove('active'))
            item.classList.add('active')
            applyBgState({ ...bgState, image: src, mode: 'image', imageOnly: bgState.imageOnly })
            hideLoader()
          }
          img.onerror = () => {
            hideLoader()
            bgItems.forEach(i => i.classList.remove('active'))
            item.classList.add('active')
            applyBgState({ ...bgState, image: src, mode: 'image', imageOnly: bgState.imageOnly })
          }
          img.src = src
        }
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

    // Image-only toggle (only in image mode)
    const imageOnlyToggle = paletteEl.querySelector('#toggle-image-only')
    imageOnlyToggle?.addEventListener('change', () => {
      applyBgState({ ...bgState, mode: 'image', imageOnly: !!imageOnlyToggle.checked })
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
  const openImagePicker = async (backgrounds) => {
    if (imagePickerEl) return
    imagePickerEl = await createImagePickerModal(backgrounds)
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
        const src = item.dataset.src
        if (src) {
          // Show loader while loading new background image
          showLoader()
          const img = new Image()
          img.onload = () => {
            items.forEach(i => i.classList.remove('active'))
            item.classList.add('active')
            applyBgState({ ...bgState, image: src, mode: 'image', imageOnly: bgState.imageOnly })

            // Update palette modal's preview grid
            const paletteItems = paletteEl?.querySelectorAll('.bg-item')
            if (paletteItems) {
              paletteItems.forEach(i => {
                if (i.dataset.src === src) {
                  i.classList.add('active')
                } else {
                  i.classList.remove('active')
                }
              })
            }
            hideLoader()
            close()
          }
          img.onerror = () => {
            hideLoader()
            items.forEach(i => i.classList.remove('active'))
            item.classList.add('active')
            applyBgState({ ...bgState, image: src, mode: 'image', imageOnly: bgState.imageOnly })
            close()
          }
          img.src = src
        }
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
    const isPostPage = Boolean(document.querySelector('.post'))
    if (!isPostPage) return

    const titleEl = document.querySelector('.post-h1')
    if (titleEl) titleEl.classList.remove('typing')

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
        // Auto-close TOC drawer on mobile
        document.body.setAttribute('data-toc-open', 'false')
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

    // Mobile TOC toggle
    const tocToggle = document.querySelector('.toc-toggle')
    if (tocToggle) {
      tocToggle.onclick = () => {
        const open = document.body.getAttribute('data-toc-open') === 'true'
        document.body.setAttribute('data-toc-open', open ? 'false' : 'true')
      }
    }
  }

  // SPA Navigation
  const initLinks = () => {
    document.querySelectorAll('a').forEach(a => {
      const href = a.getAttribute('href')
      // Skip links that don't match SPA navigation criteria
      if (!href || a.getAttribute('target') === '_blank') return
      if (href.startsWith('#')) return
      if (href.startsWith('mailto:') || href.startsWith('tel:')) return
      if (href.startsWith('http://') || href.startsWith('https://')) return
      if (href.startsWith('tencent://')) return
      if (!href.startsWith('/blog') && !href.startsWith('blog/') && !href.startsWith('./') && !href.startsWith('../')) return
      // Skip copy-to-click elements (they have their own handler)
      if (a.hasAttribute('data-copy-text')) return
      // Skip already-bound links
      if (a.getAttribute('data-spa-bound') === 'true') return
      a.setAttribute('data-spa-bound', 'true')

      a.addEventListener('click', async (e) => {
        e.preventDefault()
        const targetUrl = a.href
        if (targetUrl === window.location.href) {
          // Show toast notification for current page
          const currentPath = window.location.pathname
          let pageName = '当前页面'
          if (currentPath === '/blog/' || currentPath === '/blog') {
            pageName = '主页'
          } else if (currentPath.startsWith('/blog/archives')) {
            pageName = '归档页'
          } else if (currentPath.startsWith('/blog/tags')) {
            pageName = '标签页'
          } else if (currentPath.startsWith('/blog/changelog')) {
            pageName = '更新日志页'
          }
          showToast(`已经在${pageName}了`)
          return
        }

        // Show loader immediately
        showLoader()

        try {
          const resp = await fetch(targetUrl)
          const html = await resp.text()
          const parser = new DOMParser()
          const doc = parser.parseFromString(html, 'text/html')

          document.title = doc.title

          // Sync page-specific stylesheets (archives.css / tags.css / post.css, etc.)
          // because SPA navigation only swaps .main innerHTML by default.
          // Returns a Promise that resolves when all new CSS files are loaded.
          const syncStylesheets = () => {
            const normalizeHref = (href) => {
              try {
                return new URL(href, window.location.origin).pathname
              } catch {
                return href
              }
            }

            const isBlogStylesheet = (href) => {
              const p = normalizeHref(href)
              return p.startsWith('/blog/') && p.endsWith('.css')
            }

            const nextLinks = Array.from(doc.querySelectorAll('link[rel="stylesheet"][href]'))
              .map((l) => normalizeHref(l.getAttribute('href')))
              .filter(isBlogStylesheet)

            const curLinks = Array.from(document.querySelectorAll('link[rel="stylesheet"][href]'))
              .map((l) => ({ el: l, href: normalizeHref(l.getAttribute('href')) }))
              .filter((x) => isBlogStylesheet(x.href))

            // Remove current page-specific css that isn't needed anymore
            for (const { el, href } of curLinks) {
              if (!nextLinks.includes(href)) el.remove()
            }

            // Add missing css required by next page and wait for them to load
            const have = new Set(
              Array.from(document.querySelectorAll('link[rel="stylesheet"][href]'))
                .map((l) => normalizeHref(l.getAttribute('href')))
                .filter(isBlogStylesheet)
            )
            const loadPromises = []
            for (const href of nextLinks) {
              if (have.has(href)) continue
              const link = document.createElement('link')
              link.rel = 'stylesheet'
              link.href = href
              const loadPromise = new Promise((resolve) => {
                link.onload = resolve
                link.onerror = resolve // Continue even on error
              })
              document.head.appendChild(link)
              loadPromises.push(loadPromise)
            }
            return Promise.all(loadPromises)
          }
          await syncStylesheets()

          const newMain = doc.querySelector('.main')
          const currentMain = document.querySelector('.main')
          if (newMain && currentMain) {
            currentMain.innerHTML = newMain.innerHTML

            history.pushState(null, '', targetUrl)

            // Keep cross-page UI state in sync (important for SPA navigations)
            const isPost = Boolean(doc.querySelector('.post'))
            document.body.setAttribute('data-page', isPost ? 'post' : '')
            if (!isPost) {
              // Leaving a post page: close mobile TOC drawer and remove any lingering toggles
              document.body.setAttribute('data-toc-open', 'false')
              document.querySelector('.toc-toggle')?.remove()
              document.querySelector('.post-toc')?.remove()
            }

            const currentPath = new URL(targetUrl).pathname
            document.querySelectorAll('.nav-item').forEach(nav => {
              const navPath = new URL(nav.href, window.location.origin).pathname
              nav.classList.toggle('active', navPath === currentPath)
            })

            // Keep sidebar closed after navigation. User can open it via hamburger.
            closeSidebar()
            initLinks()
            attachGlobalListeners()
            runPostEnhancements()
            initBackToTop()
            bindCopyActions()

            // Hide loader after navigation complete
            hideLoader()
          }
        } catch (err) {
          console.error(err)
          hideLoader()
          window.location.href = targetUrl
        }
      })
    })
  }

  const attachGlobalListeners = () => {
    const paletteBtn = document.querySelector('.palette-btn')
    if (paletteBtn && paletteBtn.getAttribute('data-listener-bound') !== 'true') {
      paletteBtn.setAttribute('data-listener-bound', 'true')
      paletteBtn.addEventListener('click', openPalette)
    }
    const searchBtn = document.querySelector('.search')
    if (searchBtn && searchBtn.getAttribute('data-listener-bound') !== 'true') {
      searchBtn.setAttribute('data-listener-bound', 'true')
      searchBtn.addEventListener('click', openSearch)
    }
  }

  // Back to Top Button & Post Sticky Header
  const initBackToTop = () => {
    // Remove existing button if any (for SPA navigation)
    const existingBtn = document.querySelector('.back-to-top')
    if (existingBtn) existingBtn.remove()
    const existingHeader = document.querySelector('.post-sticky-header')
    if (existingHeader) existingHeader.remove()

    // Check if we're on tags page
    const isTagsPage = Boolean(document.querySelector('.tag-list'))
    if (isTagsPage) return

    // Check if we're on a post page
    const isPostPage = Boolean(document.querySelector('.post'))
    const postTitleEl = document.querySelector('.post-h1')
    const postTitle = postTitleEl ? postTitleEl.textContent : ''

    // Create back-to-top button
    const btn = document.createElement('button')
    btn.className = 'back-to-top'
    btn.setAttribute('aria-label', 'Back to top')
    btn.innerHTML = `
      <svg class="svgIcon" viewBox="0 0 384 512">
        <path d="M214.6 41.4c-12.5-12.5-32.8-12.5-45.3 0l-160 160c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L160 141.2V448c0 17.7 14.3 32 32 32s32-14.3 32-32V141.2L329.4 246.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3l-160-160z"></path>
      </svg>
    `
    document.body.appendChild(btn)

    // Create sticky header for post pages
    let stickyHeader = null
    if (isPostPage && postTitle) {
      stickyHeader = document.createElement('div')
      stickyHeader.className = 'post-sticky-header'
      stickyHeader.innerHTML = `
        <a class="sticky-back" href="/blog/" aria-label="返回">
          <svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M269.704 127.864a30 30 0 0 1 42.428 42.428L172.424 310H696c144.696 0 261.996 117.3 262 262 0 144.696-117.304 262-262 262H318a30 30 0 0 1 0-60H696c111.56 0 202-90.44 202-202-0.004-111.564-90.44-202-202-202H172.424l139.708 139.704a30 30 0 0 1-42.428 42.428l-190.92-190.92a30.004 30.004 0 0 1 0-42.428l190.92-190.92z" fill="currentColor"></path></svg>
        </a>
        <span class="sticky-title">${postTitle}</span>
        <button class="sticky-search" aria-label="search">
          <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" fill="currentColor"/></svg>
        </button>
      `
      document.body.appendChild(stickyHeader)

      // Bind search button
      const searchBtn = stickyHeader.querySelector('.sticky-search')
      if (searchBtn) {
        searchBtn.addEventListener('click', openSearch)
      }
    }

    // Throttle function for scroll performance
  const throttle = (fn, delay) => {
    let lastCall = 0
    return (...args) => {
      const now = Date.now()
      if (now - lastCall >= delay) {
        lastCall = now
        fn(...args)
      }
    }
  }

  // Show/hide based on scroll position (throttled for performance)
  const checkScroll = throttle(() => {
    if (window.scrollY > 300) {
      btn.classList.add('visible')
      if (stickyHeader) stickyHeader.classList.add('visible')
    } else {
      btn.classList.remove('visible')
      if (stickyHeader) stickyHeader.classList.remove('visible')
    }
  }, 100)

  // Click handler - smooth scroll to top
  btn.onclick = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // Listen for scroll with passive option
  window.addEventListener('scroll', checkScroll, { passive: true })
  checkScroll() // Initial check
  }

  window.onpopstate = async () => {
    const targetUrl = window.location.href
    showLoader()
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
      }

      const currentPath = new URL(targetUrl).pathname
      document.querySelectorAll('.nav-item').forEach(nav => {
        const navPath = new URL(nav.href, window.location.origin).pathname
        nav.classList.toggle('active', navPath === currentPath)
      })

      initLinks()
      attachGlobalListeners()
      runPostEnhancements()
      initBackToTop()
      bindCopyActions()
      closeSidebar()
      hideLoader()
    } catch (err) {
      console.error(err)
      hideLoader()
      window.location.reload()
    }
  }

  initLinks()
  attachGlobalListeners()
  runPostEnhancements()
  initBackToTop()
})
