"use client";

import Link from "next/link";
import { useState } from "react";

const features = [
  {
    title: "Upload your CV",
    body: "Paste a job description, upload your PDF CV, and we keep it safe in a local SQLite database. Your files never leave your machine.",
    highlight: "Private & encrypted storage",
  },
  {
    title: "Revamp with local models",
    body: "Run top local-first models like llama 3.2, deepseek-r1:8b, and gemma3:27b to rewrite your experience so it mirrors the role.",
    highlight: "Bring your own models",
  },
  {
    title: "View, edit, and download",
    body: "Compare the original and tailored CVs, tweak the output, and export a polished PDF that feels authentically you.",
    highlight: "You stay in control",
  },
];

const steps = [
  {
    title: "Upload the essentials",
    description: "Drop in a job description plus any CV version. We structure both for accurate context before rewriting.",
    changeTitle: "Tighten your summary",
    changeDescription: "We compare your summary to the JD and immediately highlight missing keywords before we ever touch formatting.",
    before: "Generalist summary that skims over domain expertise and tools from the posting.",
    after: "Role-specific summary that mirrors the JD's tone and brings the right stack front-and-center.",
  },
  {
    title: "Generate the tailored draft",
    description: "CV Revamper rewrites your summary and experience, keeping the layout intact and tone professional.",
    changeTitle: "Elevate the experience bullets",
    changeDescription: "Each bullet is rewritten with quantifiable outcomes and the verbs the job description leans on most.",
    before: "Responsibilities listed as tasks with little context on outcomes or team impact.",
    after: "Actionable accomplishments, metrics, and scale that match how the job defines success.",
  },
  {
    title: "Fine-tune and export",
    description: "Review the diff, edit inline, and export a ready-to-send PDF or copy the markdown.",
    changeTitle: "Polish the final draft",
    changeDescription: "Preview every change, tweak tone inline, and lock in the exact version you want to export.",
    before: "Manual edits across Word, Docs, and PDFs with no single source of truth.",
    after: "A single tailored draft with tracked edits ready to export as PDF or copy as Markdown.",
  },
];

const models = ["llama 3.2", "deepseek-r1:8b", "gemma3:27b", "Phi-4"];

export default function HomePage() {
  const [activeStep, setActiveStep] = useState(0);
  const activeChange = steps[activeStep];

  return (
    <div className="space-y-16">
      <section className="grid gap-12 lg:grid-cols-[1.1fr,0.9fr]">
        <div className="space-y-6">
          <p className="text-sm font-semibold uppercase tracking-[0.4em] text-slate-500">
            Local-first CV AI
          </p>
          <div className="space-y-4">
            <h1 className="text-4xl font-semibold leading-tight text-slate-900 sm:text-5xl dark:text-slate-300">
              Tailor your CV to any job in minutes, without sending data to the
              cloud.
            </h1>
            <p className="text-base text-slate-600 dark:text-slate-300">
              Upload a job description, drop in your PDF CV, and generate a
              tailored version that mirrors the language, skills, and outcomes
              recruiters look for. No generic templates, just your voice
              sharpened for the role.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/upload"
              className="inline-flex items-center rounded-full bg-slate-900 px-5 py-2.5 text-sm font-medium text-white shadow-lg shadow-slate-900/30 transition-colors duration-200 hover:bg-slate-800"
            >
              Upload CV
            </Link>
            <Link
              href="/cv"
              className="inline-flex items-center rounded-full border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-700 dark:text-slate-400 transition-colors duration-200 hover:border-slate-500 hover:text-slate-900 dark:hover:text-slate-300"
            >
              Browse drafts
            </Link>
          </div>
          <dl className="grid gap-6 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white/70 p-5 shadow-sm transition-colors duration-200 hover:border-slate-300 hover:bg-white dark:border-slate-800 dark:bg-slate-900/40 dark:hover:border-slate-700 dark:hover:bg-slate-900/70">
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Time saved per application
              </dt>
              <dd className="mt-2 text-3xl font-semibold text-slate-900 dark:text-slate-400">45m</dd>
              <p className="mt-1 text-sm text-slate-500">
                Average prep time compared to manual edits.
              </p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white/70 p-5 shadow-sm transition-colors duration-200 hover:border-slate-300 hover:bg-white dark:border-slate-800 dark:bg-slate-900/40 dark:hover:border-slate-700 dark:hover:bg-slate-900/70">
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                ATS-friendly rewrites
              </dt>
              <dd className="mt-2 text-3xl font-semibold text-slate-900 dark:text-slate-400">100%</dd>
              <p className="mt-1 text-sm text-slate-500">
                We never alter your structure—only the story.
              </p>
            </div>
          </dl>
        </div>
        <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8 text-white shadow-2xl">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.18),_transparent_45%)]" />
          <div className="relative space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-white/80">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Running locally
            </div>
            <p className="text-sm text-slate-200">
              CV Revamper keeps every token on-device. Swap between local models
              on the fly and see real-time diffs of what changed.
            </p>
            <div className="space-y-2 rounded-2xl border border-white/10 bg-white/5 p-5 dark:bg-white/10">
              <p className="text-xs uppercase tracking-[0.3em] text-white/60">
                Supported models
              </p>
              <div className="flex flex-wrap gap-2">
                {models.map((model) => (
                  <span
                    key={model}
                    className="rounded-full bg-white/10 px-3 py-1 text-sm text-white/80"
                  >
                    {model}
                  </span>
                ))}
              </div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-black/20 p-5">
              <p className="text-xs uppercase tracking-[0.3em] text-white/60">
                Recent activity
              </p>
              <ul className="mt-3 space-y-3 text-sm text-white/80">
                <li className="flex items-center justify-between">
                  <span>Product Design Lead • Stripe</span>
                  <span className="text-emerald-300">+12 skill matches</span>
                </li>
                <li className="flex items-center justify-between">
                  <span>Senior ML Engineer • Anthropic</span>
                  <span className="text-emerald-300">+9 keyword boosts</span>
                </li>
                <li className="flex items-center justify-between">
                  <span>Data Analyst • Notion</span>
                  <span className="text-emerald-300">Ready to export</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-8">
        <div className="space-y-3 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.5em] text-slate-500">
            Why revamp
          </p>
          <h2 className="text-3xl font-semibold text-slate-900 dark:text-slate-300">
            Purpose-built workflow for thoughtful applications
          </h2>
          <p className="text-base text-slate-600 dark:text-slate-300">
            Keep the context that matters while aligning every bullet point with
            what the hiring team actually asks for.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_12px_35px_-30px_rgba(15,23,42,0.8)] transition duration-200 hover:-translate-y-1 hover:border-slate-900/40 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900/60 dark:hover:border-slate-700 dark:hover:bg-slate-900"
            >
              <div className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400 transition-colors duration-200 group-hover:text-slate-600 dark:text-slate-500 dark:group-hover:text-slate-300">
                {feature.highlight}
              </div>
              <h3 className="mt-4 text-lg font-semibold text-slate-900 transition-colors duration-200 group-hover:text-slate-950 dark:text-slate-300 dark:hover:text-slate-200">
                {feature.title}
              </h3>
              <p className="mt-3 text-sm text-slate-600 transition-colors duration-200 group-hover:text-slate-700 dark:text-slate-300">
                {feature.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-8 lg:grid-cols-[0.9fr,1.1fr]">
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-8 dark:border-slate-800 dark:bg-slate-900/50">
          <p className="text-xs font-semibold uppercase tracking-[0.5em] text-slate-500">
            Workflow
          </p>
          <h2 className="mt-3 text-2xl font-semibold text-slate-900 dark:text-slate-300">
            Keep your structure, update your story.
          </h2>
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
            Every revamp keeps your sections untouched, so ATS parsing stays
            perfect while the narrative focuses on measurable results.
          </p>
          <div className="mt-6 space-y-4">
            {steps.map((step, index) => {
              const isActive = index === activeStep;
              return (
                <article
                  key={step.title}
                className={`group rounded-2xl border border-slate-200 bg-white  p-5 transition duration-200 hover:-translate-y-1 hover:border-slate-900/30 dark:border-slate-800 dark:bg-slate-900/60 ${ 
                    isActive ? "shadow-xl dark:shadow-slate-900/40" : ""
                  }`}
                  onMouseEnter={() => setActiveStep(index)}
                >
                  <button
                    type="button"
                    className={`inline-flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold transition-colors duration-200 ${
                      isActive
                        ? "bg-slate-900 text-white shadow-lg shadow-slate-900/30"
                        : "bg-white text-slate-500 ring-1 ring-slate-200 hover:bg-slate-900 hover:text-white dark:bg-slate-900 dark:text-slate-300 dark:ring-slate-700 dark:hover:bg-white dark:hover:text-slate-900"
                    }`}
                    onMouseEnter={() => setActiveStep(index)}
                    onFocus={() => setActiveStep(index)}
                    onClick={() => setActiveStep(index)}
                    aria-label={`Highlight workflow step: ${step.title}`}
                    aria-pressed={isActive}
                  >
                    {index + 1}
                  </button>
                  <h3 className="mt-3 text-lg font-semibold text-slate-900 dark:text-slate-300">
                    {step.title}
                  </h3>
                  <p
                    className={`mt-2 text-sm transition-colors duration-200 ${
                      isActive
                        ? "text-slate-700 dark:text-slate-200"
                        : "text-slate-600 dark:text-slate-400"
                    }`}
                  >
                    {step.description}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-white p-8 shadow-xl dark:border-slate-800 dark:bg-slate-900/80">
          <div className="space-y-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.4em] text-slate-500">
                What changes
              </p>
              <h3 className="mt-2 text-2xl font-semibold text-slate-900 dark:text-slate-300">
                Summary &amp; Experience
              </h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                Step {activeStep + 1}: {activeChange.changeTitle}
              </p>
              <p className="mt-1 text-sm text-slate-500">
                {activeChange.changeDescription}
              </p>
            </div>
            <div className="rounded-2xl bg-slate-50 p-5 text-sm text-slate-700 dark:bg-slate-900/40 dark:text-slate-200">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                Before
              </p>
              <p className="mt-1">{activeChange.before}</p>
            </div>
            <div className="rounded-2xl bg-slate-900 p-5 text-sm text-white">
              <p className="text-xs uppercase tracking-[0.3em] text-white/50">
                After
              </p>
              <p className="mt-1 text-white/90">{activeChange.after}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-slate-100 p-10 text-center shadow-[0_30px_80px_-45px_rgba(15,23,42,0.9)] dark:border-slate-800 dark:from-slate-900 dark:via-slate-950 dark:to-slate-900">
        <p className="text-xs font-semibold uppercase tracking-[0.5em] text-slate-500">
          Ready when you are
        </p>
        <h2 className="mt-4 text-3xl font-semibold text-slate-900 dark:text-slate-300">
          Upload your next application and let CV Revamper do the heavy lifting.
        </h2>
        <p className="mt-3 text-base text-slate-600 dark:text-slate-300">
          Create your first tailored CV in under five minutes—no subscriptions,
          no endless forms, just a focused workflow that keeps your voice.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            href="/upload"
            className="inline-flex items-center rounded-full bg-slate-900 px-6 py-3 text-sm font-medium text-white transition-colors duration-200 hover:bg-slate-800"
          >
            Get started
          </Link>
          <Link
            href="/upload"
            className="inline-flex items-center rounded-full border border-slate-300 px-6 py-3 text-sm font-medium text-slate-700 transition-colors duration-200 hover:border-slate-500 hover:bg-white dark:border-slate-700 dark:text-slate-200 dark:hover:border-slate-500 dark:hover:bg-slate-900/60"
          >
            See how it works
          </Link>
        </div>
      </section>
    </div>
  );
}
