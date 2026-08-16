"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { AuthHero } from "@/components/AuthHero";

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await signIn("credentials", {
      emailOrUsername,
      password,
      redirect: false,
    });
    setLoading(false);
    if (res?.error) {
      setError("Invalid email/username or password.");
      return;
    }
    router.push(params.get("callbackUrl") ?? "/");
    router.refresh();
  }

  return (
    <AuthHero windowTitle="Watchlist">
      <p className="eyebrow text-[11px] text-brand-400 mb-2">Sign in</p>
      <h1 className="font-display text-3xl font-semibold mb-1">Welcome back</h1>
      <p className="text-sm text-ink-muted mb-6">Sign in to continue tracking.</p>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label htmlFor="emailOrUsername" className="block text-sm text-ink-muted mb-1">
            Email or username
          </label>
          <input
            id="emailOrUsername"
            required
            value={emailOrUsername}
            onChange={(e) => setEmailOrUsername(e.target.value)}
            className="w-full rounded-lg bg-bg border border-border px-3 py-2 text-sm focus-ring"
            autoComplete="username"
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm text-ink-muted mb-1">
            Password
          </label>
          <input
            id="password"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg bg-bg border border-border px-3 py-2 text-sm focus-ring"
            autoComplete="current-password"
          />
        </div>
        {error && (
          <p role="alert" className="text-sm text-accent">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white font-medium py-2 text-sm transition-colors focus-ring"
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>
      <p className="text-center text-sm text-ink-muted mt-4">
        New here?{" "}
        <Link href="/register" className="text-brand-300 hover:underline focus-ring rounded">
          Create an account
        </Link>
      </p>
    </AuthHero>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
