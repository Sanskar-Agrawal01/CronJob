/**
 * Cron Expression Parser and Validator
 * Implements Unix cron behavior with 5-field format: minute hour day month weekday
 */

// Field ranges for validation
const FIELD_RANGES = {
  minute: [0, 59],
  hour: [0, 23],
  day: [1, 31],
  month: [1, 12],
  weekday: [0, 7], // 0 and 7 both represent Sunday
};

// Month names
const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

// Weekday names
const WEEKDAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

// Predefined expressions
const PREDEFINED = {
  '@yearly': '0 0 1 1 *',
  '@annually': '0 0 1 1 *',
  '@monthly': '0 0 1 * *',
  '@weekly': '0 0 * * 0',
  '@daily': '0 0 * * *',
  '@hourly': '0 * * * *',
  '@minutely': '* * * * *',
};

/**
 * Parse a cron expression into its components
 */
export function parseCronExpression(expression) {
  // Handle predefined expressions
  const normalized = expression.trim().toLowerCase();
  if (PREDEFINED[normalized]) {
    expression = PREDEFINED[normalized];
  }

  const parts = expression.trim().split(/\s+/);
  
  if (parts.length !== 5) {
    return { valid: false, error: 'Cron expression must have exactly 5 fields' };
  }

  const [minute, hour, day, month, weekday] = parts;
  
  return {
    valid: true,
    minute,
    hour,
    day,
    month,
    weekday,
  };
}

/**
 * Validate a single cron field
 */
function validateField(field, fieldName, range) {
  if (field === '*') {
    return { valid: true };
  }

  // Handle ranges, lists, and step values
  const parts = field.split(',');
  
  for (const part of parts) {
    // Check for step values (e.g., */5, 0-30/5)
    if (part.includes('/')) {
      const [rangePart, stepPart] = part.split('/');
      const step = parseInt(stepPart, 10);
      
      if (isNaN(step) || step <= 0) {
        return { valid: false, error: `Invalid step value in ${fieldName}` };
      }

      if (rangePart === '*') {
        continue; // */5 is valid
      }

      // Handle range with step (e.g., 0-30/5)
      if (rangePart.includes('-')) {
        const [start, end] = rangePart.split('-').map(n => parseInt(n, 10));
        if (isNaN(start) || isNaN(end) || start < range[0] || end > range[1] || start > end) {
          return { valid: false, error: `Invalid range in ${fieldName}` };
        }
      } else {
        const num = parseInt(rangePart, 10);
        if (isNaN(num) || num < range[0] || num > range[1]) {
          return { valid: false, error: `Invalid value in ${fieldName}` };
        }
      }
    } else if (part.includes('-')) {
      // Handle ranges (e.g., 1-5)
      const [start, end] = part.split('-').map(n => parseInt(n, 10));
      if (isNaN(start) || isNaN(end) || start < range[0] || end > range[1] || start > end) {
        return { valid: false, error: `Invalid range in ${fieldName}` };
      }
    } else {
      // Handle single values
      const num = parseInt(part, 10);
      if (isNaN(num) || num < range[0] || num > range[1]) {
        return { valid: false, error: `Invalid value in ${fieldName}: ${part}` };
      }
    }
  }

  return { valid: true };
}

/**
 * Validate a complete cron expression
 */
export function validateCronExpression(expression) {
  const parsed = parseCronExpression(expression);
  
  if (!parsed.valid) {
    return parsed;
  }

  // Validate each field
  const minuteCheck = validateField(parsed.minute, 'minute', FIELD_RANGES.minute);
  if (!minuteCheck.valid) return minuteCheck;

  const hourCheck = validateField(parsed.hour, 'hour', FIELD_RANGES.hour);
  if (!hourCheck.valid) return hourCheck;

  const dayCheck = validateField(parsed.day, 'day', FIELD_RANGES.day);
  if (!dayCheck.valid) return dayCheck;

  const monthCheck = validateField(parsed.month, 'month', FIELD_RANGES.month);
  if (!monthCheck.valid) return monthCheck;

  const weekdayCheck = validateField(parsed.weekday, 'weekday', FIELD_RANGES.weekday);
  if (!weekdayCheck.valid) return weekdayCheck;

  return { valid: true };
}

/**
 * Check if a value matches a cron field pattern
 */
function matchesField(value, field, range) {
  if (field === '*') {
    return true;
  }

  const parts = field.split(',');
  
  for (const part of parts) {
    if (part.includes('/')) {
      const [rangePart, stepPart] = part.split('/');
      const step = parseInt(stepPart, 10);
      
      if (rangePart === '*') {
        if (value % step === 0) return true;
      } else if (rangePart.includes('-')) {
        const [start, end] = rangePart.split('-').map(n => parseInt(n, 10));
        if (value >= start && value <= end && (value - start) % step === 0) {
          return true;
        }
      } else {
        const start = parseInt(rangePart, 10);
        if (value >= start && (value - start) % step === 0) {
          return true;
        }
      }
    } else if (part.includes('-')) {
      const [start, end] = part.split('-').map(n => parseInt(n, 10));
      if (value >= start && value <= end) {
        return true;
      }
    } else {
      if (parseInt(part, 10) === value) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Get the next execution time for a cron expression
 */
export function getNextExecutionTime(expression, fromDate = new Date()) {
  const validation = validateCronExpression(expression);
  if (!validation.valid) {
    return null;
  }

  const parsed = parseCronExpression(expression);
  let current = new Date(fromDate);
  current.setSeconds(0, 0); // Reset seconds and milliseconds
  current.setMilliseconds(0);

  // Start from next minute to ensure we get a future time
  current.setMinutes(current.getMinutes() + 1);

  // Maximum iterations to prevent infinite loops (check up to 2 years ahead)
  const maxIterations = 2000000;
  let iterations = 0;
  const startYear = current.getFullYear();

  while (iterations < maxIterations) {
    iterations++;
    
    // Prevent infinite loop if we've gone too far
    if (current.getFullYear() > startYear + 2) {
      return null;
    }

    // Check month first (coarsest grain)
    const month = current.getMonth() + 1; // JavaScript months are 0-11
    if (!matchesField(month, parsed.month, FIELD_RANGES.month)) {
      current.setMinutes(0);
      current.setHours(0);
      current.setDate(1);
      current.setMonth(month); // This will wrap to next month if needed
      continue;
    }

    // Check day of month and weekday
    // In Unix cron, if both day and weekday are specified, it's OR logic (matches if either matches)
    const dayOfMonth = current.getDate();
    const weekday = current.getDay(); // 0 = Sunday, 6 = Saturday
    
    // Helper to check weekday match (handles Sunday as both 0 and 7)
    const checkWeekdayMatch = (wd, field) => {
      if (matchesField(wd, field, FIELD_RANGES.weekday)) return true;
      // If Sunday (0), also check if field matches 7
      if (wd === 0 && matchesField(7, field, FIELD_RANGES.weekday)) return true;
      // If field contains 0, also match Sunday
      if (wd === 0 && field.includes('0') && !field.includes('/')) {
        const parts = field.split(',');
        for (const part of parts) {
          if (part === '0' || part === '7') return true;
          if (part.includes('-')) {
            const [start, end] = part.split('-').map(n => parseInt(n, 10));
            if ((start === 0 || start === 7) || (end === 0 || end === 7) || (start <= 0 && end >= 0)) return true;
          }
        }
      }
      return false;
    };
    
    let dayMatches = false;
    if (parsed.day === '*' && parsed.weekday === '*') {
      dayMatches = true;
    } else if (parsed.day === '*') {
      // Only weekday matters
      dayMatches = checkWeekdayMatch(weekday, parsed.weekday);
    } else if (parsed.weekday === '*') {
      // Only day of month matters
      dayMatches = matchesField(dayOfMonth, parsed.day, FIELD_RANGES.day);
    } else {
      // Both specified - OR logic
      const dayOfMonthMatch = matchesField(dayOfMonth, parsed.day, FIELD_RANGES.day);
      const weekdayMatch = checkWeekdayMatch(weekday, parsed.weekday);
      dayMatches = dayOfMonthMatch || weekdayMatch;
    }

    if (!dayMatches) {
      current.setMinutes(0);
      current.setHours(0);
      current.setDate(dayOfMonth + 1);
      continue;
    }

    // Check hour
    if (!matchesField(current.getHours(), parsed.hour, FIELD_RANGES.hour)) {
      current.setMinutes(0);
      current.setHours(current.getHours() + 1);
      continue;
    }

    // Check minute
    if (!matchesField(current.getMinutes(), parsed.minute, FIELD_RANGES.minute)) {
      current.setMinutes(current.getMinutes() + 1);
      continue;
    }

    // All fields match and it's in the future
    if (current > fromDate) {
      return current;
    }

    // If we get here, all fields match but time is not in the future
    // Move to next minute
    current.setMinutes(current.getMinutes() + 1);
  }

  return null; // Could not find next execution time
}

/**
 * Generate human-readable description of cron expression
 */
export function getHumanReadableDescription(expression) {
  const validation = validateCronExpression(expression);
  if (!validation.valid) {
    return 'Invalid cron expression';
  }

  const parsed = parseCronExpression(expression);
  
  // Check for predefined expressions
  const normalized = expression.trim().toLowerCase();
  if (PREDEFINED[normalized]) {
    const predefinedNames = {
      '@yearly': 'Once a year (January 1st at 00:00)',
      '@annually': 'Once a year (January 1st at 00:00)',
      '@monthly': 'Once a month (1st day at 00:00)',
      '@weekly': 'Once a week (Sunday at 00:00)',
      '@daily': 'Once a day (at 00:00)',
      '@hourly': 'Once an hour (at minute 0)',
      '@minutely': 'Every minute',
    };
    return predefinedNames[normalized] || expression;
  }

  // Build description
  const parts = [];

  // Minute description
  if (parsed.minute === '*') {
    parts.push('every minute');
  } else if (parsed.minute.includes('/')) {
    const step = parsed.minute.split('/')[1];
    parts.push(`every ${step} minute${step > 1 ? 's' : ''}`);
  } else if (parsed.minute.includes('-')) {
    const [start, end] = parsed.minute.split('-');
    parts.push(`from minute ${start} to ${end}`);
  } else if (parsed.minute.includes(',')) {
    const minutes = parsed.minute.split(',').map(m => m.padStart(2, '0')).join(', ');
    parts.push(`at minute${parsed.minute.split(',').length > 1 ? 's' : ''} ${minutes}`);
  } else {
    parts.push(`at minute ${parsed.minute.padStart(2, '0')}`);
  }

  // Hour description
  if (parsed.hour === '*') {
    if (parsed.minute === '*') {
      parts[0] = 'every minute';
    }
  } else if (parsed.hour.includes('/')) {
    const step = parsed.hour.split('/')[1];
    parts.push(`every ${step} hour${step > 1 ? 's' : ''}`);
  } else if (parsed.hour.includes('-')) {
    const [start, end] = parsed.hour.split('-');
    parts.push(`from ${start.padStart(2, '0')}:00 to ${end.padStart(2, '0')}:59`);
  } else if (parsed.hour.includes(',')) {
    const hours = parsed.hour.split(',').map(h => h.padStart(2, '0')).join(', ');
    parts.push(`at hour${parsed.hour.split(',').length > 1 ? 's' : ''} ${hours}`);
  } else {
    const hour = parsed.hour.padStart(2, '0');
    const minute = parsed.minute === '*' ? '00' : parsed.minute.padStart(2, '0');
    if (!parsed.minute.includes(',') && !parsed.minute.includes('-') && !parsed.minute.includes('/')) {
      return `At ${hour}:${minute}`;
    }
    parts.push(`at hour ${hour}`);
  }

  // Day description
  if (parsed.day === '*') {
    // No specific day constraint
  } else if (parsed.day.includes('/')) {
    const step = parsed.day.split('/')[1];
    parts.push(`every ${step} day${step > 1 ? 's' : ''}`);
  } else if (parsed.day.includes('-')) {
    const [start, end] = parsed.day.split('-');
    parts.push(`from day ${start} to ${end}`);
  } else if (parsed.day.includes(',')) {
    const days = parsed.day.split(',').join(', ');
    parts.push(`on day${parsed.day.split(',').length > 1 ? 's' : ''} ${days}`);
  } else {
    parts.push(`on day ${parsed.day}`);
  }

  // Month description
  if (parsed.month === '*') {
    // No specific month constraint
  } else if (parsed.month.includes('/')) {
    const step = parsed.month.split('/')[1];
    parts.push(`every ${step} month${step > 1 ? 's' : ''}`);
  } else if (parsed.month.includes('-')) {
    const [start, end] = parsed.month.split('-').map(m => MONTH_NAMES[parseInt(m) - 1]);
    parts.push(`from ${start} to ${end}`);
  } else if (parsed.month.includes(',')) {
    const months = parsed.month.split(',').map(m => MONTH_NAMES[parseInt(m) - 1]).join(', ');
    parts.push(`in ${months}`);
  } else {
    parts.push(`in ${MONTH_NAMES[parseInt(parsed.month) - 1]}`);
  }

  // Weekday description
  if (parsed.weekday === '*') {
    // No specific weekday constraint
  } else if (parsed.weekday.includes('/')) {
    const step = parsed.weekday.split('/')[1];
    parts.push(`every ${step} weekday${step > 1 ? 's' : ''}`);
  } else if (parsed.weekday.includes('-')) {
    const [start, end] = parsed.weekday.split('-').map(w => WEEKDAY_NAMES[parseInt(w) % 7]);
    parts.push(`from ${start} to ${end}`);
  } else if (parsed.weekday.includes(',')) {
    const weekdays = parsed.weekday.split(',').map(w => WEEKDAY_NAMES[parseInt(w) % 7]).join(', ');
    parts.push(`on ${weekdays}`);
  } else {
    const wd = parseInt(parsed.weekday) % 7;
    parts.push(`on ${WEEKDAY_NAMES[wd]}`);
  }

  // Special case: if we have specific hour and minute, show time format
  if (parsed.hour !== '*' && !parsed.hour.includes(',') && !parsed.hour.includes('-') && !parsed.hour.includes('/') &&
      parsed.minute !== '*' && !parsed.minute.includes(',') && !parsed.minute.includes('-') && !parsed.minute.includes('/')) {
    const hour = parsed.hour.padStart(2, '0');
    const minute = parsed.minute.padStart(2, '0');
    const timePart = `At ${hour}:${minute}`;
    const rest = parts.slice(2).join(', ');
    return rest ? `${timePart}, ${rest}` : timePart;
  }

  return parts.join(', ');
}

/**
 * Generate a random valid cron expression
 */
export function generateRandomCron() {
  const patterns = [
    // Specific time
    () => {
      const minute = Math.floor(Math.random() * 60);
      const hour = Math.floor(Math.random() * 24);
      return `${minute} ${hour} * * *`;
    },
    // Every N minutes
    () => {
      const step = [5, 10, 15, 30][Math.floor(Math.random() * 4)];
      return `*/${step} * * * *`;
    },
    // Every N hours
    () => {
      const step = [1, 2, 3, 6, 12][Math.floor(Math.random() * 5)];
      return `0 */${step} * * *`;
    },
    // Daily at specific time
    () => {
      const minute = Math.floor(Math.random() * 60);
      const hour = Math.floor(Math.random() * 24);
      return `${minute} ${hour} * * *`;
    },
    // Weekly
    () => {
      const weekday = Math.floor(Math.random() * 7);
      const hour = Math.floor(Math.random() * 24);
      return `0 ${hour} * * ${weekday}`;
    },
    // Monthly
    () => {
      const day = Math.floor(Math.random() * 28) + 1;
      const hour = Math.floor(Math.random() * 24);
      return `0 ${hour} ${day} * *`;
    },
    // Range
    () => {
      const startHour = Math.floor(Math.random() * 20);
      const endHour = startHour + Math.floor(Math.random() * (24 - startHour));
      return `0 ${startHour}-${endHour} * * *`;
    },
  ];

  const pattern = patterns[Math.floor(Math.random() * patterns.length)];
  return pattern();
}

