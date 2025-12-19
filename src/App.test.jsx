import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';

describe('App', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2024-01-15T10:00:00'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should render the main heading', () => {
    render(<App />);
    expect(screen.getByText('Cron Expression Builder')).toBeInTheDocument();
  });

  it('should display default cron expression', () => {
    render(<App />);
    const input = screen.getByPlaceholderText('* * * * *');
    expect(input).toHaveValue('0 4 * * *');
  });

  it('should update cron expression when typing in input', async () => {
    const user = userEvent.setup();
    render(<App />);
    
    const input = screen.getByPlaceholderText('* * * * *');
    await user.clear(input);
    await user.type(input, '0 14 * * *');

    expect(input).toHaveValue('0 14 * * *');
  });

  it('should update fields when cron expression is changed', async () => {
    const user = userEvent.setup();
    render(<App />);
    
    const input = screen.getByPlaceholderText('* * * * *');
    await user.clear(input);
    await user.type(input, '30 15 * * *');

    await waitFor(() => {
      const minuteInput = screen.getByLabelText(/minute/i);
      expect(minuteInput).toHaveValue('30');
    });

    const hourInput = screen.getByLabelText(/hour/i);
    expect(hourInput).toHaveValue('15');
  });

  it('should update cron expression when fields are changed', async () => {
    const user = userEvent.setup();
    render(<App />);
    
    const minuteInput = screen.getByLabelText(/minute/i);
    await user.clear(minuteInput);
    await user.type(minuteInput, '30');

    await waitFor(() => {
      const cronInput = screen.getByPlaceholderText('* * * * *');
      expect(cronInput.value).toContain('30');
    });
  });

  it('should show validation error for invalid expression', async () => {
    const user = userEvent.setup();
    render(<App />);
    
    const input = screen.getByPlaceholderText('* * * * *');
    await user.clear(input);
    await user.type(input, '60 * * * *');

    await waitFor(() => {
      expect(screen.getByText(/invalid/i)).toBeInTheDocument();
    });
  });

  it('should display human-readable description', async () => {
    render(<App />);
    
    await waitFor(() => {
      const description = screen.getByText(/At 04:00/i);
      expect(description).toBeInTheDocument();
    });
  });

  it('should display next execution time', async () => {
    render(<App />);
    
    await waitFor(() => {
      const nextExecution = screen.getByText(/Next Execution/i);
      expect(nextExecution).toBeInTheDocument();
    });
  });

  it('should copy cron expression to clipboard', async () => {
    const user = userEvent.setup();
    const clipboardWriteText = vi.fn();
    Object.assign(navigator, {
      clipboard: {
        writeText: clipboardWriteText,
      },
    });

    render(<App />);
    
    const copyButton = screen.getByText('Copy');
    await user.click(copyButton);

    await waitFor(() => {
      expect(clipboardWriteText).toHaveBeenCalledWith('0 4 * * *');
      expect(screen.getByText('✓ Copied')).toBeInTheDocument();
    });
  });

  it('should generate random cron expression', async () => {
    const user = userEvent.setup();
    render(<App />);
    
    const randomButton = screen.getByText('🎲 Random');
    await user.click(randomButton);

    await waitFor(() => {
      const input = screen.getByPlaceholderText('* * * * *');
      expect(input.value).not.toBe('0 4 * * *');
      // Should still be valid
      expect(screen.queryByText(/invalid cron expression/i)).not.toBeInTheDocument();
    });
  });

  it('should toggle syntax legend', async () => {
    const user = userEvent.setup();
    render(<App />);
    
    const toggleButton = screen.getByText('▶');
    await user.click(toggleButton);

    await waitFor(() => {
      expect(screen.getByText('▼')).toBeInTheDocument();
      expect(screen.getByText(/Any value/i)).toBeInTheDocument();
    });

    await user.click(screen.getByText('▼'));
    
    await waitFor(() => {
      expect(screen.getByText('▶')).toBeInTheDocument();
    });
  });

  it('should display field mapping', () => {
    render(<App />);
    
    expect(screen.getByText('Field Mapping')).toBeInTheDocument();
    expect(screen.getByText('Minute')).toBeInTheDocument();
    expect(screen.getByText('Hour')).toBeInTheDocument();
    expect(screen.getByText('Day')).toBeInTheDocument();
    expect(screen.getByText('Month')).toBeInTheDocument();
    expect(screen.getByText('Weekday')).toBeInTheDocument();
  });

  it('should handle predefined expressions', async () => {
    const user = userEvent.setup();
    render(<App />);
    
    const input = screen.getByPlaceholderText('* * * * *');
    await user.clear(input);
    await user.type(input, '@daily');

    await waitFor(() => {
      expect(input).toHaveValue('0 0 * * *');
      expect(screen.queryByText(/invalid/i)).not.toBeInTheDocument();
    });
  });

  it('should update description when expression changes', async () => {
    const user = userEvent.setup();
    render(<App />);
    
    const input = screen.getByPlaceholderText('* * * * *');
    await user.clear(input);
    await user.type(input, '0 14 * * *');

    await waitFor(() => {
      const description = screen.getByText(/At 14:00/i);
      expect(description).toBeInTheDocument();
    });
  });
});

