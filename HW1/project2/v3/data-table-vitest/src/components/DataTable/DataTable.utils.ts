// ════════════════════════════════════════════════════════════════════════════════
// UTILITY FUNCTIONS
// ════════════════════════════════════════════════════════════════════════════════

/**
 * Compares two values for sorting with type-aware comparison
 * Returns negative if a < b, positive if a > b, 0 if equal
 */
export function compareValues(a: unknown, b: unknown, direction: 'asc' | 'desc'): number {
  // Handle null/undefined - always sort to end
  const aIsNullish = a === null || a === undefined;
  const bIsNullish = b === null || b === undefined;

  if (aIsNullish && bIsNullish) return 0;
  if (aIsNullish) return 1; // nulls always last
  if (bIsNullish) return -1;

  let comparison = 0;

  // Numeric comparison
  if (typeof a === 'number' && typeof b === 'number') {
    comparison = a - b;
  }
  // Boolean comparison
  else if (typeof a === 'boolean' && typeof b === 'boolean') {
    comparison = (a === b) ? 0 : a ? -1 : 1;
  }
  // Try date parsing for strings that look like dates
  else if (typeof a === 'string' && typeof b === 'string') {
    const dateA = Date.parse(a);
    const dateB = Date.parse(b);

    if (!isNaN(dateA) && !isNaN(dateB) && a.match(/^\d{4}-\d{2}-\d{2}/)) {
      comparison = dateA - dateB;
    } else {
      // Default string comparison (locale-aware)
      comparison = a.localeCompare(b, undefined, { sensitivity: 'base' });
    }
  }
  // Fallback: convert to string
  else {
    comparison = String(a).localeCompare(String(b), undefined, { sensitivity: 'base' });
  }

  return direction === 'asc' ? comparison : -comparison;
}

/**
 * Clamps a number between min and max (inclusive)
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
