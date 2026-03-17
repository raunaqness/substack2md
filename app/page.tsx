"use client";

import { useState, useRef } from "react";

type State =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; markdown: string; filename: string; title: string }
  | { status: "error"; message: string };

export default function Home() {
  const [url, setUrl] = useState("");
  const [state, setState] = useState<State>({ status: "idle" });
  const [copied, setCopied] = useState(false);
  const [dark, setDark] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  async function handleConvert(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;

    setState({ status: "loading" });
    setCopied(false);

    try {
      const res = await fetch("/api/convert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });

      const data = await res.json();

      if (!res.ok) {
        setState({ status: "error", message: data.error ?? "Something went wrong." });
        return;
      }

      setState({ status: "success", markdown: data.markdown, filename: data.filename, title: data.title });
    } catch {
      setState({ status: "error", message: "Network error. Please try again." });
    }
  }

  function handleCopy() {
    if (state.status !== "success") return;
    navigator.clipboard.writeText(state.markdown).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleDownload() {
    if (state.status !== "success") return;
    const blob = new Blob([state.markdown], { type: "text/markdown" });
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = state.filename;
    a.click();
    URL.revokeObjectURL(blobUrl);
  }

  const isLoading = state.status === "loading";
  const hasResult = state.status === "success";

  // Theme tokens
  const bg = dark ? "bg-[#0f0f0f]" : "bg-[#f9f9f7]";
  const text = dark ? "text-white" : "text-[#1a1a1a]";
  const border = dark ? "border-white/10" : "border-black/10";
  const muted = dark ? "text-white/30" : "text-black/30";
  const inputBg = dark ? "bg-white/5 placeholder-white/20 focus:border-white/30" : "bg-white placeholder-black/25 focus:border-black/30 focus:bg-white";
  const inputBorder = dark ? "border-white/10" : "border-black/15";
  const convertBtn = dark ? "bg-white text-black hover:bg-white/90" : "bg-[#1a1a1a] text-white hover:bg-black/80";
  const skeletonBg = dark ? "bg-white/5" : "bg-black/5";
  const filenameMuted = dark ? "text-white/40" : "text-black/35";
  const secondaryBtn = dark ? "bg-white/8 border border-white/10 hover:bg-white/12 text-white" : "bg-black/5 border border-black/10 hover:bg-black/8 text-[#1a1a1a]";
  const downloadBtn = dark ? "bg-white text-black hover:bg-white/90" : "bg-[#1a1a1a] text-white hover:bg-black/80";
  const textareaBg = dark ? "bg-white/4 border-white/10 text-white/80 focus:border-white/20" : "bg-white border-black/10 text-[#1a1a1a] focus:border-black/20";
  const emptyText = dark ? "text-white/20" : "text-black/25";
  const toggleBg = dark ? "bg-white/8 border-white/10 text-white hover:bg-white/12" : "bg-black/5 border-black/10 text-[#1a1a1a] hover:bg-black/8";

  return (
    <div className={`min-h-screen ${bg} ${text} flex flex-col transition-colors duration-200`}>
      {/* Header */}
      <header className={`border-b ${border} px-6 py-4`}>
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          {/* Left: logo + theme toggle */}
          <div className="flex items-center gap-3">
            <span className="text-lg font-semibold tracking-tight">substack2md</span>
            <span className={`text-xs ${muted} font-mono`}>free articles only</span>
            <button
              onClick={() => setDark((d) => !d)}
              className={`ml-1 flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium border rounded-md transition-colors ${toggleBg}`}
              aria-label="Toggle dark mode"
            >
              {dark ? <SunIcon /> : <MoonIcon />}
              {dark ? "Light" : "Dark"}
            </button>
          </div>

          {/* Right: attribution */}
          <p className={`text-sm ${muted}`}>
            Made by{" "}
            <a
              href="https://raunaqness.com/"
              target="_blank"
              rel="noopener noreferrer"
              className={`font-medium underline underline-offset-2 ${dark ? "text-white/70 hover:text-white" : "text-black/60 hover:text-black"} transition-colors`}
            >
              Raunaq
            </a>
          </p>
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex flex-col max-w-4xl mx-auto w-full px-6 py-10 gap-6">
        {/* URL Input */}
        <form onSubmit={handleConvert} className="flex gap-3">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.substack.com/p/article-slug"
            disabled={isLoading}
            className={`flex-1 border ${inputBorder} ${inputBg} rounded-lg px-4 py-3 text-sm font-mono focus:outline-none disabled:opacity-50 transition-colors`}
          />
          <button
            type="submit"
            disabled={isLoading || !url.trim()}
            className={`px-5 py-3 text-sm font-semibold rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition-colors whitespace-nowrap ${convertBtn}`}
          >
            {isLoading ? "Converting…" : "Convert"}
          </button>
        </form>

        {/* Error */}
        {state.status === "error" && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-sm text-red-500">
            {state.message}
          </div>
        )}

        {/* Loading skeleton */}
        {isLoading && (
          <div className="flex-1 flex flex-col gap-3">
            <div className={`h-4 ${skeletonBg} rounded animate-pulse w-1/3`} />
            <div className={`flex-1 min-h-[500px] ${skeletonBg} rounded-lg animate-pulse`} />
          </div>
        )}

        {/* Result */}
        {hasResult && state.status === "success" && (
          <div className="flex-1 flex flex-col gap-3">
            <div className="flex items-center justify-between gap-4">
              <p className={`text-sm ${filenameMuted} font-mono truncate`}>{state.filename}</p>
              <div className="flex gap-2 shrink-0">
                <button
                  onClick={handleCopy}
                  className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${secondaryBtn}`}
                >
                  {copied ? <><CheckIcon />Copied</> : <><CopyIcon />Copy</>}
                </button>
                <button
                  onClick={handleDownload}
                  className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${downloadBtn}`}
                >
                  <DownloadIcon />
                  Download
                </button>
              </div>
            </div>

            <textarea
              ref={textareaRef}
              readOnly
              value={state.markdown}
              className={`flex-1 min-h-[520px] w-full border rounded-lg px-5 py-4 text-sm font-mono leading-relaxed resize-none focus:outline-none transition-colors ${textareaBg}`}
              spellCheck={false}
            />
          </div>
        )}

        {/* Empty state */}
        {state.status === "idle" && (
          <div className="flex-1 flex items-center justify-center">
            <p className={`text-sm ${emptyText} font-mono`}>
              paste a substack article url above to get started
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

function MoonIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5" />
      <line x1="12" y1="1" x2="12" y2="3" />
      <line x1="12" y1="21" x2="12" y2="23" />
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
      <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
      <line x1="1" y1="12" x2="3" y2="12" />
      <line x1="21" y1="12" x2="23" y2="12" />
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
      <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}
