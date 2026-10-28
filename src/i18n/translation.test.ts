import assert from 'node:assert/strict';
import test from 'node:test';
import { COMPOSER_TUPLET_SYMBOLS, NOTE_VALUE_SYMBOLS } from '@/rhythm/scoreComposer';
import { SUBDIVISION_LABELS } from '@/rhythm/subdivisions';
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
  assert.equal(translate('zh-Hant', 'Tap tempo'), '點按設定速度');
  assert.equal(translate('zh-Hant', 'CALIBRATE TIMING'), '校準節奏');
  assert.equal(translate('zh-Hant', 'Preparing your practice…'), '正在準備練習…');
  assert.equal(translate('zh-Hant', 'Preparing your score.'), '正在準備樂譜。');
  assert.equal(translate('zh-Hant', 'Preparing your lesson.'), '正在準備課程。');
  assert.equal(translate('zh-Hant', 'Preparing your score library.'), '正在準備樂譜庫。');
  assert.equal(translate('zh-Hant', 'Loading your course progress.'), '正在載入課程進度。');
  assert.equal(translate('zh-Hant', 'Every 5th lesson is a 5-star checkpoint.'), '每第 5 堂課都是五星挑戰關卡。');
  assert.equal(translate('zh-Hant', 'Earn 5 stars here to unlock every earlier lesson.'), '在這裡取得 5 顆星，即可解鎖所有較早的課堂。');
  assert.equal(translate('zh-Hant', 'Five-star checkpoint passed. All earlier lessons are now unlocked.'), '五星挑戰成功，所有較早的課堂已解鎖。');
  assert.equal(translate('zh-Hant', 'RETRY CHECKPOINT'), '重試挑戰關卡');
  assert.equal(translate('zh-Hant', 'Starting your practice…'), '正在開始練習…');
  assert.equal(translate('zh-Hant', 'A user imported title'), 'A user imported title');
  assert.equal(translate('en', 'START PRACTICE'), 'START PRACTICE');
});

test('translations interpolate named values in the translated phrase', () => {
  assert.equal(translate('zh-Hant', 'COMPLETE LESSON {number} FIRST', { number: 4 }), '請先完成第 4 堂');
  assert.equal(translate('en', 'Lesson {number}', { number: 12 }), 'Lesson 12');
});

test('beat position labels cover every beat count used by supported meters', () => {
  for (const beatsPerBar of [2, 3, 4, 5, 7]) {
    for (let beat = 1; beat <= beatsPerBar; beat += 1) {
      const values = { beat, count: beatsPerBar };
      assert.equal(translate('en', 'Beat {beat} of {count}', values), `Beat ${beat} of ${beatsPerBar}`);
      assert.equal(translate('zh-Hant', 'Beat {beat} of {count}', values), `第 ${beat} / ${beatsPerBar} 拍`);
    }
  }
  assert.equal(translate('zh-Hant', 'NEXT CHANGE'), '下次切換');
});

test('saved result practice actions are localized and keep their bar number', () => {
  assert.equal(translate('zh-Hant', 'Saved later'), '稍後練習');
  assert.equal(translate('zh-Hant', 'Save bar {bar} for later practice', { bar: 3 }), '儲存第 3 小節以便稍後練習');
});

test('all rhythm symbols exposed by the pattern picker have Traditional Chinese labels', () => {
  const labels = [
    ...Object.values(SUBDIVISION_LABELS),
    ...NOTE_VALUE_SYMBOLS.map(({ label }) => label),
    ...NOTE_VALUE_SYMBOLS.map(({ label }) => `${label} rest`),
    ...COMPOSER_TUPLET_SYMBOLS.map(({ label }) => label),
    'Rest',
  ];
  const untranslated = [...new Set(labels)].filter((label) => translate('zh-Hant', label) === label);

  assert.deepEqual(untranslated, []);
});
