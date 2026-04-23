import fs from 'node:fs/promises'
import path from 'node:path'
import { chromium } from 'playwright'

const url = process.argv[2] ?? 'http://localhost:5181'
const outputDir = process.argv[3] ?? path.resolve('..', 'portfolio-captures')

await fs.mkdir(outputDir, { recursive: true })

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1440, height: 1200 } })

await page.goto(url, { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(10000)

const main = page.locator('main')
const mapPanel = page.locator('.leaflet-container').first()
const feedPanel = page.getByText('V2X Debate Feed').locator('..').locator('..')

await main.screenshot({ path: path.join(outputDir, '01-hero-dashboard.png') })
await mapPanel.screenshot({ path: path.join(outputDir, '02-route-and-pressure.png') })
await feedPanel.screenshot({ path: path.join(outputDir, '03-v2x-feed.png') })

const statusText = (await page.locator('span.font-medium').first().textContent())?.trim()

const stopSummary = await page.evaluate(() => {
  return Array.from(document.querySelectorAll('aside .rounded-2xl.border.px-3.py-3')).map((card) =>
    card.textContent?.replace(/\s+/g, ' ').trim(),
  )
})

const feedSummary = await page.evaluate(() => {
  return Array.from(document.querySelectorAll('article')).map((card) =>
    card.textContent?.replace(/\s+/g, ' ').trim(),
  )
})

const markerCount = await page.locator('.leaflet-marker-icon').count()
const vectorCount = await page.locator('path.leaflet-interactive').count()

const summary = {
  url,
  statusText,
  markerCount,
  vectorCount,
  stopSummary,
  feedSummary,
}

await fs.writeFile(
  path.join(outputDir, 'capture-summary.json'),
  JSON.stringify(summary, null, 2),
  'utf-8',
)

console.log(JSON.stringify(summary, null, 2))

await browser.close()
