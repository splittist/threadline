import DOMPurify from 'dompurify'

/**
 * Sanitizes HTML content to prevent XSS attacks
 */
export function sanitizeHTML(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: [
      'p',
      'br',
      'strong',
      'em',
      'u',
      'span',
      'div',
      'h1',
      'h2',
      'h3',
      'ul',
      'ol',
      'li',
    ],
    ALLOWED_ATTR: ['class', 'style'],
  })
}

/**
 * Sanitizes text content
 */
export function sanitizeText(text: string): string {
  return DOMPurify.sanitize(text, { ALLOWED_TAGS: [] })
}
