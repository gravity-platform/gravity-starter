import { useState } from "react";
import { User, Mail, Phone, CreditCard, Briefcase, Building2, DollarSign, CheckCircle, FileText } from "lucide-react";

/**
 * ApplicationReview - Step 3: Review all details and submit application
 */
export function ApplicationReview({ product, formData, onSubmit }) {
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!agreedToTerms) return;

    setIsSubmitting(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));

    onSubmit({ agreedToTerms, submittedAt: new Date().toISOString() });
    setIsSubmitting(false);
  };

  const InfoRow = ({ icon: Icon, label, value }) => (
    <div className="flex items-start gap-3 py-2">
      <Icon className="w-4 h-4 text-gray-400 mt-0.5 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide">{label}</p>
        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{value || "—"}</p>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="space-y-6">
          <div className="mb-6">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">Review Your Application</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Please review your details before submitting</p>
          </div>

          {/* Product Summary */}
          <div className="bg-blue-50 dark:bg-blue-950/30 rounded-xl p-4 border border-blue-100 dark:border-blue-900">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                  {product?.title || product?.name}
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-400">{product?.tier || "Standard"} Card</p>
              </div>
            </div>
          </div>

          {/* Personal Details */}
          <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <User className="w-4 h-4" />
              Personal Details
            </h4>
            <div className="space-y-1 divide-y divide-gray-200 dark:divide-gray-800">
              <InfoRow icon={User} label="Full Name" value={formData.fullName} />
              <InfoRow icon={Mail} label="Email" value={formData.email} />
              <InfoRow icon={Phone} label="Mobile" value={formData.phone} />
              <InfoRow icon={CreditCard} label="Emirates ID" value={formData.emiratesId} />
            </div>
          </div>

          {/* Employment Details */}
          <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <Briefcase className="w-4 h-4" />
              Employment Details
            </h4>
            <div className="space-y-1 divide-y divide-gray-200 dark:divide-gray-800">
              <InfoRow
                icon={Briefcase}
                label="Employment Status"
                value={formData.employmentStatus?.replace("-", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
              />
              {formData.employerName && <InfoRow icon={Building2} label="Employer" value={formData.employerName} />}
              {formData.jobTitle && <InfoRow icon={Briefcase} label="Job Title" value={formData.jobTitle} />}
              <InfoRow
                icon={DollarSign}
                label="Monthly Income"
                value={formData.monthlyIncome ? `AED ${formData.monthlyIncome.replace("-", " - ")}` : "—"}
              />
            </div>
          </div>

          {/* Terms & Conditions */}
          <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4">
            <label className="flex items-start gap-3 cursor-pointer">
              <div className="relative flex items-center justify-center mt-0.5">
                <input
                  type="checkbox"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="w-5 h-5 rounded border-2 border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500 focus:ring-offset-0"
                />
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  I agree to the{" "}
                  <a href="#" className="text-blue-600 hover:underline">
                    Terms & Conditions
                  </a>{" "}
                  and{" "}
                  <a href="#" className="text-blue-600 hover:underline">
                    Privacy Policy
                  </a>
                  . I confirm that all information provided is accurate and complete.
                </p>
              </div>
            </label>
          </div>

          {/* Disclaimer */}
          <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-100 dark:border-amber-900">
            <FileText className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-amber-800 dark:text-amber-200">
              By submitting this application, you authorize SAB to verify your information and perform a credit check.
              Approval is subject to eligibility criteria and credit assessment.
            </p>
          </div>
        </div>
      </div>

      {/* Footer - Submit Button */}
      <div className="px-6 py-5 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
        <button
          onClick={handleSubmit}
          disabled={!agreedToTerms || isSubmitting}
          className={`
            w-full py-3.5 font-medium text-[15px] rounded-xl transition-all
            ${
              agreedToTerms && !isSubmitting
                ? "bg-[#1d1d1f] dark:bg-white text-white dark:text-[#1d1d1f] hover:bg-black active:scale-[0.98]"
                : "bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed"
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
              Submitting Application...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <CheckCircle className="w-5 h-5" />
              Submit Application
            </span>
          )}
        </button>
      </div>
    </div>
  );
}

export default ApplicationReview;
