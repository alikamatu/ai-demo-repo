"use client";

import { FormEvent, useEffect, useState } from "react";
import LifeOSDashboard from "@/components/lifeos/LifeOSDashboard";
import type { AuthUser } from "@/lib/lifeos-contracts";
import * as api from "@/lib/lifeos-api";

const TOKEN_KEY = "lifeos-auth-token";

export default function PortfolioClient() {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("New User");
  const [email, setEmail] = useState("alex@lifeos.dev");
  const [password, setPassword] = useState("demo1234");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      const saved = window.localStorage.getItem(TOKEN_KEY);
      if (!saved) {
        setLoading(false);
        return;
      }

      try {
        const me = await api.me(saved);
        setToken(saved);
        setUser(me.user);
      } catch {
        window.localStorage.removeItem(TOKEN_KEY);
      }
      setLoading(false);
    };

    void run();
  }, []);

  async function handleAuth(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response =
        authMode === "signin"
          ? await api.login(email, password)
          : await api.register({ name, email, password });
      window.localStorage.setItem(TOKEN_KEY, response.token);
      setToken(response.token);
      setUser(response.user);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Authentication failed";
      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  function handleLogout() {
    window.localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  }

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center px-4">
        <div className="glass rounded-2xl p-6 text-center">
          <p className="text-sm text-[color:var(--text-soft)]">Loading workspace...</p>
        </div>
      </div>
    );
  }

  if (!token || !user) {
    return (
      <div className="grid min-h-screen place-items-center px-4 py-10">
        <div className="glass w-full max-w-md rounded-3xl p-5 sm:p-7">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[color:var(--text-soft)]">
            LifeOS Access
          </p>
          <h2 className="mt-2 text-3xl font-black">{authMode === "signin" ? "Sign in" : "Create account"}</h2>
          <p className="mt-2 text-sm text-[color:var(--text-soft)]">
            Each user has a separate workspace, approvals, automations, and activity timeline.
          </p>
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => setAuthMode("signin")}
              className={`rounded-xl px-3 py-1.5 text-sm font-semibold ${
                authMode === "signin"
                  ? "bg-[#10263b] text-white"
                  : "border border-[color:var(--line-strong)] bg-white/80 text-[color:var(--text-main)]"
              }`}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => setAuthMode("signup")}
              className={`rounded-xl px-3 py-1.5 text-sm font-semibold ${
                authMode === "signup"
                  ? "bg-[#10263b] text-white"
                  : "border border-[color:var(--line-strong)] bg-white/80 text-[color:var(--text-main)]"
              }`}
            >
              Create account
            </button>
          </div>

          <form className="mt-5 grid gap-3" onSubmit={handleAuth}>
            {authMode === "signup" ? (
              <label className="grid gap-1 text-sm font-semibold">
                Name
                <input
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="rounded-xl border border-[color:var(--line-strong)] bg-white/80 px-3 py-2 font-normal"
                  type="text"
                  required
                />
              </label>
            ) : null}

            <label className="grid gap-1 text-sm font-semibold">
              Email
              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="rounded-xl border border-[color:var(--line-strong)] bg-white/80 px-3 py-2 font-normal"
                type="email"
                required
              />
            </label>

            <label className="grid gap-1 text-sm font-semibold">
              Password
              <input
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="rounded-xl border border-[color:var(--line-strong)] bg-white/80 px-3 py-2 font-normal"
                type="password"
                required
              />
            </label>

            {error && <p className="text-sm font-semibold text-[#9a2f2b]">{error}</p>}

            <button
              disabled={submitting}
              type="submit"
              className="mt-1 rounded-xl bg-[#10263b] px-4 py-2.5 font-semibold text-white disabled:cursor-progress disabled:opacity-70"
            >
              {submitting
                ? authMode === "signin"
                  ? "Signing in..."
                  : "Creating account..."
                : authMode === "signin"
                  ? "Sign in"
                  : "Create account"}
            </button>
          </form>

          <div className="mt-5 rounded-xl border border-[color:var(--line)] bg-white/70 p-3 text-xs text-[color:var(--text-soft)]">
            <p className="font-semibold text-[color:var(--text-main)]">Demo users</p>
            <p className="mt-1">alex@lifeos.dev / demo1234</p>
            <p>career@lifeos.dev / demo1234</p>
            <p>family@lifeos.dev / demo1234</p>
          </div>
        </div>
      </div>
    );
  }

  return <LifeOSDashboard token={token} user={user} onLogout={handleLogout} />;
}
