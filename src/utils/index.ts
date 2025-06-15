export { Logger } from './logger';

export function format_date(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function capitalize_first_letter(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

export function is_valid_email(email: string): boolean {
  const email_regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return email_regex.test(email);
}