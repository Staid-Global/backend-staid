import puppeteer, { LaunchOptions } from 'puppeteer';

const DEFAULT_CHROME_PATHS = [
  '/usr/bin/google-chrome-stable',
  '/usr/bin/google-chrome',
  '/usr/bin/chromium-browser',
  '/usr/bin/chromium',
];

export function getPuppeteerLaunchOptions(): LaunchOptions {
  const configuredPath = process.env.PUPPETEER_EXECUTABLE_PATH?.trim();
  let executablePath = configuredPath || '';

  if (!executablePath) {
    try {
      executablePath = puppeteer.executablePath();
    } catch {
      executablePath = '';
    }
  }

  if (!executablePath) {
    executablePath = DEFAULT_CHROME_PATHS.find(Boolean) || '';
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
