import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CronField from './CronField';

describe('CronField', () => {
  it('should render with label and value', () => {
    const mockOnChange = vi.fn();
    render(
      <CronField
        label="Minute"
        value="0"
        onChange={mockOnChange}
        fieldKey="minute"
      />
    );

    expect(screen.getByLabelText(/minute/i)).toBeInTheDocument();
    expect(screen.getByDisplayValue('0')).toBeInTheDocument();
  });

  it('should call onChange when input value changes', async () => {
    const user = userEvent.setup();
    const mockOnChange = vi.fn();
    
    render(
      <CronField
        label="Hour"
        value="4"
        onChange={mockOnChange}
        fieldKey="hour"
      />
    );

    const input = screen.getByLabelText(/hour/i);
    await user.clear(input);
    await user.type(input, '14');

    expect(mockOnChange).toHaveBeenCalled();
    expect(mockOnChange).toHaveBeenCalledWith('hour', '14');
  });

  it('should display error message when error prop is provided', () => {
    const mockOnChange = vi.fn();
    render(
      <CronField
        label="Day"
        value="32"
        onChange={mockOnChange}
        fieldKey="day"
        error="Invalid value in day"
      />
    );

    expect(screen.getByText('Invalid value in day')).toBeInTheDocument();
  });

  it('should apply error styling when error is present', () => {
    const mockOnChange = vi.fn();
    const { container } = render(
      <CronField
        label="Month"
        value="13"
        onChange={mockOnChange}
        fieldKey="month"
        error="Invalid value"
      />
    );

    const input = container.querySelector('input');
    expect(input).toHaveClass('border-red-500');
  });

  it('should have placeholder', () => {
    const mockOnChange = vi.fn();
    render(
      <CronField
        label="Weekday"
        value="*"
        onChange={mockOnChange}
        fieldKey="weekday"
      />
    );

    const input = screen.getByPlaceholderText('*');
    expect(input).toBeInTheDocument();
  });
});

