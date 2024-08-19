/**
 * Escapes a string to be used in a SQL query.
 */
export function escape(text: string): string {
  return text.replace(/\0/g, '\\x00');
}

/**
 *  Unescapes a string that was escaped with `escape`.
 */
export function unescape(text: string): string {
  return text.replace(/\\x00/g, '\0');
}
