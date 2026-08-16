"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AuthHero } from "@/components/AuthHero";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, username, password }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Something went wrong.");
      setLoading(false);
      return;
    }
    const signInRes = await signIn("credentials", { emailOrUsername: email, password, redirect: false });
    setLoading(false);
    if (signInRes?.error) {
      router.push("/login");
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <AuthHero windowTitle="Watchlist">
      <p className="eyebrow text-[11px] text-brand-400 mb-2">Create account</p>
      <h1 className="font-display text-3xl font-semibold mb-1">Join Watchlist</h1>
      <p className="text-sm text-ink-muted mb-6">Start tracking in seconds.</p>
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm text-ink-muted mb-1">Email</label>
          <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-lg bg-bg border border-border px-3 py-2 text-sm focus-ring" autoComplete="email" />
        </div>
        <div>
          <label htmlFor="username" className="block text-sm text-ink-muted mb-1">Username</label>
          <input id="username" required value={username} onChange={(e) => setUsername(e.target.value)}
            className="w-full rounded-lg bg-bg border border-border px-3 py-2 text-sm focus-ring" autoComplete="username" />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm text-ink-muted mb-1">Password</label>
          <input id="password" type="password" required minLength={8} value={password} onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-lg bg-bg border border-border px-3 py-2 text-sm focus-ring" autoComplete="new-password" />
        </div>
        {error && <p role="alert" className="text-sm text-accent">{error}</p>}
        <button type="submit" disabled={loading}
          className="w-full rounded-lg bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white font-medium py-2 text-sm transition-colors focus-ring">
          {loading ? "Creating account..." : "Create account"}
        </button>
      </form>
      <p className="text-center text-sm text-ink-muted mt-4">
        Already have an account?{" "}
        <Link href="/login" className="text-brand-300 hover:underline focus-ring rounded">Sign in</Link>
      </p>
    </AuthHero>
  );
}
