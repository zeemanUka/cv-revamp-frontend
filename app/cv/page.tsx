"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { API_BASE_URL, FILE_BASE_URL } from "../../lib/api";

type TaskItem = {
  task_type: string;
  task_id: number;
  cv_id: number;
  cv_title: string;
  job_requirement_id: number;
  job_title: string;
  model_used: string;
  created_at: string;
  tailored_pdf_url: string | null;
  ats_score: number | null;
  summary: string | null;
};

type TailoredHistoryItem = {
  id: number;
  cv_id: number;
  cv_title: string;
  job_requirement_id: number;
  job_title: string;
  tailored_pdf_url: string;
  model_used: string;
  created_at: string;
};

type ATSHistoryItem = {
  id: number;
  cv_id: number;
  cv_title: string;
  job_requirement_id: number;
  job_title: string;
  model_used: string;
  ats_score: number;
  summary: string;
  issues?: string[];
  recommendations?: string[];
  raw_report?: string;
  created_at: string;
};

type HistoryResponse = {
  tailored_cv_history: TailoredHistoryItem[];
  ats_analysis_history: ATSHistoryItem[];
};

type CVOption = {
  cv_id: number;
  cv_title: string;
  task_count: number;
};

const normalizedFileBase = FILE_BASE_URL.endsWith("/")
  ? FILE_BASE_URL
  : `${FILE_BASE_URL}/`;

const resolvePdfUrl = (url: string | null) => {
  if (!url) return null;
  try {
    return new URL(url, normalizedFileBase).toString();
  } catch {
    return url;
  }
};

const formatDateTime = (value: string) => {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString();
};

const sortByCreatedAtDesc = <T extends { created_at: string }>(items: T[]) =>
  [...items].sort((a, b) => {
    const aTime = Date.parse(a.created_at);
    const bTime = Date.parse(b.created_at);
    if (Number.isNaN(aTime) || Number.isNaN(bTime)) return 0;
    return bTime - aTime;
  });

const toTaskTypeLabel = (value: string) => {
  if (value === "cv_tailor") return "CV Tailor";
  if (value === "ats_analysis") return "ATS Analysis";
  return value;
};

export default function BrowseDraftsPage() {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [tasksLoading, setTasksLoading] = useState(true);
  const [tasksError, setTasksError] = useState<string | null>(null);
  const [selectedCvId, setSelectedCvId] = useState<number | "all">("all");

  const [history, setHistory] = useState<HistoryResponse | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    try {
      setTasksLoading(true);
      setTasksError(null);

      const res = await fetch(`${API_BASE_URL}/tasks`, { cache: "no-store" });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(
          (payload?.detail as string) || "Failed to load draft tasks."
        );
      }

      const payload = (await res.json()) as unknown;
      const parsedTasks = Array.isArray(payload) ? (payload as TaskItem[]) : [];
      const sortedTasks = sortByCreatedAtDesc(parsedTasks);
      setTasks(sortedTasks);

      setSelectedCvId((current) => {
        if (sortedTasks.length === 0) return "all";
        if (current === "all") return current;
        if (
          typeof current === "number" &&
          sortedTasks.some((task) => task.cv_id === current)
        ) {
          return current;
        }
        return sortedTasks[0].cv_id;
      });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Unable to load drafts.";
      setTasksError(message);
    } finally {
      setTasksLoading(false);
    }
  }, []);

  const fetchHistory = useCallback(async (cvId: number) => {
    try {
      setHistoryLoading(true);
      setHistoryError(null);

      const res = await fetch(`${API_BASE_URL}/history?cv_id=${cvId}`, {
        cache: "no-store",
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(
          (payload?.detail as string) || "Failed to load CV history."
        );
      }

      const payload = (await res.json()) as Partial<HistoryResponse>;
      const tailored = Array.isArray(payload.tailored_cv_history)
        ? sortByCreatedAtDesc(payload.tailored_cv_history)
        : [];
      const ats = Array.isArray(payload.ats_analysis_history)
        ? sortByCreatedAtDesc(payload.ats_analysis_history)
        : [];

      setHistory({
        tailored_cv_history: tailored,
        ats_analysis_history: ats,
      });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Unable to load history.";
      setHistoryError(message);
      setHistory(null);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  useEffect(() => {
    if (typeof selectedCvId !== "number") {
      setHistory(null);
      setHistoryError(null);
      return;
    }
    fetchHistory(selectedCvId);
  }, [selectedCvId, fetchHistory]);

  const cvOptions = useMemo(() => {
    const map = new Map<number, CVOption>();
    for (const task of tasks) {
      const current = map.get(task.cv_id);
      if (!current) {
        map.set(task.cv_id, {
          cv_id: task.cv_id,
          cv_title: task.cv_title,
          task_count: 1,
        });
        continue;
      }
      map.set(task.cv_id, {
        ...current,
        task_count: current.task_count + 1,
      });
    }
    return Array.from(map.values());
  }, [tasks]);

  const selectedTasks = useMemo(() => {
    if (selectedCvId === "all") return tasks;
    return tasks.filter((task) => task.cv_id === selectedCvId);
  }, [tasks, selectedCvId]);

  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold">Browse drafts</h1>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              View recent tailoring and ATS tasks from `/api/tasks`, then inspect
              per-CV history from `/api/history`.
            </p>
          </div>
          <button
            type="button"
            onClick={fetchTasks}
            disabled={tasksLoading}
            className="inline-flex items-center rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 transition hover:border-slate-500 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:text-slate-200"
          >
            {tasksLoading ? "Refreshing..." : "Refresh tasks"}
          </button>
        </div>
        {tasksError && <p className="text-sm text-red-600">{tasksError}</p>}
      </section>

      {tasksLoading ? (
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Loading drafts...
        </p>
      ) : tasks.length === 0 ? (
        <section className="rounded-md border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
          <p className="text-sm text-slate-700 dark:text-slate-300">
            No drafts yet.
          </p>
          <Link
            href="/upload"
            className="mt-3 inline-flex items-center rounded-md bg-slate-900 px-3 py-1.5 text-sm text-white transition hover:bg-slate-800"
          >
            Upload a CV
          </Link>
        </section>
      ) : (
        <>
          <section className="rounded-md border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
            <label className="block text-sm font-medium text-slate-800 dark:text-slate-200">
              CV
            </label>
            <select
              className="mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:border-slate-900/40 focus:outline-none focus:ring-2 focus:ring-slate-900/15 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-100"
              value={selectedCvId === "all" ? "all" : String(selectedCvId)}
              onChange={(event) => {
                if (event.target.value === "all") {
                  setSelectedCvId("all");
                  return;
                }
                const value = Number(event.target.value);
                setSelectedCvId(Number.isFinite(value) ? value : "all");
              }}
            >
              <option value="all">
                All CVs - {tasks.length} task{tasks.length > 1 ? "s" : ""}
              </option>
              {cvOptions.map((option) => (
                <option key={option.cv_id} value={option.cv_id}>
                  {option.cv_title} (CV #{option.cv_id}) - {option.task_count}{" "}
                  task{option.task_count > 1 ? "s" : ""}
                </option>
              ))}
            </select>
          </section>

          <section className="rounded-md border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
            <h2 className="text-base font-semibold">Recent tasks</h2>
            <ul className="mt-3 space-y-3">
              {selectedTasks.map((task) => {
                const tailoredPdfUrl = resolvePdfUrl(task.tailored_pdf_url);
                const isAts = task.task_type === "ats_analysis";

                return (
                  <li
                    key={`${task.task_type}-${task.task_id}`}
                    className="rounded-md border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900/60"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="inline-flex items-center rounded-full bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                        {toTaskTypeLabel(task.task_type)}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {formatDateTime(task.created_at)}
                      </p>
                    </div>

                    <div className="mt-2 space-y-1 text-sm">
                      <p className="font-medium text-slate-900 dark:text-slate-100">
                        {task.cv_title} (CV #{task.cv_id})
                      </p>
                      <p className="text-slate-700 dark:text-slate-300">
                        {task.job_title} • model {task.model_used}
                      </p>
                      {isAts && typeof task.ats_score === "number" && (
                        <p className="text-slate-700 dark:text-slate-300">
                          ATS score: {Math.round(task.ats_score)}%
                        </p>
                      )}
                      {isAts && task.summary && (
                        <p className="text-slate-600 dark:text-slate-400">
                          {task.summary}
                        </p>
                      )}
                    </div>

                    <div className="mt-3 flex flex-wrap gap-2 text-xs">
                      <Link
                        href={`/cv/${task.cv_id}`}
                        className="inline-flex items-center rounded-md bg-slate-900 px-2 py-1 text-white transition hover:bg-slate-800"
                      >
                        Open CV workspace
                      </Link>
                      {tailoredPdfUrl && (
                        <>
                          <a
                            href={tailoredPdfUrl}
                            target="_blank"
                            rel="noreferrer noopener"
                            className="inline-flex items-center rounded-md border border-slate-300 px-2 py-1 text-slate-700 transition hover:border-slate-500 dark:border-slate-600 dark:text-slate-200"
                          >
                            View tailored PDF
                          </a>
                          <a
                            href={tailoredPdfUrl}
                            download
                            className="inline-flex items-center rounded-md border border-slate-300 px-2 py-1 text-slate-700 transition hover:border-slate-500 dark:border-slate-600 dark:text-slate-200"
                          >
                            Download PDF
                          </a>
                        </>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>

          <section className="rounded-md border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900/70">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold">CV history</h2>
                <p className="text-sm text-slate-600 dark:text-slate-300">
                  {selectedCvId === "all"
                    ? "Select a CV above to load detailed history."
                    : `History for CV #${selectedCvId}`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (typeof selectedCvId === "number") {
                    fetchHistory(selectedCvId);
                  }
                }}
                disabled={historyLoading || typeof selectedCvId !== "number"}
                className="inline-flex items-center rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 transition hover:border-slate-500 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:text-slate-200"
              >
                {historyLoading ? "Refreshing..." : "Refresh history"}
              </button>
            </div>

            {historyError && (
              <p className="mt-3 text-sm text-red-600">{historyError}</p>
            )}

            {historyLoading && (
              <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
                Loading history...
              </p>
            )}

            {!historyLoading &&
              selectedCvId === "all" &&
              !historyError && (
                <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
                  Choose a specific CV to view tailored and ATS history.
                </p>
              )}

            {!historyLoading && history && typeof selectedCvId === "number" && (
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <article className="rounded-md border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900/60">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Tailored CV history
                  </h3>
                  {history.tailored_cv_history.length === 0 ? (
                    <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">
                      No tailored history for this CV.
                    </p>
                  ) : (
                    <ul className="mt-2 space-y-2 text-xs">
                      {history.tailored_cv_history.map((item) => {
                        const pdfUrl = resolvePdfUrl(item.tailored_pdf_url);
                        return (
                          <li
                            key={item.id}
                            className="rounded border border-slate-200 bg-white p-2 dark:border-slate-700 dark:bg-slate-900/50"
                          >
                            <p className="font-medium text-slate-800 dark:text-slate-200">
                              {item.job_title}
                            </p>
                            <p className="text-slate-600 dark:text-slate-400">
                              {item.model_used} • {formatDateTime(item.created_at)}
                            </p>
                            {pdfUrl && (
                              <a
                                href={pdfUrl}
                                target="_blank"
                                rel="noreferrer noopener"
                                className="mt-1 inline-flex items-center rounded border border-slate-300 px-2 py-0.5 text-slate-700 transition hover:border-slate-500 dark:border-slate-600 dark:text-slate-200"
                              >
                                View PDF
                              </a>
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </article>

                <article className="rounded-md border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900/60">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    ATS analysis history
                  </h3>
                  {history.ats_analysis_history.length === 0 ? (
                    <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">
                      No ATS analysis history for this CV.
                    </p>
                  ) : (
                    <ul className="mt-2 space-y-2 text-xs">
                      {history.ats_analysis_history.map((item) => (
                        <li
                          key={item.id}
                          className="rounded border border-slate-200 bg-white p-2 dark:border-slate-700 dark:bg-slate-900/50"
                        >
                          <p className="font-medium text-slate-800 dark:text-slate-200">
                            {item.job_title} • {Math.round(item.ats_score)}%
                          </p>
                          <p className="text-slate-600 dark:text-slate-400">
                            {item.model_used} • {formatDateTime(item.created_at)}
                          </p>
                          {item.summary && (
                            <p className="mt-1 text-slate-600 dark:text-slate-400">
                              {item.summary}
                            </p>
                          )}
                          {Array.isArray(item.issues) &&
                            item.issues.length > 0 && (
                              <p className="mt-1 text-slate-600 dark:text-slate-400">
                                Issues: {item.issues.join(", ")}
                              </p>
                            )}
                          {Array.isArray(item.recommendations) &&
                            item.recommendations.length > 0 && (
                              <p className="mt-1 text-slate-600 dark:text-slate-400">
                                Recommendations:{" "}
                                {item.recommendations.join(", ")}
                              </p>
                            )}
                        </li>
                      ))}
                    </ul>
                  )}
                </article>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
