import fs from 'fs/promises'
import path from 'path'
import hljs from 'highlight.js'

const projectRoot = path.resolve(process.cwd())
const contentDir = path.join(projectRoot, 'content', 'posts')
const changelogDir = path.join(projectRoot, 'content', 'changelog')
const projectsDir = path.join(projectRoot, 'content', 'projects')
const blogDir = path.join(projectRoot, 'blog')

const BEIAN = {
  icpText: '蜀ICP备2026002494号-1',
  icpHref: 'https://beian.miit.gov.cn/',
  mpsText: '川公网安备51111102000146号',
  mpsHref: 'https://beian.mps.gov.cn/#/query/webSearch',
}

function parseSimpleFrontmatter(md) {
  const s = md.replace(/^\uFEFF/, '')
  const normalized = s.replace(/\r\n/g, '\n')
  if (!normalized.startsWith('---\n')) return { data: {}, body: s }
  const end = normalized.indexOf('\n---\n', 4)
  if (end === -1) return { data: {}, body: s }
  const raw = normalized.slice(4, end)
  const body = normalized.slice(end + 5)

  const data = {}
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const i = trimmed.indexOf(':')
    if (i === -1) continue
    const key = trimmed.slice(0, i).trim()
    const val = trimmed.slice(i + 1).trim()
    if (key) data[key] = val
  }
  return { data, body }
}

function parseChangelogMarkdown(md) {
  const { data, body } = parseSimpleFrontmatter(md)
  const version = data.version || data.v || ''
  const date = data.date || ''

  const items = []
  for (const line of body.split(/\r?\n/)) {
    const m = line.match(/^\s*[-*]\s+(.+)\s*$/)
    if (m) items.push(m[1])
  }

  return { version, date, items }
}

async function readChangelogEntries() {
  let files = []
  try {
    files = await fs.readdir(changelogDir)
  } catch {
    return []
  }

  const mdFiles = files.filter((f) => f.toLowerCase().endsWith('.md'))
  const entries = []
  for (const f of mdFiles) {
    const full = path.join(changelogDir, f)
    const md = await fs.readFile(full, 'utf8')
    const e = parseChangelogMarkdown(md)
    if (!e.version && !e.date && (!e.items || e.items.length === 0)) continue
    if (!e.version) e.version = f.replace(/\.[^.]+$/, '')
    entries.push(e)
  }

  entries.sort((a, b) => {
    const da = Date.parse((a.date || '').trim())
    const db = Date.parse((b.date || '').trim())
    const aHasDate = !Number.isNaN(da)
    const bHasDate = !Number.isNaN(db)

    const parseVer = (v) => {
      const m = String(v || '').match(/(\d+)(?:\.(\d+))?(?:\.(\d+))?/) 
      if (!m) return null
      return [Number(m[1] || 0), Number(m[2] || 0), Number(m[3] || 0)]
    }

    const cmpVerDesc = () => {
      const va = parseVer(a.version)
      const vb = parseVer(b.version)
      if (va && vb) {
        if (vb[0] !== va[0]) return vb[0] - va[0]
        if (vb[1] !== va[1]) return vb[1] - va[1]
        if (vb[2] !== va[2]) return vb[2] - va[2]
      }
      return String(b.version).localeCompare(String(a.version))
    }

    if (aHasDate && bHasDate) {
      if (db !== da) return db - da
      return cmpVerDesc()
    }
    // Entries with valid date should be shown before entries without date.
    if (aHasDate !== bHasDate) return aHasDate ? -1 : 1
    // Both missing/invalid date: sort by version.
    return cmpVerDesc()
  })
  return entries
}

function renderChangelogPage(posts, entries) {

  const list = Array.isArray(entries) ? entries : []
  const timeline = list
    .map((e, idx) => {
      const items = (e.items || []).map((it) => `<li>${escapeHtml(it)}</li>`).join('')
      return `
        <div class="changelog-item" style="--i:${idx}">
          <div class="changelog-dot"></div>
          <div class="changelog-card">
            <div class="changelog-head">
              <div class="changelog-version">${escapeHtml(e.version)}</div>
              <div class="changelog-date">${escapeHtml(e.date)}</div>
            </div>
            <ul class="changelog-list">${items}</ul>
          </div>
        </div>
      `
    })
    .join('\n')

  return renderShell({
    title: "Changelog",
    pageKind: "changelog",
    activeKey: "changelog",
    extraCss: "/blog/changelog.css",
    posts,
    topbar: `
      <a class="back" href="/blog/" aria-label="返回">${ICONS.back}</a>
        <div class="brand">
          <h1>Changelog()</h1>
        </div>
    `,
    content: `
      <section class="content">
        <div class="changelog-wrap">
          <div class="changelog-line"></div>
          <div class="changelog-timeline">
            ${timeline || '<div class="empty">暂无更新</div>'}
          </div>
        </div>
      </section>
    `,
  })
}

const ICONS = {
  home: '<svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M883.2 277.333333l-264.533333-183.466666C546.133333 42.666667 435.2 42.666667 366.933333 98.133333L136.533333 277.333333c-46.933333 34.133333-81.066667 106.666667-81.066666 166.4v315.733334c0 115.2 93.866667 213.333333 213.333333 213.333333h494.933333c115.2 0 213.333333-93.866667 213.333334-213.333333v-311.466667c-4.266667-59.733333-42.666667-136.533333-93.866667-170.666667z m21.333333 482.133334c0 38.4-12.8 72.533333-42.666666 102.4s-59.733333 42.666667-102.4 42.666666H268.8c-38.4 0-72.533333-12.8-102.4-42.666666s-42.666667-64-42.666667-102.4v-315.733334c0-46.933333 17.066667-85.333333 55.466667-110.933333l230.4-179.2c21.333333-17.066667 51.2-25.6 85.333333-25.6s64 8.533333 85.333334 25.6l264.533333 183.466667c42.666667 29.866667 59.733333 68.266667 59.733333 115.2v307.2z" fill="currentColor"></path><path d="M486.4 789.333333v-170.666666c0-17.066667 17.066667-34.133333 34.133333-34.133334s34.133333 17.066667 34.133334 34.133334v170.666666c0 17.066667-17.066667 34.133333-34.133334 34.133334s-34.133333-17.066667-34.133333-34.133334z" fill="currentColor"></path></svg>',
  archives: '<svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M934.4 260.266667l-396.8-145.066667c-17.066667-8.533333-38.4-8.533333-59.733333 0L81.066667 260.266667c-51.2 21.333333-51.2 93.866667 0 110.933333l396.8 145.066667c17.066667 8.533333 38.4 8.533333 59.733333 0l396.8-145.066667c51.2-17.066667 51.2-93.866667 0-110.933333zM512 452.266667h-12.8L128 315.733333l375.466667-136.533333h12.8l375.466666 136.533333-379.733333 136.533334z" fill="currentColor"></path><path d="M72.533333 499.2c-4.266667 0-8.533333-4.266667-12.8-4.266667-17.066667 0-34.133333 17.066667-34.133333 34.133334 0 12.8 8.533333 25.6 21.333333 29.866666l418.133334 157.866667c29.866667 12.8 55.466667 12.8 85.333333 0l418.133333-157.866667c12.8-4.266667 21.333333-17.066667 21.333334-29.866666 0-17.066667-17.066667-34.133333-34.133334-34.133334-4.266667 0-8.533333 0-12.8 4.266667l-418.133333 157.866667c-12.8 4.266667-25.6 4.266667-38.4 0l-413.866667-157.866667z" fill="currentColor"></path><path d="M72.533333 712.533333c-4.266667 0-8.533333-4.266667-12.8-4.266666-17.066667 0-34.133333 17.066667-34.133333 34.133333 0 12.8 8.533333 25.6 21.333333 29.866667l418.133334 157.866666c29.866667 12.8 55.466667 12.8 85.333333 0l418.133333-157.866666c12.8-4.266667 21.333333-17.066667 21.333334-29.866667 0-17.066667-17.066667-34.133333-34.133334-34.133333-4.266667 0-8.533333 0-12.8 4.266666l-418.133333 157.866667c-12.8 4.266667-25.6 4.266667-38.4 0l-413.866667-157.866667z" fill="currentColor"></path></svg>',
  tag: '<svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M461.397333 149.461333q-62.293333 25.173333-110.08 73.002667l-180.906666 180.906667q-41.685333 41.728-63.658667 95.957333-21.205333 52.352-21.205333 109.141333 0 56.832 21.205333 109.226667 21.973333 54.314667 63.616 96.170667 9.984 9.984 24.106667 10.026666 14.165333 0 24.149333-9.941333 10.026667-9.984 10.069333-24.106667 0-14.165333-9.941333-24.149333-31.914667-32.042667-48.725333-73.6-16.213333-40.106667-16.213334-83.626667 0-43.434667 16.213334-83.498666 16.810667-41.429333 48.64-73.301334l180.906666-180.906666q38.016-37.973333 87.466667-58.026667 47.786667-19.328 99.626667-19.328 51.797333 0 99.584 19.328 49.493333 20.053333 87.466666 58.026667 37.973333 37.973333 58.026667 87.466666 19.328 47.786667 19.328 99.584 0 51.84-19.328 99.584-20.053333 49.493333-58.026667 87.466667l-165.973333 165.973333q-33.834667 33.877333-81.493333 33.877334-47.573333 0-81.408-33.877334-33.877333-33.834667-33.877334-81.450666t33.877334-81.493334l105.386666-105.386666q9.984-9.984 9.984-24.106667 0-14.122667-9.984-24.149333-10.026667-9.984-24.149333-9.984-14.122667 0-24.149333 9.984l-105.386667 105.386666q-26.453333 26.453333-40.362667 60.757334-13.482667 33.109333-13.482666 68.992t13.482666 68.992q13.909333 34.304 40.362667 60.757333 26.453333 26.453333 60.757333 40.362667 33.109333 13.482667 68.992 13.482666 35.84 0 68.992-13.482666 34.304-13.909333 60.757334-40.362667l165.973333-165.973333q47.786667-47.786667 72.96-110.08 24.362667-60.074667 24.362667-125.269334t-24.32-125.269333q-25.173333-62.250667-73.002667-110.08-47.829333-47.786667-110.08-72.96-60.117333-24.362667-125.269333-24.362667-65.194667 0-125.269334 24.32z" fill="currentColor"></path></svg>',
  search: '<svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M469.333333 42.666667C234.666667 42.666667 42.666667 234.666667 42.666667 469.333333s192 426.666667 426.666666 426.666667 426.666667-192 426.666667-426.666667S704 42.666667 469.333333 42.666667z m251.733334 678.4c-68.266667 68.266667-153.6 106.666667-251.733334 106.666666s-183.466667-34.133333-251.733333-106.666666c-68.266667-68.266667-106.666667-153.6-106.666667-251.733334s34.133333-183.466667 106.666667-251.733333C285.866667 145.066667 371.2 110.933333 469.333333 110.933333s183.466667 34.133333 251.733334 106.666667c68.266667 68.266667 106.666667 153.6 106.666666 251.733333s-34.133333 183.466667-106.666666 251.733334zM878.933333 785.066667l89.6 89.6c12.8 12.8 12.8 34.133333 0 46.933333-12.8 12.8-34.133333 12.8-46.933333 0l-89.6-89.6c-12.8-12.8-12.8-34.133333 0-46.933333s34.133333-12.8 46.933333 0z" fill="currentColor"></path></svg>',
  nav: '<svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M287.018667 602.752l100.693333 33.578667 33.536 100.650666c22.826667 68.608 50.176 122.794667 81.322667 160.554667 31.061333 37.632 69.205333 62.464 112.682666 62.464 43.52 0 81.621333-24.832 112.682667-62.464 31.146667-37.76 58.496-91.946667 81.365333-160.597333l131.584-394.837334 0.042667-0.085333c31.061333-93.952 25.088-179.029333-27.434667-231.637333-52.608-52.650667-137.6-58.624-231.594666-27.306667L286.976 214.784c-68.608 22.954667-122.794667 50.346667-160.512 81.493333-37.632 31.104-62.464 69.205333-62.464 112.64 0 43.52 24.874667 81.578667 62.464 112.64 37.76 31.104 91.946667 58.410667 160.554667 81.237334z m589.098666-282.154667l-131.584 394.752q-30.592 91.946667-69.248 138.709334-31.104 37.674667-60.032 37.674666t-60.032-37.674666q-38.613333-46.762667-69.205333-138.666667l-28.714667-86.058667 173.909334-156.586666a34.133333 34.133333 0 0 0-45.653334-50.773334l-168.874666 152.064-108.074667-36.053333q-91.904-30.592-138.666667-69.12Q132.266667 437.76 132.266667 408.874667t37.674666-60.032Q216.746667 310.229333 308.650667 279.466667l394.837333-131.584q113.237333-37.76 161.706667 10.752 48.426667 48.512 10.922666 161.962666z" fill="currentColor"></path></svg>',
  back: '<svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M269.704 127.864a30 30 0 0 1 42.428 42.428L172.424 310H696c144.696 0 261.996 117.3 262 262 0 144.696-117.304 262-262 262H318a30 30 0 0 1 0-60H696c111.56 0 202-90.44 202-202-0.004-111.564-90.44-202-202-202H172.424l139.708 139.704a30 30 0 0 1-42.428 42.428l-190.92-190.92a30.004 30.004 0 0 1 0-42.428l190.92-190.92z" fill="currentColor"></path></svg>',
  github: '<svg viewBox="0 0 1049 1024" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M524.979332 0C234.676191 0 0 234.676191 0 524.979332c0 232.068678 150.366597 428.501342 358.967656 498.035028 26.075132 5.215026 35.636014-11.299224 35.636014-25.205961 0-12.168395-0.869171-53.888607-0.869171-97.347161-146.020741 31.290159-176.441729-62.580318-176.441729-62.580318-23.467619-60.841976-58.234462-76.487055-58.234463-76.487055-47.804409-32.15933 3.476684-32.15933 3.476685-32.15933 53.019436 3.476684 80.83291 53.888607 80.83291 53.888607 46.935238 79.963739 122.553122 57.365291 152.97411 43.458554 4.345855-33.897672 18.252593-57.365291 33.028501-70.402857-116.468925-12.168395-239.022047-57.365291-239.022047-259.012982 0-57.365291 20.860106-104.300529 53.888607-140.805715-5.215026-13.037566-23.467619-66.926173 5.215027-139.067372 0 0 44.327725-13.906737 144.282399 53.888607 41.720212-11.299224 86.917108-17.383422 131.244833-17.383422s89.524621 6.084198 131.244833 17.383422C756.178839 203.386032 800.506564 217.29277 800.506564 217.29277c28.682646 72.1412 10.430053 126.029806 5.215026 139.067372 33.897672 36.505185 53.888607 83.440424 53.888607 140.805715 0 201.64769-122.553122 245.975415-239.891218 259.012982 19.121764 16.514251 35.636014 47.804409 35.636015 97.347161 0 70.402857-0.869171 126.898978-0.869172 144.282399 0 13.906737 9.560882 30.420988 35.636015 25.205961 208.601059-69.533686 358.967656-265.96635 358.967655-498.035028C1049.958663 234.676191 814.413301 0 524.979332 0z" fill="currentColor"></path></svg>',
  email: '<svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M893.421013 263.914762c-1.982144 16.412808-9.237385 32.210609-21.676695 44.729737L581.597101 598.791715c-29.696346 29.696346-78.243015 29.696346-107.939361 0L183.510524 308.644499c-12.519128-12.519128-19.770276-28.396747-21.676695-44.729737-0.38374 3.130294-0.611937 6.259564-0.611937 9.465582l0 396.939451c0 41.983183 34.348296 76.335572 76.336596 76.335572l580.14196 0c41.980113 0 76.332503-34.352389 76.332503-76.335572L894.03295 273.380344C894.03295 270.174326 893.804752 267.045055 893.421013 263.914762L893.421013 263.914762 893.421013 263.914762zM581.597101 543.222095l304.193117-304.19414c-12.598946-24.883737-38.473243-41.983183-68.089771-41.983183L237.558487 197.044772c-29.616528 0-55.499012 17.099447-68.089771 41.983183L473.65774 543.222095C503.349993 572.917418 551.900755 572.917418 581.597101 543.222095L581.597101 543.222095 581.597101 543.222095z" fill="currentColor"></path></svg>',
  qq: '<svg viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M824.8 613.2c-16-51.4-34.4-94.6-62.7-165.3C766.5 262.2 689.3 112 511.5 112 331.7 112 256.2 265.2 261 447.9c-28.4 70.8-46.7 113.7-62.7 165.3-34 109.5-23 154.8-14.6 155.8 18 2.2 70.1-82.4 70.1-82.4 0 49 25.2 112.9 79.8 159-26.4 8.1-85.7 29.9-71.6 53.8 11.4 19.3 196.2 12.3 249.5 6.3 53.3 6 238.1 13 249.5-6.3 14.1-23.8-45.3-45.7-71.6-53.8 54.6-46.2 79.8-110.1 79.8-159 0 0 52.1 84.6 70.1 82.4 8.5-1.1 19.5-46.4-14.5-155.8z" fill="currentColor"></path></svg>',
  palette: '<svg t="1773046739790" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M608 384a64 64 0 1 0 0-128 64 64 0 0 0 0 128zM416 384a64 64 0 1 1-128 0 64 64 0 0 1 128 0zM384 704a64 64 0 1 0 0-128 64 64 0 0 0 0 128z" fill="currentColor"></path><path d="M64 512a448 448 0 0 1 896 0c0 40.384-17.792 69.12-45.632 87.872-25.152 17.024-57.536 25.152-86.656 31.104-10.688 2.176-21.056 4.096-31.04 5.952-19.712 3.584-38.336 7.04-56.832 12.032-27.328 7.424-47.872 16.704-61.568 30.08-7.744 7.424-14.272 17.664-19.968 30.72a200 200 0 0 0-9.792 28.096 400.64 400.64 0 0 0-4.48 17.344c-3.2 13.184-5.824 26.688-8.576 40.64l-0.064 0.384-0.192 0.96-0.32 1.664-3.264 16.256-2.24 10.752c-6.272 29.44-14.72 62.016-31.168 87.296-18.112 27.84-46.08 46.848-86.208 46.848a448 448 0 0 1-448-448z m448-384a384 384 0 1 0 0 768 34.56 34.56 0 0 0 32.576-17.792c9.344-14.336 15.936-36.224 22.208-65.728 1.728-7.936 3.392-16.576 5.12-25.472 4.288-21.632 8.96-45.312 15.04-66.688 8.704-30.72 21.952-63.296 46.784-87.296 25.344-24.512 58.368-37.44 89.408-45.824 20.992-5.696 44.16-9.984 65.28-13.888 9.408-1.728 18.304-3.328 26.496-5.056 29.056-5.888 50.048-12.224 63.68-21.44a44.16 44.16 0 0 0 8.896-7.68 32.192 32.192 0 0 0 4.352-6.4A44.864 44.864 0 0 0 896 512a384 384 0 0 0-384-384z" fill="currentColor"></path></svg>',
  projects: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M4 7.5A2.5 2.5 0 0 1 6.5 5h3l2 2.5h6A2.5 2.5 0 0 1 20 10v6.5a2.5 2.5 0 0 1-2.5 2.5h-11A2.5 2.5 0 0 1 4 16.5v-9Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/></svg>',
  games: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M7.5 8h9a4.5 4.5 0 0 1 4.44 3.77l.55 3.3A2.6 2.6 0 0 1 18.93 18a2.6 2.6 0 0 1-2.02-.96L15.8 15.7a1.5 1.5 0 0 0-1.15-.55H9.35a1.5 1.5 0 0 0-1.15.55l-1.11 1.34A2.6 2.6 0 0 1 5.07 18a2.6 2.6 0 0 1-2.56-2.93l.55-3.3A4.5 4.5 0 0 1 7.5 8Z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="M7.4 11v2.2M6.3 12.1h2.2M15.4 11.6h.01M17.2 13.1h.01" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>',
  link: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M10.6 13.4a3.5 3.5 0 0 0 5 0l3-3a3.54 3.54 0 0 0-5-5l-1.4 1.4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M13.4 10.6a3.5 3.5 0 0 0-5 0l-3 3a3.54 3.54 0 0 0 5 5l1.4-1.4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
  changelog: '<svg t="1772501785743" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M704 416H320a32 32 0 0 0 0 64h384a32 32 0 0 0 0-64z m0 192H320a32 32 0 0 0 0 64h384a32 32 0 0 0 0-64z" fill="currentColor"></path><path d="M832 32H192c-52.928 0-96 43.072-96 96v768c0 52.928 43.072 96 96 96h640c52.928 0 96-43.072 96-96V128c0-52.928-43.072-96-96-96zM320 96h384v96H320V96z m544 800a32 32 0 0 1-32 32H192c-17.632 0-32-14.336-32-32V128c0-17.632 14.368-32 32-32h64v96c0 35.296 28.704 64 64 64h384c35.296 0 64-28.704 64-64V96h64c17.664 0 32 14.368 32 32v768z" fill="currentColor"></path></svg>',
}

// Restores the saved theme before first paint, so the page never flashes
// default colors. Runs in <head>, where document.body does not exist yet —
// every attribute goes on the root element and CSS matches :root[data-theme-mode].
const THEME_BOOT_SCRIPT = `  <script>
    (function () {
      var root = document.documentElement
      try {
        var scheme = localStorage.getItem('blog-theme-scheme') || 'auto'
        var dark =
          scheme === 'dark' ||
          (scheme === 'auto' &&
            window.matchMedia &&
            window.matchMedia('(prefers-color-scheme: dark)').matches)
        if (dark) root.setAttribute('data-scheme', 'dark')
      } catch (e) {}
      try {
        var bg = JSON.parse(localStorage.getItem('blog-theme-bg') || 'null')
        if (bg) {
          if (typeof bg.panelAlpha === 'number') {
            root.style.setProperty('--panel-alpha', bg.panelAlpha)
          }
          if (bg.mode === 'image' && bg.image) {
            root.style.setProperty('--bg-image', 'url("' + bg.image + '")')
            root.style.setProperty('--bg-blur', (bg.blur || 0) + 'px')
            root.style.setProperty('--bg-opacity', bg.opacity == null ? 1 : bg.opacity)
            root.setAttribute('data-theme-mode', bg.imageOnly ? 'image-only' : 'image')
          } else if (bg.mode === 'color') {
            root.setAttribute('data-theme-mode', 'color')
          }
        }
      } catch (e) {}
      try {
        var t = JSON.parse(localStorage.getItem('blog-theme-hsl') || 'null')
        if (t && typeof t.h === 'number') {
          root.style.setProperty('--theme-h', String(Math.round(t.h)))
          root.style.setProperty('--theme-s', Math.round(t.s) + '%')
          root.style.setProperty('--theme-l', Math.round(t.l) + '%')
          root.style.setProperty('--theme-color', 'hsl(' + Math.round(t.h) + ',' + Math.round(t.s) + '%,' + Math.round(t.l) + '%)')
        }
      } catch (e) {}
    })()
  </script>`

// Small inline icons used in post meta rows
const MINI_ICONS = {
  calendar: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="3" stroke="currentColor" stroke-width="1.8"/><path d="M3 9.5h18M8 3v4M16 3v4" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
  clock: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="1.8"/><path d="M12 7.5V12l3 2" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  words: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M5 6h14M5 12h14M5 18h9" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
  arrowRight: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M5 12h14m0 0-6-6m6 6-6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  arrowLeft: '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M19 12H5m0 0 6-6m-6 6 6 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
}

// Page Loader HTML - shown on initial load and page transitions
const PAGE_LOADER_HTML = `
  <div class="page-loader">
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
        <path stroke-linejoin="round" stroke-linecap="round" stroke-width="8" stroke="url(#b)" d="M 54.722656,3.9726563 A 2.0002,2.0002 0 0 0 54.941406,4 h 5.007813 C 58.955121,17.046124 49.099667,27.677057 36.121094,29.580078 a 2.0002,2.0002 0 0 0 -1.708985,1.978516 V 60 H 29.587891 V 31.558594 A 2.0002,2.0002 0 0 0 27.878906,29.580078 C 14.900333,27.677057 5.0448787,17.046124 4.0507812,4 H 9.28125 c 1.231666,11.63657 10.984383,20.554048 22.6875,20.734375 a 2.0002,2.0002 0 0 0 0.02344,0 c 11.806958,0.04283 21.70649,-9.003371 22.730469-20.7617187 z" class="dash" id="y" pathLength="360"></path>
      </svg>
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" style="--rotation-duration:0ms; --rotation-direction:normal;" viewBox="0 0 64 64" height="64" width="64" class="inline-block">
        <path stroke-linejoin="round" stroke-linecap="round" stroke-width="10" stroke="url(#c)" d="M 32 32 m 0 -27 a 27 27 0 1 1 0 54 a 27 27 0 1 1 0 -54" class="spin" id="o" pathLength="360"></path>
      </svg>
      <div class="w-2"></div>
      <svg xmlns="http://www.w3.org/2000/svg" fill="none" style="--rotation-duration:0ms; --rotation-direction:normal;" viewBox="0 0 64 64" height="64" width="64" class="inline-block">
        <path stroke-linejoin="round" stroke-linecap="round" stroke-width="8" stroke="url(#d)" d="M 4,4 h 4.6230469 v 25.919922 c -0.00276,11.916203 9.8364941,21.550422 21.7500001,21.296875 11.616666,-0.240651 21.014356,-9.63894 21.253906,-21.25586 a 2.0002,2.0002 0 0 0 0,-0.04102 V 4 H 56.25 v 25.919922 c 0,14.33873 -11.581192,25.919922 -25.919922,25.919922 a 2.0002,2.0002 0 0 0 -0.0293,0 C 15.812309,56.052941 3.998433,44.409961 4,29.919922 Z" class="dash" id="u" pathLength="360"></path>
      </svg>
    </div>
  </div>`

function getUniqueTagCount(posts) {
  const set = new Set()
  for (const p of posts) {
    for (const t of p.tags || []) {
      const tag = String(t).trim()
      if (tag) set.add(tag)
    }
  }
  return set.size
}

function renderSidebarWithStats(activeKey, posts) {
  const html = renderSidebar(activeKey)
  return html
    .replace('{{POST_COUNT}}', String(posts.length))
    .replace('{{TAG_COUNT}}', String(getUniqueTagCount(posts)))
}

function slugify(input) {
  return input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\u4e00-\u9fa5\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}

function escapeHtml(s) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function applyInline(text) {
  // Protect inline code spans from further formatting
  const codeSpans = []
  let out = text.replace(/`([^`]+)`/g, (m, code) => {
    codeSpans.push(`<code>${escapeHtml(code)}</code>`)
    return `\u0000${codeSpans.length - 1}\u0000`
  })

  // Images ![alt](src)
  out = out.replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+"([^"]*)")?\)/g, (m, alt, src, title) => {
    const t = title ? ` title="${escapeHtml(title)}"` : ''
    return `<img src="${src}" alt="${escapeHtml(alt)}"${t} loading="lazy" decoding="async" />`
  })

  // Links [text](href) — external links open in a new tab
  out = out.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (m, label, href) => {
    const external = /^https?:\/\//.test(href) && !href.startsWith('https://riordon.xyz')
    const attrs = external ? ' target="_blank" rel="noopener noreferrer"' : ''
    return `<a href="${href}"${attrs}>${label}</a>`
  })

  // Bold / Italic / Strikethrough
  out = out.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  out = out.replace(/\*([^*]+)\*/g, '<em>$1</em>')
  out = out.replace(/~~([^~]+)~~/g, '<del>$1</del>')

  // Restore code spans
  out = out.replace(/\u0000(\d+)\u0000/g, (m, i) => codeSpans[Number(i)])
  return out
}

function mdToHtml(md) {
  // Line-based markdown converter: headings(+ids), fenced code(+lang),
  // blockquotes, lists, tables, hr, images, raw HTML passthrough.
  const lines = md.replace(/\r\n/g, '\n').split('\n')
  const html = []
  const usedIds = new Map()

  const headingId = (text) => {
    const base =
      slugify(text.replace(/<[^>]+>/g, '')) || 'section'
    const n = (usedIds.get(base) || 0) + 1
    usedIds.set(base, n)
    return n === 1 ? base : `${base}-${n}`
  }

  let i = 0
  while (i < lines.length) {
    const line = lines[i]

    // Blank line
    if (!line.trim()) {
      i++
      continue
    }

    // Fenced code block — a fence of N backticks closes only on a
    // fence of >= N backticks, so tutorials can nest ``` inside ````
    const fence = line.match(/^(`{3,})(.*)$/)
    if (fence) {
      const fenceLen = fence[1].length
      const lang = (fence[2].trim().split(/\s+/)[0] || '').replace(/`/g, '')
      const code = []
      i++
      while (i < lines.length) {
        const closing = lines[i].match(/^(`{3,})\s*$/)
        if (closing && closing[1].length >= fenceLen) break
        code.push(lines[i])
        i++
      }
      i++ // skip closing fence
      const source = code.join('\n')

      // Syntax highlighting happens here, at generation time, so the
      // browser ships zero highlighting JS.
      let highlighted = escapeHtml(source)
      let resolvedLang = lang
      try {
        if (lang && hljs.getLanguage(lang)) {
          highlighted = hljs.highlight(source, { language: lang, ignoreIllegals: true }).value
        } else if (!lang) {
          // Auto-detection colors the block but never labels it —
          // a confidently wrong language name is worse than none.
          const auto = hljs.highlightAuto(source)
          if (auto.relevance > 6) highlighted = auto.value
        }
      } catch {
        /* fall back to the escaped source */
      }

      const langAttr = resolvedLang ? ` data-lang="${escapeHtml(resolvedLang)}"` : ''
      const langClass = resolvedLang ? ` class="hljs language-${escapeHtml(resolvedLang)}"` : ' class="hljs"'
      html.push(
        `<div class="code-block"${langAttr}><pre><code${langClass}>${highlighted}</code></pre></div>`
      )
      continue
    }

    // Heading
    const heading = line.match(/^(#{1,4})\s+(.+)$/)
    if (heading) {
      const level = heading[1].length
      const content = applyInline(heading[2].trim())
      const id = headingId(heading[2].trim())
      html.push(`<h${level} id="${id}">${content}</h${level}>`)
      i++
      continue
    }

    // Horizontal rule
    if (/^\s*(-{3,}|\*{3,}|_{3,})\s*$/.test(line)) {
      html.push('<hr />')
      i++
      continue
    }

    // Blockquote (consume consecutive > lines)
    if (/^\s*>/.test(line)) {
      const quote = []
      while (i < lines.length && /^\s*>/.test(lines[i])) {
        quote.push(lines[i].replace(/^\s*>\s?/, ''))
        i++
      }
      html.push(`<blockquote>${mdToHtml(quote.join('\n'))}</blockquote>`)
      continue
    }

    // Table: header row + separator row
    if (
      line.includes('|') &&
      i + 1 < lines.length &&
      /^\s*\|?[\s:|-]+\|[\s:|-]*$/.test(lines[i + 1]) &&
      lines[i + 1].includes('-')
    ) {
      const parseRow = (row) =>
        row
          .trim()
          .replace(/^\|/, '')
          .replace(/\|$/, '')
          .split('|')
          .map((c) => applyInline(c.trim()))
      const headCells = parseRow(line)
      i += 2
      const bodyRows = []
      while (i < lines.length && lines[i].includes('|') && lines[i].trim()) {
        bodyRows.push(parseRow(lines[i]))
        i++
      }
      const thead = `<thead><tr>${headCells.map((c) => `<th>${c}</th>`).join('')}</tr></thead>`
      const tbody = bodyRows.length
        ? `<tbody>${bodyRows.map((r) => `<tr>${r.map((c) => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody>`
        : ''
      html.push(`<div class="table-wrap"><table>${thead}${tbody}</table></div>`)
      continue
    }

    // Unordered list
    if (/^\s*[-*+]\s+/.test(line)) {
      const items = []
      while (i < lines.length && /^\s*[-*+]\s+/.test(lines[i])) {
        items.push(applyInline(lines[i].replace(/^\s*[-*+]\s+/, '')))
        i++
      }
      html.push(`<ul>${items.map((it) => `<li>${it}</li>`).join('')}</ul>`)
      continue
    }

    // Ordered list
    if (/^\s*\d+[.)]\s+/.test(line)) {
      const items = []
      while (i < lines.length && /^\s*\d+[.)]\s+/.test(lines[i])) {
        items.push(applyInline(lines[i].replace(/^\s*\d+[.)]\s+/, '')))
        i++
      }
      html.push(`<ol>${items.map((it) => `<li>${it}</li>`).join('')}</ol>`)
      continue
    }

    // Raw HTML block: pass through until blank line
    if (/^\s*</.test(line)) {
      const raw = []
      while (i < lines.length && lines[i].trim()) {
        raw.push(lines[i])
        i++
      }
      // Ensure inline images are lazy-loaded
      html.push(
        raw
          .join('\n')
          .replace(/<img(?![^>]*loading=)/g, '<img loading="lazy" decoding="async"')
      )
      continue
    }

    // Paragraph: always consume the current line, then continue
    // until a blank line or the start of another block
    const para = [line]
    i++
    while (
      i < lines.length &&
      lines[i].trim() &&
      !/^(#{1,4}\s|```|\s*>|\s*[-*+]\s|\s*\d+[.)]\s|\s*<)/.test(lines[i])
    ) {
      para.push(lines[i])
      i++
    }
    html.push(`<p>${applyInline(para.join('\n')).replace(/\n/g, '<br/>')}</p>`)
  }

  return html.join('\n')
}

function stripToPlainText(md) {
  return md
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/<[^>]+>/g, ' ')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/[*_~>#|-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function countWords(plain) {
  // CJK characters count individually; latin words count by whitespace
  const cjk = (plain.match(/[一-龥぀-ヿ]/g) || []).length
  const latin = plain
    .replace(/[一-龥぀-ヿ]/g, ' ')
    .split(/\s+/)
    .filter(Boolean).length
  return cjk + latin
}

function readingMinutes(words) {
  return Math.max(1, Math.round(words / 350))
}

function parseFrontmatter(raw) {
  // Very small subset of YAML frontmatter.
  // ---
  // title: xxx
  // date: 2025-05-05
  // tags: [a, b]
  // ---
  if (!raw.startsWith('---')) {
    return { data: {}, body: raw }
  }

  const end = raw.indexOf('\n---', 3)
  if (end === -1) {
    return { data: {}, body: raw }
  }

  const head = raw.slice(3, end).trim()
  const body = raw.slice(end + '\n---'.length).replace(/^\s*\n/, '')
  const data = {}

  const headLines = head.split(/\r?\n/)
  for (let li = 0; li < headLines.length; li++) {
    const line = headLines[li]
    const m = /^([A-Za-z0-9_-]+)\s*:\s*(.*)$/.exec(line)
    if (!m) continue
    const key = m[1]
    let value = m[2].trim()
    if (value.startsWith('[') && value.endsWith(']')) {
      value = value
        .slice(1, -1)
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    } else if (value === '') {
      // Multi-line YAML list:  tags:\n  - a\n  - b
      const listItems = []
      while (li + 1 < headLines.length && /^\s+-\s+/.test(headLines[li + 1])) {
        listItems.push(headLines[li + 1].replace(/^\s+-\s+/, '').trim())
        li++
      }
      if (listItems.length) value = listItems
    }
    data[key] = value
  }

  return { data, body }
}

function parseDate(input) {
  if (!input) return null
  const d = new Date(input)
  if (Number.isNaN(d.getTime())) return null
  return d
}

function formatDate(d) {
  return d.toISOString().slice(0, 10)
}

function renderSidebar(activeKey) {
  return `
    <aside class="sidebar" data-open="false">
      <div class="profile">
        <div class="avatar"><img src="/avatar.jpg" alt="avatar" /></div>
        <div class="name">Riordon-v1.2</div>
      </div>
      <div class="quick-actions">
        <a class="qa" href="https://github.com/Riordon666" target="_blank" aria-label="GitHub">${ICONS.github}</a>
        <a class="qa" href="#" aria-label="Email" data-copy-text="admin@riordon.xyz" data-copy-toast="已复制邮箱">${ICONS.email}</a>
        <a class="qa" href="#" aria-label="QQ" data-copy-text="2717831140">${ICONS.qq}</a>
      </div>
      <div class="stats">
        <div class="stat">
          <div class="stat-value">{{POST_COUNT}}</div>
          <div class="stat-label">文章</div>
        </div>
        <div class="stat">
          <div class="stat-value">{{TAG_COUNT}}</div>
          <div class="stat-label">标签</div>
        </div>
      </div>
      <nav class="nav">
        <a class="nav-item ${activeKey === 'home' ? 'active' : ''}" href="/blog/" data-short="主">
          <span class="nav-icon svg-icon">${ICONS.home}</span>
          <span class="nav-text">主 页</span>
        </a>
        <a class="nav-item ${activeKey === 'projects' ? 'active' : ''}" href="/blog/projects/" data-short="项">
          <span class="nav-icon svg-icon">${ICONS.projects}</span>
          <span class="nav-text">项 目</span>
        </a>
        <a class="nav-item ${activeKey === 'games' ? 'active' : ''}" href="/blog/games/" data-short="玩">
          <span class="nav-icon svg-icon">${ICONS.games}</span>
          <span class="nav-text">小游戏</span>
        </a>
        <a class="nav-item ${activeKey === 'archives' ? 'active' : ''}" href="/blog/archives/" data-short="档">
          <span class="nav-icon svg-icon">${ICONS.archives}</span>
          <span class="nav-text">归 档</span>
        </a>
        <a class="nav-item ${activeKey === 'tags' ? 'active' : ''}" href="/blog/tags/" data-short="签">
          <span class="nav-icon svg-icon">${ICONS.tag}</span>
          <span class="nav-text">标 签</span>
        </a>
        <a class="nav-item ${activeKey === 'changelog' ? 'active' : ''}" href="/blog/changelog/" data-short="更">
          <span class="nav-icon svg-icon">${ICONS.changelog}</span>
          <span class="nav-text">更新日志</span>
        </a>
        <button class="palette-btn" type="button" aria-label="调色盘">
          <span class="nav-icon svg-icon">${ICONS.palette}</span>
          <span class="nav-text">调色盘</span>
        </button>
        <a class="nav-item" href="/" data-short="导">
          <span class="nav-icon svg-icon">${ICONS.nav}</span>
          <span class="nav-text">导 航</span>
        </a>
      </nav>
      <div class="sidebar-footer">
        <div class="copyright">© 2026 Riordon. All rights reserved.</div>
        <a target="_blank" href="${BEIAN.icpHref}">
          <svg class="beian-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><rect x="4" y="3" width="16" height="18" rx="2.5" stroke="currentColor" stroke-width="1.8"/><path d="M8.5 8h7M8.5 12h7M8.5 16h4.5" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
          <span>${BEIAN.icpText}</span>
        </a>
        <a target="_blank" href="${BEIAN.mpsHref}">
          <svg class="beian-icon" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M12 3 5 5.6v5.3c0 4.4 2.9 8.4 7 9.6 4.1-1.2 7-5.2 7-9.6V5.6L12 3Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round"/><path d="m9.2 11.8 2 2 3.6-3.9" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>
          <span>${BEIAN.mpsText}</span>
        </a>
      </div>
    </aside>
  `
}

async function readPosts() {
  let entries = []
  try {
    entries = await fs.readdir(contentDir, { withFileTypes: true })
  } catch {
    return []
  }

  const posts = []
  for (const ent of entries) {
    if (!ent.isFile()) continue
    if (!ent.name.endsWith('.md')) continue

    const full = path.join(contentDir, ent.name)
    const raw = await fs.readFile(full, 'utf8')

    const { data: fm, body } = parseFrontmatter(raw)

    const lines = body.split(/\r?\n/)
    let title = null
    for (const line of lines) {
      const m = /^#\s+(.+)$/.exec(line)
      if (m) {
        title = m[1].trim()
        break
      }
    }
    title = (typeof fm.title === 'string' && fm.title.trim()) || title || ent.name.replace(/\.md$/, '')

    const stat = await fs.stat(full)
    const date = parseDate(fm.date) || stat.mtime
    const fileSlug = slugify(ent.name.replace(/\.md$/, ''))
    const slug = (typeof fm.slug === 'string' && fm.slug.trim()) ? slugify(fm.slug) : fileSlug
    const tags = Array.isArray(fm.tags) ? fm.tags : []

    const excerpt = lines
      .filter((l) => l.trim() && !l.startsWith('#') && !/^\s*</.test(l))
      .slice(0, 2)
      .join(' ')
      .replace(/[*_`[\]()>#]/g, '')
      .slice(0, 160)

    const plain = stripToPlainText(body)
    const words = countWords(plain)

    posts.push({
      title,
      date,
      slug,
      tags,
      body,
      raw,
      excerpt,
      plain,
      words,
      minutes: readingMinutes(words),
      cover: typeof fm.cover === 'string' ? fm.cover : null,
    })
  }

  posts.sort((a, b) => b.date - a.date)
  return posts
}

function renderPostMeta(p, { withWords = false } = {}) {
  const tags = (p.tags || [])
    .map((t) => `<a class="meta-tag" href="/blog/tags/">${escapeHtml(String(t))}</a>`)
    .join('')
  return `
    <span class="meta-item">${MINI_ICONS.calendar}<span>${formatDate(p.date)}</span></span>
    <span class="meta-item">${MINI_ICONS.clock}<span>${p.minutes} 分钟</span></span>
    ${withWords ? `<span class="meta-item">${MINI_ICONS.words}<span>${p.words} 字</span></span>` : ''}
    ${tags ? `<span class="meta-tags">${tags}</span>` : ''}
  `
}

// Shared page skeleton. Every generated page differs only in title,
// stylesheet, sidebar highlight, topbar and body content.
function renderShell({
  title,
  pageKind,
  activeKey,
  extraCss = '',
  posts = [],
  topbar = '',
  content = '',
}) {
  return `<!DOCTYPE html>
<html lang="zh-CN" data-theme-mode="image-only">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
  <link rel="stylesheet" href="/blog/blog.css" />
${extraCss ? `  <link rel="stylesheet" href="${extraCss}" />\n` : ''}${THEME_BOOT_SCRIPT}
</head>
<body data-page="${pageKind}">
  ${PAGE_LOADER_HTML}
  <div class="site-background"></div>
  <div id="app" class="layout">
    <button class="nav-toggle" aria-label="menu" type="button">
      <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M3 12h18M3 6h18M3 18h18" stroke="currentColor" stroke-width="2" stroke-linecap="round" fill="none"/></svg>
    </button>
    ${renderSidebarWithStats(activeKey, posts)}
    <main class="main">
      <header class="topbar">
${topbar}
      </header>
${content}
    </main>
  </div>
  <script type="module" src="/blog/blog.js"></script>
</body>
</html>`
}

async function readProjects() {
  let entries = []
  try {
    entries = await fs.readdir(projectsDir, { withFileTypes: true })
  } catch {
    return []
  }

  const projects = []
  for (const ent of entries) {
    if (!ent.isFile() || !ent.name.endsWith('.md')) continue
    const raw = await fs.readFile(path.join(projectsDir, ent.name), 'utf8')
    const { data: fm, body } = parseFrontmatter(raw)

    const name = (typeof fm.name === 'string' && fm.name.trim()) || ent.name.replace(/\.md$/, '')
    const slug = (typeof fm.slug === 'string' && fm.slug.trim()) ? slugify(fm.slug) : slugify(name)
    const tech = Array.isArray(fm.tech) ? fm.tech : []

    // First paragraph is the summary; "- " lines become highlight bullets
    const lines = body.split(/\r?\n/)
    const summary = []
    const points = []
    for (const line of lines) {
      const bullet = line.match(/^\s*[-*]\s+(.+)$/)
      if (bullet) points.push(bullet[1].trim())
      else if (line.trim() && points.length === 0) summary.push(line.trim())
    }

    projects.push({
      name,
      slug,
      tagline: typeof fm.tagline === 'string' ? fm.tagline : '',
      repo: typeof fm.repo === 'string' ? fm.repo : '',
      demo: typeof fm.demo === 'string' ? fm.demo : '',
      cover: typeof fm.cover === 'string' ? fm.cover : '',
      status: typeof fm.status === 'string' ? fm.status : '',
      year: typeof fm.year === 'string' ? fm.year : '',
      featured: String(fm.featured) === 'true',
      tech,
      summary: summary.join(' '),
      points,
    })
  }

  // Featured first, then newest year, then name
  projects.sort((a, b) => {
    if (a.featured !== b.featured) return a.featured ? -1 : 1
    if (a.year !== b.year) return String(b.year).localeCompare(String(a.year))
    return a.name.localeCompare(b.name)
  })
  return projects
}

function renderProjectsPage(projects, posts) {
  const cards = projects
    .map(
      (p, idx) => `
      <article class="project-card${p.featured ? ' featured' : ''}" style="--i:${idx}">
        <div class="project-head">
          <div class="project-title-row">
            <h2 class="project-name">${escapeHtml(p.name)}</h2>
            ${p.status ? `<span class="project-status">${escapeHtml(p.status)}</span>` : ''}
          </div>
          ${p.tagline ? `<p class="project-tagline">${escapeHtml(p.tagline)}</p>` : ''}
        </div>

        ${p.summary ? `<p class="project-summary">${escapeHtml(p.summary)}</p>` : ''}

        ${
          p.points.length
            ? `<ul class="project-points">${p.points
                .map((it) => `<li>${applyInline(it)}</li>`)
                .join('')}</ul>`
            : ''
        }

        ${
          p.tech.length
            ? `<div class="project-tech">${p.tech
                .map((t) => `<span class="tech-chip">${escapeHtml(String(t))}</span>`)
                .join('')}</div>`
            : ''
        }

        <div class="project-links">
          ${
            p.repo
              ? `<a class="project-link primary" href="${p.repo}" target="_blank" rel="noopener noreferrer">${ICONS.github}<span>源码</span></a>`
              : ''
          }
          ${
            p.demo
              ? `<a class="project-link" href="${p.demo}" target="_blank" rel="noopener noreferrer">${ICONS.link}<span>在线体验</span></a>`
              : ''
          }
        </div>
      </article>
    `
    )
    .join('\n')

  return renderShell({
    title: 'Projects',
    pageKind: 'projects',
    activeKey: 'projects',
    extraCss: '/blog/projects.css',
    posts,
    topbar: `
      <a class="back" href="/blog/" aria-label="返回">${ICONS.back}</a>
      <div class="brand">
        <h1>Projects.map()</h1>
        <div class="subtitle">写过的东西，都在这里</div>
      </div>
    `,
    content: `
      <section class="content">
        <div class="project-list">
          ${cards || '<div class="empty">暂无项目，去 content/projects 新建一个 .md 吧</div>'}
        </div>
      </section>
    `,
  })
}

// Mini games. Each one is mounted by /blog/games.js via its `slug`.
const GAMES = [
  {
    slug: 'snake',
    name: '贪吃蛇',
    en: 'Snake',
    desc: '起始页那条蛇的完整版。吃食物变长，撞墙或咬到自己就结束。',
    controls: '方向键 / WASD 控制，手机可滑动屏幕',
    accent: 0,
    icon: '<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><rect x="6" y="6" width="36" height="36" rx="6" stroke="currentColor" stroke-width="2.5"/><path d="M14 30h8v-8h8v-8h4" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="34" cy="32" r="3" fill="currentColor"/></svg>',
  },
  {
    slug: '2048',
    name: '2048',
    en: '2048',
    desc: '滑动合并相同数字，看看能不能凑出 2048。',
    controls: '方向键 / WASD，手机可滑动',
    accent: 40,
    icon: '<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><rect x="6" y="6" width="16" height="16" rx="4" stroke="currentColor" stroke-width="2.5"/><rect x="26" y="6" width="16" height="16" rx="4" stroke="currentColor" stroke-width="2.5" opacity="0.55"/><rect x="6" y="26" width="16" height="16" rx="4" stroke="currentColor" stroke-width="2.5" opacity="0.55"/><rect x="26" y="26" width="16" height="16" rx="4" fill="currentColor" opacity="0.9"/></svg>',
  },
  {
    slug: 'memory',
    name: '记忆翻牌',
    en: 'Memory',
    desc: '翻开两张相同的牌就配对成功，用最少步数清空棋盘。',
    controls: '点击或轻触卡片',
    accent: 80,
    icon: '<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><rect x="5" y="10" width="16" height="24" rx="4" transform="rotate(-8 5 10)" stroke="currentColor" stroke-width="2.5"/><rect x="26" y="12" width="16" height="24" rx="4" stroke="currentColor" stroke-width="2.5"/><path d="M31 24h6M34 21v6" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/></svg>',
  },
  {
    slug: 'tetris',
    name: '俄罗斯方块',
    en: 'Tetris',
    desc: '经典七连块，带下一块预览、影子提示和硬降。消行升级，越来越快。',
    controls: '方向键移动旋转 · 空格硬降 · 手机拖动点按',
    accent: 160,
    icon: '<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><rect x="7" y="27" width="11" height="11" rx="2.5" stroke="currentColor" stroke-width="2.5"/><rect x="18" y="16" width="11" height="11" rx="2.5" stroke="currentColor" stroke-width="2.5"/><rect x="18" y="27" width="11" height="11" rx="2.5" fill="currentColor" opacity="0.85"/><rect x="29" y="27" width="11" height="11" rx="2.5" stroke="currentColor" stroke-width="2.5" opacity="0.6"/></svg>',
  },
  {
    slug: 'minesweeper',
    name: '扫雷',
    en: 'Minesweeper',
    desc: '首点必不踩雷，支持初级与进阶两档，数字连点自动展开。',
    controls: '左键翻开 · 右键插旗；手机轻触翻开 · 长按插旗',
    accent: 120,
    icon: '<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><circle cx="24" cy="27" r="12" stroke="currentColor" stroke-width="2.5"/><path d="M24 11v6M24 37v-4M11 27h4M37 27h-4M14.7 17.7l3.2 3.2M33.3 17.7l-3.2 3.2" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/><circle cx="20.5" cy="23.5" r="2.4" fill="currentColor"/></svg>',
  },
  {
    slug: 'gomoku',
    name: '五子棋',
    en: 'Gomoku',
    desc: '和会算棋型的 AI 下一盘，先连成五子者胜。',
    controls: '点击交叉点落子',
    accent: 200,
    icon: '<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M8 16h32M8 24h32M8 32h32M16 8v32M24 8v32M32 8v32" stroke="currentColor" stroke-width="1.8" opacity="0.55"/><circle cx="16" cy="24" r="5" fill="currentColor"/><circle cx="32" cy="16" r="5" stroke="currentColor" stroke-width="2.5"/></svg>',
  },
  {
    slug: 'breakout',
    name: '打砖块',
    en: 'Breakout',
    desc: '接住小球打光砖块，还有加宽挡板和减速道具，一关比一关快。',
    controls: '鼠标 / 拖动移动挡板 · 点击或空格发射',
    accent: 240,
    icon: '<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><rect x="7" y="8" width="10" height="6" rx="2" fill="currentColor" opacity="0.6"/><rect x="19" y="8" width="10" height="6" rx="2" fill="currentColor" opacity="0.85"/><rect x="31" y="8" width="10" height="6" rx="2" fill="currentColor" opacity="0.6"/><rect x="13" y="16" width="10" height="6" rx="2" stroke="currentColor" stroke-width="2.2"/><rect x="25" y="16" width="10" height="6" rx="2" stroke="currentColor" stroke-width="2.2"/><circle cx="24" cy="30" r="3.4" fill="currentColor"/><rect x="15" y="38" width="18" height="4.5" rx="2.2" stroke="currentColor" stroke-width="2.4"/></svg>',
  },
  {
    slug: 'dino',
    name: '像素跑酷',
    en: 'Dino Run',
    desc: '一键起跳的无尽跑酷，越跑越快，暗色模式自动变夜晚。',
    controls: '空格 / 点击跳跃',
    accent: 280,
    icon: '<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M6 38h36" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/><rect x="10" y="18" width="13" height="13" rx="4" stroke="currentColor" stroke-width="2.5"/><circle cx="19.5" cy="22.5" r="1.8" fill="currentColor"/><path d="M32 38V27M36.5 38v-7" stroke="currentColor" stroke-width="2.8" stroke-linecap="round"/></svg>',
  },
  {
    slug: 'reversi',
    name: '黑白棋',
    en: 'Reversi',
    desc: '夹住就翻面，抢住四个角。AI 懂位置价值，别小看它。',
    controls: '点击提示点落子',
    accent: 20,
    icon: '<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><circle cx="17" cy="17" r="8" fill="currentColor"/><circle cx="31" cy="31" r="8" stroke="currentColor" stroke-width="2.5"/><path d="M31 9a8 8 0 0 1 8 8M17 39a8 8 0 0 1-8-8" stroke="currentColor" stroke-width="2.5" stroke-linecap="round"/></svg>',
  },
  {
    slug: 'puzzle15',
    name: '数字华容道',
    en: '15 Puzzle',
    desc: '把 1 到 15 滑回原位，打乱保证一定有解。',
    controls: '点击滑块或用方向键',
    accent: 320,
    icon: '<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><rect x="7" y="7" width="15" height="15" rx="3.5" stroke="currentColor" stroke-width="2.5"/><rect x="26" y="7" width="15" height="15" rx="3.5" fill="currentColor" opacity="0.8"/><rect x="7" y="26" width="15" height="15" rx="3.5" fill="currentColor" opacity="0.55"/><rect x="26" y="26" width="15" height="15" rx="3.5" stroke="currentColor" stroke-width="2.5" stroke-dasharray="4 4" opacity="0.6"/></svg>',
  },
  {
    slug: 'simon',
    name: '西蒙记忆',
    en: 'Simon',
    desc: '四个色块按顺序闪烁，凭记忆复现，每轮多记一个。',
    controls: '看完闪烁后点击复现',
    accent: 60,
    icon: '<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M24 6a18 18 0 0 1 18 18h-8a10 10 0 0 0-10-10V6Z" fill="currentColor" opacity="0.85"/><path d="M24 6a18 18 0 0 0-18 18h8a10 10 0 0 1 10-10V6Z" stroke="currentColor" stroke-width="2.4"/><path d="M6 24a18 18 0 0 0 18 18v-8a10 10 0 0 1-10-10H6Z" stroke="currentColor" stroke-width="2.4"/><path d="M42 24a18 18 0 0 1-18 18v-8a10 10 0 0 0 10-10h8Z" fill="currentColor" opacity="0.5"/></svg>',
  },
  {
    slug: 'whack',
    name: '打地鼠',
    en: 'Whack',
    desc: '60 秒限时，地鼠越冒越快，金色地鼠三倍分，连击有加成。',
    controls: '点击冒头的地鼠',
    accent: 100,
    icon: '<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><ellipse cx="24" cy="36" rx="14" ry="4.5" stroke="currentColor" stroke-width="2.5"/><path d="M14 34v-8a10 10 0 0 1 20 0v8" stroke="currentColor" stroke-width="2.5"/><circle cx="20" cy="26" r="1.8" fill="currentColor"/><circle cx="28" cy="26" r="1.8" fill="currentColor"/><path d="M22.5 30.5c1 .8 2 .8 3 0" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>',
  },
  {
    slug: 'reaction',
    name: '反应速度',
    en: 'Reaction',
    desc: '变绿的瞬间出手，五轮取平均，看看你是不是电竞级反应。',
    controls: '变绿后尽快点击',
    accent: 140,
    icon: '<svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M26 5 12 27h9l-3 16 16-24h-9l1-14Z" stroke="currentColor" stroke-width="2.5" stroke-linejoin="round" fill="currentColor" fill-opacity="0.25"/></svg>',
  },
]

function renderGamesPage(posts) {
  const cards = GAMES.map(
    (g, idx) => `
      <a class="game-card" href="/blog/games/${g.slug}/" style="--i:${idx}; --accent-shift:${g.accent}">
        <div class="game-icon">${g.icon}</div>
        <div class="game-body">
          <h2 class="game-name">${escapeHtml(g.name)}<span class="game-en">${escapeHtml(g.en)}</span></h2>
          <p class="game-desc">${escapeHtml(g.desc)}</p>
          <div class="game-controls">${escapeHtml(g.controls)}</div>
        </div>
        <div class="game-play">开始 ${MINI_ICONS.arrowRight}</div>
      </a>
    `
  ).join('\n')

  return renderShell({
    title: 'Games',
    pageKind: 'games',
    activeKey: 'games',
    extraCss: '/blog/games.css',
    posts,
    topbar: `
      <a class="back" href="/blog/" aria-label="返回">${ICONS.back}</a>
        <div class="brand">
          <h1>Games()</h1>
          <div class="subtitle">摸鱼一下，配色跟着主题走</div>
        </div>
    `,
    content: `
      <section class="content">
        <div class="game-list">
          ${cards}
        </div>
      </section>
    `,
  })
}

function renderGamePage(game, posts) {
  return renderShell({
    title: `${game.name} · Games`,
    pageKind: 'game',
    activeKey: 'games',
    extraCss: '/blog/games.css',
    posts,
    topbar: `
      <a class="back" href="/blog/games/" aria-label="返回">${ICONS.back}</a>
        <div class="brand">
          <h1>${escapeHtml(game.name)}</h1>
          <div class="subtitle">${escapeHtml(game.controls)}</div>
        </div>
    `,
    content: `
      <section class="content">
        <div class="game-stage" data-game="${game.slug}" style="--accent-shift:${game.accent}">
          <div class="game-hud">
            <div class="hud-item"><span class="hud-label">得分</span><span class="hud-value" data-hud="score">0</span></div>
            <div class="hud-item"><span class="hud-label">最高</span><span class="hud-value" data-hud="best">0</span></div>
            <div class="hud-actions">
              <button class="game-btn" data-action="restart" type="button">重新开始</button>
            </div>
          </div>
          <div class="game-viewport" data-role="viewport">
            <div class="game-loading">加载中…</div>
          </div>
          <div class="game-overlay" data-role="overlay" hidden>
            <div class="overlay-card">
              <div class="overlay-title" data-role="overlay-title"></div>
              <div class="overlay-text" data-role="overlay-text"></div>
              <button class="game-btn primary" data-action="restart" type="button">再来一局</button>
            </div>
          </div>
        </div>
      </section>
    `,
  })
}

function renderBlogIndex(posts) {
  const items = posts
    .map(
      (p, idx) => `
        <article class="post-item" style="--i:${idx}">
          <a class="post-item-cover${p.cover ? '' : ' no-cover'}" href="/blog/${p.slug}/" tabindex="-1" aria-hidden="true">
            ${p.cover ? `<span class="cover-img" style="background-image: url('${p.cover}')"></span>` : '<span class="cover-img cover-placeholder"></span>'}
          </a>
          <div class="post-item-body">
            <h2 class="post-item-title"><a href="/blog/${p.slug}/">${escapeHtml(
        p.title
      )}</a></h2>
            <div class="post-item-meta">${renderPostMeta(p)}</div>
            <p class="post-item-excerpt">${escapeHtml(p.excerpt || '')}</p>
            <a class="post-item-cta" href="/blog/${p.slug}/"><span>阅读全文</span>${MINI_ICONS.arrowRight}</a>
          </div>
        </article>
      `
    )
    .join('\n')

  return renderShell({
    title: "Blog",
    pageKind: "home",
    activeKey: "home",
    posts,
    topbar: `
      <div class="brand">
          <h1>Riordon</h1>
          <div class="subtitle">Go where your heart leads.</div>
        </div>
        <button class="search" aria-label="search">${ICONS.search}</button>
    `,
    content: `
      <section class="content">
        <div class="post-list">
          ${items || '<div class="empty">暂无文章，去 content/posts 新建一个 .md 吧</div>'}
        </div>
      </section>
    `,
  })
}

function renderPostPage(post, allPosts) {
  const body = mdToHtml(post.body)

  // posts are sorted newest-first: next = newer, prev = older
  const idx = allPosts.findIndex((p) => p.slug === post.slug)
  const newer = idx > 0 ? allPosts[idx - 1] : null
  const older = idx >= 0 && idx < allPosts.length - 1 ? allPosts[idx + 1] : null

  const postNav =
    newer || older
      ? `
      <nav class="post-nav">
        ${older
          ? `<a class="post-nav-card prev" href="/blog/${older.slug}/">
              <span class="post-nav-label">${MINI_ICONS.arrowLeft}<span>上一篇</span></span>
              <span class="post-nav-title">${escapeHtml(older.title)}</span>
            </a>`
          : '<span class="post-nav-card placeholder"></span>'}
        ${newer
          ? `<a class="post-nav-card next" href="/blog/${newer.slug}/">
              <span class="post-nav-label"><span>下一篇</span>${MINI_ICONS.arrowRight}</span>
              <span class="post-nav-title">${escapeHtml(newer.title)}</span>
            </a>`
          : '<span class="post-nav-card placeholder"></span>'}
      </nav>`
      : ''

  return renderShell({
    title: post.title,
    pageKind: 'post',
    activeKey: 'post',
    extraCss: '/blog/post.css',
    posts: allPosts,
    topbar: `
      <a class="back" href="/blog/" aria-label="返回">${ICONS.back}</a>
        <div class="brand">
          <h1>Riordon</h1>
          <div class="subtitle">Go where your heart leads.</div>
        </div>
        <button class="search" aria-label="search">${ICONS.search}</button>
    `,
    content: `
      <article class="post">
        <div class="post-header">
          <h1 class="post-h1">${escapeHtml(post.title)}</h1>
          <button class="toc-toggle" aria-label="toc" type="button">
            <svg t="1772439250931" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="1023" aria-hidden="true"><path d="M800 6c115.98 0 210 94.02 210 210v596c0 115.98-94.02 210-210 210H220c-115.98 0-210-94.02-210-210V216C10 100.02 104.02 6 220 6h580z m-410 956H800c82.844 0 150-67.156 150-150V216c0-82.84-67.156-150-150-150H390v896zM220 66c-82.84 0-150 67.16-150 150v596c0 82.844 67.16 150 150 150h110v-896H220z m539.448 285.764a30.004 30.004 0 0 1 29.104 52.472l-210.3 116.648 211.064 125.32a30 30 0 0 1 10.48 41.112 30 30 0 0 1-41.112 10.48l-238.028-141.328c-27.88-16.552-27.284-57.116 1.072-72.844l237.72-131.86z" fill="currentColor" p-id="1024"></path></svg>
          </button>
        </div>
        <div class="post-meta">${renderPostMeta(post, { withWords: true })}</div>
        <div class="post-content">${body}</div>
        ${postNav}
      </article>
      <aside class="post-toc" aria-label="toc">
        <div class="post-toc-inner"></div>
      </aside>
    `,
  })
}

function renderArchivesPage(posts) {
  // Group posts by year -> month
  const yearMap = new Map()
  for (const p of posts) {
    const d = new Date(p.date)
    const year = d.getFullYear()
    const month = d.getMonth() + 1
    if (!yearMap.has(year)) yearMap.set(year, new Map())
    const monthMap = yearMap.get(year)
    if (!monthMap.has(month)) monthMap.set(month, [])
    monthMap.get(month).push(p)
  }

  // Sort years descending
  const years = Array.from(yearMap.keys()).sort((a, b) => b - a)

  let itemIndex = 0
  const yearSections = years
    .map((year) => {
      const monthMap = yearMap.get(year)
      const months = Array.from(monthMap.keys()).sort((a, b) => b - a)
      const monthSections = months
        .map((m) => {
          const list = monthMap.get(m)
          const mm = String(m).padStart(2, '0')
          const postItems = list
            .map(
              (p) => `
          <div class="timeline-item" style="--i:${itemIndex++}">
            <span class="timeline-date">${formatDate(p.date).slice(5)}</span>
            <a class="timeline-title" href="/blog/${p.slug}/">${escapeHtml(p.title)}</a>
          </div>`
            )
            .join('\n')

          return `
          <div class="month-block">
            <div class="month-label">${mm}</div>
            <div class="month-posts">${postItems}</div>
          </div>`
        })
        .join('\n')

      return `
      <div class="year-block">
        <div class="year-label">${year}</div>
        <div class="timeline-line"></div>
        <div class="timeline-posts">${monthSections}</div>
      </div>`
    })
    .join('\n')

  return renderShell({
    title: "Archives",
    pageKind: "archives",
    activeKey: "archives",
    extraCss: "/blog/archives.css",
    posts,
    topbar: `
      <a class="back" href="/blog/" aria-label="返回">${ICONS.back}</a>
        <div class="brand">
          <h1>Archive()</h1>
        </div>
    `,
    content: `
      <section class="content">
        <div class="archive-container">
          <div class="archive-timeline">
            ${yearSections || '<div class="empty">暂无文章</div>'}
          </div>
        </div>
      </section>
    `,
  })
}

function renderTagsPage(posts) {
  const tagsMap = new Map()
  for (const p of posts) {
    for (const t of p.tags || []) {
      const tag = String(t).trim()
      if (!tag) continue
      if (!tagsMap.has(tag)) tagsMap.set(tag, [])
      tagsMap.get(tag).push(p)
    }
  }

  const tags = Array.from(tagsMap.entries()).sort((a, b) => a[0].localeCompare(b[0]))
  const html = tags
    .map(([tag, list], idx) => {
      const items = list
        .map((p) => `<a class="tag-post" href="/blog/${p.slug}/">${escapeHtml(p.title)}</a>`)
        .join('')
      return `
        <div class="tag-block" style="--i:${idx}">
          <div class="tag-title">${escapeHtml(tag)} <span class="tag-count">(${list.length})</span></div>
          <div class="tag-posts">${items}</div>
        </div>
      `
    })
    .join('\n')

  return renderShell({
    title: "Tags",
    pageKind: "tags",
    activeKey: "tags",
    extraCss: "/blog/tags.css",
    posts,
    topbar: `
      <a class="back" href="/blog/" aria-label="返回">${ICONS.back}</a>
        <div class="brand">
          <h1>Tag.sort()</h1>
        </div>
    `,
    content: `
      <section class="content">
        <div class="tag-list">
          ${html || '<div class="empty">暂无标签（在文章 frontmatter 里写 tags: [a, b]）</div>'}
        </div>
      </section>
    `,
  })
}

async function ensureDir(p) {
  await fs.mkdir(p, { recursive: true })
}

async function writeFile(p, content) {
  await ensureDir(path.dirname(p))
  await fs.writeFile(p, content, 'utf8')
}

async function scanBackgrounds() {
  const bgDir = path.join(projectRoot, 'public', 'blog', 'backgrounds')
  const thumbsDir = path.join(bgDir, 'thumbs')
  const files = await fs.readdir(bgDir).catch(() => [])
  
  // Prefer WebP over other formats
  const allImages = files.filter(f => /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(f))
  const webpSet = new Set()
  const images = []
  
  for (const f of allImages) {
    const baseName = f.replace(/\.[^.]+$/, '')
    if (f.toLowerCase().endsWith('.webp')) {
      webpSet.add(baseName)
      images.push(`/blog/backgrounds/${f}`)
    }
  }
  
  // Add non-WebP only if no WebP version exists
  for (const f of allImages) {
    if (f.toLowerCase().endsWith('.webp')) continue
    const baseName = f.replace(/\.[^.]+$/, '')
    if (!webpSet.has(baseName)) {
      images.push(`/blog/backgrounds/${f}`)
    }
  }
  
  // Sort by number in filename
  images.sort((a, b) => {
    const numA = parseInt(a.match(/(\d+)/)?.[1] || '0')
    const numB = parseInt(b.match(/(\d+)/)?.[1] || '0')
    return numA - numB
  })
  
  const outPath = path.join(projectRoot, 'public', 'blog', 'backgrounds.json')
  await fs.writeFile(outPath, JSON.stringify(images, null, 2))
  
  // Generate thumbs config
  const thumbFiles = (await fs.readdir(thumbsDir).catch(() => []))
    .filter(f => f.endsWith('.webp'))
    .sort((a, b) => {
      const numA = parseInt(a.match(/(\d+)/)?.[1] || '0')
      const numB = parseInt(b.match(/(\d+)/)?.[1] || '0')
      return numA - numB
    })
  
  const thumbsConfig = {
    dir: '/blog/backgrounds/thumbs/',
    files: thumbFiles
  }
  const thumbsPath = path.join(projectRoot, 'public', 'blog', 'thumbs.json')
  await fs.writeFile(thumbsPath, JSON.stringify(thumbsConfig, null, 2))
  
  console.log(`[blog] found ${images.length} background images, ${thumbFiles.length} thumbnails`)
  return images
}

async function cleanupOrphanedPosts(posts) {
  // Get all existing post directories in blog/
  const entries = await fs.readdir(blogDir, { withFileTypes: true }).catch(() => [])
  const existingDirs = entries
    .filter(
      (e) =>
        e.isDirectory() &&
        !['archives', 'tags', 'changelog', 'projects', 'games'].includes(e.name)
    )
    .map(e => e.name)

  // Get current post slugs
  const currentSlugs = new Set(posts.map(p => p.slug))

  // Remove directories that no longer have a corresponding .md file
  for (const dir of existingDirs) {
    if (!currentSlugs.has(dir)) {
      const dirPath = path.join(blogDir, dir)
      await fs.rm(dirPath, { recursive: true }).catch(() => { })
      console.log(`[blog] removed orphaned directory: ${dir}`)
    }
  }
}

const SITE_URL = 'https://riordon.xyz'

function renderSearchIndex(posts) {
  return JSON.stringify(
    posts.map((p) => ({
      title: p.title,
      url: `/blog/${p.slug}/`,
      date: formatDate(p.date),
      tags: (p.tags || []).map(String),
      excerpt: p.excerpt || '',
      minutes: p.minutes,
      content: p.plain.slice(0, 5000),
    }))
  )
}

function renderRss(posts) {
  const items = posts
    .map(
      (p) => `
    <item>
      <title>${escapeHtml(p.title)}</title>
      <link>${SITE_URL}/blog/${p.slug}/</link>
      <guid>${SITE_URL}/blog/${p.slug}/</guid>
      <pubDate>${new Date(p.date).toUTCString()}</pubDate>
      <description>${escapeHtml(p.excerpt || '')}</description>
    </item>`
    )
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Riordon's Blog</title>
    <link>${SITE_URL}/blog/</link>
    <description>Go where your heart leads.</description>
    <language>zh-CN</language>
    ${items}
  </channel>
</rss>`
}

function renderSitemap(posts) {
  const staticUrls = ['/', '/blog/', '/blog/archives/', '/blog/tags/', '/blog/changelog/']
  const urls = [
    ...staticUrls.map((u) => `  <url><loc>${SITE_URL}${u}</loc></url>`),
    ...posts.map(
      (p) =>
        `  <url><loc>${SITE_URL}/blog/${p.slug}/</loc><lastmod>${formatDate(p.date)}</lastmod></url>`
    ),
  ].join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`
}

async function main() {
  const posts = await readPosts()

  // Clean up orphaned post directories
  await cleanupOrphanedPosts(posts)

  // blog index
  await writeFile(path.join(blogDir, 'index.html'), renderBlogIndex(posts))

  // posts
  for (const post of posts) {
    const out = path.join(blogDir, post.slug, 'index.html')
    await writeFile(out, renderPostPage(post, posts))
  }

  // archives & tags
  await writeFile(path.join(blogDir, 'archives', 'index.html'), renderArchivesPage(posts))
  await writeFile(path.join(blogDir, 'tags', 'index.html'), renderTagsPage(posts))

  // changelog
  const changelogEntries = await readChangelogEntries()
  await writeFile(path.join(blogDir, 'changelog', 'index.html'), renderChangelogPage(posts, changelogEntries))

  // projects
  const projects = await readProjects()
  await writeFile(path.join(blogDir, 'projects', 'index.html'), renderProjectsPage(projects, posts))

  // games
  await writeFile(path.join(blogDir, 'games', 'index.html'), renderGamesPage(posts))
  for (const game of GAMES) {
    await writeFile(
      path.join(blogDir, 'games', game.slug, 'index.html'),
      renderGamePage(game, posts)
    )
  }

  // search index + feeds (served from public/)
  await writeFile(path.join(projectRoot, 'public', 'blog', 'search-index.json'), renderSearchIndex(posts))
  await writeFile(path.join(projectRoot, 'public', 'blog', 'feed.xml'), renderRss(posts))
  await writeFile(path.join(projectRoot, 'public', 'sitemap.xml'), renderSitemap(posts))

  // backgrounds.json
  await scanBackgrounds()

  console.log(`[blog] generated ${posts.length} posts + search index + rss + sitemap`)
}

await main()
