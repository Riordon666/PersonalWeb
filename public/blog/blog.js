// Blog page interactions
// - Theme & background system (HSL palette / background picker)
// - SPA navigation with top progress bar, prefetch & page cache
// - Global search (search-index.json) with keyboard navigation
// - Post enhancements: TOC, code copy, reading progress, lightbox
// - Back-to-top & sticky post header

// ========================================
// Utilities
// ========================================

const qs = (s, r = document) => r.querySelector(s)
const qsa = (s, r = document) => Array.from(r.querySelectorAll(s))
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const escapeHtml = (s) =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

const prefersReducedMotion = () =>
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

// ========================================
// Color scheme (light / dark / follow OS)
// ========================================

const SCHEME_KEY = 'blog-theme-scheme'

const SCHEMES = [
  {
    id: 'auto',
    label: '跟随系统',
    icon: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><rect x="3" y="4.5" width="18" height="13" rx="2.5" stroke="currentColor" stroke-width="1.8"/><path d="M9 20.5h6" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
  },
  {
    id: 'light',
    label: '浅色',
    icon: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><circle cx="12" cy="12" r="4.2" stroke="currentColor" stroke-width="1.8"/><path d="M12 2.8v2.1M12 19.1v2.1M21.2 12h-2.1M4.9 12H2.8m15.3-6.4-1.5 1.5M7.3 16.7l-1.5 1.5m12.3 0-1.5-1.5M7.3 7.3 5.8 5.8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
  },
  {
    id: 'dark',
    label: '深色',
    icon: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M20 14.2A8.2 8.2 0 0 1 9.8 4 8.4 8.4 0 1 0 20 14.2Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>',
  },
]

const getScheme = () => {
  try {
    const v = localStorage.getItem(SCHEME_KEY)
    return v === 'light' || v === 'dark' ? v : 'auto'
  } catch {
    return 'auto'
  }
}

const systemPrefersDark = () =>
  window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches

const applyScheme = (scheme) => {
  const dark = scheme === 'dark' || (scheme === 'auto' && systemPrefersDark())
  const root = document.documentElement
  if (dark) root.setAttribute('data-scheme', 'dark')
  else root.removeAttribute('data-scheme')
  try {
    localStorage.setItem(SCHEME_KEY, scheme)
  } catch {}
}

// Track the OS preference while in "auto"
if (window.matchMedia) {
  const mq = window.matchMedia('(prefers-color-scheme: dark)')
  const onChange = () => {
    if (getScheme() === 'auto') applyScheme('auto')
  }
  if (mq.addEventListener) mq.addEventListener('change', onChange)
  else if (mq.addListener) mq.addListener(onChange)
}

// ========================================
// Toast (single reusable element)
// ========================================

let toastEl = null
let toastTimer = 0
const showToast = (message) => {
  if (!toastEl) {
    toastEl = document.createElement('div')
    toastEl.className = 'toast'
    document.body.appendChild(toastEl)
  }
  toastEl.textContent = message
  clearTimeout(toastTimer)
  requestAnimationFrame(() => toastEl.classList.add('show'))
  toastTimer = window.setTimeout(() => {
    toastEl.classList.remove('show')
  }, 1400)
}

// ========================================
// Page Loader (initial full-screen)
// ========================================

const LOADER_SVG = `
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
    </div>`

let pageLoader = null
const showLoader = () => {
  if (!pageLoader) pageLoader = qs('.page-loader')
  if (!pageLoader) {
    pageLoader = document.createElement('div')
    pageLoader.className = 'page-loader'
    pageLoader.innerHTML = LOADER_SVG
    document.body.appendChild(pageLoader)
  }
  pageLoader.classList.remove('hidden')
}
const hideLoader = () => {
  if (!pageLoader) pageLoader = qs('.page-loader')
  if (pageLoader) pageLoader.classList.add('hidden')
  document.body.classList.add('app-ready')
}

const createTileLoader = () => {
  const loader = document.createElement('div')
  loader.className = 'tile-loader'
  const uid = `tl-${Math.random().toString(36).slice(2, 10)}`
  loader.innerHTML = LOADER_SVG.replace(/url\(#([bcd])\)/g, `url(#$1-${uid})`).replace(
    /id="([bcd])"/g,
    `id="$1-${uid}"`
  )
  return loader
}

// Track when theme and background are fully loaded
let themeLoadedResolve = null
const themeLoadedPromise = new Promise((resolve) => {
  themeLoadedResolve = resolve
})

// Hide the initial loader when the page + theme are ready.
// Keeps a short minimum so the animation doesn't flash, plus a
// safety timeout so a failed fetch can never leave it stuck.
window.addEventListener('load', async () => {
  const startTime = Date.now()
  const minDuration = 500
  await Promise.race([themeLoadedPromise, sleep(3000)])
  const remaining = Math.max(0, minDuration - (Date.now() - startTime))
  if (remaining > 0) await sleep(remaining)
  hideLoader()
})

// ========================================
// Top progress bar (SPA navigation)
// ========================================

const progress = (() => {
  let el = null
  let bar = null
  let hideTimer = 0
  let trickleTimer = 0
  let value = 0

  const ensure = () => {
    if (el) return
    el = document.createElement('div')
    el.className = 'nav-progress'
    bar = document.createElement('div')
    bar.className = 'nav-progress-bar'
    el.appendChild(bar)
    document.body.appendChild(el)
  }

  const set = (v) => {
    value = Math.min(1, Math.max(0, v))
    bar.style.transform = `scaleX(${value})`
  }

  return {
    start() {
      ensure()
      clearTimeout(hideTimer)
      clearInterval(trickleTimer)
      el.classList.add('active')
      set(0.08)
      trickleTimer = window.setInterval(() => {
        // Trickle towards 90% while waiting
        set(value + (0.9 - value) * 0.12)
      }, 160)
    },
    done() {
      if (!el) return
      clearInterval(trickleTimer)
      set(1)
      hideTimer = window.setTimeout(() => {
        el.classList.remove('active')
        set(0)
      }, 260)
    },
  }
})()

// ========================================
// Main app
// ========================================

document.addEventListener('DOMContentLoaded', async () => {
  const root = document.documentElement
  const sidebar = qs('.sidebar')
  const toggle = qs('.nav-toggle')

  // ----------------------------------------
  // Sidebar
  // ----------------------------------------

  const setOpen = (open) => {
    if (!sidebar) return
    sidebar.setAttribute('data-open', open ? 'true' : 'false')
    root.classList.toggle('nav-open', open)
  }
  const closeSidebar = () => setOpen(false)

  if (toggle && sidebar) {
    toggle.addEventListener('click', () => {
      setOpen(sidebar.getAttribute('data-open') !== 'true')
    })
  }

  document.addEventListener('click', (e) => {
    if (!sidebar) return
    if (sidebar.getAttribute('data-open') !== 'true') return
    const target = e.target
    if (
      target instanceof Node &&
      !sidebar.contains(target) &&
      (!toggle || !toggle.contains(target))
    ) {
      setOpen(false)
    }
  })

  // ----------------------------------------
  // Copy-to-clipboard (event delegation)
  // ----------------------------------------

  document.addEventListener('click', async (e) => {
    const el = e.target instanceof Element ? e.target.closest('[data-copy-text]') : null
    if (!el) return
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

  // ----------------------------------------
  // Theme & Background
  // ----------------------------------------

  const STORAGE_KEY = 'blog-theme-hsl'
  const BG_STORAGE_KEY = 'blog-theme-bg'
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v))

  const DEFAULT_PANEL_ALPHA = 0.85

  let bgState = {
    mode: 'color',
    image: '',
    blur: 0,
    opacity: 1,
    imageOnly: false,
    panelAlpha: DEFAULT_PANEL_ALPHA,
  }

  const applyBgState = (state) => {
    bgState = state
    const bodyMode = state.mode === 'image' && state.imageOnly ? 'image-only' : state.mode
    document.body.setAttribute('data-theme-mode', bodyMode)
    root.setAttribute('data-theme-mode', bodyMode)
    const bgImage = state.mode === 'color' ? 'none' : state.image ? `url("${state.image}")` : 'none'
    root.style.setProperty('--bg-image', bgImage)
    root.style.setProperty('--bg-blur', `${state.blur}px`)
    root.style.setProperty('--bg-opacity', state.opacity)
    root.style.setProperty('--panel-alpha', state.panelAlpha ?? DEFAULT_PANEL_ALPHA)
    localStorage.setItem(BG_STORAGE_KEY, JSON.stringify({ ...state, timestamp: Date.now() }))
  }

  const loadBgState = async () => {
    try {
      let config = { defaultMode: 'color', defaultImage: 1, defaultBlur: 0, defaultOpacity: 1 }
      try {
        const resp = await fetch('/blog/background-config.json')
        if (resp.ok) config = await resp.json()
      } catch (e) {
        /* use defaults */
      }

      const files = await fetch('/blog/backgrounds.json')
        .then((r) => (r.ok ? r.json() : []))
        .catch(() => [])
      const defaultImage = files[config.defaultImage - 1] || ''

      const TWO_DAYS_MS = 2 * 24 * 60 * 60 * 1000
      const raw = localStorage.getItem(BG_STORAGE_KEY)
      let useDefaults = true

      if (raw) {
        try {
          const saved = JSON.parse(raw)
          if (saved.timestamp && Date.now() - saved.timestamp < TWO_DAYS_MS) {
            useDefaults = false
            applyBgState({
              mode: saved.mode,
              image: saved.image || defaultImage,
              blur: saved.blur ?? config.defaultBlur,
              opacity: saved.opacity ?? config.defaultOpacity,
              imageOnly: saved.imageOnly ?? false,
              panelAlpha:
                saved.panelAlpha ?? config.defaultPanelAlpha ?? DEFAULT_PANEL_ALPHA,
            })
          }
        } catch (e) {
          /* corrupted state -> defaults */
        }
      }

      if (useDefaults) {
        applyBgState({
          mode: config.defaultMode || 'color',
          image: defaultImage,
          blur: config.defaultBlur,
          opacity: config.defaultOpacity,
          imageOnly: config.defaultImageOnly ?? false,
          panelAlpha: config.defaultPanelAlpha ?? DEFAULT_PANEL_ALPHA,
        })
      }
    } catch (e) {
      console.error('Failed to load bg state', e)
    }
  }

  const setTheme = ({ h, s, l }) => {
    root.style.setProperty('--theme-h', String(Math.round(h)))
    root.style.setProperty('--theme-s', `${Math.round(s)}%`)
    root.style.setProperty('--theme-l', `${Math.round(l)}%`)
    root.style.setProperty(
      '--theme-color',
      `hsl(${Math.round(h)}, ${Math.round(s)}%, ${Math.round(l)}%)`
    )
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
  if (themeLoadedResolve) themeLoadedResolve()

  const hslToRgb = (h, s, l) => {
    s /= 100
    l /= 100
    const c = (1 - Math.abs(2 * l - 1)) * s
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1))
    const m = l - c / 2
    let r = 0,
      g = 0,
      b = 0
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

  // ----------------------------------------
  // Palette modal
  // ----------------------------------------

  const createPaletteModal = async (initial) => {
    const modal = document.createElement('div')
    modal.className = 'palette-modal'

    let backgrounds = []
    try {
      const resp = await fetch('/blog/backgrounds.json')
      if (resp.ok) backgrounds = await resp.json()
    } catch (e) {
      console.warn('Failed to load backgrounds:', e)
    }

    // One preview slot is taken by the solid-color tile, one by "view more"
    const isMobile = window.innerWidth <= 768
    const previewCount = isMobile ? 5 : 6
    const previewImages = backgrounds.slice(0, previewCount)
    const hasMore = backgrounds.length > previewCount

    modal.innerHTML = `
      <div class="palette-card" role="dialog" aria-modal="true" aria-label="外观设置">
        <div class="palette-header">
          <div class="palette-title">外观</div>
          <button class="palette-close" type="button" aria-label="close">×</button>
        </div>

        <div class="palette-content">
          <section class="palette-section">
            <div class="section-label">配色方案</div>
            <div class="scheme-switch" role="group" aria-label="配色方案">
              ${SCHEMES.map(
                (s) => `
                <button class="scheme-btn ${getScheme() === s.id ? 'active' : ''}" type="button" data-scheme="${s.id}">
                  ${s.icon}<span>${s.label}</span>
                </button>`
              ).join('')}
            </div>
          </section>

          <section class="palette-section">
            <div class="section-label">主题色</div>
            <div class="color-row">
              <div class="wheel-wrap">
                <canvas class="palette-wheel" width="168" height="168"></canvas>
                <div class="wheel-knob" aria-hidden="true"></div>
              </div>
              <div class="color-side">
                <div class="theme-chip"><span class="theme-chip-dot"></span><span class="theme-chip-text">当前主题色</span></div>
                <div class="setting-row">
                  <div class="setting-label"><span>明度</span><span id="val-light">${Math.round(initial.l)}%</span></div>
                  <input class="setting-slider palette-light" type="range" min="20" max="80" value="${Math.round(initial.l)}" aria-label="明度" />
                </div>
              </div>
            </div>
          </section>

          <section class="palette-section">
            <div class="section-label">背景</div>
            <div class="bg-grid">
              <button class="bg-item bg-solid ${bgState.mode === 'color' ? 'active' : ''}" type="button" data-action="solid">
                <span class="bg-solid-swatch"></span>
                <span class="bg-solid-label">纯色</span>
              </button>
              ${
                backgrounds.length > 0
                  ? `
                ${previewImages
                  .map(
                    (src) => `
                  <button class="bg-item ${bgState.mode === 'image' && bgState.image === src ? 'active' : ''}"
                       type="button"
                       style="background-image: url('${src}')"
                       data-src="${src}"></button>
                `
                  )
                  .join('')}
                ${
                  hasMore
                    ? `
                  <button class="bg-item bg-more" type="button" data-action="view-more">
                    <span class="bg-more-text">+${backgrounds.length - previewCount}</span>
                    <span class="bg-more-label">更多</span>
                  </button>
                `
                    : ''
                }
              `
                  : '<div class="bg-empty">暂无背景图片，请添加到 public/blog/backgrounds/ 文件夹</div>'
              }
            </div>
          </section>

          <section class="palette-section">
            <div class="section-label">显示</div>
            <div class="bg-controls">
              <div class="setting-row">
                <div class="setting-label"><span>卡片透明度</span><span id="val-panel">${Math.round((bgState.panelAlpha ?? DEFAULT_PANEL_ALPHA) * 100)}%</span></div>
                <input class="setting-slider" id="input-panel" type="range" min="20" max="100" value="${Math.round((bgState.panelAlpha ?? DEFAULT_PANEL_ALPHA) * 100)}" />
              </div>
              <div class="setting-row needs-image">
                <div class="setting-label"><span>虚化程度</span><span id="val-blur">${bgState.blur}px</span></div>
                <input class="setting-slider" id="input-blur" type="range" min="0" max="20" value="${bgState.blur}" />
              </div>
              <div class="setting-row needs-image">
                <div class="setting-label"><span>背景亮度</span><span id="val-opacity">${Math.round(bgState.opacity * 100)}%</span></div>
                <input class="setting-slider" id="input-opacity" type="range" min="10" max="100" value="${bgState.opacity * 100}" />
              </div>
              <div class="setting-row setting-switch needs-image">
                <div class="setting-label"><span>仅背景图片</span><span>不叠加主题色</span></div>
                <div class="checkbox-wrapper-5">
                  <div class="check">
                    <input ${bgState.imageOnly ? 'checked' : ''} id="toggle-image-only" type="checkbox">
                    <label for="toggle-image-only"></label>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        <div class="palette-footer">
          <button class="palette-btn-close" type="button">完成</button>
        </div>
      </div>
    `

    modal._backgrounds = backgrounds
    return modal
  }

  const createImagePickerModal = async (backgrounds) => {
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
          ${backgrounds
            .map((src) => {
              const baseName = src.split('/').pop().replace(/\.[^.]+$/, '')
              const thumbFile = thumbsConfig.files.find((f) => f.includes(baseName))
              const thumbSrc = thumbFile ? `${thumbsConfig.dir}${thumbFile}` : src
              return `
              <div class="image-picker-item ${bgState.image === src ? 'active' : ''}"
                   data-src="${src}"
                   data-thumb="${thumbSrc}"></div>
            `
            })
            .join('')}
        </div>
      </div>
    `

    // Lazy load thumbnails with a small concurrency budget
    const loadQueue = []
    let loadingCount = 0
    const MAX_CONCURRENT = 6

    const processQueue = () => {
      while (loadQueue.length > 0 && loadingCount < MAX_CONCURRENT) {
        loadItemNow(loadQueue.shift())
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

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            loadItem(entry.target)
            observer.unobserve(entry.target)
          }
        })
      },
      { rootMargin: '100px' }
    )

    requestAnimationFrame(() => {
      picker.querySelectorAll('.image-picker-item').forEach((item) => observer.observe(item))
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
    requestAnimationFrame(() => paletteEl && paletteEl.classList.add('open'))

    const onKeydown = (e) => {
      if (e.key === 'Escape') close()
    }

    const close = () => {
      if (!paletteEl) return
      const el = paletteEl
      paletteEl = null
      document.removeEventListener('keydown', onKeydown)
      el.classList.remove('open')
      window.setTimeout(() => el.remove(), 200)
    }

    document.addEventListener('keydown', onKeydown)

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

    // Tile loaders for the preview grid
    paletteEl.querySelectorAll('.bg-item[data-src]').forEach((item) => {
      const src = item.dataset.src
      if (!src) return
      const overlay = createTileLoader()
      item.appendChild(overlay)
      const img = new Image()
      img.onload = () => overlay.remove()
      img.onerror = () => overlay.remove()
      img.src = src
    })

    // Color scheme switch
    paletteEl.querySelectorAll('.scheme-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const next = btn.dataset.scheme
        applyScheme(next)
        paletteEl?.querySelectorAll('.scheme-btn').forEach((b) => {
          b.classList.toggle('active', b.dataset.scheme === next)
        })
        // The wheel is painted with canvas pixels, so it has to be
        // repainted for the new surface behind it
        redraw()
      })
    })

    // Background-dependent controls are dimmed while in solid-color mode
    const syncModeUI = () => {
      if (!paletteEl) return
      const isColor = bgState.mode === 'color'
      paletteEl.classList.toggle('is-color-mode', isColor)
      paletteEl.querySelectorAll('.needs-image input').forEach((el) => {
        el.disabled = isColor
      })
      paletteEl.querySelectorAll('.bg-item').forEach((el) => {
        const active = el.dataset.action === 'solid' ? isColor : !isColor && el.dataset.src === bgState.image
        el.classList.toggle('active', !!active)
      })
    }
    syncModeUI()

    // Background selection — switches mode in place, no modal rebuild
    paletteEl.querySelectorAll('.bg-item').forEach((item) => {
      item.addEventListener('click', () => {
        if (item.dataset.action === 'view-more') {
          openImagePicker(item.closest('.palette-modal')._backgrounds)
          return
        }
        if (item.dataset.action === 'solid') {
          applyBgState({ ...bgState, mode: 'color' })
          syncModeUI()
          return
        }
        const src = item.dataset.src
        if (!src) return
        const apply = () => {
          applyBgState({ ...bgState, image: src, mode: 'image' })
          syncModeUI()
        }
        // Already-decoded images swap instantly; only show the loader
        // when the bitmap still needs fetching
        const img = new Image()
        img.src = src
        if (img.complete) {
          apply()
          return
        }
        showLoader()
        const done = () => {
          apply()
          hideLoader()
        }
        img.onload = done
        img.onerror = done
      })
    })

    // Sliders
    const panelInput = paletteEl.querySelector('#input-panel')
    const panelVal = paletteEl.querySelector('#val-panel')
    panelInput?.addEventListener('input', () => {
      panelVal.textContent = `${panelInput.value}%`
      applyBgState({ ...bgState, panelAlpha: Number(panelInput.value) / 100 })
    })

    const blurInput = paletteEl.querySelector('#input-blur')
    const blurVal = paletteEl.querySelector('#val-blur')
    blurInput?.addEventListener('input', () => {
      blurVal.textContent = `${blurInput.value}px`
      applyBgState({ ...bgState, blur: Number(blurInput.value) })
    })

    const opacityInput = paletteEl.querySelector('#input-opacity')
    const opacityVal = paletteEl.querySelector('#val-opacity')
    opacityInput?.addEventListener('input', () => {
      opacityVal.textContent = `${opacityInput.value}%`
      applyBgState({ ...bgState, opacity: Number(opacityInput.value) / 100 })
    })

    const imageOnlyToggle = paletteEl.querySelector('#toggle-image-only')
    imageOnlyToggle?.addEventListener('change', () => {
      applyBgState({ ...bgState, mode: 'image', imageOnly: !!imageOnlyToggle.checked })
      syncModeUI()
    })

    paletteEl._syncModeUI = syncModeUI

    // Color wheel dragging
    const pickAt = (clientX, clientY) => {
      const rect = wheel.getBoundingClientRect()
      const x = clamp(clientX - rect.left, 0, rect.width)
      const y = clamp(clientY - rect.top, 0, rect.height)
      const px = (x * wheel.width) / rect.width
      const py = (y * wheel.height) / rect.height
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

    const lightVal = paletteEl.querySelector('#val-light')
    light?.addEventListener('input', () => {
      theme = { ...theme, l: Number(light.value) }
      if (lightVal) lightVal.textContent = `${light.value}%`
      redraw()
    })

    paletteEl.querySelector('.palette-btn-close')?.addEventListener('click', close)
    paletteEl.querySelector('.palette-close')?.addEventListener('click', close)
    paletteEl.addEventListener('click', (e) => {
      if (e.target === paletteEl) close()
    })
  }

  let imagePickerEl = null
  const openImagePicker = async (backgrounds) => {
    if (imagePickerEl) return
    imagePickerEl = await createImagePickerModal(backgrounds)
    document.body.appendChild(imagePickerEl)

    const onKeydown = (e) => {
      if (e.key === 'Escape') close()
    }

    const close = () => {
      if (!imagePickerEl) return
      const el = imagePickerEl
      imagePickerEl = null
      document.removeEventListener('keydown', onKeydown)
      el.remove()
    }

    document.addEventListener('keydown', onKeydown)

    imagePickerEl.querySelector('.image-picker-close')?.addEventListener('click', (e) => {
      e.stopPropagation()
      close()
    })
    imagePickerEl.addEventListener('click', (e) => {
      if (e.target === imagePickerEl || e.target.classList.contains('image-picker-backdrop'))
        close()
    })

    imagePickerEl.querySelectorAll('.image-picker-item').forEach((item) => {
      item.addEventListener('click', () => {
        const src = item.dataset.src
        if (!src) return
        showLoader()
        const apply = () => {
          applyBgState({ ...bgState, image: src, mode: 'image' })
          // The chosen image may live outside the palette's preview grid;
          // syncModeUI reconciles both grids against the new state
          paletteEl?._syncModeUI?.()
          hideLoader()
          close()
        }
        const img = new Image()
        img.onload = apply
        img.onerror = apply
        img.src = src
      })
    })
  }

  // ----------------------------------------
  // Global search (search-index.json)
  // ----------------------------------------

  let searchIndexCache = null
  const loadSearchIndex = async () => {
    if (searchIndexCache) return searchIndexCache
    try {
      const resp = await fetch('/blog/search-index.json')
      if (resp.ok) searchIndexCache = await resp.json()
    } catch {
      searchIndexCache = null
    }
    return searchIndexCache || []
  }

  const highlight = (text, terms) => {
    let out = escapeHtml(text)
    for (const term of terms) {
      if (!term) continue
      const re = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')
      out = out.replace(re, (m) => `<mark>${m}</mark>`)
    }
    return out
  }

  const makeSnippet = (content, terms) => {
    const lower = content.toLowerCase()
    let pos = -1
    for (const term of terms) {
      const p = lower.indexOf(term.toLowerCase())
      if (p !== -1 && (pos === -1 || p < pos)) pos = p
    }
    if (pos === -1) return content.slice(0, 90)
    const start = Math.max(0, pos - 30)
    const end = Math.min(content.length, pos + 60)
    return (start > 0 ? '…' : '') + content.slice(start, end) + (end < content.length ? '…' : '')
  }

  const searchPosts = (index, query) => {
    const terms = query.toLowerCase().split(/\s+/).filter(Boolean)
    if (!terms.length) return []
    const scored = []
    for (const post of index) {
      const title = post.title.toLowerCase()
      const tags = (post.tags || []).join(' ').toLowerCase()
      const content = (post.content || '').toLowerCase()
      let score = 0
      let allMatch = true
      for (const term of terms) {
        let s = 0
        if (title.includes(term)) s += 5
        if (tags.includes(term)) s += 3
        if (content.includes(term)) s += 1
        if (s === 0) {
          allMatch = false
          break
        }
        score += s
      }
      if (allMatch) scored.push({ post, score })
    }
    scored.sort((a, b) => b.score - a.score)
    return scored.map((s) => s.post)
  }

  let searchModal = null
  const openSearch = async () => {
    if (searchModal) return

    searchModal = document.createElement('div')
    searchModal.className = 'search-modal'
    searchModal.innerHTML = `
      <div class="search-card" role="dialog" aria-modal="true" aria-label="search">
        <div class="search-header">
          <svg class="search-header-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><circle cx="11" cy="11" r="7" stroke="currentColor" stroke-width="2"/><path d="m20 20-3.5-3.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
          <input class="search-input" type="text" placeholder="搜索文章标题、标签、内容…" autofocus />
          <button class="search-close" type="button" aria-label="close">×</button>
        </div>
        <div class="search-results"><div class="search-hint">输入关键词，搜索全站文章</div></div>
        <div class="search-footer">
          <span><kbd>↑</kbd><kbd>↓</kbd> 选择</span>
          <span><kbd>Enter</kbd> 打开</span>
          <span><kbd>Esc</kbd> 关闭</span>
        </div>
      </div>
    `
    document.body.appendChild(searchModal)
    requestAnimationFrame(() => searchModal && searchModal.classList.add('open'))

    const input = searchModal.querySelector('.search-input')
    const results = searchModal.querySelector('.search-results')
    let activeIndex = -1

    const onKeydown = (e) => {
      if (e.key === 'Escape') {
        close()
        return
      }
      const links = results ? Array.from(results.querySelectorAll('.search-result')) : []
      if (!links.length) return
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault()
        activeIndex =
          e.key === 'ArrowDown'
            ? (activeIndex + 1) % links.length
            : (activeIndex - 1 + links.length) % links.length
        links.forEach((l, i) => l.classList.toggle('selected', i === activeIndex))
        links[activeIndex]?.scrollIntoView({ block: 'nearest' })
      } else if (e.key === 'Enter') {
        e.preventDefault()
        const target = activeIndex >= 0 ? links[activeIndex] : links[0]
        target?.click()
      }
    }

    const close = () => {
      if (!searchModal) return
      const el = searchModal
      searchModal = null
      document.removeEventListener('keydown', onKeydown)
      el.classList.remove('open')
      window.setTimeout(() => el.remove(), 200)
    }

    document.addEventListener('keydown', onKeydown)

    searchModal.querySelector('.search-close').addEventListener('click', close)
    searchModal.addEventListener('click', (e) => {
      if (e.target === searchModal) close()
      // Close after choosing a result (SPA handler takes over navigation)
      if (e.target instanceof Element && e.target.closest('.search-result')) close()
    })

    const index = await loadSearchIndex()

    let debounceTimer = 0
    input.addEventListener('input', () => {
      clearTimeout(debounceTimer)
      debounceTimer = window.setTimeout(() => {
        const q = input.value.trim()
        activeIndex = -1
        if (!q) {
          results.innerHTML = '<div class="search-hint">输入关键词，搜索全站文章</div>'
          return
        }
        const terms = q.split(/\s+/).filter(Boolean)
        const found = searchPosts(index, q)
        if (!found.length) {
          results.innerHTML = `<div class="search-empty">未找到与 "${escapeHtml(q)}" 相关的文章</div>`
          return
        }
        results.innerHTML = found
          .map(
            (p) => `
          <a class="search-result" href="${p.url}">
            <div class="search-result-title">${highlight(p.title, terms)}</div>
            <div class="search-result-excerpt">${highlight(makeSnippet(p.content || p.excerpt || '', terms), terms)}</div>
            <div class="search-result-meta">
              <span>${p.date}</span>
              ${(p.tags || []).map((t) => `<span class="search-result-tag">${escapeHtml(t)}</span>`).join('')}
            </div>
          </a>
        `
          )
          .join('')
      }, 120)
    })

    input.focus()
  }

  // Palette / search buttons via delegation (survives SPA swaps)
  document.addEventListener('click', (e) => {
    if (!(e.target instanceof Element)) return
    if (e.target.closest('.palette-btn')) {
      openPalette()
      return
    }
    if (e.target.closest('.search') || e.target.closest('.sticky-search')) {
      openSearch()
    }
  })

  // Keyboard shortcut: Ctrl/Cmd+K or '/' opens search
  document.addEventListener('keydown', (e) => {
    const typing =
      e.target instanceof HTMLElement &&
      (e.target.tagName === 'INPUT' ||
        e.target.tagName === 'TEXTAREA' ||
        e.target.isContentEditable)
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault()
      openSearch()
    } else if (e.key === '/' && !typing && !searchModal) {
      e.preventDefault()
      openSearch()
    } else if (e.key === 'Escape') {
      setOpen(false)
    }
  })

  // ----------------------------------------
  // Post enhancements: TOC / code copy / lightbox / reading progress
  // ----------------------------------------

  // ----------------------------------------
  // Mini games (loaded on demand)
  // ----------------------------------------

  let teardownGame = null
  let gameMountSeq = 0
  const syncGame = async () => {
    const seq = ++gameMountSeq
    if (teardownGame) {
      teardownGame()
      teardownGame = null
    }
    const stage = qs('[data-game]')
    if (!stage) return
    try {
      const { mountGame } = await import('/blog/games.js')
      if (seq !== gameMountSeq || !stage.isConnected) return
      const teardown = await mountGame(stage)
      // The page may have been swapped again while the game module loaded
      if (seq !== gameMountSeq || !stage.isConnected) {
        teardown?.()
        return
      }
      teardownGame = teardown
    } catch (err) {
      console.error('[games] failed to load:', err)
      const viewport = stage.querySelector('[data-role="viewport"]')
      if (viewport) viewport.innerHTML = '<div class="game-loading">游戏加载失败</div>'
    }
  }

  // Category filter on the games index
  const initGameFilters = () => {
    const bar = qs('.game-filters')
    if (!bar || bar.dataset.bound === 'true') return
    bar.dataset.bound = 'true'
    bar.addEventListener('click', (e) => {
      const btn = e.target.closest('.game-filter')
      if (!btn) return
      const key = btn.dataset.filter
      bar.querySelectorAll('.game-filter').forEach((b) => b.classList.toggle('active', b === btn))
      document.querySelectorAll('.game-section').forEach((sec) => {
        sec.hidden = key !== 'all' && sec.dataset.cat !== key
      })
    })
  }

  const runPostEnhancements = () => {
    const isPostPage = Boolean(qs('.post'))
    document.body.setAttribute('data-page', detectPageKind())
    initReadingProgress(isPostPage)
    syncGame()
    initGameFilters()
    if (!isPostPage) return

    const titleEl = qs('.post-h1')
    if (titleEl) titleEl.classList.remove('typing')

    initToc()
    initCodeCopy()
  }

  const detectPageKind = () => {
    if (qs('.post')) return 'post'
    if (qs('.tag-list')) return 'tags'
    if (qs('.archive-container')) return 'archives'
    if (qs('.changelog-wrap')) return 'changelog'
    if (qs('.project-list')) return 'projects'
    if (qs('[data-game]')) return 'game'
    if (qs('.game-list')) return 'games'
    return 'home'
  }

  const initToc = () => {
    const tocRoot = qs('.post-toc-inner')
    const content = qs('.post-content')
    if (!tocRoot || !content) return

    const headings = qsa('h2, h3', content)
    if (headings.length === 0) {
      const tocAside = qs('.post-toc')
      if (tocAside) tocAside.style.display = 'none'
      return
    }

    const slugifyText = (s) =>
      s
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9一-龥-]/g, '')

    const used = new Map()
    const ensureId = (el) => {
      if (el.id) return el.id
      const base = slugifyText(el.textContent || 'section') || 'section'
      const n = (used.get(base) || 0) + 1
      used.set(base, n)
      el.id = n === 1 ? base : `${base}-${n}`
      return el.id
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
        e.stopPropagation()
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        history.pushState(null, '', `#${id}`)
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

    const tocToggle = qs('.toc-toggle')
    if (tocToggle) {
      tocToggle.onclick = () => {
        const open = document.body.getAttribute('data-toc-open') === 'true'
        document.body.setAttribute('data-toc-open', open ? 'false' : 'true')
      }
    }
  }

  const initCodeCopy = () => {
    qsa('.post-content pre').forEach((pre) => {
      const wrap = pre.closest('.code-block') || pre
      if (wrap.querySelector('.code-copy')) return
      const btn = document.createElement('button')
      btn.className = 'code-copy'
      btn.type = 'button'
      btn.setAttribute('aria-label', '复制代码')
      btn.innerHTML =
        '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="9" y="9" width="11" height="11" rx="2" stroke="currentColor" stroke-width="1.8"/><path d="M5 15V5a1 1 0 0 1 1-1h9" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>'
      btn.addEventListener('click', async () => {
        const code = pre.innerText
        try {
          await navigator.clipboard.writeText(code)
          btn.classList.add('copied')
          btn.innerHTML =
            '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="m5 13 4 4L19 7" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>'
          showToast('已复制代码')
          setTimeout(() => {
            btn.classList.remove('copied')
            btn.innerHTML =
              '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><rect x="9" y="9" width="11" height="11" rx="2" stroke="currentColor" stroke-width="1.8"/><path d="M5 15V5a1 1 0 0 1 1-1h9" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>'
          }, 1600)
        } catch {
          showToast('复制失败')
        }
      })
      if (wrap === pre) {
        pre.style.position = 'relative'
      }
      wrap.appendChild(btn)
    })
  }

  // Lightbox for post images (delegated)
  let lightboxEl = null
  const openLightbox = (src, alt) => {
    if (lightboxEl) return
    lightboxEl = document.createElement('div')
    lightboxEl.className = 'lightbox'
    lightboxEl.innerHTML = `
      <img class="lightbox-img" src="${src}" alt="${escapeHtml(alt || '')}" />
      <div class="lightbox-caption">${escapeHtml(alt || '')}</div>
    `
    document.body.appendChild(lightboxEl)
    document.body.style.overflow = 'hidden'
    requestAnimationFrame(() => lightboxEl && lightboxEl.classList.add('open'))

    const onKeydown = (e) => {
      if (e.key === 'Escape') close()
    }
    const close = () => {
      if (!lightboxEl) return
      const el = lightboxEl
      lightboxEl = null
      document.removeEventListener('keydown', onKeydown)
      document.body.style.overflow = ''
      el.classList.remove('open')
      window.setTimeout(() => el.remove(), 240)
    }
    document.addEventListener('keydown', onKeydown)
    lightboxEl.addEventListener('click', close)
  }

  document.addEventListener('click', (e) => {
    if (!(e.target instanceof Element)) return
    const img = e.target.closest('.post-content img')
    if (img && img instanceof HTMLImageElement) {
      e.preventDefault()
      openLightbox(img.currentSrc || img.src, img.alt)
    }
  })

  // Reading progress bar (post pages only)
  let readingProgressEl = null
  let readingProgressRaf = 0
  const updateReadingProgress = () => {
    readingProgressRaf = 0
    if (!readingProgressEl) return
    const doc = document.documentElement
    const max = doc.scrollHeight - window.innerHeight
    const ratio = max > 0 ? Math.min(1, window.scrollY / max) : 0
    readingProgressEl.style.transform = `scaleX(${ratio})`
  }
  const onReadingScroll = () => {
    if (!readingProgressRaf) {
      readingProgressRaf = requestAnimationFrame(updateReadingProgress)
    }
  }
  const initReadingProgress = (isPostPage) => {
    if (!isPostPage) {
      readingProgressEl?.parentElement?.remove()
      readingProgressEl = null
      window.removeEventListener('scroll', onReadingScroll)
      return
    }
    if (!readingProgressEl) {
      const wrap = document.createElement('div')
      wrap.className = 'reading-progress'
      readingProgressEl = document.createElement('div')
      readingProgressEl.className = 'reading-progress-bar'
      wrap.appendChild(readingProgressEl)
      document.body.appendChild(wrap)
      window.addEventListener('scroll', onReadingScroll, { passive: true })
    }
    updateReadingProgress()
  }

  // ----------------------------------------
  // Back-to-top & post sticky header
  // ----------------------------------------

  let scrollUiCleanup = null
  const initBackToTop = () => {
    if (scrollUiCleanup) {
      scrollUiCleanup()
      scrollUiCleanup = null
    }
    qs('.back-to-top')?.remove()
    qs('.post-sticky-header')?.remove()

    if (qs('.tag-list')) return

    const isPostPage = Boolean(qs('.post'))
    const postTitle = qs('.post-h1')?.textContent || ''

    const btn = document.createElement('button')
    btn.className = 'back-to-top'
    btn.setAttribute('aria-label', 'Back to top')
    btn.innerHTML = `
      <svg class="svgIcon" viewBox="0 0 384 512">
        <path d="M214.6 41.4c-12.5-12.5-32.8-12.5-45.3 0l-160 160c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L160 141.2V448c0 17.7 14.3 32 32 32s32-14.3 32-32V141.2L329.4 246.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3l-160-160z"></path>
      </svg>
    `
    btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }))
    document.body.appendChild(btn)

    let stickyHeader = null
    if (isPostPage && postTitle) {
      stickyHeader = document.createElement('div')
      stickyHeader.className = 'post-sticky-header'
      stickyHeader.innerHTML = `
        <a class="sticky-back" href="/blog/" aria-label="返回">
          <svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M269.704 127.864a30 30 0 0 1 42.428 42.428L172.424 310H696c144.696 0 261.996 117.3 262 262 0 144.696-117.304 262-262 262H318a30 30 0 0 1 0-60H696c111.56 0 202-90.44 202-202-0.004-111.564-90.44-202-202-202H172.424l139.708 139.704a30 30 0 0 1-42.428 42.428l-190.92-190.92a30.004 30.004 0 0 1 0-42.428l190.92-190.92z" fill="currentColor"></path></svg>
        </a>
        <span class="sticky-title">${escapeHtml(postTitle)}</span>
        <button class="sticky-search" aria-label="search">
          <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M15.5 14h-.79l-.28-.27A6.471 6.471 0 0 0 16 9.5 6.5 6.5 0 1 0 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z" fill="currentColor"/></svg>
        </button>
      `
      document.body.appendChild(stickyHeader)
    }

    let ticking = false
    const checkScroll = () => {
      ticking = false
      const show = window.scrollY > 300
      btn.classList.toggle('visible', show)
      stickyHeader?.classList.toggle('visible', show)
    }
    const onScroll = () => {
      if (!ticking) {
        ticking = true
        requestAnimationFrame(checkScroll)
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    checkScroll()

    scrollUiCleanup = () => window.removeEventListener('scroll', onScroll)
  }

  // ----------------------------------------
  // SPA navigation: prefetch, cache, transitions
  // ----------------------------------------

  const pageCache = new Map()
  const PAGE_CACHE_MAX = 40
  const PAGE_CACHE_TTL = 5 * 60 * 1000
  const prefetching = new Set()

  const cachePut = (url, html) => {
    if (pageCache.size >= PAGE_CACHE_MAX) {
      const first = pageCache.keys().next().value
      pageCache.delete(first)
    }
    pageCache.set(url, { html, time: Date.now() })
  }

  const cacheGet = (url) => {
    const hit = pageCache.get(url)
    if (!hit) return null
    if (Date.now() - hit.time > PAGE_CACHE_TTL) {
      pageCache.delete(url)
      return null
    }
    return hit.html
  }

  const fetchPage = async (url) => {
    const cached = cacheGet(url)
    if (cached) return cached
    const resp = await fetch(url)
    if (!resp.ok) throw new Error(`HTTP ${resp.status}`)
    const html = await resp.text()
    cachePut(url, html)
    return html
  }

  const prefetchPage = (url) => {
    if (cacheGet(url) || prefetching.has(url)) return
    prefetching.add(url)
    fetch(url)
      .then((r) => (r.ok ? r.text() : null))
      .then((html) => {
        if (html) cachePut(url, html)
      })
      .catch(() => {})
      .finally(() => prefetching.delete(url))
  }

  const isSpaLink = (a) => {
    if (!a || !(a instanceof HTMLAnchorElement)) return false
    const href = a.getAttribute('href')
    if (!href) return false
    if (a.getAttribute('target') === '_blank') return false
    if (a.hasAttribute('data-copy-text')) return false
    if (href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return false
    if (/^[a-z]+:\/\//i.test(href) || href.startsWith('tencent://')) return false
    return href.startsWith('/blog')
  }

  // Sync page-specific stylesheets (archives.css / post.css, ...)
  const syncStylesheets = (doc) => {
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

    const nextLinks = qsa('link[rel="stylesheet"][href]', doc)
      .map((l) => normalizeHref(l.getAttribute('href')))
      .filter(isBlogStylesheet)

    const curLinks = qsa('link[rel="stylesheet"][href]')
      .map((l) => ({ el: l, href: normalizeHref(l.getAttribute('href')) }))
      .filter((x) => isBlogStylesheet(x.href))

    for (const { el, href } of curLinks) {
      if (!nextLinks.includes(href)) el.remove()
    }

    const have = new Set(
      qsa('link[rel="stylesheet"][href]')
        .map((l) => normalizeHref(l.getAttribute('href')))
        .filter(isBlogStylesheet)
    )
    const loadPromises = []
    for (const href of nextLinks) {
      if (have.has(href)) continue
      const link = document.createElement('link')
      link.rel = 'stylesheet'
      link.href = href
      loadPromises.push(
        new Promise((resolve) => {
          link.onload = resolve
          link.onerror = resolve
        })
      )
      document.head.appendChild(link)
    }
    return Promise.all(loadPromises)
  }

  const afterSwap = () => {
    closeSidebar()
    runPostEnhancements()
    initBackToTop()
  }

  let renderedPath = window.location.pathname
  let navigating = false
  const spaNavigate = async (targetUrl, { push = true, restoreScroll = null } = {}) => {
    if (navigating) return
    navigating = true
    progress.start()

    const main = qs('.main')
    const reduced = prefersReducedMotion()

    try {
      if (main && !reduced) main.classList.add('page-leaving')

      const [html] = await Promise.all([
        fetchPage(targetUrl),
        reduced ? Promise.resolve() : sleep(150),
      ])

      const doc = new DOMParser().parseFromString(html, 'text/html')
      await syncStylesheets(doc)

      document.title = doc.title

      const newMain = doc.querySelector('.main')
      const currentMain = qs('.main')
      if (!newMain || !currentMain) throw new Error('missing .main')

      if (push) {
        // Remember scroll position for history back
        history.replaceState({ scroll: window.scrollY }, '', window.location.href)
        history.pushState({ scroll: 0 }, '', targetUrl)
      }

      // Close any floating post UI, then swap content
      // (.post-toc lives inside .main, so the swap replaces it)
      document.body.setAttribute('data-toc-open', 'false')
      currentMain.innerHTML = newMain.innerHTML

      const currentPath = new URL(targetUrl, window.location.origin).pathname
      renderedPath = currentPath
      qsa('.nav-item').forEach((nav) => {
        const navPath = new URL(nav.getAttribute('href'), window.location.origin).pathname
        nav.classList.toggle('active', navPath === currentPath)
      })

      // Force an instant jump — html { scroll-behavior: smooth } would
      // otherwise animate the scroll across the page swap
      window.scrollTo({ top: restoreScroll ?? 0, behavior: 'instant' })

      currentMain.classList.remove('page-leaving')
      if (!reduced) {
        currentMain.classList.add('page-entering')
        window.setTimeout(() => currentMain.classList.remove('page-entering'), 450)
      }

      afterSwap()
      progress.done()
    } catch (err) {
      console.error('[spa] navigation failed:', err)
      progress.done()
      window.location.href = targetUrl
    } finally {
      navigating = false
    }
  }

  // Delegated click for SPA links
  document.addEventListener('click', (e) => {
    if (e.defaultPrevented) return
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
    if (!(e.target instanceof Element)) return
    const a = e.target.closest('a')
    if (!isSpaLink(a)) return
    e.preventDefault()

    const targetUrl = a.href
    if (targetUrl === window.location.href) {
      const currentPath = window.location.pathname
      let pageName = '当前页面'
      if (currentPath === '/blog/' || currentPath === '/blog') pageName = '主页'
      else if (currentPath.startsWith('/blog/archives')) pageName = '归档页'
      else if (currentPath.startsWith('/blog/tags')) pageName = '标签页'
      else if (currentPath.startsWith('/blog/changelog')) pageName = '更新日志页'
      showToast(`已经在${pageName}了`)
      return
    }
    spaNavigate(targetUrl)
  })

  // Hover / touch prefetch
  const onPrefetchIntent = (e) => {
    if (!(e.target instanceof Element)) return
    const a = e.target.closest('a')
    if (!isSpaLink(a)) return
    if (a.href === window.location.href) return
    prefetchPage(a.href)
  }
  document.addEventListener('mouseover', onPrefetchIntent, { passive: true })
  document.addEventListener('touchstart', onPrefetchIntent, { passive: true })

  // History back/forward
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual'
  window.addEventListener('popstate', (e) => {
    const scroll = e.state && typeof e.state.scroll === 'number' ? e.state.scroll : 0
    // Hash-only movement inside the current page (e.g. TOC anchors):
    // scroll there directly instead of re-rendering the page
    if (window.location.pathname === renderedPath) {
      const hash = window.location.hash.slice(1)
      const target = hash ? document.getElementById(decodeURIComponent(hash)) : null
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' })
      else window.scrollTo({ top: scroll, behavior: 'instant' })
      return
    }
    spaNavigate(window.location.href, { push: false, restoreScroll: scroll })
  })

  // ----------------------------------------
  // Initial boot
  // ----------------------------------------

  history.replaceState({ scroll: window.scrollY }, '', window.location.href)
  runPostEnhancements()
  initBackToTop()
})
