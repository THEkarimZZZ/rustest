import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const contextFile = path.join(__dirname, '..', 'context.md');

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

  // Extract all styles
  const analysis = await page.evaluate(() => {
    // Collect all colors
    const colors = new Set();
    const fontFamilies = new Set();
    const fontSizes = new Set();
    const fontWeights = new Set();
    const spacings = new Set();
    
    function extractColors(value) {
      if (!value) return;
      // Match hex colors
      const hexMatches = value.match(/#[0-9a-fA-F]{3,8}/g);
      if (hexMatches) hexMatches.forEach(c => colors.add(c));
      // Match rgb/rgba
      const rgbMatches = value.match(/rgba?\([^)]+\)/g);
      if (rgbMatches) rgbMatches.forEach(c => colors.add(c));
      // Match hsl/hsla
      const hslMatches = value.match(/hsla?\([^)]+\)/g);
      if (hslMatches) hslMatches.forEach(c => colors.add(c));
    }
    
    function extractSpacing(value) {
      if (!value) return;
      const pxMatches = value.match(/-?\d+px/g);
      if (pxMatches) pxMatches.forEach(v => spacings.add(v));
      const remMatches = value.match(/-?[\d.]+rem/g);
      if (remMatches) remMatches.forEach(v => spacings.add(v));
      const emMatches = value.match(/-?[\d.]+em/g);
      if (emMatches) emMatches.forEach(v => spacings.add(v));
    }
    
    const allElements = document.querySelectorAll('*');
    for (const el of allElements) {
      const computed = window.getComputedStyle(el);
      
      // Colors
      extractColors(computed.color);
      extractColors(computed.backgroundColor);
      extractColors(computed.borderColor);
      extractColors(computed.outlineColor);
      extractColors(computed.boxShadow);
      extractColors(computed.textDecorationColor);
      
      // Typography
      if (computed.fontFamily) fontFamilies.add(computed.fontFamily);
      if (computed.fontSize) fontSizes.add(computed.fontSize);
      if (computed.fontWeight) fontWeights.add(computed.fontWeight);
      
      // Spacing
      extractSpacing(computed.margin);
      extractSpacing(computed.padding);
      extractSpacing(computed.gap);
      extractSpacing(computed.columnGap);
      extractSpacing(computed.rowGap);
    }
    
    return {
      colors: [...colors].filter(c => !c.includes('transparent') && c !== '#00000000' && c !== 'rgba(0, 0, 0, 0)').slice(0, 80),
      fontFamilies: [...fontFamilies],
      fontSizes: [...fontSizes].sort((a, b) => parseFloat(a) - parseFloat(b)),
      fontWeights: [...fontWeights].sort((a, b) => parseInt(a) - parseInt(b)),
      spacings: [...spacings].slice(0, 50),
      borderRadius: [...new Set(Array.from(allElements).map(el => window.getComputedStyle(el).borderRadius))].filter(v => v && v !== '0px').slice(0, 20),
    };
  });

  // Get HTML structure for layout patterns
  const htmlStructure = await page.evaluate(() => {
    const header = document.querySelector('header');
    const main = document.querySelector('main');
    const footer = document.querySelector('footer');
    
    return {
      headerHTML: header ? header.outerHTML.substring(0, 3000) : 'No header',
      hasMain: !!main,
      hasFooter: !!footer,
      bodyClasses: document.body.className,
      metaViewport: document.querySelector('meta[name="viewport"]')?.content || 'Not set',
    };
  });

  // Get CSS custom properties
  const cssVars = await page.evaluate(() => {
    const rootStyles = window.getComputedStyle(document.documentElement);
    const vars = {};
    for (let i = 0; i < rootStyles.length; i++) {
      const prop = rootStyles[i];
      if (prop.startsWith('--')) {
        vars[prop] = rootStyles.getPropertyValue(prop).trim();
      }
    }
    return vars;
  });

  // Build the context.md
  let md = `# Gosuslugi.ru Design Analysis\n\nGenerated: ${new Date().toISOString()}\n\n`;
  
  md += `## Color Palette\n\n`;
  md += `Primary colors found:\n\n`;
  analysis.colors.forEach(c => md += `- \`${c}\`\n`);
  
  md += `\n## Typography\n\n`;
  md += `### Font Families\n\n`;
  analysis.fontFamilies.forEach(f => md += `- ${f}\n`);
  
  md += `\n### Font Sizes (sorted)\n\n`;
  analysis.fontSizes.forEach(s => md += `- ${s}\n`);
  
  md += `\n### Font Weights\n\n`;
  analysis.fontWeights.forEach(w => md += `- ${w}\n`);
  
  md += `\n## Spacing System\n\n`;
  md += `Sample spacing values:\n\n`;
  analysis.spacings.forEach(s => md += `- ${s}\n`);
  
  md += `\n### Border Radius\n\n`;
  analysis.borderRadius.forEach(r => md += `- ${r}\n`);
  
  md += `\n## CSS Custom Properties\n\n`;
  Object.entries(cssVars).forEach(([k, v]) => md += `- \`${k}\`: \`${v}\`\n`);
  
  md += `\n## Layout Patterns\n\n`;
  md += `- Viewport: ${htmlStructure.metaViewport}\n`;
  md += `- Body classes: ${htmlStructure.bodyClasses}\n`;
  md += `- Has <main>: ${htmlStructure.hasMain}\n`;
  md += `- Has <footer>: ${htmlStructure.hasFooter}\n`;
  
  md += `\n### Header Structure (first 3000 chars)\n\n\`\`\`html\n${htmlStructure.headerHTML}\n\`\`\`\n`;
  
  md += `\n## UI Component Patterns\n\n`;
  md += `- Card-based layout with rounded corners\n`;
  md += `- Clean white cards on light gray backgrounds\n`;
  md += `- Government-style official aesthetic\n`;
  md += `- Blue primary action colors\n`;
  md += `- Clear visual hierarchy\n`;
  
  md += `\n## Animation Patterns\n\n`;
  const animations = await page.evaluate(() => {
    const anims = new Set();
    document.querySelectorAll('*').forEach(el => {
      const computed = window.getComputedStyle(el);
      if (computed.transition && computed.transition !== 'none' && computed.transition !== 'all 0s ease 0s') {
        anims.add(computed.transition);
      }
      if (computed.animation && computed.animation !== 'none') {
        anims.add(computed.animation);
      }
    });
    return [...anims].slice(0, 30);
  });
  animations.forEach(a => md += `- ${a}\n`);

  fs.writeFileSync(contextFile, md, 'utf8');
  console.log(`Context written to: ${contextFile}`);

  await browser.close();
}

main().catch(console.error);
