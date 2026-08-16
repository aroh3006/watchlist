"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { UploadIcon } from "./icons";

interface Job {
  id: string;
  status: string;
  stage: string | null;
  sourceName: string;
  processedRows: number;
  matchedRows: number;
  ambiguousRows: number;
  unmatchedRows: number;
  duplicateRows: number;
  errorRows: number;
  files: { filename: string; detectedKind: string | null; rowCount: number }[];
}

interface Candidate {
  id: string;
  title: string;
  posterUrl: string | null;
  year: number | null;
  score: number;
}

interface Row {
  id: string;
  rowNumber: number;
  rawData: Record<string, string>;
  candidates: Candidate[] | null;
  status: string;
}

const IN_PROGRESS_STATUSES = new Set(["PENDING", "VALIDATING", "EXTRACTING", "MAPPING", "MATCHING"]);

export function ImportWizard() {
  const router = useRouter();
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [job, setJob] = useState<Job | null>(null);
  const [ambiguousRows, setAmbiguousRows] = useState<Row[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [finished, setFinished] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const pollRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => () => clearTimeout(pollRef.current), []);

  function scheduleNextPoll(jobId: string) {
    pollRef.current = setTimeout(() => pollJob(jobId), 1200);
  }

  async function pollJob(jobId: string) {
    const res = await fetch(`/api/import/jobs/${jobId}`);
    if (!res.ok) {
      setError("Lost track of the import job. Try refreshing the page.");
      return;
    }
    const data: Job = await res.json();
    setJob(data);

    if (data.status === "FAILED") {
      setError(data.stage ?? "Import failed.");
      return;
    }
    if (IN_PROGRESS_STATUSES.has(data.status)) {
      scheduleNextPoll(jobId);
      return;
    }
    if (data.status === "NEEDS_REVIEW") {
      const rowsRes = await fetch(`/api/import/jobs/${jobId}/rows?status=AMBIGUOUS`);
      setAmbiguousRows(await rowsRes.json());
      return;
    }
    // MATCHING-complete-but-no-review-needed lands here as status "MATCHING"
    // with everything processed, or already COMPLETED if it self-committed.
    if (data.status === "COMPLETED") {
      setFinished(true);
      router.refresh();
    }
  }

  async function upload(file: File) {
    setUploading(true);
    setError(null);
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch("/api/import/upload", { method: "POST", body: formData });
    setUploading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Upload failed.");
      return;
    }
    const data: Job = await res.json();
    setJob(data);
    if (IN_PROGRESS_STATUSES.has(data.status)) {
      scheduleNextPoll(data.id);
    } else if (data.status === "NEEDS_REVIEW") {
      const rowsRes = await fetch(`/api/import/jobs/${data.id}/rows?status=AMBIGUOUS`);
      setAmbiguousRows(await rowsRes.json());
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file) upload(file);
  }

  async function resolveRow(rowId: string, entityId?: string, applyToSimilar = false) {
    if (!job) return;
    await fetch(`/api/import/jobs/${job.id}/rows/${rowId}/resolve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ entityId, skip: !entityId, applyToSimilar }),
    });
    setAmbiguousRows((prev) => prev?.filter((r) => r.id !== rowId) ?? null);
  }

  async function finishImport() {
    if (!job) return;
    const res = await fetch(`/api/import/jobs/${job.id}/commit`, { method: "POST" });
    if (res.ok) {
      setJob(await res.json());
      setFinished(true);
      router.refresh();
    }
  }

  if (error) {
    return (
      <div className="rounded-xl2 border border-accent/40 bg-accent/5 p-6">
        <h2 className="font-semibold text-lg mb-2">Import failed</h2>
        <p className="text-sm text-ink-muted mb-4">{error}</p>
        <button
          onClick={() => {
            setError(null);
            setJob(null);
            setAmbiguousRows(null);
          }}
          className="text-sm text-brand-300 hover:underline focus-ring rounded"
        >
          Try again
        </button>
      </div>
    );
  }

  if (finished && job) {
    return (
      <div className="rounded-xl2 border border-border bg-bg-raised p-6">
        <h2 className="font-semibold text-lg mb-2">Import complete</h2>
        <SummaryGrid job={job} />
        <button
          onClick={() => {
            setJob(null);
            setAmbiguousRows(null);
            setFinished(false);
          }}
          className="mt-4 text-sm text-brand-300 hover:underline focus-ring rounded"
        >
          Import another file
        </button>
      </div>
    );
  }

  if (job && ambiguousRows && ambiguousRows.length > 0) {
    return (
      <div>
        <div className="rounded-xl2 border border-border bg-bg-raised p-4 mb-4">
          <SummaryGrid job={job} />
        </div>
        <h2 className="font-semibold mb-2">Review ambiguous matches ({ambiguousRows.length})</h2>
        <p className="text-sm text-ink-muted mb-4">We found more than one possible match. Pick the right one, or skip.</p>
        <ul className="space-y-3">
          {ambiguousRows.map((row) => (
            <li key={row.id} className="rounded-xl2 border border-border-subtle bg-bg-raised p-4">
              <p className="text-sm font-medium mb-2">
                Row {row.rowNumber}: &ldquo;{row.rawData.title ?? row.rawData.show ?? row.rawData.movie ?? JSON.stringify(row.rawData)}&rdquo;
              </p>
              <div className="flex flex-wrap gap-2">
                {row.candidates?.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => resolveRow(row.id, c.id, true)}
                    className="text-xs px-3 py-1.5 rounded-lg border border-border hover:border-brand-400 hover:text-brand-300 transition-colors focus-ring"
                  >
                    {c.title} {c.year ? `(${c.year})` : ""}
                  </button>
                ))}
                <button
                  onClick={() => resolveRow(row.id)}
                  className="text-xs px-3 py-1.5 rounded-lg border border-border text-ink-faint hover:text-ink focus-ring"
                >
                  Skip
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  if (job && IN_PROGRESS_STATUSES.has(job.status)) {
    const totalRows = job.files?.reduce((sum, f) => sum + f.rowCount, 0) ?? 0;
    const pct = totalRows > 0 ? Math.min(100, Math.round((job.processedRows / totalRows) * 100)) : 0;
    return (
      <div className="rounded-xl2 border border-border bg-bg-raised p-6">
        <h2 className="font-semibold text-lg mb-1">Importing {job.sourceName}</h2>
        <p className="text-sm text-ink-muted mb-4">{job.stage ?? "Working..."}</p>
        <div className="h-2 rounded-full bg-bg-overlay overflow-hidden mb-2">
          <div className="h-full bg-brand-400 transition-all duration-500" style={{ width: `${pct}%` }} />
        </div>
        <p className="text-xs text-ink-faint mb-4">
          {job.processedRows.toLocaleString()} / {totalRows.toLocaleString()} rows processed
        </p>
        <SummaryGrid job={job} />
        <p className="text-xs text-ink-faint mt-4">
          Large exports can take a few minutes on the first pass — this keeps running even if you navigate away, and
          picks back up here if you come back to this page.
        </p>
      </div>
    );
  }

  if (job) {
    return (
      <div className="rounded-xl2 border border-border bg-bg-raised p-6">
        <h2 className="font-semibold text-lg mb-2">Ready to import</h2>
        <SummaryGrid job={job} />
        <button
          onClick={finishImport}
          className="mt-4 rounded-lg bg-brand-500 hover:bg-brand-600 text-white font-medium px-4 py-2 text-sm transition-colors focus-ring"
        >
          Finish import
        </button>
      </div>
    );
  }

  return (
    <div>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragActive(true);
        }}
        onDragLeave={() => setDragActive(false)}
        onDrop={onDrop}
        className={`rounded-xl2 border-2 border-dashed p-10 text-center transition-colors ${
          dragActive ? "border-brand-400 bg-brand-900/10" : "border-border"
        }`}
      >
        <UploadIcon width={32} height={32} className="mx-auto text-ink-muted mb-3" />
        <p className="text-sm text-ink-muted mb-4">Drag and drop a .zip or .csv export here, or</p>
        <button
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="rounded-lg bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white font-medium px-4 py-2 text-sm transition-colors focus-ring"
        >
          {uploading ? "Uploading..." : "Choose file"}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept=".zip,.csv"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) upload(file);
          }}
        />
      </div>
      {error && <p role="alert" className="text-sm text-accent mt-3">{error}</p>}
    </div>
  );
}

function SummaryGrid({ job }: { job: Job }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
      <Stat label="Files" value={job.files?.length ?? 1} />
      <Stat label="Rows processed" value={job.processedRows} />
      <Stat label="Matched" value={job.matchedRows} />
      <Stat label="Ambiguous" value={job.ambiguousRows} />
      <Stat label="Unmatched" value={job.unmatchedRows} />
      <Stat label="Duplicates" value={job.duplicateRows} />
      <Stat label="Errors" value={job.errorRows} />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg bg-bg-overlay border border-border-subtle p-2.5">
      <p className="font-semibold text-ink">{value}</p>
      <p className="text-[11px] text-ink-muted">{label}</p>
    </div>
  );
}
