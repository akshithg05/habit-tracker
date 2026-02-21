import { useState } from "react";
import LoginForm from "./LoginForm";
import SignupForm from "./SignupForm";

type AuthView = "login" | "signup";

export default function AuthScreen() {
  const [view, setView] = useState<AuthView>("login");

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        {/* Logo / branding */}
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🗓</div>
          <h1 className="text-2xl font-bold text-white">Habit Tracker</h1>
          <p className="text-sm text-gray-400 mt-1">
            {view === "login" ? "Sign in to continue" : "Create your account"}
          </p>
        </div>

        {/* Card */}
        <div className="bg-gray-800 rounded-2xl shadow-xl p-6 border border-gray-700/50">
          {view === "login" ? (
            <LoginForm onSwitchToSignup={() => setView("signup")} />
          ) : (
            <SignupForm onSwitchToLogin={() => setView("login")} />
          )}
        </div>
      </div>
    </div>
  );
}
