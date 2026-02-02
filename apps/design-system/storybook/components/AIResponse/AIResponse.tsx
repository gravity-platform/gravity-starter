import React, { useState, useEffect, useRef } from "react";
import Markdown from "markdown-to-jsx";
import { getSafeMarkdown } from "./markdownBuffer";
import styles from "./AIResponse.module.css";

// Custom link component that opens in new tab
const ExternalLink = ({ children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement>) => (
  <a {...props} target="_blank" rel="noopener noreferrer">
    {children}
  </a>
);

const markdownOptions = {
  overrides: {
    a: { component: ExternalLink },
  },
};

interface AIResponseProps {
  progressText?: string;
  text?: string;
  questions?: string[]; // Always an array of strings
  onQuestionClick?: (question: string) => void;
  className?: string;
  nodeId?: string; // For Zustand store subscription
  isStreaming?: boolean; // Show typing cursor when streaming
}

// Timeout in ms to stop thinking animation after no updates
const THINKING_TIMEOUT_MS = 3000;

export default function AIResponse(props: AIResponseProps) {
  const { progressText, text, questions, onQuestionClick, className, isStreaming } = props;

  // Track if thinking animation should show (stops after timeout of no updates)
  const [showThinkingDots, setShowThinkingDots] = useState(true);
  const lastProgressTextRef = useRef(progressText);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Reset thinking dots when progressText changes, set timeout to hide them
  useEffect(() => {
    if (progressText !== lastProgressTextRef.current) {
      // New progressText received - show dots and reset timeout
      lastProgressTextRef.current = progressText;
      setShowThinkingDots(true);

      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Set new timeout to hide dots after inactivity
      timeoutRef.current = setTimeout(() => {
        setShowThinkingDots(false);
      }, THINKING_TIMEOUT_MS);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [progressText]);

  // Hide thinking dots immediately when text starts streaming
  useEffect(() => {
    if (text && text.length > 0) {
      setShowThinkingDots(false);
    }
  }, [text]);

  // SIMPLE: Just show the text prop directly. Server sends accumulated text.
  const questionList = questions || [];

  return (
    <div className={`${styles.container} ${className || ""}`}>
      {/* Reasoning/Thinking - show when progressText exists, dots animate until timeout */}
      {progressText && (
        <div className={styles.progress}>
          {showThinkingDots && (
            <span className={styles.dotsContainer}>
              <span className={styles.dot} />
              <span className={styles.dot} />
              <span className={styles.dot} />
            </span>
          )}
          <Markdown options={markdownOptions}>{progressText}</Markdown>
        </div>
      )}

      {/* Text - server sends accumulated chunks, use getSafeMarkdown during streaming */}
      {text && (
        <div className={`${styles.textContent} prose`}>
          <Markdown options={markdownOptions}>{getSafeMarkdown(text, !!isStreaming)}</Markdown>
          {/* Animated blinking cursor inline with text */}
          {isStreaming && <span className={styles.cursor} />}
        </div>
      )}

      {/* Questions - only show if questions are provided */}
      {questionList.length > 0 && (
        <div className={styles.questionsContainer}>
          {questionList.map((question, i) => (
            <button key={`q-${i}`} className={styles.questionButton} onClick={() => onQuestionClick?.(question)}>
              <svg className={styles.questionIcon} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                />
              </svg>
              <span className={styles.questionText}>{question}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
