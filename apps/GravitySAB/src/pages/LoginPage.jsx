import React from "react";
import { useGravityAuth } from "@gravity-platform/gravity-client";

export function LoginPage() {
  const { login } = useGravityAuth();

  console.log("[LoginPage] login function:", login);
  console.log("[LoginPage] login type:", typeof login);

  const handleClick = () => {
    console.log("[LoginPage] handleClick called");
    if (login) {
      console.log("[LoginPage] calling login()");
      login();
    } else {
      console.error("[LoginPage] login is undefined!");
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden">
      {/* YouTube video background */}
      <div className="absolute inset-0 w-full h-full overflow-hidden">
        <iframe
          src="https://www.youtube.com/embed/dNmoL0rJj8U?autoplay=1&mute=1&loop=1&playlist=dNmoL0rJj8U&controls=0&showinfo=0&modestbranding=1&rel=0&disablekb=1&iv_load_policy=3&start=5"
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200vw] h-[200vh] min-w-[200%] min-h-[200%] pointer-events-none"
          frameBorder="0"
          allow="autoplay; encrypted-media"
          allowFullScreen
        />
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/40" />
      </div>

      {/* Login card */}
      <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 w-full max-w-sm shadow-2xl">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <img
            src="https://res.cloudinary.com/sonik/image/upload/v1751802699/gravity/icons/logo_white.png"
            alt="Gravity"
            className="w-16 h-16"
          />
        </div>

        {/* Title */}
        <h1 className="text-2xl font-semibold text-white text-center mb-2">Welcome to Gravity</h1>
        <p className="text-gray-400 text-center text-sm mb-8">Sign in to continue to your workspace</p>

        {/* Login button */}
        <button
          onClick={handleClick}
          className="w-full py-3 bg-white text-gray-900 font-medium rounded-lg hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
            />
          </svg>
          Sign In
        </button>

        {/* Footer */}
        <p className="text-gray-500 text-xs text-center mt-6">Secure authentication powered by Auth0</p>
      </div>
    </div>
  );
}
