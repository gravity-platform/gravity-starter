import React from "react";

/**
 * Time Slot Grid - Apple-style time picker
 */
export function TimeSlotGrid({ timeSlots, selectedTime, onTimeSelect }) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {timeSlots.map((slot, index) => {
        const isSelected = selectedTime === slot.time;
        const isAvailable = slot.available;

        if (!isAvailable) {
          return (
            <button
              key={index}
              disabled
              className="relative h-14 rounded-xl bg-gray-100 dark:bg-gray-800/20 text-gray-300 dark:text-gray-700 cursor-not-allowed opacity-30"
            >
              <span className="text-base font-bold line-through">{slot.time}</span>
            </button>
          );
        }

        return (
          <button
            key={index}
            onClick={() => onTimeSelect(slot.time)}
            className={`
              group relative h-10 rounded-xl transition-all duration-200 ease-out flex items-center justify-center
              ${
                isSelected
                  ? "bg-gradient-to-b from-blue-600 to-blue-700 text-white shadow-xl shadow-blue-500/40 scale-105 border-2 border-blue-500"
                  : "bg-white dark:bg-gray-800 text-gray-900 dark:text-white border-2 border-gray-200 dark:border-gray-700 hover:border-blue-500 hover:scale-102 active:scale-95 shadow-sm"
              }
            `}
          >
            <span
              className={`text-base font-bold transition-colors ${
                isSelected ? "text-white" : "text-gray-900 dark:text-white"
              }`}
            >
              {slot.time}
            </span>
          </button>
        );
      })}
    </div>
  );
}
