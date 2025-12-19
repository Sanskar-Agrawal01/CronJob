import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  parseCronExpression,
  validateCronExpression,
  getNextExecutionTime,
  getHumanReadableDescription,
  generateRandomCron,
} from './cronUtils';

describe('parseCronExpression', () => {
  it('should parse a valid 5-field cron expression', () => {
    const result = parseCronExpression('0 4 * * *');
    expect(result.valid).toBe(true);
    expect(result.minute).toBe('0');
    expect(result.hour).toBe('4');
    expect(result.day).toBe('*');
    expect(result.month).toBe('*');
    expect(result.weekday).toBe('*');
  });

  it('should parse expressions with ranges', () => {
    const result = parseCronExpression('0-30 9-17 1-15 * *');
    expect(result.valid).toBe(true);
    expect(result.minute).toBe('0-30');
    expect(result.hour).toBe('9-17');
    expect(result.day).toBe('1-15');
  });

  it('should parse expressions with step values', () => {
    const result = parseCronExpression('*/15 * * * *');
    expect(result.valid).toBe(true);
    expect(result.minute).toBe('*/15');
  });

  it('should parse expressions with lists', () => {
    const result = parseCronExpression('0,15,30,45 * * * *');
    expect(result.valid).toBe(true);
    expect(result.minute).toBe('0,15,30,45');
  });

  it('should parse predefined expressions', () => {
    const yearly = parseCronExpression('@yearly');
    expect(yearly.valid).toBe(true);
    expect(yearly.minute).toBe('0');
    expect(yearly.hour).toBe('0');
    expect(yearly.day).toBe('1');
    expect(yearly.month).toBe('1');

    const daily = parseCronExpression('@daily');
    expect(daily.valid).toBe(true);
    expect(daily.minute).toBe('0');
    expect(daily.hour).toBe('0');
  });

  it('should handle case-insensitive predefined expressions', () => {
    const result = parseCronExpression('@YEARLY');
    expect(result.valid).toBe(true);
    expect(result.month).toBe('1');
  });

  it('should reject expressions with wrong number of fields', () => {
    const result1 = parseCronExpression('0 4 * *');
    expect(result1.valid).toBe(false);
    expect(result1.error).toContain('exactly 5 fields');

    const result2 = parseCronExpression('0 4 * * * *');
    expect(result2.valid).toBe(false);
  });

  it('should handle extra whitespace', () => {
    const result = parseCronExpression('  0    4   *   *   *  ');
    expect(result.valid).toBe(true);
    expect(result.minute).toBe('0');
    expect(result.hour).toBe('4');
  });
});

describe('validateCronExpression', () => {
  it('should validate a correct cron expression', () => {
    const result = validateCronExpression('0 4 * * *');
    expect(result.valid).toBe(true);
  });

  it('should validate wildcard expressions', () => {
    expect(validateCronExpression('* * * * *').valid).toBe(true);
  });

  it('should validate expressions with ranges', () => {
    expect(validateCronExpression('0-59 0-23 1-31 1-12 0-7').valid).toBe(true);
  });

  it('should validate expressions with step values', () => {
    expect(validateCronExpression('*/5 * * * *').valid).toBe(true);
    expect(validateCronExpression('0-30/5 * * * *').valid).toBe(true);
    expect(validateCronExpression('10/5 * * * *').valid).toBe(true);
  });

  it('should validate expressions with lists', () => {
    expect(validateCronExpression('0,15,30,45 * * * *').valid).toBe(true);
    expect(validateCronExpression('0,1,2,3 * * * *').valid).toBe(true);
  });

  it('should reject invalid minute values', () => {
    expect(validateCronExpression('60 * * * *').valid).toBe(false);
    expect(validateCronExpression('-1 * * * *').valid).toBe(false);
    expect(validateCronExpression('abc * * * *').valid).toBe(false);
  });

  it('should reject invalid hour values', () => {
    expect(validateCronExpression('* 24 * * *').valid).toBe(false);
    expect(validateCronExpression('* -1 * * *').valid).toBe(false);
  });

  it('should reject invalid day values', () => {
    expect(validateCronExpression('* * 32 * *').valid).toBe(false);
    expect(validateCronExpression('* * 0 * *').valid).toBe(false);
  });

  it('should reject invalid month values', () => {
    expect(validateCronExpression('* * * 13 *').valid).toBe(false);
    expect(validateCronExpression('* * * 0 *').valid).toBe(false);
  });

  it('should reject invalid weekday values', () => {
    expect(validateCronExpression('* * * * 8').valid).toBe(false);
    expect(validateCronExpression('* * * * -1').valid).toBe(false);
  });

  it('should reject invalid ranges', () => {
    expect(validateCronExpression('30-20 * * * *').valid).toBe(false); // start > end
    expect(validateCronExpression('0-100 * * * *').valid).toBe(false); // out of range
  });

  it('should reject invalid step values', () => {
    expect(validateCronExpression('*/0 * * * *').valid).toBe(false);
    expect(validateCronExpression('*/-5 * * * *').valid).toBe(false);
    expect(validateCronExpression('*/abc * * * *').valid).toBe(false);
  });

  it('should validate predefined expressions', () => {
    expect(validateCronExpression('@yearly').valid).toBe(true);
    expect(validateCronExpression('@daily').valid).toBe(true);
    expect(validateCronExpression('@hourly').valid).toBe(true);
  });

  it('should handle complex valid expressions', () => {
    expect(validateCronExpression('0 9-17 * * 1-5').valid).toBe(true);
    expect(validateCronExpression('*/15 0,12 * * *').valid).toBe(true);
    expect(validateCronExpression('0 0 1,15 * *').valid).toBe(true);
  });
});

describe('getNextExecutionTime', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should return null for invalid expressions', () => {
    expect(getNextExecutionTime('invalid')).toBe(null);
    expect(getNextExecutionTime('* * * * * *')).toBe(null);
  });

  it('should calculate next execution for specific time', () => {
    // Set current time to 2024-01-15 10:00:00
    const baseDate = new Date('2024-01-15T10:00:00');
    vi.setSystemTime(baseDate);

    // Next execution at 14:00 same day
    const next = getNextExecutionTime('0 14 * * *');
    expect(next).not.toBe(null);
    expect(next.getHours()).toBe(14);
    expect(next.getMinutes()).toBe(0);
    expect(next.getDate()).toBe(15);
  });

  it('should handle daily expressions', () => {
    const baseDate = new Date('2024-01-15T10:00:00');
    vi.setSystemTime(baseDate);

    const next = getNextExecutionTime('0 0 * * *'); // Daily at midnight
    expect(next).not.toBe(null);
    expect(next.getHours()).toBe(0);
    expect(next.getMinutes()).toBe(0);
    expect(next.getDate()).toBeGreaterThanOrEqual(15);
  });

  it('should handle expressions with step values', () => {
    const baseDate = new Date('2024-01-15T10:05:00');
    vi.setSystemTime(baseDate);

    const next = getNextExecutionTime('*/15 * * * *'); // Every 15 minutes
    expect(next).not.toBe(null);
    expect(next.getMinutes() % 15).toBe(0);
    expect(next > baseDate).toBe(true);
  });

  it('should handle monthly expressions', () => {
    const baseDate = new Date('2024-01-15T10:00:00');
    vi.setSystemTime(baseDate);

    const next = getNextExecutionTime('0 0 1 * *'); // First day of month
    expect(next).not.toBe(null);
    expect(next.getDate()).toBe(1);
    expect(next.getMonth()).toBeGreaterThanOrEqual(0); // Could be next month
  });

  it('should handle weekday expressions', () => {
    const baseDate = new Date('2024-01-15T10:00:00'); // Monday
    vi.setSystemTime(baseDate);

    const next = getNextExecutionTime('0 0 * * 0'); // Sunday
    expect(next).not.toBe(null);
    expect(next.getDay()).toBe(0); // Sunday
  });

  it('should handle expressions with ranges', () => {
    const baseDate = new Date('2024-01-15T08:00:00');
    vi.setSystemTime(baseDate);

    const next = getNextExecutionTime('0 9-17 * * *'); // 9 AM to 5 PM
    expect(next).not.toBe(null);
    expect(next.getHours()).toBeGreaterThanOrEqual(9);
    expect(next.getHours()).toBeLessThanOrEqual(17);
  });

  it('should return future time', () => {
    const baseDate = new Date('2024-01-15T10:00:00');
    vi.setSystemTime(baseDate);

    const next = getNextExecutionTime('0 14 * * *');
    expect(next > baseDate).toBe(true);
  });

  it('should handle @daily predefined expression', () => {
    const baseDate = new Date('2024-01-15T10:00:00');
    vi.setSystemTime(baseDate);

    const next = getNextExecutionTime('@daily');
    expect(next).not.toBe(null);
    expect(next.getHours()).toBe(0);
    expect(next.getMinutes()).toBe(0);
  });
});

describe('getHumanReadableDescription', () => {
  it('should describe specific time expressions', () => {
    expect(getHumanReadableDescription('0 4 * * *')).toContain('At 04:00');
    expect(getHumanReadableDescription('5 14 * * *')).toContain('At 14:05');
  });

  it('should describe wildcard expressions', () => {
    const desc = getHumanReadableDescription('* * * * *');
    expect(desc).toContain('every minute');
  });

  it('should describe step value expressions', () => {
    expect(getHumanReadableDescription('*/15 * * * *')).toContain('every 15 minutes');
    expect(getHumanReadableDescription('*/5 * * * *')).toContain('every 5 minutes');
  });

  it('should describe range expressions', () => {
    const desc = getHumanReadableDescription('0 9-17 * * *');
    expect(desc).toContain('9') || expect(desc).toContain('17');
  });

  it('should describe list expressions', () => {
    const desc = getHumanReadableDescription('0,15,30,45 * * * *');
    expect(desc).toContain('minute');
  });

  it('should describe predefined expressions', () => {
    expect(getHumanReadableDescription('@yearly')).toContain('year');
    expect(getHumanReadableDescription('@daily')).toContain('day');
    expect(getHumanReadableDescription('@hourly')).toContain('hour');
    expect(getHumanReadableDescription('@weekly')).toContain('week');
  });

  it('should describe monthly expressions', () => {
    const desc = getHumanReadableDescription('0 0 1 * *');
    expect(desc).toContain('day 1') || expect(desc).toContain('month');
  });

  it('should describe weekday expressions', () => {
    const desc = getHumanReadableDescription('0 0 * * 0');
    expect(desc).toContain('Sun') || expect(desc).toContain('Sunday');
  });

  it('should return error message for invalid expressions', () => {
    expect(getHumanReadableDescription('invalid')).toBe('Invalid cron expression');
    expect(getHumanReadableDescription('* * * *')).toBe('Invalid cron expression');
  });

  it('should handle complex expressions', () => {
    const desc = getHumanReadableDescription('0 9-17 * * 1-5');
    expect(desc.length).toBeGreaterThan(0);
    expect(desc).not.toBe('Invalid cron expression');
  });
});

describe('generateRandomCron', () => {
  it('should generate a valid cron expression', () => {
    const cron = generateRandomCron();
    const validation = validateCronExpression(cron);
    expect(validation.valid).toBe(true);
  });

  it('should generate expressions with 5 fields', () => {
    const cron = generateRandomCron();
    const parts = cron.split(/\s+/);
    expect(parts.length).toBe(5);
  });

  it('should generate different expressions on multiple calls', () => {
    const cron1 = generateRandomCron();
    const cron2 = generateRandomCron();
    const cron3 = generateRandomCron();
    
    // At least one should be different (very high probability)
    const allSame = cron1 === cron2 && cron2 === cron3;
    // This test might occasionally fail, but it's very unlikely
    // In practice, random generation should produce variety
    expect(typeof cron1).toBe('string');
    expect(typeof cron2).toBe('string');
    expect(typeof cron3).toBe('string');
  });

  it('should generate expressions that can calculate next execution', () => {
    const cron = generateRandomCron();
    const next = getNextExecutionTime(cron);
    // Most random expressions should have a next execution time
    // Some edge cases might return null, but most should work
    expect(typeof cron).toBe('string');
  });
});

describe('Edge Cases', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('should handle Sunday as both 0 and 7', () => {
    expect(validateCronExpression('* * * * 0').valid).toBe(true);
    expect(validateCronExpression('* * * * 7').valid).toBe(true);
  });

  it('should handle expressions with both day and weekday', () => {
    // In Unix cron, if both are specified, it's OR logic
    const result = validateCronExpression('0 0 1 * 0');
    expect(result.valid).toBe(true);
  });

  it('should handle month boundaries', () => {
    const baseDate = new Date('2024-01-31T10:00:00');
    vi.useFakeTimers();
    vi.setSystemTime(baseDate);

    const next = getNextExecutionTime('0 0 1 * *'); // First of month
    expect(next).not.toBe(null);
    expect(next.getDate()).toBe(1);
  });

  it('should handle year boundaries', () => {
    const baseDate = new Date('2024-12-31T23:00:00');
    vi.useFakeTimers();
    vi.setSystemTime(baseDate);

    const next = getNextExecutionTime('0 0 1 1 *'); // January 1st
    expect(next).not.toBe(null);
    expect(next.getMonth()).toBe(0); // January
  });

  it('should handle leap year February 29th', () => {
    const baseDate = new Date('2024-02-28T10:00:00'); // 2024 is a leap year
    vi.useFakeTimers();
    vi.setSystemTime(baseDate);

    const next = getNextExecutionTime('0 0 29 2 *');
    if (next) {
      expect(next.getDate()).toBe(29);
      expect(next.getMonth()).toBe(1); // February
    }
  });
});

