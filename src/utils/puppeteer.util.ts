import puppeteer, { LaunchOptions } from 'puppeteer';
import { existsSync } from 'fs';

const DEFAULT_CHROME_PATHS = [
  '/usr/bin/google-chrome-stable',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium-browser',
  '/usr/bin/chromium',
];

export function getPuppeteerLaunchOptions(): LaunchOptions {
  const configuredPath = process.env.PUPPETEER_EXECUTABLE_PATH?.trim();
  let executablePath = '';

  if (configuredPath && existsSync(configuredPath)) {
    executablePath = configuredPath;
  }

  if (!executablePath) {
    try {
      const detectedPath = puppeteer.executablePath();
      if (detectedPath && existsSync(detectedPath)) {
        executablePath = detectedPath;
      }
    } catch {
      // Ignore and continue to fallback paths
    }
  }

  if (!executablePath) {
    executablePath = DEFAULT_CHROME_PATHS.find((path) => existsSync(path)) || '';
  }

  const options: LaunchOptions = {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  };

  if (executablePath) {
    options.executablePath = executablePath;
  }

  return options;
}
