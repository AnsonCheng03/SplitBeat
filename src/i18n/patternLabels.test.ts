import assert from 'node:assert/strict';
import test from 'node:test';
import { patternSelectionLabel } from '@/i18n/patternLabels';
import { translate } from '@/i18n/translation';

test('pattern selection accessibility labels localize notes, rests, and generated mixtures', () => {
  const t = (source: string, values?: Record<string, string | number>) => translate('zh-Hant', source, values);

  const quarter = patternSelectionLabel({ subdivision: 'quarter', rest: false }, t);
  assert.equal(quarter, '四分音符');
  assert.equal(t('Select {pattern}', { pattern: quarter }), '選擇四分音符');
  assert.equal(patternSelectionLabel({ subdivision: 'eighth', rest: true }, t), '休止');
  assert.equal(patternSelectionLabel({
    subdivision: 'quarter',
    mixture: 'semiquaverDemisemiquaverRestDemisemiquaver',
    rest: false,
  }, t), '十六分音符 + 三十二分休止符 + 三十二分音符');
});
