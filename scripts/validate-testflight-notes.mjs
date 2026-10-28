import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { readTestFlightNotes } from './testflight-notes.mjs';

const notesPath = new URL('../store/app-store/testflight-notes.md', import.meta.url);

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : '';
if (invokedPath && pathToFileURL(invokedPath).href === import.meta.url) {
  readTestFlightNotes(notesPath)
    .then((notes) => {
      console.log(`Validated TestFlight notes for ${[...notes.keys()].join(' and ')}.`);
    })
    .catch((error) => {
      console.error(error instanceof Error ? error.message : error);
      process.exitCode = 1;
    });
}
