import { LaunchOptions } from 'puppeteer';

export function getPuppeteerLaunchOptions(): LaunchOptions {
  return {
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  };
}
