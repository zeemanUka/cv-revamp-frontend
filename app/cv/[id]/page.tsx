"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { API_BASE_URL } from "../../../lib/api";

type TailoredSummary = {
  id: number;
  job_requirement_id: number;
  tailored_pdf_url: string;
  model_used: string;
};

type CVDetail = {
  id: number;
  title: string;
  original_pdf_url: string;
  original_text: string;
};

type CVWithTailored = {
  cv: CVDetail;
  tailored_versions: TailoredSummary[];
};

type TailoredFull = {
  id: number;
  cv_id: number;
  job_requirement_id: number;
  tailored_text: string;
  tailored_pdf_url: string;
  model_used: string;
};

const fileBaseUrl =
  process.env.NEXT_PUBLIC_FILE_BASE_URL ||
  API_BASE_URL.replace(/\/api\/?$/, "");
const normalizedFileBase = fileBaseUrl.endsWith("/")
  ? fileBaseUrl
  : `${fileBaseUrl}/`;

const resolvePdfUrl = (url: string) => {
  try {
    return new URL(url, normalizedFileBase).toString();
  } catch {
    return url;
  }
};

export default function CvDetailPage() {
  const params = useParams();
  const cvId = params?.id as string;

  const [data, setData] = useState<CVWithTailored | null>(null);
  const [loading, setLoading] = useState(true);
  const [tailorLoading, setTailorLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selectedModel, setSelectedModel] = useState<string>("llama3.2");
  const [selectedTailored, setSelectedTailored] = useState<TailoredFull | null>(
    null
  );
  const [viewError, setViewError] = useState<string | null>(null);

  async function fetchCv() {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE_URL}/cv/${cvId}`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.detail || "Failed to load CV.");
      }
      const json: CVWithTailored = await res.json();
      setData(json);
      setError(null);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (cvId) {
      fetchCv();
    }
  }, [cvId]);

  async function handleTailorClick() {
    if (!data) return;
    if (!data.cv || !data.cv.id) return;

    try {
      setTailorLoading(true);
      setError(null);

      // For now we use the first job_requirement tied to this CV.
      // Backend always creates one when uploading.
      const jobRequirementId =
        data.tailored_versions[0]?.job_requirement_id || 1; // fallback if none

      const res = await fetch(`${API_BASE_URL}/cv/${data.cv.id}/tailor`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          job_requirement_id: jobRequirementId,
          model: selectedModel,
        }),
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload?.detail || "Failed to tailor CV.");
      }

      await res.json();
      // Refresh list
      await fetchCv();
    } catch (err: any) {
      setError(err.message || "An error occurred while tailoring your CV.");
    } finally {
      setTailorLoading(false);
    }
  }

  async function handleViewTailoredText(tailoredId: number) {
    try {
      setViewError(null);
      const res = await fetch(`${API_BASE_URL}/tailored/${tailoredId}`);
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload?.detail || "Failed to load tailored CV.");
      }
      const json: TailoredFull = await res.json();
      setSelectedTailored(json);
    } catch (err: any) {
      setViewError(err.message || "Unable to load tailored text.");
    }
  }

  if (loading) {
    return <p>Loading CV details...</p>;
  }

  if (error) {
    return <p className="text-sm text-red-600">{error}</p>;
  }

  if (!data) {
    return <p className="text-sm text-slate-700">CV not found.</p>;
  }

  const { cv, tailored_versions } = data;
  const originalPdfUrl = resolvePdfUrl(cv.original_pdf_url);
  const originalPreviewUrl = `${originalPdfUrl}#toolbar=1&view=fitH`;

  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <h1 className="text-2xl font-semibold">{cv.title}</h1>
        <p className="text-sm text-slate-700">
          CV ID {cv.id}. You can view the original PDF, inspect the extracted text,
          and generate tailored versions using your local models.
        </p>
      </section>

      <section className="rounded-md border bg-white p-4 shadow-sm space-y-3">
        <h2 className="text-base font-semibold">Original CV</h2>
        <p className="text-sm text-slate-700">
          Download or open the original PDF, or inspect the text below.
        </p>
        <div className="flex flex-wrap gap-2 text-xs">
          <a
            href={originalPdfUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center rounded-md bg-slate-900 px-3 py-1.5 text-white"
          >
            View PDF in new tab
          </a>
          <a
            href={originalPdfUrl}
            download
            className="inline-flex items-center rounded-md border border-slate-300 px-3 py-1.5 text-slate-700"
          >
            Download PDF
          </a>
        </div>
        <div className="mt-3 hidden rounded-md border bg-slate-50 md:block">
          <iframe
            src={originalPreviewUrl}
            className="h-[28rem] w-full rounded-md"
            title="Original CV preview"
          />
        </div>
        <div className="mt-3 max-h-64 overflow-y-auto rounded-md border bg-slate-50 px-3 py-2 text-xs whitespace-pre-wrap md:hidden">
          {cv.original_text}
        </div>
      </section>

      <section className="rounded-md border bg-white p-4 shadow-sm space-y-3">
        <h2 className="text-base font-semibold">Generate tailored CV</h2>
        <p className="text-sm text-slate-700">
          Choose a local model to use for rewriting your CV text to match the
          job description.
        </p>
        <div className="flex flex-wrap items-center gap-3 text-sm">
          <label className="flex items-center gap-2">
            <span>Model</span>
            <select
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
              className="rounded-md border px-2 py-1 text-sm"
            >
              <option value="llama3.2">llama 3.2</option>
              <option value="deepseek-r1:8b">deepseek-r1:8b</option>
              <option value="gemma3:27b">gemma3:27b</option>
            </select>
          </label>
          <button
            type="button"
            onClick={handleTailorClick}
            disabled={tailorLoading}
            className="inline-flex items-center rounded-md bg-slate-900 px-3 py-1.5 text-xs text-white disabled:opacity-60"
          >
            {tailorLoading ? "Generating..." : "Generate tailored CV"}
          </button>
        </div>
        <p className="text-xs text-slate-500">
          Make sure your local model server is running and accessible at{" "}
          {process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000/api"}.
        </p>
      </section>

      <section className="rounded-md border bg-white p-4 shadow-sm space-y-3">
        <h2 className="text-base font-semibold">Tailored versions</h2>
        {tailored_versions.length === 0 ? (
          <p className="text-sm text-slate-700">
            No tailored versions yet. Generate one above.
          </p>
        ) : (
          <ul className="space-y-3 text-sm">
            {tailored_versions.map((t) => {
              const tailoredPdfUrl = resolvePdfUrl(t.tailored_pdf_url);
              return (
                <li
                  key={t.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-md border bg-slate-50 px-3 py-2"
                >
                  <div className="space-y-1">
                    <p>
                      Tailored CV {t.id} with model {t.model_used}
                    </p>
                    <div className="flex flex-wrap gap-2 text-xs">
                      <div className="flex flex-wrap gap-2">
                        <a
                          href={tailoredPdfUrl}
                          target="_blank"
                          rel="noreferrer noopener"
                          className="inline-flex items-center rounded-md bg-slate-900 px-2 py-1 text-white"
                        >
                          View PDF
                        </a>
                        <a
                          href={tailoredPdfUrl}
                          download
                          className="inline-flex items-center rounded-md border border-slate-300 px-2 py-1 text-slate-700"
                        >
                          Download
                        </a>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleViewTailoredText(t.id)}
                        className="inline-flex items-center rounded-md border px-2 py-1"
                      >
                        View text
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {viewError && (
          <p className="text-xs text-red-600 mt-2">{viewError}</p>
        )}

        {selectedTailored && (
          <div className="mt-4 space-y-2">
            <p className="text-sm font-medium">
              Tailored text for version {selectedTailored.id}
            </p>
            <textarea
              className="h-64 w-full resize-y rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-relaxed text-slate-900"
              value={selectedTailored.tailored_text}
              onChange={(e) =>
                setSelectedTailored({
                  ...selectedTailored,
                  tailored_text: e.target.value,
                })
              }
            />
            <p className="text-xs text-slate-500">
              You can edit this text locally for now. To regenerate the PDF with
              your edits, we will add a backend endpoint later. For now, you can
              copy and paste it into a Word/Google Docs CV template.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
