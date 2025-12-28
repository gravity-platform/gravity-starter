import React from "react";

/**
 * Day Selector - Apple-style horizontal day picker
 */
export function DaySelector({ availableDates, currentDate, selectedDate, onDateSelect }) {
  const isSelected = (date) => {
    return selectedDate && date.toDateString() === selectedDate.toDateString();
  };

  const isToday = (date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSameMonth = (date) => {
    return date.getMonth() === currentDate.getMonth() && date.getFullYear() === currentDate.getFullYear();
  };

  // Filter dates for current month
  const monthDates = availableDates.filter(isSameMonth);

  return (
    <div className="relative -mx-4 px-4">
      <div className="flex gap-2 overflow-x-auto pb-3 scrollbar-none">
        {monthDates.map((date, index) => {
          const selected = isSelected(date);
          const today = isToday(date);

          return (
            <button
              key={index}
              onClick={() => onDateSelect(date)}
              className={`
                group flex-shrink-0 flex flex-col items-center justify-center
                min-w-[64px] h-[80px] rounded-2xl transition-all duration-200 ease-out
                ${
                  selected
                    ? "bg-gradient-to-b from-blue-600 to-blue-700 shadow-xl shadow-blue-500/40 scale-105"
                    : "bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 hover:border-blue-500 hover:scale-102 active:scale-95 shadow-sm"
                }
              `}
            >
              <span
                className={`text-[10px] font-bold tracking-widest uppercase mb-2 transition-colors ${
                  selected ? "text-blue-100" : "text-gray-500 dark:text-gray-400"
                }`}
              >
                {date.toLocaleDateString("en-US", { weekday: "short" })}
              </span>
              <span
                className={`text-3xl font-bold transition-colors ${
                  selected
                    ? "text-white"
                    : today
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-gray-900 dark:text-white"
                }`}
              >
                {date.getDate()}
              </span>
              {today && !selected && (
                <div className="w-1.5 h-1.5 rounded-full bg-blue-600 dark:bg-blue-400 mt-2" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
