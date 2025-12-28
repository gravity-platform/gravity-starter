import React, { useState } from "react";
import { Calendar, Clock, User, Mail, Phone, ArrowLeft, CheckCircle } from "lucide-react";

/**
 * Booking Confirmation - Final step to confirm appointment details
 */
export function BookingConfirmation({ service, contactDetails, selectedDate, selectedTime, onBack, onSubmit }) {
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setIsSubmitting(true);

    const bookingData = {
      service: service?.name || service?.title,
      date: selectedDate.toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      }),
      time: selectedTime,
      notes,
      ...contactDetails,
    };

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));

    onSubmit(bookingData);
    setIsSubmitting(false);
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-black">
      {/* Header */}
      <div className="px-6 py-5 border-b border-gray-200 dark:border-gray-800">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-3 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">Confirm Booking</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">Review your appointment details</p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="space-y-6">
          {/* Appointment Summary */}
          <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-5 space-y-4">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-emerald-500 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Service</p>
                <p className="font-medium text-gray-900 dark:text-white">{service?.name || service?.title}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 text-emerald-500 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Date</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {selectedDate?.toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-emerald-500 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">Time</p>
                <p className="font-medium text-gray-900 dark:text-white">{selectedTime}</p>
              </div>
            </div>
          </div>

          {/* Contact Summary */}
          <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Your Details</h3>
            <div className="flex items-center gap-3">
              <User className="w-4 h-4 text-gray-400" />
              <span className="text-gray-700 dark:text-gray-300">{contactDetails?.name}</span>
            </div>
            <div className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-gray-400" />
              <span className="text-gray-700 dark:text-gray-300">{contactDetails?.email}</span>
            </div>
            <div className="flex items-center gap-3">
              <Phone className="w-4 h-4 text-gray-400" />
              <span className="text-gray-700 dark:text-gray-300">{contactDetails?.phone}</span>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Additional Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all resize-none text-sm"
              placeholder="Any specific requirements..."
            />
          </div>
        </div>
      </div>

      {/* Footer - Submit Button */}
      <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-black">
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className={`
            w-full font-medium py-3.5 px-6 rounded-xl transition-all duration-200
            ${
              !isSubmitting
                ? "bg-[#1d1d1f] dark:bg-white text-white dark:text-[#1d1d1f] hover:bg-black active:scale-[0.98]"
                : "bg-gray-300 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
            }
          `}
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  fill="none"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Confirming...
            </span>
          ) : (
            "Confirm Booking"
          )}
        </button>
      </div>
    </div>
  );
}
