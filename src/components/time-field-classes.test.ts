import { describe, expect, it } from 'vitest';
import {
  dayPeriodNames,
  draftFromTime,
  draftTime,
  from12,
  hourAdvances,
  hourCycleFor,
  hourText,
  inTimeRange,
  lastMinute,
  normalizeStep,
  parseTime,
  stepHour,
  stepMinute,
  to12,
  toTime,
} from './time-field-classes';

describe('parseTime and toTime', () => {
  it('parses valid HH:mm', () => {
    expect(parseTime('09:05')).toEqual({ h: 9, m: 5 });
    expect(parseTime('23:59')).toEqual({ h: 23, m: 59 });
    expect(parseTime('00:00')).toEqual({ h: 0, m: 0 });
  });
  it('rejects the rest', () => {
    for (const s of ['24:00', '9:05', '09:60', '', 'ab:cd', '09:05:00']) expect(parseTime(s)).toBeNull();
    expect(parseTime(null)).toBeNull();
    expect(parseTime(undefined)).toBeNull();
  });
  it('pads', () => expect(toTime(9, 5)).toBe('09:05'));
});

describe('inTimeRange', () => {
  it('checks both limits', () => {
    expect(inTimeRange('10:00', '09:00', '17:00')).toBe(true);
    expect(inTimeRange('08:59', '09:00', '17:00')).toBe(false);
    expect(inTimeRange('17:01', '09:00', '17:00')).toBe(false);
    expect(inTimeRange('09:00', '09:00', '17:00')).toBe(true);
  });
  it('ignores invalid or missing limits', () => {
    expect(inTimeRange('00:00', 'junk', null)).toBe(true);
    expect(inTimeRange('23:59', undefined, '9:00')).toBe(true);
  });
});

describe('locale clock', () => {
  it('hourCycleFor', () => {
    expect(hourCycleFor('en-US')).toBe(12);
    expect(hourCycleFor('de-DE')).toBe(24);
    expect(hourCycleFor('en-GB')).toBe(24);
    expect(hourCycleFor('ja-JP')).toBe(24);
    expect(hourCycleFor('not a locale!!')).toBe(24);
    expect(hourCycleFor('en-US')).toBe(12); // cached
  });
  it('dayPeriodNames', () => {
    expect(dayPeriodNames('en-US')).toEqual(['AM', 'PM']);
    expect(dayPeriodNames('en-US')).toBe(dayPeriodNames('en-US'));
    expect(dayPeriodNames('ja-JP')).toEqual(['午前', '午後']);
    expect(dayPeriodNames('not a locale!!')).toEqual(['AM', 'PM']);
  });
});

describe('12-hour conversion', () => {
  it('known values', () => {
    expect(to12(0)).toEqual({ hour: 12, pm: false });
    expect(to12(12)).toEqual({ hour: 12, pm: true });
    expect(to12(13)).toEqual({ hour: 1, pm: true });
    expect(from12(12, false)).toBe(0);
    expect(from12(12, true)).toBe(12);
  });
  it('round trips 0-23', () => {
    for (let h = 0; h < 24; h++) {
      const { hour, pm } = to12(h);
      expect(from12(hour, pm)).toBe(h);
    }
  });
});

describe('stepping', () => {
  it('normalizeStep', () => {
    expect(normalizeStep(undefined)).toBe(1);
    expect(normalizeStep(0)).toBe(1);
    expect(normalizeStep(15)).toBe(15);
    expect(normalizeStep(90)).toBe(60);
    expect(normalizeStep(Number.NaN)).toBe(1);
    expect(normalizeStep(7.9)).toBe(7);
  });
  it('lastMinute', () => {
    expect(lastMinute(1)).toBe(59);
    expect(lastMinute(7)).toBe(56);
    expect(lastMinute(15)).toBe(45);
    expect(lastMinute(60)).toBe(0);
  });
  it('stepHour', () => {
    expect(stepHour(23, 1)).toBe(0);
    expect(stepHour(0, -1)).toBe(23);
    expect(stepHour(9, 1)).toBe(10);
    expect(stepHour(null, 1)).toBe(0);
    expect(stepHour(null, -1)).toBe(23);
  });
  it('stepMinute', () => {
    expect(stepMinute(7, 1, 15)).toBe(15);
    expect(stepMinute(7, -1, 15)).toBe(0);
    expect(stepMinute(0, -1, 15)).toBe(45);
    expect(stepMinute(45, 1, 15)).toBe(0);
    expect(stepMinute(59, 1, 1)).toBe(0);
    expect(stepMinute(null, -1, 7)).toBe(56);
    expect(stepMinute(null, 1, 7)).toBe(0);
  });
});

describe('drafts', () => {
  it('hourText', () => {
    expect(hourText(9, 24)).toBe('09');
    expect(hourText(9, 12)).toBe('9');
    expect(hourText(0, 12)).toBe('12');
    expect(hourText(15, 12)).toBe('3');
  });
  it('draftFromTime', () => {
    expect(draftFromTime(null, 24)).toEqual({ h: '', m: '', pm: false });
    expect(draftFromTime('15:05', 12)).toEqual({ h: '3', m: '05', pm: true });
    expect(draftFromTime('09:30', 24)).toEqual({ h: '09', m: '30', pm: false });
    expect(draftFromTime('bad', 24)).toEqual({ h: '', m: '', pm: false });
  });
  it('draftTime', () => {
    expect(draftTime({ h: '', m: '', pm: false }, 24)).toBeNull();
    expect(draftTime({ h: '', m: '30', pm: false }, 24)).toBeUndefined();
    expect(draftTime({ h: '9', m: '', pm: false }, 24)).toBeUndefined();
    expect(draftTime({ h: 'ab', m: '30', pm: false }, 24)).toBeUndefined();
    expect(draftTime({ h: '9', m: '300', pm: false }, 24)).toBeUndefined();
    expect(draftTime({ h: '9', m: '60', pm: false }, 24)).toBeUndefined();
    expect(draftTime({ h: '0', m: '30', pm: false }, 12)).toBeUndefined();
    expect(draftTime({ h: '13', m: '30', pm: false }, 12)).toBeUndefined();
    expect(draftTime({ h: '12', m: '00', pm: false }, 12)).toBe('00:00');
    expect(draftTime({ h: '12', m: '00', pm: true }, 12)).toBe('12:00');
    expect(draftTime({ h: '3', m: '5', pm: true }, 12)).toBe('15:05');
    expect(draftTime({ h: '24', m: '00', pm: false }, 24)).toBeUndefined();
    expect(draftTime({ h: '23', m: '59', pm: false }, 24)).toBe('23:59');
  });
  it('hourAdvances', () => {
    expect(hourAdvances('', 24)).toBe(false);
    expect(hourAdvances('1', 24)).toBe(false);
    expect(hourAdvances('2', 24)).toBe(false);
    expect(hourAdvances('3', 24)).toBe(true);
    expect(hourAdvances('1', 12)).toBe(false);
    expect(hourAdvances('2', 12)).toBe(true);
    expect(hourAdvances('3', 12)).toBe(true);
    expect(hourAdvances('09', 24)).toBe(true);
  });
});
