import React from 'react';

/**
 * Calendar Header - Apple-style month display
 */
export function CalendarHeader({ currentDate }) {
  const monthYear = currentDate.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="text-center">
      <h3 className="text-base font-semibold text-gray-900 dark:text-white tracking-tight">
        {monthYear}
      </h3>
    </div>
  );
}
