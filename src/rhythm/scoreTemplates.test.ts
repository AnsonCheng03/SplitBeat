import assert from 'node:assert/strict';
import test from 'node:test';
import {
  filterScoreTemplates,
  SCORE_TEMPLATE_CATEGORIES,
  SCORE_TEMPLATES,
} from '@/rhythm/scoreTemplates';

test('filters example scores by category', () => {
  const classical = filterScoreTemplates(SCORE_TEMPLATES, { category: 'Classical' });
  assert.deepEqual(classical.map(({ id }) => id), [
    'ode-to-joy-one-hand',
    'fur-elise-difficult-one-hand',
    'minuet-in-g-easy-duet',
  ]);
  const pop = filterScoreTemplates(SCORE_TEMPLATES, { category: 'Pop' });
  assert.ok(pop.length >= 3);
  assert.ok(pop.some(({ id }) => id === 'pop-groove-difficult-duet'));
  assert.ok(pop.some(({ id }) => id === 'three-lanterns-easy-duet'));
  assert.equal(filterScoreTemplates(SCORE_TEMPLATES, { category: 'All' }).length, SCORE_TEMPLATES.length);
});

test('provides at least three example songs in every category', () => {
  for (const category of SCORE_TEMPLATE_CATEGORIES) {
    assert.ok(
      filterScoreTemplates(SCORE_TEMPLATES, { category }).length >= 3,
      `${category} should have at least three example songs`,
    );
  }
});

test('combines tags with AND matching for difficulty and hand setup', () => {
  const difficultTwoHandScores = filterScoreTemplates(SCORE_TEMPLATES, {
    tags: ['Difficult', 'Both hands'],
  });
  assert.deepEqual(difficultTwoHandScores.map(({ id }) => id), [
    'pop-groove-difficult-duet',
    'triple-trail-medium-duet',
    'nine-bright-notes-medium-duet',
    'five-steps-home-medium-duet',
  ]);

  const easyOneHandScores = filterScoreTemplates(SCORE_TEMPLATES, {
    tags: ['Easy', 'One hand'],
  });
  assert.deepEqual(easyOneHandScores.map(({ id }) => id), [
    'ode-to-joy-one-hand',
    'mary-had-a-little-lamb-easy-one-hand',
  ]);
});

test('combines category and tags and allows empty results', () => {
  const classicalDifficult = filterScoreTemplates(SCORE_TEMPLATES, {
    category: 'Classical',
    tags: ['Difficult'],
  });
  assert.deepEqual(classicalDifficult.map(({ id }) => id), ['fur-elise-difficult-one-hand']);

  assert.deepEqual(filterScoreTemplates(SCORE_TEMPLATES, {
    category: 'Pop',
    tags: ['Holiday'],
  }), []);
});

test('example score metadata covers style, difficulty, and hand filters', () => {
  assert.ok(SCORE_TEMPLATES.every((template) => template.category.length > 0 && template.tags.length > 0));
  assert.ok(SCORE_TEMPLATES.some(({ tags }) => tags.includes('Easy')));
  assert.ok(SCORE_TEMPLATES.some(({ tags }) => tags.includes('Difficult')));
  assert.ok(SCORE_TEMPLATES.some(({ tags }) => tags.includes('One hand')));
  assert.ok(SCORE_TEMPLATES.some(({ tags }) => tags.includes('Both hands')));
});

test('keeps the difficult classical example in its written compound meter', () => {
  const furElise = SCORE_TEMPLATES.find(({ id }) => id === 'fur-elise-difficult-one-hand')!;
  assert.equal(furElise.score.timeSignature, '3/8');
  assert.equal(furElise.score.measures[0]!.durationQuarter, 1.5);
  assert.equal(furElise.score.measures[1]!.startQuarter, 1.5);
  assert.equal(furElise.score.totalQuarterNotes, 12);
});
