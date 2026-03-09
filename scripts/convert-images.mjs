/**
 * Convert background images to WebP format and generate thumbnails
 * Run: node scripts/convert-images.mjs
 * Run with delete: node scripts/convert-images.mjs --delete
 * 
 * Requirements: npm install sharp --save-dev
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const backgroundsDir = path.join(__dirname, '../public/blog/backgrounds')
const thumbsDir = path.join(__dirname, '../public/blog/backgrounds/thumbs')

// Check for --delete flag
const shouldDeleteOriginals = process.argv.includes('--delete')

// Check if sharp is available
let sharp = null
try {
  sharp = (await import('sharp')).default
} catch {
  console.log('❌ sharp 未安装，请先运行: npm install sharp --save-dev')
  process.exit(1)
}

// Ensure thumbs directory exists
if (!fs.existsSync(thumbsDir)) {
  fs.mkdirSync(thumbsDir, { recursive: true })
}

// Get all image files
const files = fs.readdirSync(backgroundsDir)
const imageFiles = files.filter(f => 
  /\.(jpg|jpeg|png|webp)$/i.test(f) && 
  !f.startsWith('thumb_') &&
  !fs.statSync(path.join(backgroundsDir, f)).isDirectory()
)

console.log(`找到 ${imageFiles.length} 张图片待处理\n`)

let converted = 0
let skipped = 0
let deleted = 0
let thumbCreated = 0
const filesToDelete = []

for (const file of imageFiles) {
  const inputPath = path.join(backgroundsDir, file)
  const baseName = path.basename(file, path.extname(file))
  const webpPath = path.join(backgroundsDir, `${baseName}.webp`)
  const thumbPath = path.join(thumbsDir, `thumb_${baseName}.webp`)

  try {
    const metadata = await sharp(inputPath).metadata()
    const originalSize = fs.statSync(inputPath).size

    // Convert to WebP (only if not already WebP or if conversion saves space)
    if (!file.toLowerCase().endsWith('.webp')) {
      await sharp(inputPath)
        .webp({ quality: 85, effort: 4 })
        .toFile(webpPath)
      
      const webpSize = fs.statSync(webpPath).size
      const savings = ((1 - webpSize / originalSize) * 100).toFixed(1)
      
      if (webpSize < originalSize * 0.95) {
        console.log(`✅ ${file} → ${baseName}.webp (节省 ${savings}%)`)
        converted++
        // Mark for deletion if --delete flag is set
        if (shouldDeleteOriginals) {
          filesToDelete.push(inputPath)
        }
      } else {
        // Delete webp if it's not significantly smaller
        fs.unlinkSync(webpPath)
        console.log(`⏭️  ${file} (WebP 不够小，保留原格式)`)
        skipped++
      }
    } else {
      console.log(`⏭️  ${file} (已是 WebP)`)
      skipped++
    }

    // Generate thumbnail (400px wide, for picker modal)
    const thumbWidth = 400
    if (metadata.width > thumbWidth) {
      await sharp(inputPath)
        .resize(thumbWidth, null, { 
          fit: 'inside',
          withoutEnlargement: true 
        })
        .webp({ quality: 80, effort: 4 })
        .toFile(thumbPath)
      
      const thumbSize = fs.statSync(thumbPath).size
      console.log(`   └─ 缩略图: thumb_${baseName}.webp (${(thumbSize / 1024).toFixed(1)}KB)`)
      thumbCreated++
    }

  } catch (err) {
    console.log(`❌ ${file}: ${err.message}`)
  }
}

// Delete original files if --delete flag was provided
if (shouldDeleteOriginals && filesToDelete.length > 0) {
  console.log('\n🗑️  删除原文件...')
  for (const filePath of filesToDelete) {
    try {
      fs.unlinkSync(filePath)
      deleted++
    } catch (err) {
      console.log(`   删除失败: ${path.basename(filePath)} - ${err.message}`)
    }
  }
}

console.log('\n========================================')
console.log(`转换完成: ${converted} 张转WebP, ${skipped} 张保留原格式`)
console.log(`缩略图: ${thumbCreated} 张`)
if (shouldDeleteOriginals) {
  console.log(`已删除原文件: ${deleted} 张`)
}
console.log('========================================')

// Generate config for thumbnails
const thumbFiles = fs.readdirSync(thumbsDir).filter(f => f.endsWith('.webp'))
const thumbConfig = {
  thumbsDir: '/blog/backgrounds/thumbs/',
  files: thumbFiles
}

fs.writeFileSync(
  path.join(__dirname, '../public/blog/thumbs-config.json'),
  JSON.stringify(thumbConfig, null, 2)
)

console.log('\n缩略图配置已写入 public/blog/thumbs-config.json')
console.log('请在 blog.js 中使用缩略图路径以提升加载速度')
