import { useState, type FormEvent } from "react";
import {
  createUserWithEmailAndPassword,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { auth } from "../../firebase";

interface Props {
  onSwitchToLogin: () => void;
}

export default function SignupForm({ onSwitchToLogin }: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  async function handleGoogleSignIn() {
    setError(null);
    setGoogleLoading(true);
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
    } catch (err: unknown) {
      setError(friendlyError(err));
    } finally {
      setGoogleLoading(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      const credential = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );
      await updateProfile(credential.user, { displayName: name.trim() });
    } catch (err: unknown) {
      setError(friendlyError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label className="block text-xs font-medium text-gray-400 mb-1">
          Name
        </label>
        <input
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Your name"
          className="w-full px-3 py-2 rounded-lg bg-gray-700 border border-gray-600
                     text-white text-sm placeholder-gray-500
                     focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-400 mb-1">
          Email
        </label>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="w-full px-3 py-2 rounded-lg bg-gray-700 border border-gray-600
                     text-white text-sm placeholder-gray-500
                     focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-400 mb-1">
          Password
        </label>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Min. 6 characters"
          className="w-full px-3 py-2 rounded-lg bg-gray-700 border border-gray-600
                     text-white text-sm placeholder-gray-500
                     focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-400 mb-1">
          Confirm Password
        </label>
        <input
          type="password"
          required
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="Repeat password"
          className="w-full px-3 py-2 rounded-lg bg-gray-700 border border-gray-600
                     text-white text-sm placeholder-gray-500
                     focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
      </div>

      {error && (
        <p
          className="text-xs text-red-400 bg-red-500/10 border border-red-500/20
                      rounded-lg px-3 py-2"
        >
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading || googleLoading}
        className="w-full py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500
                   text-sm font-medium text-white transition-colors
                   disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Creating account…" : "Create Account"}
      </button>

      {/* Divider */}
      <div className="flex items-center gap-3">
        <span className="flex-1 h-px bg-gray-700" />
        <span className="text-xs text-gray-500">or continue with</span>
        <span className="flex-1 h-px bg-gray-700" />
      </div>

      {/* Google */}
      <button
        type="button"
        onClick={handleGoogleSignIn}
        disabled={loading || googleLoading}
        className="w-full py-2 rounded-lg bg-gray-700 hover:bg-gray-600 border border-gray-600
                   text-sm font-medium text-white transition-colors
                   disabled:opacity-50 disabled:cursor-not-allowed
                   flex items-center justify-center gap-2.5"
      >
        <GoogleIcon />
        {googleLoading ? "Signing in…" : "Continue with Google"}
      </button>

      <p className="text-center text-xs text-gray-500">
        Already have an account?{" "}
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors"
        >
          Sign in
        </button>
      </p>
    </form>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function friendlyError(err: unknown): string {
  if (err && typeof err === "object" && "code" in err) {
    switch ((err as { code: string }).code) {
      case "auth/email-already-in-use":
        return "An account with this email already exists.";
      case "auth/invalid-email":
        return "Invalid email address.";
      case "auth/weak-password":
        return "Password is too weak.";
      default:
        return "Could not create account. Please try again.";
    }
  }
  return "An unexpected error occurred.";
}

function GoogleIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 48 48"
      className="w-4 h-4"
    >
      <path
        fill="#EA4335"
        d="M24 9.5c3.14 0 5.95 1.08 8.17 2.85l6.1-6.1C34.46 3.09 29.5 1 24 1 14.82 1 7.07 6.48 3.64 14.22l7.1 5.52C12.4 13.67 17.74 9.5 24 9.5z"
      />
      <path
        fill="#4285F4"
        d="M46.52 24.5c0-1.64-.15-3.22-.43-4.74H24v8.98h12.67c-.55 2.95-2.2 5.45-4.68 7.13l7.19 5.59C43.53 37.27 46.52 31.35 46.52 24.5z"
      />
      <path
        fill="#FBBC05"
        d="M10.74 28.26A14.57 14.57 0 0 1 9.5 24c0-1.48.26-2.91.72-4.26l-7.1-5.52A23.93 23.93 0 0 0 0 24c0 3.85.92 7.49 2.56 10.71l8.18-6.45z"
      />
      <path
        fill="#34A853"
        d="M24 47c5.5 0 10.12-1.82 13.49-4.94l-7.19-5.59c-1.89 1.27-4.3 2.03-6.3 2.03-6.26 0-11.6-4.17-13.26-9.74l-8.18 6.45C7.07 41.52 14.82 47 24 47z"
      />
    </svg>
  );
}
