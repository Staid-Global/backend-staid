import puppeteer, { Browser, LaunchOptions } from 'puppeteer';
import { execSync } from 'child_process';
import { existsSync } from 'fs';

const SYSTEM_CHROME_PATH = '/usr/bin/google-chrome-stable';

export function getPuppeteerLaunchOptions(): LaunchOptions {
  const options: LaunchOptions = {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  };

  if (existsSync(SYSTEM_CHROME_PATH)) {
    options.executablePath = SYSTEM_CHROME_PATH;
  }

  return options;
}

function isMissingChromeError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return (
    message.includes('Could not find Chrome') ||
    message.includes('Browser was not found at the configured executablePath')
  );
}

function installChromeBinary(): void {
  execSync('npx puppeteer browsers install chrome', {
    stdio: 'inherit',
    env: {
      ...process.env,
      PUPPETEER_CACHE_DIR:
        process.env.PUPPETEER_CACHE_DIR || '/opt/render/.cache/puppeteer',
    },
  });
}

export async function launchPuppeteerBrowser(): Promise<Browser> {
  const options = getPuppeteerLaunchOptions();

  try {
    return await puppeteer.launch(options);
  } catch (error) {
    if (!isMissingChromeError(error)) {
      throw error;
    }

    installChromeBinary();
    return puppeteer.launch(getPuppeteerLaunchOptions());
  }
}
