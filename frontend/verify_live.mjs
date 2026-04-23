import { chromium } from 'playwright'

const url = process.argv[2] ?? 'http://localhost:5181'
const screenshotPath = process.argv[3] ?? '../frontend-check.png'

const browser = await chromium.launch({ headless: true })
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } })

await page.goto(url, { waitUntil: 'domcontentloaded' })
await page.waitForTimeout(8000)

const statusText = (await page.locator('main').getByText(/Live|Connecting|Interrupted|Reconnecting|Closed/).first().textContent())?.trim()
const markerCount = await page.locator('.leaflet-marker-icon').count()
const vectorCount = await page.locator('path.leaflet-interactive').count()
const feedReady = await page.locator('text=V2X Debate Feed').count()

await page.screenshot({ path: screenshotPath, fullPage: true })
console.log(JSON.stringify({ statusText, markerCount, vectorCount, feedReady }))

await browser.close()
