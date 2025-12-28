import { useState } from "react";
import { Briefcase, Building2, DollarSign, Clock } from "lucide-react";

/**
 * EmploymentDetailsStep - Step 2: Collect employment and income information
 */
export function EmploymentDetailsStep({ initialData, onSubmit }) {
  const [formData, setFormData] = useState({
    employmentStatus: initialData?.employmentStatus || "",
    employerName: initialData?.employerName || "",
    jobTitle: initialData?.jobTitle || "",
    monthlyIncome: initialData?.monthlyIncome || "",
    yearsEmployed: initialData?.yearsEmployed || "",
  });

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const isFormValid = formData.employmentStatus && formData.monthlyIncome;

  const showEmployerFields = formData.employmentStatus === "employed" || formData.employmentStatus === "self-employed";

  return (
    <div className="flex flex-col h-full">
      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="mb-6">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">Employment Details</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">Tell us about your employment and income</p>
          </div>

          {/* Employment Status */}
          <div>
            <label className="block text-xs font-bold tracking-wider uppercase text-gray-600 dark:text-gray-400 mb-2">
              EMPLOYMENT STATUS *
            </label>
            <div className="relative">
              <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                required
                value={formData.employmentStatus}
                onChange={(e) => handleInputChange("employmentStatus", e.target.value)}
                className="w-full h-14 pl-12 pr-4 text-base font-medium rounded-xl border-2 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-blue-600 focus:ring-0 transition-all appearance-none"
              >
                <option value="">Select status</option>
                <option value="employed">Employed</option>
                <option value="self-employed">Self-Employed</option>
                <option value="business-owner">Business Owner</option>
                <option value="retired">Retired</option>
                <option value="student">Student</option>
                <option value="unemployed">Unemployed</option>
              </select>
            </div>
          </div>

          {/* Employer Name - Show only if employed */}
          {showEmployerFields && (
            <>
              <div>
                <label className="block text-xs font-bold tracking-wider uppercase text-gray-600 dark:text-gray-400 mb-2">
                  {formData.employmentStatus === "self-employed" ? "BUSINESS NAME" : "EMPLOYER NAME"}
                </label>
                <div className="relative">
                  <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={formData.employerName}
                    onChange={(e) => handleInputChange("employerName", e.target.value)}
                    className="w-full h-14 pl-12 pr-4 text-base font-medium rounded-xl border-2 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-blue-600 focus:ring-0 transition-all"
                    placeholder={formData.employmentStatus === "self-employed" ? "Your business name" : "Company name"}
                  />
                </div>
              </div>

              {/* Job Title */}
              <div>
                <label className="block text-xs font-bold tracking-wider uppercase text-gray-600 dark:text-gray-400 mb-2">
                  JOB TITLE / DESIGNATION
                </label>
                <div className="relative">
                  <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={formData.jobTitle}
                    onChange={(e) => handleInputChange("jobTitle", e.target.value)}
                    className="w-full h-14 pl-12 pr-4 text-base font-medium rounded-xl border-2 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-blue-600 focus:ring-0 transition-all"
                    placeholder="Your role"
                  />
                </div>
              </div>

              {/* Years Employed */}
              <div>
                <label className="block text-xs font-bold tracking-wider uppercase text-gray-600 dark:text-gray-400 mb-2">
                  YEARS IN CURRENT ROLE
                </label>
                <div className="relative">
                  <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <select
                    value={formData.yearsEmployed}
                    onChange={(e) => handleInputChange("yearsEmployed", e.target.value)}
                    className="w-full h-14 pl-12 pr-4 text-base font-medium rounded-xl border-2 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-blue-600 focus:ring-0 transition-all appearance-none"
                  >
                    <option value="">Select duration</option>
                    <option value="less-than-1">Less than 1 year</option>
                    <option value="1-2">1-2 years</option>
                    <option value="2-5">2-5 years</option>
                    <option value="5-10">5-10 years</option>
                    <option value="10+">10+ years</option>
                  </select>
                </div>
              </div>
            </>
          )}

          {/* Monthly Income */}
          <div>
            <label className="block text-xs font-bold tracking-wider uppercase text-gray-600 dark:text-gray-400 mb-2">
              MONTHLY INCOME (AED) *
            </label>
            <div className="relative">
              <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <select
                required
                value={formData.monthlyIncome}
                onChange={(e) => handleInputChange("monthlyIncome", e.target.value)}
                className="w-full h-14 pl-12 pr-4 text-base font-medium rounded-xl border-2 border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-blue-600 focus:ring-0 transition-all appearance-none"
              >
                <option value="">Select income range</option>
                <option value="5000-10000">AED 5,000 - 10,000</option>
                <option value="10000-20000">AED 10,000 - 20,000</option>
                <option value="20000-35000">AED 20,000 - 35,000</option>
                <option value="35000-50000">AED 35,000 - 50,000</option>
                <option value="50000-75000">AED 50,000 - 75,000</option>
                <option value="75000-100000">AED 75,000 - 100,000</option>
                <option value="100000+">AED 100,000+</option>
              </select>
            </div>
          </div>

          {/* Info Text */}
          <div className="pt-2">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Your income information helps us determine your eligibility and credit limit. All information is kept
              confidential.
            </p>
          </div>
        </form>
      </div>

      {/* Footer - Continue Button */}
      <div className="px-6 py-5 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
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
  );
}

export default EmploymentDetailsStep;
