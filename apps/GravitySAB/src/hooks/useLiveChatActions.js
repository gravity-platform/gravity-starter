import { useCallback, useRef } from "react";

/**
 * Hook to handle live chat actions
 * Returns onAction handler for GravityClient and onReady to capture loadTemplate
 */
export function useLiveChatActions() {
  const loadTemplateRef = useRef(null);

  // Called by GravityClient when ready
  const onReady = useCallback(({ loadTemplate }) => {
    console.log("[useLiveChatActions] GravityClient ready");
    loadTemplateRef.current = loadTemplate;
  }, []);

  // Called by GravityClient when gravity:action received
  const onAction = useCallback((type, data) => {
    if (type === "end_live_chat") {
      console.log("[useLiveChatActions] End live chat - loading inputtrigger1 template");
      if (loadTemplateRef.current) {
        // Just switch template, no message sent
        loadTemplateRef.current("inputtrigger1");
      } else {
        console.error("[useLiveChatActions] loadTemplateRef.current is null!");
      }
    } else if (type === "live_agent_template") {
      console.log("[useLiveChatActions] Live agent template requested - loading inputtrigger3 template");
      if (loadTemplateRef.current) {
        loadTemplateRef.current("inputtrigger3");
      } else {
        console.error("[useLiveChatActions] loadTemplateRef.current is null!");
      }
    } else if (type === "back_to_chat") {
      console.log("[useLiveChatActions] Back to chat requested - loading inputtrigger1 template");
      if (loadTemplateRef.current) {
        loadTemplateRef.current("inputtrigger1");
      } else {
        console.error("[useLiveChatActions] loadTemplateRef.current is null!");
      }
    }
  }, []);

  return { onReady, onAction };
}
