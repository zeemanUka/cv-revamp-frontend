"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { API_BASE_URL } from "../../lib/api";

export default function UploadPage() {
  const router = useRouter();
  const [cvTitle, setCvTitle] = useState("My CV");
  const [jobTitle, setJobTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!file) {
      setError("Please upload a CV PDF file.");
      return;
    }

    if (!jobTitle.trim() || !jobDescription.trim()) {
      setError("Job title and job description are required.");
      return;
    }

    try {
      setLoading(true);

      const formData = new FormData();
      formData.append("cv_title", cvTitle);
      formData.append("job_title", jobTitle);
      formData.append("job_description", jobDescription);
      formData.append("file", file);

      const res = await fetch(`${API_BASE_URL}/cv/upload`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(
          data?.detail || "Failed to upload CV. Please try again."
        );
      }

      const data = await res.json();
      const cvId = data.cv_id as number;
      router.push(`/cv/${cvId}`);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "An unexpected error occurred.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Upload CV and job description</h1>
      <p className="text-sm text-slate-700 dark:text-slate-300">
        Fill in the job details and upload your existing CV in PDF format. We
        will store it in the backend and let you generate tailored versions
        later.
      </p>

      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-md border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/70"
      >
        <div>
          <label className="block text-sm font-medium text-slate-800 dark:text-slate-300">
            CV title
          </label>
          <input
            type="text"
            value={cvTitle}
            onChange={(e) => setCvTitle(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-900/30 focus:outline-none focus:ring-2 focus:ring-slate-900/20 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-100 dark:placeholder:text-slate-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-800 dark:text-slate-300">
            Job title
          </label>
          <input
            type="text"
            value={jobTitle}
            onChange={(e) => setJobTitle(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-900/30 focus:outline-none focus:ring-2 focus:ring-slate-900/20 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-100 dark:placeholder:text-slate-500"
            placeholder="Senior Backend Engineer"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-800 dark:text-slate-300">
            Job description
          </label>
          <textarea
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
            className="mt-1 min-h-[12rem] w-full resize-y rounded-md border border-slate-200 bg-white px-3 py-2 text-sm leading-relaxed text-slate-900 placeholder:text-slate-400 focus:border-slate-900/30 focus:outline-none focus:ring-2 focus:ring-slate-900/20 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-100 dark:placeholder:text-slate-500"
            placeholder="Paste the job description here..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-800 dark:text-slate-300">
            CV PDF file
          </label>
          <input
            type="file"
            accept="application/pdf"
            onChange={(e) => {
              const selected = e.target.files?.[0] || null;
              setFile(selected);
            }}
            className="mt-1 block w-full cursor-pointer rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-900/30 focus:outline-none focus:ring-2 focus:ring-slate-900/20 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-100 dark:file:bg-slate-100 dark:file:text-slate-900 file:mr-4 file:rounded-md file:border-0 file:bg-slate-900 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white"
          />
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="inline-flex items-center rounded-md bg-slate-900 px-4 py-2 text-sm text-white transition hover:bg-slate-800 disabled:opacity-60"
        >
          {loading ? "Uploading..." : "Upload CV"}
        </button>
      </form>
    </div>
  );
}
