import React, { useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useUser, useGravityAuth } from "@gravity-platform/gravity-client";
import { Profile } from "./profile/Profile";
import { workflowConfig, apiUrl } from "../config";

export function ProfilePage() {
  const navigate = useNavigate();
  const { workflowId, userId: paramUserId } = useParams();
  const { userId: contextUserId } = useUser();
  const { getAccessToken } = useGravityAuth();

  const handleBack = useCallback(() => navigate("/"), [navigate]);

  return (
    <Profile
      userId={paramUserId || contextUserId}
      workflowId={workflowId || workflowConfig.workflowId}
      apiUrl={apiUrl}
      getAccessToken={getAccessToken}
      onBack={handleBack}
    />
  );
}
