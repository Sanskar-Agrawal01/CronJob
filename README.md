# Cron Expression Builder

A 100% frontend-only Cron Job Expression Builder built with React.js and Tailwind CSS. This application allows you to build, validate, parse, and understand standard 5-field cron expressions entirely in your browser.

## Features

- ✅ **Visual Cron Builder** - Intuitive field-by-field editor for minute, hour, day, month, and weekday
- ✅ **Real-time Validation** - Instant validation with clear error messages
- ✅ **Human-readable Descriptions** - Automatically generates natural language descriptions (e.g., "At 04:05")
- ✅ **Next Execution Calculator** - Calculates and displays the next execution time
- ✅ **Editable Cron Input** - Direct text input with automatic parsing
- ✅ **Copy to Clipboard** - One-click copy functionality
- ✅ **Random Generator** - Generate random valid cron expressions
- ✅ **Syntax Legend** - Comprehensive guide to cron syntax including predefined expressions
- ✅ **Dark Professional UI** - Modern dark theme with neon yellow/green accents
- ✅ **Fully Offline** - No backend or API calls required
- ✅ **Responsive Design** - Works on desktop, tablet, and mobile devices

## Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Build for production:
```bash
npm run build
```

## Testing

The project includes comprehensive test coverage using Vitest and React Testing Library.

1. Run tests:
```bash
npm test
```

2. Run tests in watch mode:
```bash
npm test -- --watch
```

3. Run tests with UI:
```bash
npm run test:ui
```

4. Run tests with coverage:
```bash
npm run test:coverage
```

### Test Coverage

- **Cron Parser Tests** - Validates parsing of various cron expression formats
- **Validation Tests** - Tests validation logic for all field types and edge cases
- **Next Execution Calculator Tests** - Verifies correct calculation of next execution times
- **Human-readable Description Tests** - Ensures accurate natural language generation
- **Component Tests** - Tests React component behavior and user interactions
- **Edge Case Tests** - Handles special cases like leap years, month boundaries, Sunday as 0/7

## Usage

1. **Build a Cron Expression:**
   - Use the field editors to set minute, hour, day, month, and weekday values
   - Or directly type a cron expression in the input field

2. **Validate:**
   - The expression is validated in real-time
   - Invalid expressions show clear error messages

3. **Understand:**
   - View the human-readable description
   - See the next execution time
   - Check the visual field mapping

4. **Copy:**
   - Click the "Copy" button to copy the cron expression to clipboard

5. **Explore:**
   - Use the "Random" button to generate random cron expressions
   - Expand the "Syntax Legend" to learn about cron syntax

## Cron Syntax

### Standard Fields
- **Minute** (0-59)
- **Hour** (0-23)
- **Day of Month** (1-31)
- **Month** (1-12)
- **Weekday** (0-7, where 0 and 7 both represent Sunday)

### Special Characters
- `*` - Any value
- `,` - Value list separator (e.g., `1,3,5`)
- `-` - Range (e.g., `1-5`)
- `/` - Step values (e.g., `*/5` for every 5 minutes)

### Predefined Expressions
- `@yearly` or `@annually` - Once a year (January 1st at 00:00)
- `@monthly` - Once a month (1st day at 00:00)
- `@weekly` - Once a week (Sunday at 00:00)
- `@daily` - Once a day (at 00:00)
- `@hourly` - Once an hour (at minute 0)
- `@minutely` - Every minute

### Examples
- `0 4 * * *` - Daily at 4:00 AM
- `*/15 * * * *` - Every 15 minutes
- `0 0 1 * *` - Monthly on the 1st at midnight
- `0 9-17 * * 1-5` - Weekdays from 9 AM to 5 PM

## Technology Stack

- **React 18** - UI framework with functional components and hooks
- **Tailwind CSS** - Utility-first CSS framework
- **Vite** - Fast build tool and dev server
- **Custom Cron Parser** - 100% frontend implementation matching Unix cron behavior

## Browser Compatibility

Works in all modern browsers that support:
- ES6+ JavaScript
- CSS Grid and Flexbox
- Clipboard API

## License

MIT

