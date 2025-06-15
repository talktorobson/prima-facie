import { Environment } from '../types';

export class Logger {
  private environment: Environment;

  constructor() {
    this.environment = (process.env.NODE_ENV as Environment) || 'development';
  }

  info(message: string, ...args: unknown[]): void {
    // eslint-disable-next-line no-console
    console.log(`[INFO] ${new Date().toISOString()} - ${message}`, ...args);
  }

  warn(message: string, ...args: unknown[]): void {
    console.warn(`[WARN] ${new Date().toISOString()} - ${message}`, ...args);
  }

  error(message: string, ...args: unknown[]): void {
    console.error(`[ERROR] ${new Date().toISOString()} - ${message}`, ...args);
  }

  debug(message: string, ...args: unknown[]): void {
    if (this.environment === 'development') {
      // eslint-disable-next-line no-console
      console.log(`[DEBUG] ${new Date().toISOString()} - ${message}`, ...args);
    }
  }
}