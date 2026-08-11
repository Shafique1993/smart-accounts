import { useState } from "react";
import { supabase } from "../lib/supabase";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();

    if (!email || !password) {
      alert("Email and password are required.");
      return;
    }

    try {
      setLoading(true);

      const { data, error } =
        await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });

      if (error) {
        throw error;
      }

      if (!data?.session) {
        throw new Error("Login session was not created.");
      }

      window.location.href = "/";
    } catch (error) {
      console.error("Login Error:", error);

      alert(
        error?.message ||
          "Invalid email or password."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-lg border p-8">

          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              SMART ACCOUNTS
            </h1>

            <p className="text-gray-500 mt-2">
              Sign in to your account
            </p>
          </div>

          <form
            onSubmit={handleLogin}
            className="space-y-5"
          >

            <div>
              <label className="block text-sm font-semibold mb-2">
                Email
              </label>

              <input
                type="email"
                value={email}
                onChange={(e) =>
                  setEmail(e.target.value)
                }
                placeholder="Enter your email"
                className="w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoComplete="email"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">
                Password
              </label>

              <input
                type="password"
                value={password}
                onChange={(e) =>
                  setPassword(e.target.value)
                }
                placeholder="Enter your password"
                className="w-full border rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoComplete="current-password"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold py-3 rounded-lg"
            >
              {loading
                ? "Signing in..."
                : "Sign In"}
            </button>

          </form>

        </div>
      </div>
    </div>
  );
}

export default Login;