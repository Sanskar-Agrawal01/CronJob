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
  const [cronExpression, setCronExpression] = useState('0 4 * * *');
  const [fields, setFields] = useState({
    minute: '0',
    hour: '4',
    day: '*',
    month: '*',
    weekday: '*',
  });
  const [validation, setValidation] = useState({ valid: true });
  const [description, setDescription] = useState('');
  const [nextExecution, setNextExecution] = useState(null);
  const [copied, setCopied] = useState(false);
  const [showLegend, setShowLegend] = useState(false);

  // Update cron expression when fields change
  useEffect(() => {
    const expression = `${fields.minute} ${fields.hour} ${fields.day} ${fields.month} ${fields.weekday}`;
    setCronExpression(expression);
  }, [fields]);

  // Validate and update description/next execution when expression changes
  useEffect(() => {
    const result = validateCronExpression(cronExpression);
    setValidation(result);

    if (result.valid) {
      setDescription(getHumanReadableDescription(cronExpression));
      const next = getNextExecutionTime(cronExpression);
      setNextExecution(next);
    } else {
      setDescription('Invalid cron expression');
      setNextExecution(null);
    }
  }, [cronExpression]);

  // Parse expression when manually edited
  const handleExpressionChange = (value) => {
    setCronExpression(value);
    const parsed = parseCronExpression(value);
    if (parsed.valid) {
      setFields({
        minute: parsed.minute,
        hour: parsed.hour,
        day: parsed.day,
        month: parsed.month,
        weekday: parsed.weekday,
      });
    }
  };

  const handleFieldChange = (fieldKey, value) => {
    setFields((prev) => ({
      ...prev,
      [fieldKey]: value,
    }));
  };

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(cronExpression);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, [cronExpression]);

  const handleRandom = () => {
    const random = generateRandomCron();
    handleExpressionChange(random);
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    return date.toLocaleString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8 animate-pulse-neon">
          <h1 className="text-4xl font-bold mb-2 text-glow-yellow transition-all duration-300">
            Cron Expression Builder
          </h1>
          <p className="text-gray-400">Build, validate, and understand cron expressions</p>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Field Editor */}
          <div className="lg:col-span-2 space-y-6">
            {/* Cron Expression Display */}
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 shadow-lg transition-all duration-300 hover:border-gray-600">
              <label className="block text-sm font-semibold text-gray-300 mb-2 uppercase tracking-wider">
                Cron Expression
              </label>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <input
                  type="text"
                  value={cronExpression}
                  onChange={(e) => handleExpressionChange(e.target.value)}
                  className={`
                    flex-1 bg-gray-900 border-2 rounded-lg px-4 py-3 text-base sm:text-lg monospace
                    focus:outline-none focus:ring-2 transition-all duration-200
                    ${validation.valid
                      ? 'border-green-500 focus:border-green-400 focus:ring-green-400/50 focus:shadow-neon-green-sm text-green-400'
                      : 'border-red-500 focus:border-red-400 focus:ring-red-400/50 text-red-400'
                    }
                  `}
                  placeholder="* * * * *"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleCopy}
                    className={`
                      flex-1 sm:flex-none px-4 py-3 rounded-lg font-semibold transition-all duration-200
                      ${copied
                        ? 'bg-green-600 text-white shadow-neon-green-sm'
                        : 'bg-gray-700 hover:bg-gray-600 text-gray-200 hover:shadow-neon-yellow-sm'
                      }
                    `}
                    title="Copy to clipboard"
                  >
                    {copied ? '✓ Copied' : 'Copy'}
                  </button>
                  <button
                    onClick={handleRandom}
                    className="flex-1 sm:flex-none px-4 py-3 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg font-semibold transition-all duration-200 hover:shadow-neon-yellow-sm"
                    title="Generate random cron"
                  >
                    🎲 Random
                  </button>
                </div>
              </div>
              {!validation.valid && (
                <div className="mt-3 p-3 bg-red-900/30 border border-red-700 rounded-lg">
                  <p className="text-red-400 text-sm">{validation.error || 'Invalid cron expression'}</p>
                </div>
              )}
            </div>

            {/* Field Editors */}
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 shadow-lg transition-all duration-300 hover:border-gray-600">
              <h2 className="text-xl font-bold mb-4 text-gray-200 flex items-center gap-2">
                <span className="text-glow-green">Field Editor</span>
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
                <CronField
                  label="Minute"
                  value={fields.minute}
                  onChange={handleFieldChange}
                  fieldKey="minute"
                  error={validation.field === 'minute' ? validation.error : null}
                />
                <CronField
                  label="Hour"
                  value={fields.hour}
                  onChange={handleFieldChange}
                  fieldKey="hour"
                  error={validation.field === 'hour' ? validation.error : null}
                />
                <CronField
                  label="Day"
                  value={fields.day}
                  onChange={handleFieldChange}
                  fieldKey="day"
                  error={validation.field === 'day' ? validation.error : null}
                />
                <CronField
                  label="Month"
                  value={fields.month}
                  onChange={handleFieldChange}
                  fieldKey="month"
                  error={validation.field === 'month' ? validation.error : null}
                />
                <CronField
                  label="Weekday"
                  value={fields.weekday}
                  onChange={handleFieldChange}
                  fieldKey="weekday"
                  error={validation.field === 'weekday' ? validation.error : null}
                />
              </div>
            </div>

            {/* Visual Field Mapping */}
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 shadow-lg transition-all duration-300 hover:border-gray-600">
              <h2 className="text-xl font-bold mb-4 text-gray-200">Field Mapping</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                {[
                  { label: 'Minute', value: fields.minute, range: '0-59' },
                  { label: 'Hour', value: fields.hour, range: '0-23' },
                  { label: 'Day', value: fields.day, range: '1-31' },
                  { label: 'Month', value: fields.month, range: '1-12' },
                  { label: 'Weekday', value: fields.weekday, range: '0-7' },
                ].map((field, idx) => (
                  <div
                    key={idx}
                    className="bg-gray-900/50 border border-gray-700 rounded-lg p-3 text-center"
                  >
                    <div className="text-xs text-gray-400 mb-1">{field.label}</div>
                    <div className="text-lg font-mono text-yellow-400 mb-1">{field.value}</div>
                    <div className="text-xs text-gray-500">{field.range}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column - Info Panel */}
          <div className="space-y-6">
            {/* Description */}
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 shadow-lg transition-all duration-300 hover:border-gray-600">
              <h2 className="text-xl font-bold mb-3 text-gray-200 flex items-center gap-2">
                <span className="text-glow-yellow">Description</span>
              </h2>
              <p className={`text-lg ${validation.valid ? 'text-green-400' : 'text-red-400'}`}>
                {description || 'Enter a cron expression'}
              </p>
            </div>

            {/* Next Execution */}
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 shadow-lg transition-all duration-300 hover:border-gray-600">
              <h2 className="text-xl font-bold mb-3 text-gray-200 flex items-center gap-2">
                <span className="text-glow-green">Next Execution</span>
              </h2>
              {nextExecution ? (
                <div>
                  <p className="text-2xl font-mono text-green-400 mb-2">
                    {formatDate(nextExecution)}
                  </p>
                  <p className="text-sm text-gray-400">
                    {Math.ceil((nextExecution - new Date()) / 1000 / 60)} minutes from now
                  </p>
                </div>
              ) : (
                <p className="text-gray-400">No valid execution time found</p>
              )}
            </div>

            {/* Syntax Legend */}
            <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-xl p-6 shadow-lg transition-all duration-300 hover:border-gray-600">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-200">Syntax Legend</h2>
                <button
                  onClick={() => setShowLegend(!showLegend)}
                  className="text-gray-400 hover:text-yellow-400 transition-colors"
                >
                  {showLegend ? '▼' : '▶'}
                </button>
              </div>
              {showLegend && (
                <div className="space-y-3 text-sm">
                  <div>
                    <code className="text-yellow-400 font-mono">*</code>
                    <span className="ml-2 text-gray-300">Any value</span>
                  </div>
                  <div>
                    <code className="text-yellow-400 font-mono">,</code>
                    <span className="ml-2 text-gray-300">Value list separator</span>
                  </div>
                  <div>
                    <code className="text-yellow-400 font-mono">-</code>
                    <span className="ml-2 text-gray-300">Range</span>
                  </div>
                  <div>
                    <code className="text-yellow-400 font-mono">/</code>
                    <span className="ml-2 text-gray-300">Step values</span>
                  </div>
                  <div className="pt-2 border-t border-gray-700">
                    <div className="text-gray-400 mb-2 font-semibold">Predefined:</div>
                    <div className="space-y-1">
                      <div><code className="text-green-400 font-mono">@yearly</code> <span className="text-gray-300">or</span> <code className="text-green-400 font-mono">@annually</code></div>
                      <div><code className="text-green-400 font-mono">@monthly</code></div>
                      <div><code className="text-green-400 font-mono">@weekly</code></div>
                      <div><code className="text-green-400 font-mono">@daily</code></div>
                      <div><code className="text-green-400 font-mono">@hourly</code></div>
                      <div><code className="text-green-400 font-mono">@minutely</code></div>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-gray-700">
                    <div className="text-gray-400 mb-2 font-semibold">Examples:</div>
                    <div className="space-y-1 text-xs">
                      <div><code className="text-gray-300 font-mono">0 4 * * *</code> <span className="text-gray-500">Daily at 4:00 AM</span></div>
                      <div><code className="text-gray-300 font-mono">*/15 * * * *</code> <span className="text-gray-500">Every 15 minutes</span></div>
                      <div><code className="text-gray-300 font-mono">0 0 1 * *</code> <span className="text-gray-500">Monthly on 1st</span></div>
                      <div><code className="text-gray-300 font-mono">0 9-17 * * 1-5</code> <span className="text-gray-500">Weekdays 9 AM-5 PM</span></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 text-center text-gray-500 text-sm">
          <p>100% Frontend • No Backend Required • Works Offline</p>
        </div>
      </div>
    </div>
  );
}

export default App;

