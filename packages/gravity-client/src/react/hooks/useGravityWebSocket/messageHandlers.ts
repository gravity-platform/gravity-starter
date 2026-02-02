/**
 * Message handlers for incoming WebSocket messages
 */

import type {
  ServerMessage,
  ComponentInitMessage,
  ComponentDataMessage,
  ComponentRemoveMessage,
  WorkflowStateMessage,
  NodeExecutionMessage,
  SuggestionsUpdateMessage,
} from "../../../core/types";
import type { AudioState } from "../../../realtime/types";
import type { MessageHandlerContext } from "./types";
import { generateChatId } from "./helpers";
import { useAIContext } from "../../store/aiContext";

// =============================================================================
// MAIN ROUTER
// =============================================================================

/**
 * Route incoming server messages to appropriate handlers
 */
export function handleServerMessage(data: ServerMessage, ws: WebSocket, ctx: MessageHandlerContext): void {
  // Cast to any for switch since audioState isn't in ServerMessage type yet
  switch ((data as any).type) {
    case "SESSION_READY":
      handleSessionReady(ws, ctx);
      break;

    case "COMPONENT_INIT":
      handleComponentInit(data as ComponentInitMessage, ctx);
      break;

    case "COMPONENT_DATA":
      handleComponentData(data as ComponentDataMessage, ctx);
      break;

    case "COMPONENT_REMOVE":
      handleComponentRemove(data as ComponentRemoveMessage, ctx);
      break;

    case "WORKFLOW_STATE":
      handleWorkflowState(data as WorkflowStateMessage, ctx);
      break;

    case "NODE_EXECUTION":
      handleNodeExecution(data as NodeExecutionMessage, ctx);
      break;

    case "AUDIO_STATE":
      handleAudioState(data, ctx);
      break;

    case "SUGGESTIONS_UPDATE":
      handleSuggestionsUpdate(data as SuggestionsUpdateMessage);
      break;

    case "AI_ASSIST_RESULT":
      handleAIAssistResult(data as any, ctx);
      break;

    case "INPUT_SYNC_RESULT":
      handleInputSyncResult(data as any, ctx);
      break;

    default:
      // Ignore unknown message types (PONG, etc.)
      break;
  }
}

// =============================================================================
// INDIVIDUAL HANDLERS
// =============================================================================

/**
 * Session is ready - send initial query if provided
 */
function handleSessionReady(ws: WebSocket, ctx: MessageHandlerContext): void {
  ctx.setIsReady(true);

  const { sessionParams } = ctx;

  if (sessionParams.initialQuery) {
    const chatId = sessionParams.chatId || generateChatId();

    ws.send(
      JSON.stringify({
        type: "USER_ACTION",
        action: "send_message",
        data: {
          message: sessionParams.initialQuery,
          chatId,
          workflowId: sessionParams.workflowId,
          targetTriggerNode: sessionParams.targetTriggerNode,
        },
      }),
    );
  }
}

/**
 * New component initialized - add to Zustand store
 */
function handleComponentInit(msg: ComponentInitMessage, ctx: MessageHandlerContext): void {
  if (!msg.chatId) {
    return;
  }

  ctx.initComponent(msg.chatId, msg.nodeId, msg.component.type);

  // If props included, update store immediately
  if (msg.component.props && Object.keys(msg.component.props).length > 0) {
    ctx.updateComponentData(msg.chatId, msg.nodeId, msg.component.props);
  }

  ctx.setEvents((prev) => [...prev, { ...msg, id: `${msg.nodeId}_${Date.now()}` }]);
}

/**
 * Component data update - update Zustand store
 */
function handleComponentData(msg: ComponentDataMessage, ctx: MessageHandlerContext): void {
  console.log("[WS] 📦 COMPONENT_DATA received", msg);
  if (!msg.chatId) {
    console.warn("[WS] ⚠️ COMPONENT_DATA missing chatId, skipping");
    return;
  }
  ctx.updateComponentData(msg.chatId, msg.nodeId, msg.data);
  console.log("[WS] ✅ COMPONENT_DATA processed", { nodeId: msg.nodeId, chatId: msg.chatId });
}

/**
 * Component removed - remove from Zustand store
 */
function handleComponentRemove(msg: ComponentRemoveMessage, ctx: MessageHandlerContext): void {
  if (!msg.chatId) {
    return;
  }
  ctx.removeComponent(msg.chatId, msg.nodeId);
}

/**
 * Workflow state change - update Zustand and emit event
 */
function handleWorkflowState(msg: WorkflowStateMessage, ctx: MessageHandlerContext): void {
  ctx.setWorkflowState(msg.state, msg.workflowId, msg.workflowRunId);

  ctx.setEvents((prev) => [...prev, { ...msg, id: `${msg.state}_${msg.chatId}_${msg.workflowRunId}` }]);
}

/**
 * Node execution event - for GravityCanvas debug visualization
 *
 * Updates node states (running/completed/armed/error/focused) in the canvas.
 * Used by WorkflowSubscriptionProvider to show real-time node execution.
 */
function handleNodeExecution(msg: NodeExecutionMessage, ctx: MessageHandlerContext): void {
  // Update node execution state in context
  if (ctx.setNodeExecutionEvent) {
    ctx.setNodeExecutionEvent(msg);
  }

  // Emit as event for components that subscribe to events array
  ctx.setEvents((prev) => [...prev, { ...msg, id: `node_${msg.nodeId}_${msg.status}_${Date.now()}` }]);
}

/**
 * Audio state change - update Zustand store and emit event for templates
 */
function handleAudioState(msg: any, ctx: MessageHandlerContext): void {
  // Update Zustand store with audio state (auto-updates speaking states)
  const { setAudioState } = useAIContext.getState();
  setAudioState(msg.state as AudioState);

  // Call the audio state callback if provided
  if (ctx.onAudioState) {
    ctx.onAudioState(msg.state, msg.metadata);
  }

  // Emit as event so templates can react
  ctx.setEvents((prev) => [...prev, { ...msg, id: `audioState_${msg.state}_${Date.now()}` }]);
}

/**
 * AI Assist result - store result for frontend to pick up
 */
function handleAIAssistResult(msg: any, ctx: MessageHandlerContext): void {
  console.log("[WS] 🤖 AI_ASSIST_RESULT received", msg);

  // Emit as event so frontend can pick it up
  ctx.setEvents((prev) => [...prev, { ...msg, id: `ai_assist_${msg.nodeId}_${Date.now()}` }]);
}

/**
 * Input Sync result - store result for frontend to pick up
 */
function handleInputSyncResult(msg: any, ctx: MessageHandlerContext): void {
  console.log("[WS] 🔄 INPUT_SYNC_RESULT received", msg);

  // Emit as event so frontend can pick it up
  ctx.setEvents((prev) => [...prev, { ...msg, id: msg.id || `input_sync_${Date.now()}` }]);
}

/**
 * Suggestions update - update Zustand store with FAQs, Actions, Recommendations
 */
function handleSuggestionsUpdate(msg: SuggestionsUpdateMessage): void {
  // Update Zustand store with suggestions
  const { setSuggestions } = useAIContext.getState();
  setSuggestions(msg.suggestions);
}
