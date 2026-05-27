import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const CURRENCY_SYMBOL_MAP: Record<string, string> = {
  INR: '₹', USD: '$', EUR: '€', GBP: '£',
  AED: 'د.إ', SGD: 'S$', AUD: 'A$', CAD: 'C$', JPY: '¥',
}

export function currencySymbol(code: string): string {
  return CURRENCY_SYMBOL_MAP[code] ?? code
}

export function formatCurrency(amount: number, currencyCode: string): string {
  const sym = currencySymbol(currencyCode)
  return `${sym}${amount.toFixed(2)}`
}
