import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveLocale, translate } from './translation';

test('system language follows Chinese device locales and falls back to English otherwise', () => {
  assert.equal(resolveLocale('system', 'zh-HK'), 'zh-Hant');
  assert.equal(resolveLocale('system', 'zh-Hans-CN'), 'zh-Hant');
  assert.equal(resolveLocale('system', 'en-US'), 'en');
});

test('an explicit language preference overrides the device language', () => {
  assert.equal(resolveLocale('en', 'zh-HK'), 'en');
  assert.equal(resolveLocale('zh-Hant', 'en-US'), 'zh-Hant');
});

test('Traditional Chinese translations preserve English fallback for untranslated text', () => {
  assert.equal(translate('zh-Hant', 'START PRACTICE'), '開始練習');
  assert.equal(translate('zh-Hant', 'A user imported title'), 'A user imported title');
  assert.equal(translate('en', 'START PRACTICE'), 'START PRACTICE');
});

test('translations interpolate named values in the translated phrase', () => {
  assert.equal(translate('zh-Hant', 'COMPLETE LESSON {number} FIRST', { number: 4 }), '請先完成第 4 堂');
  assert.equal(translate('en', 'Lesson {number}', { number: 12 }), 'Lesson 12');
});

test('saved result practice actions are localized and keep their bar number', () => {
  assert.equal(translate('zh-Hant', 'Saved later'), '稍後練習');
  assert.equal(translate('zh-Hant', 'Save bar {bar} for later practice', { bar: 3 }), '儲存第 3 小節以便稍後練習');
});
