import assert from 'node:assert/strict';
import test from 'node:test';
import { gameCenterStatusMessage } from './gameCenterMessages';

test('Game Center authentication errors show actionable sign-in guidance', () => {
  assert.equal(
    gameCenterStatusMessage('The requested operation could not be completed because local player has not been authenticated.'),
    'Game Center sign-in did not complete. Check your Game Center account in iOS Settings, then try again.',
  );
});

test('other Game Center errors remain available to explain the failure', () => {
  assert.equal(gameCenterStatusMessage('Network connection was lost.'), 'Network connection was lost.');
  assert.equal(gameCenterStatusMessage(undefined), undefined);
});
