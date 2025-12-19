import React from 'react';

const CronField = ({ label, value, onChange, fieldKey, error }) => {
  return (
    <div className="flex flex-col">
      <label className="text-sm font-semibold text-gray-300 mb-1 uppercase tracking-wider">
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(fieldKey, e.target.value)}
        className={`
          bg-gray-800 border-2 rounded-lg px-4 py-2 text-white monospace
          focus:outline-none focus:ring-2 transition-all duration-200
          ${error 
            ? 'border-red-500 focus:border-red-500 focus:ring-red-500/50' 
            : 'border-gray-700 focus:border-yellow-400 focus:ring-yellow-400/50 focus:shadow-neon-yellow-sm'
          }
          hover:border-gray-600
        `}
        placeholder="*"
      />
      {error && (
        <span className="text-red-400 text-xs mt-1">{error}</span>
      )}
    </div>
  );
};

export default CronField;

