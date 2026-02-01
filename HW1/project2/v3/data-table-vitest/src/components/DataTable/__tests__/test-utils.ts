/**
 * Test utilities for DataTable component tests
 */

/**
 * Custom text matcher for React Testing Library that handles text split across multiple elements.
 * Useful when styled text breaks content into multiple <span> elements.
 *
 * @param text - String or RegExp pattern to match
 * @returns Matcher function for use with getByText, findByText, etc.
 *
 * @example
 * // Instead of:
 * screen.getByText(/showing 1–5 of 20/i)  // Fails if text is split
 *
 * // Use:
 * screen.getByText(withSplitText(/showing 1–5 of 20/i))  // Works!
 */
export function withSplitText(text: string | RegExp) {
  return (_: string, element: Element | null) => {
    if (!element) return false;

    const elementText = element.textContent || '';

    // Check if this element's text matches
    const matches = typeof text === 'string'
      ? elementText.toLowerCase().includes(text.toLowerCase())
      : text.test(elementText);

    if (!matches) return false;

    // Only return true if none of the children also match
    // This ensures we get the most specific (leaf) element
    const childrenArray = Array.from(element.children);
    const childMatches = childrenArray.some(child => {
      const childText = child.textContent || '';
      return typeof text === 'string'
        ? childText.toLowerCase().includes(text.toLowerCase())
        : text.test(childText);
    });

    // Return true only if no children match (this is the leaf/target element)
    return !childMatches;
  };
}
