import { useState, useCallback } from "react";
import { ArrowLeft } from "lucide-react";
import { PersonalDetailsStep } from "./steps/PersonalDetailsStep";
import { EmploymentDetailsStep } from "./steps/EmploymentDetailsStep";
import { ApplicationReview } from "./steps/ApplicationReview";

/**
 * ProductApplicationForm - Multi-step application form for bank products
 *
 * Steps:
 * 1. Personal Details - Name, email, phone, ID
 * 2. Employment Details - Employer, income, employment type
 * 3. Review & Submit - Confirm all details
 */
export function ProductApplicationForm({ product, onBack, onComplete }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    // Personal Details
    fullName: "",
    email: "",
    phone: "",
    emiratesId: "",
    dateOfBirth: "",
    nationality: "",

    // Employment Details
    employmentStatus: "",
    employerName: "",
    jobTitle: "",
    monthlyIncome: "",
    yearsEmployed: "",
  });

  const totalSteps = 3;

  const handlePersonalSubmit = useCallback((personalData) => {
    setFormData((prev) => ({ ...prev, ...personalData }));
    setCurrentStep(2);
  }, []);

  const handleEmploymentSubmit = useCallback((employmentData) => {
    setFormData((prev) => ({ ...prev, ...employmentData }));
    setCurrentStep(3);
  }, []);

  const handleApplicationSubmit = useCallback(
    async (finalData) => {
      const applicationData = {
        ...formData,
        ...finalData,
        product: product?.title || product?.name,
        productId: product?.id || product?.universal_id,
        submittedAt: new Date().toISOString(),
      };

      console.log("[ProductApplicationForm] Submitting:", applicationData);
      onComplete?.(applicationData);
    },
    [formData, product, onComplete]
  );

  const handleBack = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
    } else {
      onBack?.();
    }
  }, [currentStep, onBack]);

  // Step indicator
  const StepIndicator = () => (
    <div className="flex items-center justify-center gap-2 py-4">
      {[1, 2, 3].map((step) => (
        <div
          key={step}
          className={`h-2 rounded-full transition-all duration-300 ${
            step === currentStep
              ? "w-8 bg-blue-600"
              : step < currentStep
              ? "w-2 bg-blue-600"
              : "w-2 bg-gray-300 dark:bg-gray-700"
          }`}
        />
      ))}
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800">
        <button
          onClick={handleBack}
          className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-2 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {currentStep === 1 ? "Back to Product" : "Back"}
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Apply for {product?.title || product?.name}
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Step {currentStep} of {totalSteps}
            </p>
          </div>
        </div>
        <StepIndicator />
      </div>

      {/* Step Content */}
      <div className="flex-1 overflow-hidden">
        {currentStep === 1 && <PersonalDetailsStep initialData={formData} onSubmit={handlePersonalSubmit} />}
        {currentStep === 2 && <EmploymentDetailsStep initialData={formData} onSubmit={handleEmploymentSubmit} />}
        {currentStep === 3 && (
          <ApplicationReview product={product} formData={formData} onSubmit={handleApplicationSubmit} />
        )}
      </div>
    </div>
  );
}

export default ProductApplicationForm;
