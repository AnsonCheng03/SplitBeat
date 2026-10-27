import { SESSION_END_BAR_OPTIONS } from '@/types/rhythm';

export const SESSION_END_MODES = [
  { label: 'Time', value: 'time' },
  { label: 'Bars', value: 'bars' },
] as const;

export const SESSION_DURATION_OPTIONS = [
  { label: '30 sec', value: 30 },
  { label: '60 sec', value: 60 },
  { label: '2 min', value: 120 },
  { label: 'Endless', value: 'endless' },
] as const;

export const SESSION_BAR_COUNT_OPTIONS = SESSION_END_BAR_OPTIONS.map((value) => ({
  label: value === 1 ? '1 bar' : '{count} bars',
  value,
}));
