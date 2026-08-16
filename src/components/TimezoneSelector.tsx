"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

const COMMON_TIMEZONES = [
  "UTC",
  "America/Los_Angeles",
  "America/Denver",
  "America/Chicago",
  "America/New_York",
  "America/Sao_Paulo",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Europe/Moscow",
  "Asia/Kolkata",
  "Asia/Dubai",
  "Asia/Shanghai",
  "Asia/Tokyo",
  "Australia/Sydney",
  "Pacific/Auckland",
];

export function TimezoneSelector({ current }: { current: string }) {
  const router = useRouter();
  const [, startTransition] = useTransition();
  const [value, setValue] = useState(current);
  const [saving, setSaving] = useState(false);

  async function update(tz: string) {
    setValue(tz);
    setSaving(true);
    await fetch("/api/profile/timezone", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ timezone: tz }),
    });
    setSaving(false);
    startTransition(() => router.refresh());
  }

  const options = COMMON_TIMEZONES.includes(current) ? COMMON_TIMEZONES : [current, ...COMMON_TIMEZONES];

  return (
    <label className="flex items-center gap-2 text-xs text-ink-muted">
      Timezone
      <select
        value={value}
        onChange={(e) => update(e.target.value)}
        disabled={saving}
        className="rounded-lg bg-bg-overlay border border-border px-2 py-1.5 text-xs focus-ring"
      >
        {options.map((tz) => (
          <option key={tz} value={tz}>
            {tz}
          </option>
        ))}
      </select>
    </label>
  );
}
