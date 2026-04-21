import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const screenshotsDir = __dirname;

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  });
  const page = await context.newPage();

  console.log('Navigating to gosuslugi.ru...');
  await page.goto('https://www.gosuslugi.ru/', { 
    waitUntil: 'domcontentloaded',
    timeout: 30000 
  });
  await page.waitForTimeout(3000);

  // Capture footer
  try {
    const footer = await page.$('footer');
    if (footer) {
      console.log('Capturing footer...');
      await footer.screenshot({ path: `${screenshotsDir}/section-footer.png` });
    } else {
      console.log('No footer element found, scrolling to bottom...');
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await page.waitForTimeout(1000);
      await page.screenshot({ 
        path: `${screenshotsDir}/bottom-section.png`,
        clip: { x: 0, y: await page.evaluate(() => document.body.scrollHeight) - 800, width: 1920, height: 800 }
      });
    }
  } catch (e) {
    console.log('Footer capture error:', e.message);
  }

  // Also capture notable UI components - cards, buttons
  try {
    const cards = await page.$$('.card, [class*="card"], [class*="Card"]');
    for (let i = 0; i < Math.min(cards.length, 5); i++) {
      await cards[i].screenshot({ path: `${screenshotsDir}/component-card-${i}.png` });
      console.log(`Captured card ${i}`);
    }
  } catch (e) {
    console.log('Cards capture:', e.message);
  }

  await browser.close();
  console.log('Done!');
}

main().catch(console.error);
