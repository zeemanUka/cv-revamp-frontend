"use client";

import { FormEvent, useCallback, useMemo, useState } from "react";
import { API_BASE_URL } from "../../lib/api";

type CVDetail = {
  id: number;
  title: string;
  job_title?: string;
};

type TailoredSummary = {
  id: number;
  job_requirement_id: number;
};

type CVWithTailored = {
  cv: CVDetail;
  tailored_versions: TailoredSummary[];
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

const models = ["llama3.2", "deepseek-r1:8b", "gemma3:27b"];

export default function ATSCheckPage() {
  const [cvTitle, setCvTitle] = useState("My CV");
  const [jobTitle, setJobTitle] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [model, setModel] = useState(models[0]);
  const [uploading, setUploading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [detail, setDetail] = useState<CVWithTailored | null>(null);
  const jobRequirementId = useMemo(
    () =>
      detail?.tailored_versions?.[0]?.job_requirement_id
        ? detail.tailored_versions[0].job_requirement_id
        : 1,
    [detail]
  );

  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [result, setResult] = useState<ATSAnalysisResponse | null>(null);

  const matchScore = result?.match_score ?? result?.overall_score;
  const matchedKeywords = Array.isArray(result?.matched_keywords)
    ? (result?.matched_keywords as string[])
    : undefined;
  const missingKeywords = Array.isArray(result?.missing_keywords)
    ? (result?.missing_keywords as string[])
    : undefined;
  const recommendations = Array.isArray(result?.recommendations)
    ? (result?.recommendations as string[])
    : undefined;
  const strengths = Array.isArray(result?.strengths)
    ? (result?.strengths as string[])
    : undefined;
  const risks = Array.isArray(result?.risks)
    ? (result?.risks as string[])
    : undefined;
  const keywordBreakdownEntries = useMemo(() => {
    if (
      result?.keyword_breakdown &&
      typeof result.keyword_breakdown === "object"
    ) {
      return Object.entries(
        result.keyword_breakdown as Record<string, number | string>
      );
    }
    return [];
  }, [result]);

  const fetchCvDetail = useCallback(async (cvId: number) => {
    const res = await fetch(`${API_BASE_URL}/cv/${cvId}`);
    if (!res.ok) {
      const payload = await res.json().catch(() => ({}));
      throw new Error(
        (payload?.detail as string) ||
          "Upload succeeded but fetching CV details failed."
      );
    }

    const data = (await res.json()) as CVWithTailored;
    if (!data?.cv?.id) {
      throw new Error("CV details are missing required fields.");
    }
    return data;
  }, []);

  const runAnalysis = useCallback(
    async (sourceDetail: CVWithTailored) => {
      const payload: ATSAnalysisPayload = {
        job_requirement_id:
          sourceDetail.tailored_versions?.[0]?.job_requirement_id || 1,
        model,
      };

      try {
        setAnalysisLoading(true);
        setAnalysisError(null);
        const res = await fetch(
          `${API_BASE_URL}/cv/${sourceDetail.cv.id}/analyze`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
          }
        );

        if (!res.ok) {
          const responseBody = await res.json().catch(() => ({}));
          throw new Error(
            (responseBody?.detail as string) ||
              "The ATS check failed. Please try again."
          );
        }

        const analysis = (await res.json()) as ATSAnalysisResponse;
        setResult(analysis);
      } catch (err: unknown) {
        const message =
          err instanceof Error
            ? err.message
            : "Something went wrong while checking ATS fit.";
        setAnalysisError(message);
      } finally {
        setAnalysisLoading(false);
      }
    },
    [model]
  );

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setFormError(null);

      if (!file) {
        setFormError("Please upload a CV PDF file.");
        return;
      }
      if (!jobTitle.trim() || !jobDescription.trim()) {
        setFormError("Job title and job description are required.");
        return;
      }

      try {
        setUploading(true);
        setAnalysisError(null);
        setResult(null);

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
          const payload = await res.json().catch(() => ({}));
          throw new Error(
            (payload?.detail as string) ||
              "Failed to upload CV. Please try again."
          );
        }

        const responseData = await res.json();
        const newCvId = Number(responseData.cv_id);
        if (!Number.isFinite(newCvId)) {
          throw new Error("Upload succeeded but CV id was not returned.");
        }

        const newDetail = await fetchCvDetail(newCvId);
        setDetail(newDetail);
        await runAnalysis(newDetail);
      } catch (err: unknown) {
        const message =
          err instanceof Error ? err.message : "An unexpected error occurred.";
        setFormError(message);
      } finally {
        setUploading(false);
      }
    },
    [cvTitle, jobTitle, jobDescription, file, fetchCvDetail, runAnalysis]
  );

  const handleReRun = useCallback(() => {
    if (detail) {
      runAnalysis(detail);
    }
  }, [detail, runAnalysis]);

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs font-semibold uppercase tracking-[0.5em] text-slate-500">
          ATS checker
        </p>
        <h1 className="text-3xl font-semibold text-slate-900">
          Upload a CV, then run the ATS pass immediately
        </h1>
        <p className="text-sm text-slate-600">
          Follow the same upload flow you&apos;re used to—job details plus a PDF
          upload—then get an instant ATS score without copying IDs around.
        </p>
      </header>

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-800">
                CV title
              </label>
              <input
                value={cvTitle}
                onChange={(event) => setCvTitle(event.target.value)}
                className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-900/40 focus:outline-none focus:ring-2 focus:ring-slate-900/15"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-800">
                Model
              </label>
              <select
                className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-900/40 focus:outline-none focus:ring-2 focus:ring-slate-900/15"
                value={model}
                onChange={(event) => setModel(event.target.value)}
              >
                {models.map((modelOption) => (
                  <option key={modelOption} value={modelOption}>
                    {modelOption}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="block text-sm font-medium text-slate-800">
                Job title
              </label>
              <input
                value={jobTitle}
                onChange={(event) => setJobTitle(event.target.value)}
                placeholder="Senior Backend Engineer"
                className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-900/40 focus:outline-none focus:ring-2 focus:ring-slate-900/15"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-800">
                CV PDF file
              </label>
              <input
                type="file"
                accept="application/pdf"
                onChange={(event) => {
                  const selected = event.target.files?.[0] || null;
                  setFile(selected);
                }}
                className="mt-1 block w-full cursor-pointer rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-900/40 focus:outline-none focus:ring-2 focus:ring-slate-900/15 file:mr-4 file:rounded-md file:border-0 file:bg-slate-900 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-800">
              Job description
            </label>
            <textarea
              value={jobDescription}
              onChange={(event) => setJobDescription(event.target.value)}
              placeholder="Paste the job description here..."
              className="mt-1 min-h-[12rem] w-full resize-y rounded-md border border-slate-200 bg-white px-3 py-2 text-sm leading-relaxed text-slate-900 placeholder:text-slate-400 focus:border-slate-900/40 focus:outline-none focus:ring-2 focus:ring-slate-900/15"
            />
          </div>

          {formError && <p className="text-sm text-red-600">{formError}</p>}

          <button
            type="submit"
            disabled={uploading}
            className="inline-flex items-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:opacity-60"
          >
            {uploading ? "Uploading & analyzing..." : "Upload & run ATS check"}
          </button>
        </form>
      </section>

      {detail && (
        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-500">
                Latest upload
              </p>
              <h2 className="text-xl font-semibold text-slate-900">
                {detail.cv.title}
              </h2>
              {detail.cv.job_title && (
                <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
                  {detail.cv.job_title}
                </p>
              )}
              <p className="mt-2 text-xs text-slate-500">
                Using job requirement #{jobRequirementId}. Re-run with another
                model without re-uploading.
              </p>
            </div>
            <button
              type="button"
              onClick={handleReRun}
              disabled={analysisLoading}
              className="inline-flex items-center rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-900 transition hover:border-slate-400 disabled:opacity-60"
            >
              Re-run ATS check
            </button>
          </div>
          {analysisError && (
            <p className="text-sm text-red-600">{analysisError}</p>
          )}
        </section>
      )}

      <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        {result ? (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-6">
              {typeof matchScore === "number" && (
                <div>
                  <p className="text-xs uppercase tracking-[0.4em] text-slate-500">
                    Match score
                  </p>
                  <p className="text-4xl font-semibold text-slate-900">
                    {Math.round(matchScore)}%
                  </p>
                </div>
              )}
              {result.summary && (
                <div className="max-w-xl text-sm text-slate-700">
                  {result.summary}
                </div>
              )}
            </div>

            {matchedKeywords && matchedKeywords.length > 0 && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                  Matched keywords
                </p>
                <div className="mt-1 flex flex-wrap gap-2 text-xs">
                  {matchedKeywords.map((keyword) => (
                    <span
                      key={keyword}
                      className="rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-900"
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
                      className="rounded-full bg-red-50 px-2.5 py-1 text-red-700"
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
                    className="rounded-xl border border-slate-100 bg-slate-50 p-3"
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

            {(strengths && strengths.length > 0) ||
            (risks && risks.length > 0) ||
            (recommendations && recommendations.length > 0) ? (
              <div className="grid gap-3 md:grid-cols-3">
                {strengths && strengths.length > 0 && (
                  <div className="rounded-xl border border-emerald-100 bg-emerald-50/70 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800">
                      Strengths
                    </p>
                    <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-emerald-900">
                      {strengths.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {risks && risks.length > 0 && (
                  <div className="rounded-xl border border-amber-100 bg-amber-50/80 p-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-amber-800">
                      Risks
                    </p>
                    <ul className="mt-2 list-disc space-y-1 pl-4 text-xs text-amber-900">
                      {risks.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {recommendations && recommendations.length > 0 && (
                  <div className="rounded-xl border border-slate-200 bg-white p-3 md:col-span-1 md:row-span-2">
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

            <details className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-700">
              <summary className="cursor-pointer text-sm font-medium text-slate-900">
                Raw response
              </summary>
              <pre className="mt-2 whitespace-pre-wrap break-words text-[11px] leading-relaxed">
                {JSON.stringify(result, null, 2)}
              </pre>
            </details>
          </div>
        ) : (
          <div className="space-y-2 text-sm text-slate-600">
            <p>No ATS report yet.</p>
            <p>
              Upload a CV above, then we&apos;ll automatically score it against
              the job you provided and surface keyword gaps, strengths, and
              risks.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
