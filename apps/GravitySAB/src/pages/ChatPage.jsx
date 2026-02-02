import React, { useMemo } from "react";
import { GravityClient, useUser, useGravityAuth } from "@gravity-platform/gravity-client";
import TopMenu from "../components/TopMenu";
import { LoginPage } from "./LoginPage";
import { ProductDrawer } from "../components/ProductDrawer";
import { useProductDrawer } from "../hooks/useProductDrawer";
import { useLiveChatActions } from "../hooks/useLiveChatActions";
import { workflowConfig, apiUrl, wsUrl, amazonConnectConfig } from "../config";

export function ChatPage() {
  const { userId, loading } = useUser();
  const { isAuthenticated, isLoading: authLoading, getAccessToken } = useGravityAuth();
  const { drawerOpen, activeProduct, closeDrawer, handleApply } = useProductDrawer();
  const { onReady, onAction } = useLiveChatActions();

  const session = useMemo(
    () => ({
      conversationId: `conv_${userId}`,
      userId,
      workflowId: workflowConfig.workflowId,
      targetTriggerNode: workflowConfig.targetTriggerNode,
    }),
    [userId],
  );

  const config = useMemo(() => ({ apiUrl, wsUrl, getAccessToken }), [getAccessToken]);

  if (loading || authLoading) {
    return <div className="h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden relative">
      <TopMenu />
      <div style={{ flex: 1, minHeight: 0, height: "100%" }}>
        <GravityClient
          config={config}
          session={session}
          templateProps={{ amazonConnectConfig }}
          onReady={onReady}
          onAction={onAction}
        />
      </div>
      <ProductDrawer isOpen={drawerOpen} product={activeProduct} onClose={closeDrawer} onApply={handleApply} />
    </div>
  );
}
