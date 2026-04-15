/**
 * BasicLayout - Minimal template that renders response components vertically
 * No chat input, no avatars, no chat bubbles. Just stacked components.
 */

import React, { useEffect, useRef } from "react";
import { renderComponent, useStreamingState } from "../core";
import type { BasicLayoutProps } from "./types";
import styles from "./BasicLayout.module.css";

export default function BasicLayout(props: BasicLayoutProps) {
  const { client, autoScroll = true } = props;

  const history = client.history.entries;
  const isStreaming = useStreamingState(history);
  const endRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll on new content
  useEffect(() => {
    if (autoScroll && endRef.current) {
      endRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [history, autoScroll]);

  // Auto-scroll during streaming (DOM mutations)
  useEffect(() => {
    if (!autoScroll || !containerRef.current) return;

    const observer = new MutationObserver(() => {
      endRef.current?.scrollIntoView({ behavior: "smooth" });
    });

    observer.observe(containerRef.current, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    return () => observer.disconnect();
  }, [autoScroll]);

  return (
    <div ref={containerRef} className={styles.container}>
      <div className={styles.content}>
        {history.length === 0 ? (
          <div className={styles.emptyState}>
            <h1 className={styles.emptyTitle}>Gravity AI</h1>
            <p className={styles.emptySubtitle}>How can I help you today?</p>
          </div>
        ) : (
          history.map((entry) => {
            if (entry.type !== "assistant_response") return null;

            const { streamingState, components } = entry;

            return (
              <React.Fragment key={entry.id}>
                {components.length > 0
                  ? components.map((component) => {
                      if (!component.Component) return null;

                      return (
                        <div key={component.id}>
                          {renderComponent(component, { streamingState }, client?.openFocus)}
                        </div>
                      );
                    })
                  : streamingState === "streaming" && <div className={styles.loadingState}>Thinking...</div>}
              </React.Fragment>
            );
          })
        )}
        <div ref={endRef} />
      </div>
    </div>
  );
}
