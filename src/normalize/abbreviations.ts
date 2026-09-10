export function expandAbbreviations(
  text: string,
  map: Record<string, string>
): string {
  return text
    .split(' ')
    .map((token) => {
      const key = token.toLowerCase().replace(/\.$/, '');
      const expanded = map[key];
      return expanded !== undefined ? expanded : token;
    })
    .join(' ');
}
