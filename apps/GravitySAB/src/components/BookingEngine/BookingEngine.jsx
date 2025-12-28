import React, { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, ArrowLeft } from "lucide-react";
import { CalendarHeader } from "./CalendarHeader";
import { DaySelector } from "./DaySelector";
import { TimeSlotGrid } from "./TimeSlotGrid";
import { BookingConfirmation } from "./BookingConfirmation";
import { ContactDetailsStep } from "./ContactDetailsStep";

/**
 * Premium Booking Engine Component
 * Calendar-based appointment booking for sports clinic
 */
export function BookingEngine({ service, onBack, onBookingComplete }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [bookingStep, setBookingStep] = useState("calendar"); // 'calendar' | 'contact' | 'confirmation'
  const [contactDetails, setContactDetails] = useState({
    name: "",
    email: "",
    phone: "",
  });

  // Generate available dates (next 30 days)
  const availableDates = useMemo(() => {
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      // Skip Sundays (or customize based on clinic hours)
      if (date.getDay() !== 0) {
        dates.push(date);
      }
    }
    return dates;
  }, []);

  // Generate time slots for selected date
  const timeSlots = useMemo(() => {
    if (!selectedDate) return [];

    const slots = [];
    const startHour = 9; // 9 AM
    const endHour = 17; // 5 PM

    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute of [0, 30]) {
        const time = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
        const isAvailable = Math.random() > 0.3; // Mock availability
        slots.push({ time, available: isAvailable });
      }
    }
    return slots;
  }, [selectedDate]);

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setSelectedTime(null);
  };

  const handleTimeSelect = (time) => {
    setSelectedTime(time);
  };

  const handleConfirmBooking = () => {
    setBookingStep("contact");
  };

  const handleContactSubmit = (details) => {
    setContactDetails(details);
    setBookingStep("confirmation");
  };

  const handleBookingSubmit = (bookingData) => {
    const completeBooking = {
      ...contactDetails,
      ...bookingData,
    };
    console.log("[BookingEngine] Booking submitted:", completeBooking);
    onBookingComplete?.(completeBooking);
  };

  const handleBackToCalendar = () => {
    setBookingStep("calendar");
  };

  const handleBackToContact = () => {
    setBookingStep("contact");
  };

  // Navigate months
  const navigateMonth = (direction) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(currentDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  // Step 2: Contact Details
  if (bookingStep === "contact") {
    return (
      <ContactDetailsStep
        service={service}
        initialData={contactDetails}
        isLoggedIn={false}
        user={null}
        onSubmit={handleContactSubmit}
        onBack={handleBackToCalendar}
      />
    );
  }

  // Step 3: Confirmation
  if (bookingStep === "confirmation") {
    return (
      <BookingConfirmation
        service={service}
        contactDetails={contactDetails}
        selectedDate={selectedDate}
        selectedTime={selectedTime}
        onBack={handleBackToContact}
        onSubmit={handleBookingSubmit}
      />
    );
  }

  // Step 1: Calendar Selection

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800">
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-3 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
        )}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Book Appointment</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {service?.name || service?.title || "Select your preferred date and time"}
            </p>
          </div>
          <div className="text-right ml-4">
            <div className="text-2xl font-bold text-gray-900 dark:text-white">$55</div>
            <div className="text-xs text-gray-500 dark:text-gray-400">per session</div>
          </div>
        </div>
      </div>

      {/* Calendar Section */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 space-y-4">
          {/* Month Navigation */}
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigateMonth(-1)}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </button>
            <CalendarHeader currentDate={currentDate} />
            <button
              onClick={() => navigateMonth(1)}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <ChevronRight className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </button>
          </div>

          {/* Day Selector */}
          <DaySelector
            availableDates={availableDates}
            currentDate={currentDate}
            selectedDate={selectedDate}
            onDateSelect={handleDateSelect}
          />

          {/* Time Slots */}
          {selectedDate && (
            <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Available Times</h3>

              <TimeSlotGrid timeSlots={timeSlots} selectedTime={selectedTime} onTimeSelect={handleTimeSelect} />
            </div>
          )}
        </div>
      </div>

      {/* Footer - Confirm Button */}
      {selectedTime && (
        <div className="px-4 py-5 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
          <div className="max-w-lg mx-auto">
            <button
              onClick={handleConfirmBooking}
              className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-[15px] rounded-xl transition-all active:scale-[0.98]"
            >
              Continue
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default BookingEngine;
