import React, { useState } from "react";
import { User, Mail, Phone, CheckCircle, ArrowLeft } from "lucide-react";

/**
 * Contact Details Step - Second step in booking flow
 * Shows user info if logged in, or collects contact details
 */
export function ContactDetailsStep({ service, initialData, isLoggedIn, user, onSubmit, onBack }) {
  const [formData, setFormData] = useState({
    name: initialData?.name || "",
    email: initialData?.email || "",
    phone: initialData?.phone || "",
  });

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const isFormValid = formData.name && formData.email && formData.phone;

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-3 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Calendar
        </button>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
          {isLoggedIn ? "Confirm Your Details" : "Your Information"}
        </h2>
        <p className="text-xs text-gray-500 dark:text-gray-400">{service?.name || service?.title}</p>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <form onSubmit={handleSubmit} className="max-w-lg mx-auto space-y-5">
          {/* Logged In Indicator */}
          {isLoggedIn && (
            <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-3 border border-blue-100 dark:border-blue-900">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <div>
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    Logged in as {user?.name || user?.email}
                  </p>
                  <p className="text-xs text-blue-600 dark:text-blue-400">Your details are pre-filled below</p>
                </div>
              </div>
            </div>
          )}

          {/* Name */}
          <div>
            <label className="block text-xs font-bold tracking-wider uppercase text-gray-600 dark:text-gray-400 mb-2">
              FULL NAME *
            </label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                className="w-full h-14 pl-12 pr-4 text-base font-medium rounded-xl border-2 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-blue-600 focus:ring-0 transition-all"
                placeholder="John Doe"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-bold tracking-wider uppercase text-gray-600 dark:text-gray-400 mb-2">
              EMAIL ADDRESS *
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                required
                value={formData.email}
                onChange={(e) => handleInputChange("email", e.target.value)}
                className="w-full h-14 pl-12 pr-4 text-base font-medium rounded-xl border-2 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-blue-600 focus:ring-0 transition-all"
                placeholder="john@example.com"
              />
            </div>
          </div>

          {/* Phone */}
          <div>
            <label className="block text-xs font-bold tracking-wider uppercase text-gray-600 dark:text-gray-400 mb-2">
              PHONE NUMBER *
            </label>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="tel"
                required
                value={formData.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
                className="w-full h-14 pl-12 pr-4 text-base font-medium rounded-xl border-2 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-blue-600 focus:ring-0 transition-all"
                placeholder="+1 (555) 000-0000"
              />
            </div>
          </div>

          {/* Info Text */}
          <div className="pt-2">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              We'll use this information to confirm your appointment and send you reminders.
            </p>
          </div>
        </form>
      </div>

      {/* Footer - Continue Button */}
      <div className="px-6 py-5 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <div className="max-w-lg mx-auto">
          <button
            onClick={handleSubmit}
            disabled={!isFormValid}
            className={`
              w-full py-3.5 font-medium text-[15px] rounded-xl transition-all
              ${
                isFormValid
                  ? "bg-blue-600 hover:bg-blue-700 text-white active:scale-[0.98]"
                  : "bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed"
              }
            `}
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}
