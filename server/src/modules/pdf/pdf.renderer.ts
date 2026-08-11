import puppeteer, { Browser } from 'puppeteer-core';
import fs from 'fs';

/**
 * Résolution du binaire Chromium sans téléchargement :
 * 1. Variable d'environnement PUPPETEER_EXECUTABLE_PATH
 * 2. Chromium Playwright déjà installé sur le VPS (~/.cache/ms-playwright)
 * 3. Binaires système usuels
 */
const CHROMIUM_CANDIDATES: string[] = [
  process.env.PUPPETEER_EXECUTABLE_PATH || '',
  '/root/.cache/puppeteer/chrome/linux-*/chrome-linux64/chrome',
  '/usr/bin/chromium',
  '/usr/bin/chromium-browser',
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].filter(Boolean);

let browserInstance: Browser | null = null;

/**
 * Recherche récursive du binaire Chromium dans les caches Playwright/Puppeteer :
 * ~/.cache/ms-playwright/chromium-<rev>/chrome-linux<64>/chrome
 * ~/.cache/ms-playwright/chromium_headless_shell-<rev>/chrome-linux<64>/headless_shell
 */
function findInCache(cacheRoot: string): string | null {
  try {
    if (!fs.existsSync(cacheRoot)) return null;
    for (const entry of fs.readdirSync(cacheRoot)) {
      if (!/^chromium/.test(entry)) continue;
      const dir = `${cacheRoot}/${entry}`;
      try {
        for (const sub of fs.readdirSync(dir)) {
          if (!/^chrome-linux/.test(sub)) continue;
          const binDir = `${dir}/${sub}`;
          for (const bin of ['chrome', 'headless_shell', 'chrome-headless-shell']) {
            const full = `${binDir}/${bin}`;
            if (fs.existsSync(full)) return full;
          }
        }
      } catch {
        /* continue */
      }
    }
  } catch {
    return null;
  }
  return null;
}

function resolveExecutable(): string | null {
  const home = process.env.HOME || '/root';
  const cacheRoots = [
    `${home}/.cache/ms-playwright`,
    `${home}/.cache/puppeteer`,
  ];
  for (const root of cacheRoots) {
    const found = findInCache(root);
    if (found) return found;
  }
  for (const candidate of CHROMIUM_CANDIDATES) {
    try {
      if (candidate.includes('*')) {
        const base = candidate.split('*')[0];
        if (fs.existsSync(base)) {
          for (const entry of fs.readdirSync(base)) {
            const full = candidate.replace('*', entry);
            if (fs.existsSync(full)) return full;
          }
        }
        continue;
      }
      if (fs.existsSync(candidate)) return candidate;
    } catch {
      /* continue */
    }
  }
  return null;
}

export class PuppeteerRenderer {
  private async getBrowser(): Promise<Browser> {
    if (browserInstance && browserInstance.connected) {
      return browserInstance;
    }

    const executablePath = resolveExecutable();
    if (!executablePath) {
      throw new Error('Chromium introuvable pour la génération PDF Puppeteer');
    }

    browserInstance = await puppeteer.launch({
      executablePath,
      headless: true,
      timeout: 60000,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--font-render-hinting=none',
        '--disable-gpu',
      ],
    });

    browserInstance.on('disconnected', () => {
      browserInstance = null;
    });

    return browserInstance;
  }

  /**
   * Rend du HTML en PDF (A4, fond imprimé, marges zéro gérées dans le HTML)
   */
  async renderHtml(html: string): Promise<Buffer> {
    const browser = await this.getBrowser();
    const page = await browser.newPage();
    try {
      page.setDefaultTimeout(30000);
      await page.setContent(html, { waitUntil: 'load', timeout: 30000 });
      const pdf = await page.pdf({
        format: 'A4',
        printBackground: true,
        preferCSSPageSize: false,
        margin: { top: '0mm', right: '0mm', bottom: '0mm', left: '0mm' },
      });
      return Buffer.from(pdf);
    } finally {
      await page.close().catch(() => {});
    }
  }

  /** Ferme proprement le navigateur (utilisé lors des tests / arrêts) */
  async close(): Promise<void> {
    if (browserInstance && browserInstance.connected) {
      await browserInstance.close().catch(() => {});
    }
    browserInstance = null;
  }
}

export const pdfRenderer = new PuppeteerRenderer();
