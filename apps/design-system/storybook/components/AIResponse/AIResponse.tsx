import React, { useState, useEffect, useRef } from "react";
import Markdown from "markdown-to-jsx";
import { ChunkAnimator } from "./chunkAnimator";
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

export default function AIResponse(props: AIResponseProps) {
  const { progressText, text, questions, onQuestionClick, className, nodeId, isStreaming } = props;

  // Use ref for displayed text to avoid React state race conditions
  const displayedTextRef = useRef<string>(props.text || "");
  const [, forceUpdate] = useState(0);
  const animatorRef = useRef<ChunkAnimator | null>(null);

  // Initialize animator once with a callback that updates the ref and triggers render
  if (!animatorRef.current) {
    animatorRef.current = new ChunkAnimator({
      charsPerSecond: 200,
      onUpdate: (newText: string) => {
        // Only update if text is longer (never go backwards)
        if (newText.length >= displayedTextRef.current.length) {
          displayedTextRef.current = newText;
          forceUpdate((n) => n + 1);
        }
      },
      onTypingChange: () => {},
    });
  }

  // Cleanup animator on unmount
  React.useEffect(() => {
    return () => {
      animatorRef.current?.destroy();
    };
  }, []);

  // Handle text updates
  React.useLayoutEffect(() => {
    // Not streaming - show full text immediately
    if (!isStreaming) {
      animatorRef.current?.stop(false);
      if (text) {
        displayedTextRef.current = text;
        forceUpdate((n) => n + 1);
      }
      return;
    }

    // Streaming - animate new text
    if (text) {
      animatorRef.current?.addChunk(text);
    }
  }, [text, isStreaming]);

  // Get current displayed text
  const displayedText = displayedTextRef.current;

  // Questions are always an array of strings
  const questionList = questions || [];

  return (
    <div className={`${styles.container} ${className || ""}`}>
      {/* Reasoning/Thinking - rendered as markdown in italic gray */}
      {progressText && (
        <div className={styles.progress}>
          <span className={styles.dotsContainer}>
            <span className={styles.dot} />
            <span className={styles.dot} />
            <span className={styles.dot} />
          </span>
          <Markdown options={markdownOptions}>{progressText}</Markdown>
        </div>
      )}

      {/* Text - server sends accumulated chunks */}
      {displayedText && (
        <div className={`${styles.textContent} prose`}>
          <Markdown options={markdownOptions}>{getSafeMarkdown(displayedText, !!isStreaming)}</Markdown>
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
