import React, { useState, useEffect } from "react";
import styles from "./AccountTransferWidget.module.css";
import KenBurnsImage from "../../atoms/Image/KenBurnsImage";
import TransferHeader from "./components/TransferHeader";
import StepIndicator from "./components/StepIndicator";
import SourceAccountStep from "./components/SourceAccountStep";
import RecipientStep from "./components/RecipientStep";
import AmountStep from "./components/AmountStep";
import ReviewStep from "./components/ReviewStep";
import ConfirmationStep from "./components/ConfirmationStep";
import TransferActions from "./components/TransferActions";
import TransferSummary from "./components/TransferSummary";

export interface BankAccount {
  accountNumber?: string;
  accountName?: string;
  bankName?: string;
  bankCode?: string;
  iban?: string;
  swiftCode?: string;
  currency?: string;
  balance?: number;
}

export interface Beneficiary {
  id: string;
  name: string;
  nickname?: string;
  accountNumber?: string;
  iban?: string;
  bankName: string;
  bankCode?: string;
  swiftCode?: string;
  currency?: string;
  type: "domestic" | "international";
}

export interface TransferData {
  /** Source account details */
  sourceAccount?: BankAccount;
  /** Recipient account details */
  recipientAccount?: BankAccount;
  /** Transfer amount */
  amount?: number;
  /** Currency code (e.g., USD, EUR, GBP) */
  currency?: string;
  /** Transfer reference/memo */
  reference?: string;
  /** Transfer type: domestic or international */
  transferType?: "domestic" | "international";
  /** Scheduled date for transfer */
  scheduledDate?: string;
  /** Transfer fee */
  fee?: number;
  /** Exchange rate (for international transfers) */
  exchangeRate?: number;
  /** Transfer status */
  status?: "draft" | "pending" | "processing" | "completed" | "failed";
  /** Confirmation number */
  confirmationNumber?: string;
  /** Estimated arrival date */
  estimatedArrival?: string;
}

export type TransferStep = "source" | "recipient" | "amount" | "review" | "confirmation";

const STEPS: TransferStep[] = ["source", "recipient", "amount", "review", "confirmation"];

const STEP_LABELS: Record<TransferStep, string> = {
  source: "From Account",
  recipient: "To Account",
  amount: "Amount",
  review: "Review",
  confirmation: "Done",
};

interface AccountTransferWidgetProps {
  /** Display state for focus mode: 'inline' (compact card) or 'focused' (full widget) */
  displayState?: "inline" | "focused";
  /** Transfer data object populated by AI */
  transferData?: TransferData;
  /** Available source accounts to choose from */
  availableAccounts?: BankAccount[];
  /** Saved beneficiaries to choose from */
  beneficiaries?: Beneficiary[];
  /** Callback when transfer data changes */
  onTransferChange?: (updatedTransfer: TransferData) => void;
  /** Callback when transfer is confirmed */
  onConfirm?: (transfer: TransferData) => void;
  /** Callback when transfer is cancelled */
  onCancel?: () => void;
  /** Whether the widget is editable */
  editable?: boolean;
  /** Hero image URL */
  heroImage?: string;
  /** Current step (from Zustand state) */
  currentStep?: TransferStep;
  /** Local transfer data (from Zustand state) */
  localTransfer?: TransferData;
  /** Function to update Zustand state (injected by withZustandData HOC) */
  updateData?: (updates: Record<string, any>) => void;
}

const DEFAULT_HERO_IMAGE = "https://res.cloudinary.com/sonik/image/upload/v1767543207/SAB/travel.jpg";

export default function AccountTransferWidget(props: AccountTransferWidgetProps) {
  const {
    displayState = "focused",
    transferData = {},
    availableAccounts = [],
    beneficiaries = [],
    onTransferChange,
    onConfirm,
    onCancel,
    editable = true,
    heroImage,
    currentStep: zustandCurrentStep,
    localTransfer: zustandLocalTransfer,
    updateData,
  } = props;

  // Determine the first incomplete step based on pre-filled data
  const getInitialStep = (data: TransferData): TransferStep => {
    if (data.status === "completed") return "confirmation";
    // If we have amount and recipient, go to review
    if (data.amount && data.amount > 0 && (data.recipientAccount?.accountNumber || data.recipientAccount?.iban)) {
      return "review";
    }
    // If we have recipient but no amount, go to amount step
    if (data.recipientAccount?.accountName || data.recipientAccount?.accountNumber || data.recipientAccount?.iban) {
      return "amount";
    }
    // If we have source account, go to recipient step
    if (data.sourceAccount?.accountNumber) {
      return "recipient";
    }
    return "source";
  };

  // Use Zustand state if available, otherwise fall back to local state (for Storybook)
  const [fallbackStep, setFallbackStep] = useState<TransferStep>(() => getInitialStep(transferData));
  const [fallbackTransfer, setFallbackTransfer] = useState<TransferData>(transferData);

  // Determine which state to use (Zustand or fallback)
  const currentStep = zustandCurrentStep || fallbackStep;
  const localTransfer = zustandLocalTransfer || fallbackTransfer;

  // Wrapper to update state (Zustand if available, otherwise local)
  const setCurrentStep = (step: TransferStep) => {
    if (updateData) {
      updateData({ currentStep: step });
    } else {
      setFallbackStep(step);
    }
  };

  const setLocalTransfer = (transfer: TransferData) => {
    if (updateData) {
      updateData({ localTransfer: transfer });
    } else {
      setFallbackTransfer(transfer);
    }
  };

  // Initialize Zustand state on first render if not already set
  useEffect(() => {
    if (updateData && !zustandCurrentStep) {
      const initialStep = getInitialStep(transferData);
      updateData({ currentStep: initialStep, localTransfer: transferData });
    }
  }, [updateData, zustandCurrentStep, transferData]);

  // Update fallback state when props change (for Storybook)
  useEffect(() => {
    if (!updateData) {
      setFallbackTransfer(transferData);
      setFallbackStep(getInitialStep(transferData));
    }
  }, [transferData, updateData]);

  const currentStepIndex = STEPS.indexOf(currentStep);

  const handleFieldChange = <K extends keyof TransferData>(field: K, value: TransferData[K]) => {
    const updated = { ...localTransfer, [field]: value };
    setLocalTransfer(updated);
    onTransferChange?.(updated);
  };

  const handleSourceAccountChange = (account: BankAccount) => {
    handleFieldChange("sourceAccount", account);
  };

  const handleRecipientChange = (account: BankAccount) => {
    handleFieldChange("recipientAccount", account);
  };

  const canProceed = (): boolean => {
    switch (currentStep) {
      case "source":
        return !!localTransfer.sourceAccount?.accountNumber;
      case "recipient":
        return !!localTransfer.recipientAccount?.accountNumber || !!localTransfer.recipientAccount?.iban;
      case "amount":
        return !!localTransfer.amount && localTransfer.amount > 0;
      case "review":
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (currentStep === "review") {
      // Confirm transfer
      const confirmedTransfer: TransferData = {
        ...localTransfer,
        status: "completed",
        confirmationNumber: `TRF-${Date.now().toString(36).toUpperCase()}`,
        estimatedArrival: getEstimatedArrival(),
      };
      setLocalTransfer(confirmedTransfer);
      onConfirm?.(confirmedTransfer);
      setCurrentStep("confirmation");
    } else {
      const nextIndex = currentStepIndex + 1;
      if (nextIndex < STEPS.length) {
        setCurrentStep(STEPS[nextIndex]);
      }
    }
  };

  const handleBack = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(STEPS[prevIndex]);
    }
  };

  const getEstimatedArrival = (): string => {
    const days = localTransfer.transferType === "international" ? 3 : 1;
    const arrival = new Date();
    arrival.setDate(arrival.getDate() + days);
    return arrival.toISOString().split("T")[0];
  };

  const handleNewTransfer = () => {
    setLocalTransfer({});
    setCurrentStep("source");
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case "source":
        return (
          <SourceAccountStep
            selectedAccount={localTransfer.sourceAccount}
            availableAccounts={availableAccounts}
            onSelect={handleSourceAccountChange}
          />
        );
      case "recipient":
        return (
          <RecipientStep
            selectedBeneficiary={localTransfer.recipientAccount}
            beneficiaries={beneficiaries}
            transferType={localTransfer.transferType || "domestic"}
            onSelect={handleRecipientChange}
            onTransferTypeChange={(type: "domestic" | "international") => handleFieldChange("transferType", type)}
          />
        );
      case "amount":
        return (
          <AmountStep
            amount={localTransfer.amount}
            currency={localTransfer.currency || localTransfer.sourceAccount?.currency || "USD"}
            reference={localTransfer.reference}
            scheduledDate={localTransfer.scheduledDate}
            fee={localTransfer.fee}
            sourceBalance={localTransfer.sourceAccount?.balance}
            onAmountChange={(amount: number) => handleFieldChange("amount", amount)}
            onCurrencyChange={(currency: string) => handleFieldChange("currency", currency)}
            onReferenceChange={(ref: string) => handleFieldChange("reference", ref)}
            onScheduledDateChange={(date: string) => handleFieldChange("scheduledDate", date)}
          />
        );
      case "review":
        return <ReviewStep transfer={localTransfer} />;
      case "confirmation":
        return <ConfirmationStep transfer={localTransfer} onNewTransfer={handleNewTransfer} />;
      default:
        return null;
    }
  };

  const isConfirmation = currentStep === "confirmation";

  // INLINE VIEW - micro version showing current step and state
  if (displayState === "inline") {
    // Step-aware content based on currentStep
    const getStepContent = () => {
      switch (currentStep) {
        case "source":
          return {
            stepLabel: "Step 1 of 4",
            title: "Select Source Account",
            subtitle: "Choose which account to send from",
            isComplete: false,
          };
        case "recipient":
          return {
            stepLabel: "Step 2 of 4",
            title: "Select Recipient",
            subtitle: localTransfer.sourceAccount?.accountName
              ? `From: ${localTransfer.sourceAccount.accountName}`
              : "Choose who to pay",
            isComplete: false,
          };
        case "amount":
          return {
            stepLabel: "Step 3 of 4",
            title: "Enter Amount",
            subtitle: localTransfer.recipientAccount?.accountName
              ? `To: ${localTransfer.recipientAccount.accountName}`
              : "Set transfer amount",
            isComplete: false,
          };
        case "review":
          return {
            stepLabel: "Step 4 of 4",
            title: `$${localTransfer.amount?.toLocaleString() || "0"} to ${
              localTransfer.recipientAccount?.accountName || "..."
            }`,
            subtitle: "Review and confirm transfer",
            isComplete: false,
          };
        case "confirmation":
          return {
            stepLabel: "Complete",
            title: `$${localTransfer.amount?.toLocaleString() || "0"} sent`,
            subtitle: `To ${localTransfer.recipientAccount?.accountName || "recipient"}`,
            isComplete: true,
          };
        default:
          return {
            stepLabel: "New Transfer",
            title: "Bank Transfer",
            subtitle: "Send money to anyone",
            isComplete: false,
          };
      }
    };

    const content = getStepContent();
    const stepNumber = STEPS.indexOf(currentStep) + 1;

    return (
      <div className={styles.inlineCard}>
        {/* Left: Icon + Content */}
        <div className={styles.inlineMain}>
          {/* Icon */}
          <div className={`${styles.inlineIcon} ${content.isComplete ? styles.inlineIconComplete : ""}`}>
            {content.isComplete ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M20 6L9 17l-5-5" />
              </svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M17 1l4 4-4 4" />
                <path d="M3 11V9a4 4 0 0 1 4-4h14" />
                <path d="M7 23l-4-4 4-4" />
                <path d="M21 13v2a4 4 0 0 1-4 4H3" />
              </svg>
            )}
          </div>

          {/* Content */}
          <div className={styles.inlineContent}>
            <div className={styles.inlineHeader}>
              <span className={styles.inlineTitle}>Bank Transfer</span>
              {!content.isComplete && <span className={styles.inlineStep}>{content.stepLabel}</span>}
            </div>
            <div className={styles.inlinePrimary}>{content.title}</div>
            <div className={styles.inlineSecondary}>{content.subtitle}</div>

            {/* Progress dots inline */}
            {!content.isComplete && (
              <div className={styles.inlineProgress}>
                {[1, 2, 3, 4].map((step) => (
                  <div
                    key={step}
                    className={`${styles.inlineProgressDot} ${
                      step < stepNumber ? styles.inlineProgressDotComplete : ""
                    } ${step === stepNumber ? styles.inlineProgressDotActive : ""}`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Hero Image */}
        <div className={styles.inlineImage}>
          <img src={heroImage || DEFAULT_HERO_IMAGE} alt="Bank Transfer" />
        </div>
      </div>
    );
  }

  // FOCUSED VIEW - full widget
  return (
    <div className={styles.widget}>
      <div className={styles.content}>
        <TransferHeader
          isCompleted={isConfirmation}
          title={isConfirmation ? "Transfer Complete" : "Bank Transfer"}
          subtitle={isConfirmation ? "Your transfer has been processed" : STEP_LABELS[currentStep]}
        />

        {!isConfirmation && (
          <StepIndicator
            steps={STEPS.slice(0, -1)} // Don't show confirmation in indicator
            currentStep={currentStep}
            labels={STEP_LABELS}
          />
        )}

        <TransferSummary
          sourceAccount={localTransfer.sourceAccount}
          recipientAccount={localTransfer.recipientAccount}
          amount={localTransfer.amount}
          currency={localTransfer.currency}
          currentStep={currentStep}
          onEditSource={() => setCurrentStep("source")}
          onEditRecipient={() => setCurrentStep("recipient")}
          onEditAmount={() => setCurrentStep("amount")}
        />

        <div className={styles.stepContent}>{renderStepContent()}</div>

        {!isConfirmation && (
          <TransferActions
            currentStep={currentStep}
            canProceed={canProceed()}
            onBack={handleBack}
            onNext={handleNext}
            onCancel={onCancel}
            isFirstStep={currentStepIndex === 0}
            isLastStep={currentStep === "review"}
          />
        )}
      </div>

      <div className={styles.imageContainer}>
        <KenBurnsImage src={heroImage || DEFAULT_HERO_IMAGE} alt="Bank Transfer" overlay={true} />
      </div>
    </div>
  );
}
