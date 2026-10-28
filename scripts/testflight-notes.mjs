import { readFile } from 'node:fs/promises';

const requiredLocales = ['en-US', 'zh-Hant'];
const maximumNoteLength = 4000;

export function parseTestFlightNotes(source) {
  const notes = new Map();
  let currentLocale;

  for (const rawLine of source.replaceAll('\r\n', '\n').split('\n')) {
    const localeHeading = rawLine.match(/^##\s+([a-z]{2}(?:-[A-Za-z0-9]+)*)\s*$/);
    if (localeHeading) {
      currentLocale = localeHeading[1];
      if (notes.has(currentLocale)) {
        throw new Error(`Duplicate TestFlight notes locale: ${currentLocale}`);
      }
      notes.set(currentLocale, []);
      continue;
    }

    if (currentLocale) notes.get(currentLocale).push(rawLine);
  }

  const localizedNotes = new Map();
  for (const locale of requiredLocales) {
    const lines = notes.get(locale);
    if (!lines) throw new Error(`Missing required TestFlight notes locale: ${locale}`);

    const text = lines.join('\n').trim();
    if (!text) throw new Error(`TestFlight notes for ${locale} cannot be empty.`);
    if (text.length > maximumNoteLength) {
      throw new Error(`TestFlight notes for ${locale} exceed ${maximumNoteLength} characters.`);
    }
    localizedNotes.set(locale, text);
  }

  return localizedNotes;
}

export async function readTestFlightNotes(path) {
  return parseTestFlightNotes(await readFile(path, 'utf8'));
}
