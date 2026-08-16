"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";

export function AvatarUpload({ avatarUrl, initial }: { avatarUrl: string | null; initial: string }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState(avatarUrl);
  const [uploading, setUploading] = useState(false);
  const [, startTransition] = useTransition();

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    const form = new FormData();
    form.append("file", file);
    const res = await fetch("/api/profile/avatar", { method: "POST", body: form });
    setUploading(false);
    if (res.ok) {
      const data = await res.json();
      setPreview(data.avatarUrl);
      startTransition(() => router.refresh());
    }
  }

  return (
    <div className="relative w-16 h-16 shrink-0 group">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        aria-label="Change profile photo"
        className="w-16 h-16 rounded-full overflow-hidden bg-gradient-to-br from-brand-400 to-accent flex items-center justify-center text-xl font-bold text-white focus-ring disabled:opacity-70"
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="" className="w-full h-full object-cover" />
        ) : (
          initial
        )}
        <span className="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center text-white text-[10px] font-medium opacity-0 group-hover:opacity-100">
          {uploading ? "..." : "Change"}
        </span>
      </button>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />
    </div>
  );
}
