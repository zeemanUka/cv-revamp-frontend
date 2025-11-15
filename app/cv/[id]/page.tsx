"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
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

type ATSAnalysisPayload = {
  job_requirement_id: number;
  model: string;
};

type ATSAnalysisResponse = {
  match_score?: number;
  overall_score?: number;
  matched_keywords?: string[];
  missing_keywords?: string[];
  recommendations?: string[];
  summary?: string;
  keyword_breakdown?: Record<string, number | string>;
  strengths?: string[];
  risks?: string[];
  [key: string]: unknown;
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

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const toTitleCase = (value: string) =>
  value
    .split("_")
    .map((word) =>
      word.length > 0 ? word[0].toUpperCase() + word.slice(1) : word
    )
    .join(" ");

const formatAnalysisValue = (value: unknown) => {
  if (Array.isArray(value)) {
    return value.join(", ");
  }
  if (isRecord(value)) {
    return JSON.stringify(value, null, 2);
  }
  if (value === null || value === undefined) {
    return "—";
  }
  return String(value);
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
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] =
    useState<ATSAnalysisResponse | null>(null);

  const fetchCv = useCallback(async () => {
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
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "An unexpected error occurred.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [cvId]);

  useEffect(() => {
    if (cvId) {
      fetchCv();
    }
  }, [cvId, fetchCv]);

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
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "An error occurred while tailoring your CV.";
      setError(message);
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
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Unable to load tailored text.";
      setViewError(message);
    }
  }

  async function handleAnalyzeATS() {
    if (!data?.cv?.id) return;
    const jobRequirementId =
      data.tailored_versions[0]?.job_requirement_id || 1;

    const payload: ATSAnalysisPayload = {
      job_requirement_id: jobRequirementId,
      model: selectedModel,
    };

    try {
      setAnalysisLoading(true);
      setAnalysisError(null);
      const res = await fetch(`${API_BASE_URL}/cv/${data.cv.id}/analyze`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const responseBody = await res.json().catch(() => ({}));
        throw new Error(
          (responseBody?.detail as string) ||
            "Failed to analyze CV against the ATS checks."
        );
      }

      const analysis: ATSAnalysisResponse = await res.json();
      setAnalysisResult(analysis);
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : "An error occurred while analyzing your CV.";
      setAnalysisError(message);
    } finally {
      setAnalysisLoading(false);
    }
  }

  const analysisScore =
    analysisResult?.match_score ?? analysisResult?.overall_score;
  const matchedKeywords = Array.isArray(analysisResult?.matched_keywords)
    ? (analysisResult?.matched_keywords as string[])
    : undefined;
  const missingKeywords = Array.isArray(analysisResult?.missing_keywords)
    ? (analysisResult?.missing_keywords as string[])
    : undefined;
  const recommendations = Array.isArray(analysisResult?.recommendations)
    ? (analysisResult?.recommendations as string[])
    : undefined;
  const strengths = Array.isArray(analysisResult?.strengths)
    ? (analysisResult?.strengths as string[])
    : undefined;
  const risks = Array.isArray(analysisResult?.risks)
    ? (analysisResult?.risks as string[])
    : undefined;
  const keywordBreakdownEntries = useMemo(() => {
    if (
      analysisResult?.keyword_breakdown &&
      typeof analysisResult.keyword_breakdown === "object"
    ) {
      return Object.entries(
        analysisResult.keyword_breakdown as Record<string, number | string>
      );
    }
    return [];
  }, [analysisResult]);
  const additionalAnalysisEntries = useMemo(() => {
    if (!analysisResult) return [];
    const consumed = new Set([
      "match_score",
      "overall_score",
      "summary",
      "matched_keywords",
      "missing_keywords",
      "recommendations",
      "strengths",
      "risks",
      "keyword_breakdown",
    ]);
    return Object.entries(analysisResult).filter(
      ([key]) => !consumed.has(key)
    );
  }, [analysisResult]);

  if (loading) {
    return <p>Loading CV details...</p>;
  }

  if (error) {
    return <p className="text-sm text-red-600">{error}</p>;
  }

  if (!data) {
    return <p className="text-sm text-slate-700 dark:text-slate-300">CV not found.</p>;
  }

  const { cv, tailored_versions } = data;
  const originalPdfUrl = resolvePdfUrl(cv.original_pdf_url);
  const originalPreviewUrl = `${originalPdfUrl}#toolbar=1&view=fitH`;

  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <h1 className="text-2xl font-semibold">{cv.title}</h1>
        <p className="text-sm text-slate-700 dark:text-slate-300">
          CV ID {cv.id}. You can view the original PDF, inspect the extracted text,
          and generate tailored versions using your local models.
        </p>
      </section>

      <section className="rounded-md border border-slate-200 bg-white p-4 shadow-sm space-y-3 dark:border-slate-800 dark:bg-slate-900/70">
        <h2 className="text-base font-semibold">Original CV</h2>
        <p className="text-sm text-slate-700 dark:text-slate-300">
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
            className="inline-flex items-center rounded-md border border-slate-300 px-3 py-1.5 text-slate-700 transition hover:border-slate-500 dark:border-slate-600 dark:text-slate-200"
          >
            Download PDF
          </a>
        </div>
        <div className="mt-3 hidden rounded-md border border-slate-200 bg-slate-50 md:block dark:border-slate-800 dark:bg-slate-900/60">
          <iframe
            src={originalPreviewUrl}
            className="h-[28rem] w-full rounded-md"
            title="Original CV preview"
          />
        </div>
        <div className="mt-3 max-h-64 overflow-y-auto rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700 whitespace-pre-wrap dark:border-slate-800 dark:bg-slate-900/60 dark:text-slate-200 md:hidden">
          {cv.original_text}
        </div>
      </section>

      <section className="rounded-md border border-slate-200 bg-white p-4 shadow-sm space-y-3 dark:border-slate-800 dark:bg-slate-900/70">
        <h2 className="text-base font-semibold">Generate tailored CV</h2>
        <p className="text-sm text-slate-700 dark:text-slate-300">
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
            className="inline-flex items-center rounded-md bg-slate-900 px-3 py-1.5 text-xs text-white transition hover:bg-slate-800 disabled:opacity-60"
          >
            {tailorLoading ? "Generating..." : "Generate tailored CV"}
          </button>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Make sure your local model server is running and accessible at{" "}
          {process.env.NEXT_PUBLIC_API_BASE_URL || "http://127.0.0.1:8000/api"}.
        </p>
      </section>

      <section className="rounded-md border border-slate-200 bg-white p-4 shadow-sm space-y-3 dark:border-slate-800 dark:bg-slate-900/70">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-semibold">ATS analysis</h2>
            <p className="text-sm text-slate-600">
              Run an on-device ATS pass to see how well this CV aligns with the
              job description keywords.
            </p>
          </div>
          <button
            type="button"
            onClick={handleAnalyzeATS}
            disabled={analysisLoading}
            className="inline-flex items-center rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-emerald-700 disabled:opacity-60"
          >
            {analysisLoading ? "Analyzing..." : "Analyze ATS fit"}
          </button>
        </div>
        {analysisError && (
          <p className="text-sm text-red-600">{analysisError}</p>
        )}

        {analysisResult ? (
          <div className="space-y-4 rounded-2xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
            {typeof analysisScore === "number" && (
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
                  Match score
                </p>
                <p className="text-3xl font-semibold text-slate-900">
                  {Math.round(analysisScore)}%
                </p>
              </div>
            )}
            {analysisResult.summary && (
              <p className="text-sm text-slate-700 dark:text-slate-300">
                {analysisResult.summary}
              </p>
            )}
            {matchedKeywords && matchedKeywords.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                  Matched keywords
                </p>
                <div className="mt-1 flex flex-wrap gap-2 text-xs">
                  {matchedKeywords.map((keyword) => (
                    <span
                      key={keyword}
                      className="rounded-full bg-white px-2.5 py-1 text-slate-700"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {missingKeywords && missingKeywords.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-red-600">
                  Missing keywords
                </p>
                <div className="mt-1 flex flex-wrap gap-2 text-xs">
                  {missingKeywords.map((keyword) => (
                    <span
                      key={keyword}
                      className="rounded-full bg-white px-2.5 py-1 text-red-600 dark:bg-slate-900/40 dark:text-red-300"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {keywordBreakdownEntries.length > 0 && (
              <div className="grid gap-3 sm:grid-cols-2">
                {keywordBreakdownEntries.map(([keyword, value]) => (
                  <div
                    key={keyword}
                    className="rounded-xl border border-white bg-white/70 p-3"
                  >
                    <p className="text-xs uppercase tracking-wide text-slate-500">
                      {keyword}
                    </p>
                    <p className="text-lg font-semibold text-slate-900">
                      {value}
                      {typeof value === "number" ? "%" : ""}
                    </p>
                  </div>
                ))}
              </div>
            )}
            {(recommendations && recommendations.length > 0) ||
            (strengths && strengths.length > 0) ||
            (risks && risks.length > 0) ? (
              <div className="grid gap-3 md:grid-cols-3">
                {strengths && strengths.length > 0 && (
                  <div className="rounded-xl border border-emerald-100 bg-white p-3 dark:border-emerald-400/30 dark:bg-emerald-950/40">
                    <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                      Strengths
                    </p>
                    <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-slate-700">
                      {strengths.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {risks && risks.length > 0 && (
                  <div className="rounded-xl border border-amber-100 bg-white p-3 dark:border-amber-300/30 dark:bg-amber-950/20">
                    <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
                      Risks
                    </p>
                    <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-slate-700">
                      {risks.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {recommendations && recommendations.length > 0 && (
                  <div className="rounded-xl border border-slate-200 bg-white p-3 md:col-span-1 md:row-span-2 dark:border-slate-700 dark:bg-slate-900/60">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-700">
                      Recommendations
                    </p>
                    <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-slate-700">
                      {recommendations.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : null}
            {additionalAnalysisEntries.length > 0 && (
              <div className="space-y-4 rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900/70">
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-200">
                  Additional signals
                </p>
                <div className="grid gap-3 sm:grid-cols-2">
                  {additionalAnalysisEntries.map(([key, value]) => {
                    const label = toTitleCase(key);
                    let content: ReactNode;

                    if (Array.isArray(value)) {
                      content = (
                        <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-slate-700 dark:text-slate-300">
                          {value.map((item, index) => (
                            <li key={`${key}-${index}`}>{String(item)}</li>
                          ))}
                        </ul>
                      );
                    } else if (isRecord(value)) {
                      content = (
                        <div className="mt-2 space-y-1 text-xs text-slate-700 dark:text-slate-300">
                          {Object.entries(value).map(([innerKey, innerValue]) => (
                            <p key={innerKey}>
                              <span className="font-semibold">
                                {toTitleCase(innerKey)}:
                              </span>{" "}
                              {String(innerValue)}
                            </p>
                          ))}
                        </div>
                      );
                    } else {
                      content = (
                        <p className="mt-2 text-sm text-slate-800 dark:text-slate-200">
                          {formatAnalysisValue(value)}
                        </p>
                      );
                    }

                    return (
                      <article
                        key={key}
                        className="rounded-lg border border-slate-100 bg-slate-50 p-3 dark:border-slate-700 dark:bg-slate-900/50"
                      >
                        <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                          {label}
                        </h3>
                        {content}
                      </article>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ) : (
          <p className="text-sm text-slate-600 dark:text-slate-400">
            No ATS run yet. Use the button above to analyze how recruiting
            software will score this CV.
          </p>
        )}
      </section>

      <section className="rounded-md border border-slate-200 bg-white p-4 shadow-sm space-y-3 dark:border-slate-800 dark:bg-slate-900/70">
        <h2 className="text-base font-semibold">Tailored versions</h2>
        {tailored_versions.length === 0 ? (
          <p className="text-sm text-slate-700 dark:text-slate-300">
            No tailored versions yet. Generate one above.
          </p>
        ) : (
          <ul className="space-y-3 text-sm">
            {tailored_versions.map((t) => {
              const tailoredPdfUrl = resolvePdfUrl(t.tailored_pdf_url);
              return (
                <li
                  key={t.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-800 dark:bg-slate-900/60"
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
                          className="inline-flex items-center rounded-md bg-slate-900 px-2 py-1 text-white transition hover:bg-slate-800"
                        >
                          View PDF
                        </a>
                        <a
                          href={tailoredPdfUrl}
                          download
                          className="inline-flex items-center rounded-md border border-slate-300 px-2 py-1 text-slate-700 transition hover:border-slate-500 dark:border-slate-600 dark:text-slate-200"
                        >
                          Download
                        </a>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleViewTailoredText(t.id)}
                        className="inline-flex items-center rounded-md border px-2 py-1 text-slate-700 transition hover:border-slate-600 dark:border-slate-600 dark:text-slate-200"
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
          <p className="mt-2 text-xs text-red-500">{viewError}</p>
        )}

        {selectedTailored && (
          <div className="mt-4 space-y-2">
            <p className="text-sm font-medium">
              Tailored text for version {selectedTailored.id}
            </p>
            <textarea
              className="h-64 w-full resize-y rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-relaxed text-slate-900 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-100"
              value={selectedTailored.tailored_text}
              onChange={(e) =>
                setSelectedTailored({
                  ...selectedTailored,
                  tailored_text: e.target.value,
                })
              }
            />
            <p className="text-xs text-slate-500 dark:text-slate-400">
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
