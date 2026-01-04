import React, { useState, useEffect, useCallback } from 'react';
import CronField from './components/CronField';
import {
  parseCronExpression,
  validateCronExpression,
  getNextExecutionTime,
  getHumanReadableDescription,
  generateRandomCron,
} from './utils/cronUtils';

function App() {
  const [cronExpression, setCronExpression] = useState('5 4/2 * * *');
  const [fields, setFields] = useState({
    minute: '5',
    hour: '4/2',
    day: '*',
    month: '*',
    weekday: '*',
  });
  const [validation, setValidation] = useState({ valid: true });
  const [description, setDescription] = useState('');
  const [nextExecution, setNextExecution] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setCronExpression(
      `${fields.minute} ${fields.hour} ${fields.day} ${fields.month} ${fields.weekday}`
    );
  }, [fields]);

  useEffect(() => {
    const result = validateCronExpression(cronExpression);
    setValidation(result);

    if (result.valid) {
      setDescription(getHumanReadableDescription(cronExpression));
      setNextExecution(getNextExecutionTime(cronExpression));
    } else {
      setDescription('Invalid cron expression');
      setNextExecution(null);
    }
  }, [cronExpression]);

  const handleExpressionChange = (value) => {
    setCronExpression(value);
    const parsed = parseCronExpression(value);
    if (parsed.valid) {
      setFields(parsed);
    }
  };

  const handleFieldChange = (fieldKey, value) => {
    setFields((prev) => ({ ...prev, [fieldKey]: value }));
  };

  const handleCopy = useCallback(async () => {
    await navigator.clipboard.writeText(cronExpression);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }, [cronExpression]);

  const handleRandom = () => {
    handleExpressionChange(generateRandomCron());
  };

  const formatDate = (date) =>
    date?.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0b0e11] to-[#0f1216] text-gray-200">
      <div className="max-w-4xl mx-auto px-6 py-20 text-center space-y-12">

        {/* Logo */}
        <div className="flex justify-between items-center text-sm text-gray-400">
          <span className="font-semibold tracking-wide">CronS</span>
          <span className="border border-yellow-400 px-3 py-1 rounded-md text-yellow-300">
            Help
          </span>
        </div>

        {/* Title */}
        <div className="space-y-4">
          <h1 className="text-5xl font-semibold tracking-tight">
            Cron Expression <span className="text-yellow-400">Builder</span>
          </h1>
          <p className="text-gray-400 max-w-xl mx-auto">
            The quick and simple editor for cron schedule expressions.
          </p>
        </div>

        {/* Human readable */}
        <div className="space-y-2">
          <p className="text-2xl sm:text-3xl font-mono leading-relaxed">
            <span className="text-gray-300">“</span>
            <span className="text-yellow-300">{description}</span>
            <span className="text-gray-300">”</span>
          </p>

          {nextExecution && (
            <p className="text-sm text-gray-500">
              next at {formatDate(nextExecution)}
            </p>
          )}
        </div>

        {/* Cron Input */}
        <div className="relative max-w-2xl mx-auto">
          <input
            value={cronExpression}
            onChange={(e) => handleExpressionChange(e.target.value)}
            className="
              w-full text-center font-mono text-2xl
              bg-[#0b0e11]
              border-2 border-yellow-400
              rounded-xl
              px-6 py-5
              text-yellow-300
              focus:outline-none
              focus:ring-2 focus:ring-yellow-300/40
            "
          />

          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-2">
            <button
              onClick={handleRandom}
              className="bg-yellow-400 text-black px-3 py-1 rounded-md text-sm font-semibold"
            >
              random
            </button>
            <button
              onClick={handleCopy}
              className="bg-yellow-400 text-black px-3 py-1 rounded-md text-sm font-semibold"
            >
              {copied ? '✓' : 'Copy'}
            </button>
          </div>
        </div>

        {/* Field Editor */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 max-w-3xl mx-auto">
          {['minute', 'hour', 'day', 'month', 'weekday'].map((key) => (
            <CronField
              key={key}
              label={key}
              fieldKey={key}
              value={fields[key]}
              onChange={handleFieldChange}
              error={validation.field === key ? validation.error : null}
            />
          ))}
        </div>

        {/* Legend */}
        <div className="mt-10 max-w-md mx-auto text-sm text-gray-400 space-y-2 text-left font-mono">
          <div className="flex justify-between"><span>*</span><span>any value</span></div>
          <div className="flex justify-between"><span>,</span><span>value list</span></div>
          <div className="flex justify-between"><span>-</span><span>range</span></div>
          <div className="flex justify-between"><span>/</span><span>step values</span></div>
          <div className="flex justify-between"><span>0-23</span><span>allowed values</span></div>
        </div>

      </div>
    </div>
  );
}

export default App;
