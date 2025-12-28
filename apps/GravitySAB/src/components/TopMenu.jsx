import { createElement as h } from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUser, useGravityAuth } from "@gravity-platform/gravity-client";
import { defaultWorkflowConfig } from "../routes";

export function TopMenu() {
  const navigate = useNavigate();
  const { userId } = useUser();
  const { user, logout } = useGravityAuth();
  const [isOpen, setIsOpen] = useState(false);

  return h(
    "div",
    { className: "fixed top-4 right-4 z-50" },
    // Profile button
    h(
      "button",
      {
        onClick: () => setIsOpen(!isOpen),
        className:
          "w-10 h-10 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition-colors border border-gray-200",
      },
      h(
        "svg",
        { className: "w-5 h-5 text-gray-600", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24" },
        h("path", {
          strokeLinecap: "round",
          strokeLinejoin: "round",
          strokeWidth: 2,
          d: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
        })
      )
    ),
    // Dropdown menu
    isOpen &&
      h(
        "div",
        {
          className:
            "absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 overflow-hidden",
        },
        // User email
        user?.email &&
          h("div", { className: "px-4 py-2 text-sm text-gray-500 border-b border-gray-100 truncate" }, user.email),
        // Profile link
        h(
          "button",
          {
            onClick: () => {
              setIsOpen(false);
              navigate(`/profile/${defaultWorkflowConfig.workflowId}/${userId}`);
            },
            className: "w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2",
          },
          h(
            "svg",
            { className: "w-4 h-4", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24" },
            h("path", {
              strokeLinecap: "round",
              strokeLinejoin: "round",
              strokeWidth: 2,
              d: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z",
            })
          ),
          "Profile"
        ),
        // Logout button
        h(
          "button",
          {
            onClick: () => {
              setIsOpen(false);
              logout();
            },
            className: "w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2",
          },
          h(
            "svg",
            { className: "w-4 h-4", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24" },
            h("path", {
              strokeLinecap: "round",
              strokeLinejoin: "round",
              strokeWidth: 2,
              d: "M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1",
            })
          ),
          "Logout"
        )
      )
  );
}

export default TopMenu;
