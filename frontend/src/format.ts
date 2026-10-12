// Prices in the way Indian buyers read them: crore (1,00,00,000) and lakh (1,00,000).
export function formatPrice(rupees: number): string {
  if (rupees >= 1_00_00_000) {
    const cr = rupees / 1_00_00_000
    return `₹${trimZeros(cr.toFixed(2))} Cr`
  }
  if (rupees >= 1_00_000) {
    const lakh = rupees / 1_00_000
    return `₹${trimZeros(lakh.toFixed(2))} L`
  }
  return `₹${rupees.toLocaleString('en-IN')}`
}

/** "7.50" -> "7.5", "12.00" -> "12" */
function trimZeros(n: string): string {
  return n.replace(/\.?0+$/, '')
}

/** Full figure with Indian digit grouping, e.g. ₹7,25,00,000 */
export function formatPriceFull(rupees: number): string {
  return `₹${rupees.toLocaleString('en-IN')}`
}

export function formatSqft(sqft: number): string {
  return `${sqft.toLocaleString('en-IN')} sq ft`
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function plural(n: number, word: string, pluralWord = `${word}s`): string {
  return `${n} ${n === 1 ? word : pluralWord}`
}
