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
  try {
    await page.goto('https://www.gosuslugi.ru/', { 
      waitUntil: 'networkidle',
      timeout: 60000 
    });
  } catch (e) {
    console.log('Navigation had issues, continuing anyway:', e.message);
  }

  // Wait for page to settle
  await page.waitForTimeout(5000);

  // Full page screenshot
  console.log('Capturing full page...');
  await page.screenshot({ 
    path: `${screenshotsDir}/fullpage.png`, 
    fullPage: true 
  });

  // Desktop viewport screenshot (above the fold)
  console.log('Capturing above the fold...');
  await page.screenshot({ 
    path: `${screenshotsDir}/above-fold.png` 
  });

  // Try to capture sections
  const sections = [
    { sel: 'header', name: 'header' },
    { sel: 'main', name: 'main-content' },
    { sel: 'footer', name: 'footer' },
  ];

  for (const section of sections) {
    try {
      const el = await page.$(section.sel);
      if (el) {
        console.log(`Capturing ${section.name}...`);
        await el.screenshot({ path: `${screenshotsDir}/section-${section.name}.png` });
      }
    } catch (e) {
      console.log(`Could not capture ${section.sel}:`, e.message);
    }
  }

  // Mobile view
  await context.close();
  
  const mobileContext = await browser.newContext({
    viewport: { width: 390, height: 844 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X)',
    isMobile: true,
  });
  const mobilePage = await mobileContext.newPage();
  
  try {
    await mobilePage.goto('https://www.gosuslugi.ru/', { 
      waitUntil: 'networkidle',
      timeout: 60000 
    });
    await mobilePage.waitForTimeout(3000);
    
    console.log('Capturing mobile full page...');
    await mobilePage.screenshot({ 
      path: `${screenshotsDir}/mobile-fullpage.png`, 
      fullPage: true 
    });
    
    console.log('Capturing mobile above-fold...');
    await mobilePage.screenshot({ 
      path: `${screenshotsDir}/mobile-above-fold.png` 
    });
  } catch (e) {
    console.log('Mobile navigation issues:', e.message);
  }

  await browser.close();
  console.log('Done! Screenshots saved.');
}

main().catch(console.error);
