"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Globe,
  ArrowRight,
  Hourglass,
  WarningCircle,
  CheckCircle,
  ArrowSquareOut,
  Cpu,
  Sun,
  Moon,
  CaretLeft,
  GithubLogo,
  TwitterLogo,
  ListChecks,
  Sliders,
  ShareNetwork,
  Link as LinkIcon
} from "@phosphor-icons/react";
import { ScoreRing } from "@/components/seo/ScoreRing";
import { OpenGraphPreview } from "@/components/seo/OpenGraphPreview";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SeoBeaconLogo } from "@/components/brand/logo";

interface CheckItem {
  name: string;
  status: "pass" | "warning" | "error";
  score: string;
  importance: "Very important" | "Important" | "Optional";
  value: string | null;
  checks: string[];
  tip?: string;
}

interface ScrapedData {
  url: string;
  statusCode: number;
  responseTime: number;
  fileSizeKb: number;
  wordCount: number;
  language: string;
  title: { content: string | null; length: number; exists: boolean };
  description: { content: string | null; length: number; exists: boolean };
  canonical: { content: string | null; exists: boolean };
  headings: {
    h1: string[];
    h2: string[];
    h3: string[];
    count: { h1: number; h2: number; h3: number };
  };
  images: {
    total: number;
    missingAlt: number;
    sample: { src: string; alt: string | null }[];
  };
  openGraph: {
    title: string | null;
    description: string | null;
    image: string | null;
    url: string | null;
    type: string | null;
  };
  twitter: {
    card: string | null;
    title: string | null;
    description: string | null;
    image: string | null;
  };
  links: {
    total: number;
    internal: number;
    external: number;
    emptyOrBroken: number;
  };
}

interface AiAnalysis {
  score: number;
  summary: string;
  onPageScores: {
    metaData: number;
    pageQuality: number;
    pageStructure: number;
    links: number;
    server: number;
    external: number;
  };
  criticalFixes: { title: string; description: string; type: "error" | "warning"; category: string; importance?: string }[];
  metaDataTab: CheckItem[];
  pageQualityTab: CheckItem[];
  pageStructureTab: CheckItem[];
  linksTab: CheckItem[];
  serverTab: CheckItem[];
  externalTab: CheckItem[];
  backlinkStrategy: { recommendation: string; actionItem: string }[];
}

const REPORT_TABS = [
  { id: "overview", label: "Overview", icon: <Cpu className="h-4 w-4" /> },
  { id: "tasks", label: "Tasks (To-Do)", icon: <ListChecks className="h-4 w-4" /> },
  { id: "audits", label: "Detailed Audits", icon: <Sliders className="h-4 w-4" /> },
  { id: "social", label: "Social Preview", icon: <ShareNetwork className="h-4 w-4" /> },
  { id: "backlinks", label: "Link Strategy", icon: <LinkIcon className="h-4 w-4" /> },
] as const;

const DETAILED_TABS = [
  { id: "metaData", label: "Meta data", key: "metaDataTab" },
  { id: "pageQuality", label: "Page quality", key: "pageQualityTab" },
  { id: "pageStructure", label: "Page structure", key: "pageStructureTab" },
  { id: "links", label: "Link structure", key: "linksTab" },
  { id: "server", label: "Server configuration", key: "serverTab" },
  { id: "external", label: "External factors", key: "externalTab" },
] as const;

function ReportContent() {
  const searchParams = useSearchParams();
  const targetUrl = searchParams.get("url");
  const router = useRouter();

  const [urlInput, setUrlInput] = useState(targetUrl || "");
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState("Establishing connection...");
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<{
    scrapedData: ScrapedData;
    aiAnalysis: AiAnalysis | null;
  } | null>(null);

  const [activeReportTab, setActiveReportTab] = useState<(typeof REPORT_TABS)[number]["id"]>("overview");
  const [activeDetailedTab, setActiveDetailedTab] = useState<(typeof DETAILED_TABS)[number]>(DETAILED_TABS[0]);
  const [theme, setTheme] = useState<"light" | "dark" | null>(null);

  // Initialize theme from storage or preferences on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;
    const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const initialTheme = savedTheme || (systemPrefersDark ? "dark" : "light");
    setTheme(initialTheme);
    document.documentElement.classList.toggle("dark", initialTheme === "dark");
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    localStorage.setItem("theme", nextTheme);
    document.documentElement.classList.toggle("dark", nextTheme === "dark");
  };

  // Run analysis on mount when targetUrl exists
  useEffect(() => {
    if (targetUrl) {
      triggerAnalysis(targetUrl);
    } else {
      setError("No target website URL provided.");
    }
  }, [targetUrl]);

  // Loading steps text transitions
  useEffect(() => {
    if (!loading) return;
    const steps = [
      setTimeout(() => setLoadingStep("Scraping page tags and content assets..."), 1200),
      setTimeout(() => setLoadingStep("Validating heading outline hierarchy & outline elements..."), 2600),
      setTimeout(() => setLoadingStep("Auditing link anchors & checking status parameters..."), 4000),
      setTimeout(() => setLoadingStep("Analyzing with Groq Llama 3.3 AI audit logic..."), 5500),
    ];
    return () => steps.forEach(clearTimeout);
  }, [loading]);

  const triggerAnalysis = async (urlToAnalyze: string) => {
    setLoading(true);
    setLoadingStep("Establishing page connection...");
    setError(null);
    setResults(null);
    setActiveReportTab("overview"); // reset tab on load

    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: urlToAnalyze }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Analysis failed");
      }

      setResults(data);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;

    let normalized = urlInput.trim();
    if (!/^https?:\/\//i.test(normalized)) {
      normalized = `https://${normalized}`;
    }
    
    router.push(`/report?url=${encodeURIComponent(normalized)}`);
  };

  // High quality custom SVGs for pass, warning, and error states
  const StatusIcon = ({ status }: { status: "pass" | "warning" | "error" }) => {
    if (status === "pass") {
      return (
        <svg className="w-5 h-5 text-emerald-600 shrink-0" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
        </svg>
      );
    }
    if (status === "warning") {
      return (
        <svg className="w-5 h-5 text-amber-500 shrink-0" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
        </svg>
      );
    }
    return (
      <svg className="w-5 h-5 text-rose-500 shrink-0" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
      </svg>
    );
  };

  const categoriesList = results?.aiAnalysis?.onPageScores
    ? [
        { label: "Meta data", score: results.aiAnalysis.onPageScores.metaData, color: "#cdb4db" },
        { label: "Page quality", score: results.aiAnalysis.onPageScores.pageQuality, color: "#ffc8dd" },
        { label: "Page structure", score: results.aiAnalysis.onPageScores.pageStructure, color: "#ffafcc" },
        { label: "Links", score: results.aiAnalysis.onPageScores.links, color: "#bde0fe" },
        { label: "Server", score: results.aiAnalysis.onPageScores.server, color: "#a2d2ff" },
        { label: "External factors", score: results.aiAnalysis.onPageScores.external, color: "#cdb4db" },
      ]
    : [];

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground transition-colors duration-250 font-sans">
      {/* Header Navigation */}
      <header className="border-b border-border bg-card/75 backdrop-blur-md sticky top-0 z-50 px-6 md:px-12 py-4 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => router.push("/")}
            className="p-1 rounded-lg hover:bg-muted text-slate-500 hover:text-foreground cursor-pointer flex items-center justify-center transition-colors"
            title="Back to Landing Page"
          >
            <CaretLeft className="h-5 w-5" />
          </button>
          <a 
            href="/"
            id="brand-logo"
            className="font-extrabold text-lg tracking-tight font-display text-foreground select-none hover:opacity-90 transition-opacity flex items-center gap-2"
          >
            <SeoBeaconLogo size={22} />
            <span>SeoBeacon</span>
          </a>
        </div>
        <div className="flex items-center gap-4 text-xs">
          {theme !== null && (
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-muted hover:bg-slate-200 dark:hover:bg-[#1e2230] text-slate-650 dark:text-slate-400 transition-colors border border-border cursor-pointer flex items-center justify-center"
              aria-label="Toggle dark mode"
            >
              {theme === "light" ? (
                <Moon className="h-4.5 w-4.5" />
              ) : (
                <Sun className="h-4.5 w-4.5" />
              )}
            </button>
          )}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-5xl mx-auto px-4 md:px-8 py-8 flex flex-col gap-8">
        
        {/* Dynamic loading steps state */}
        <AnimatePresence mode="wait">
          {loading ? (
            <motion.section
              key="loading"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex-1 flex flex-col items-center justify-center py-20 text-center gap-5"
            >
              <div className="relative w-16 h-16 flex items-center justify-center">
                <div className="absolute inset-0 border-4 border-slate-200 dark:border-slate-800 rounded-full" />
                <div className="absolute inset-0 border-4 border-t-[#cdb4db] border-r-[#bde0fe] rounded-full animate-spin" />
              </div>
              <h3 className="text-lg font-bold font-display text-foreground animate-pulse mt-2">
                Running SEO Audit Checklist
              </h3>
              <p className="text-xs text-muted-foreground font-mono bg-muted border border-border px-3 py-1.5 rounded-lg max-w-xs truncate">
                {loadingStep}
              </p>
            </motion.section>
          ) : error ? (
            <motion.section
              key="error"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex-1 flex flex-col items-center justify-center py-20 text-center gap-4"
            >
              <div className="p-3.5 bg-rose-500/5 border border-rose-500/10 rounded-2xl text-rose-500">
                <WarningCircle className="h-8 w-8" />
              </div>
              <h3 className="text-base font-bold font-display text-foreground">Audit Failed</h3>
              <p className="text-xs text-muted-foreground max-w-sm leading-relaxed font-sans">{error}</p>
              <Button 
                onClick={() => router.push("/")}
                className="mt-2 bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-850 px-5 py-2 rounded-lg text-xs font-semibold cursor-pointer"
              >
                Return to Search Page
              </Button>
            </motion.section>
          ) : results ? (
            // Report output state
            <motion.section
              key="results"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ type: "spring", stiffness: 100, damping: 20 }}
              className="flex flex-col gap-6 text-left"
            >
              {/* Compact Check Page Header Search */}
              <Card className="bg-card border-border p-6 rounded-2xl shadow-xs">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
                  <div>
                    <h2 className="text-xl font-bold font-display text-foreground">Audit Diagnostics</h2>
                    <p className="text-xs text-muted-foreground mt-0.5 font-sans">Enter another URL below to execute another full on-page analysis.</p>
                  </div>
                  <div className="text-[10px] font-mono text-muted-foreground bg-muted border border-border px-2.5 py-1 rounded-md self-start md:self-auto uppercase">
                    SCANNED: {new URL(results.scrapedData.url).hostname}
                  </div>
                </div>
                
                <form onSubmit={handleSearchSubmit} className="w-full">
                  <div className="relative flex flex-col sm:flex-row items-stretch sm:items-center bg-muted border border-border rounded-xl p-1.5 gap-2 focus-within:border-[#cdb4db] transition-all">
                    <div className="flex items-center gap-2.5 flex-1 min-w-0 px-2 py-1.5 sm:py-0">
                      <Globe className="h-4.5 w-4.5 text-muted-foreground shrink-0" />
                      <Input
                        type="text"
                        placeholder="Enter URL (e.g. yoursite.com)"
                        value={urlInput}
                        onChange={(e) => setUrlInput(e.target.value)}
                        className="bg-transparent border-0 ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-slate-450 text-foreground text-xs py-0 h-auto flex-1 min-w-0 font-sans"
                      />
                    </div>
                    <Button
                      type="submit"
                      disabled={!urlInput.trim()}
                      className="bg-gradient-to-r from-[#a2d2ff] via-[#cdb4db] to-[#ffc8dd] hover:opacity-90 active:scale-[0.99] transition-all text-slate-800 font-bold px-6 py-2.5 h-10 rounded-lg flex items-center justify-center gap-2 cursor-pointer text-xs"
                    >
                      <span>Scan Site</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </form>
              </Card>

              {/* Top-Level Tabs to Split Content */}
              <div className="flex border-b border-border overflow-x-auto scrollbar-none gap-2 mt-4">
                {REPORT_TABS.map((tab) => {
                  const isActive = activeReportTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveReportTab(tab.id)}
                      className={`py-3 px-5 font-display text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                        isActive
                          ? "border-[#ffafcc] text-foreground"
                          : "border-transparent text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      {tab.icon}
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Tab Contents View */}
              <div className="mt-4 min-h-[400px]">
                <AnimatePresence mode="wait">
                  {activeReportTab === "overview" && (
                    <motion.div
                      key="overview-tab"
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="flex flex-col gap-6"
                    >
                      {/* Score row */}
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
                        <div className="lg:col-span-4 flex flex-col">
                          {results.aiAnalysis && (
                            <ScoreRing score={results.aiAnalysis.score} />
                          )}
                        </div>

                        <Card className="lg:col-span-8 bg-card border-border p-6 rounded-2xl shadow-xs flex flex-col justify-between">
                          <div className="text-[9px] font-mono text-muted-foreground tracking-wider mb-2">
                            CATEGORIES // 02
                          </div>
                          <h3 className="text-base font-bold font-display text-foreground mb-4">On-page score metrics</h3>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 flex-1">
                            {categoriesList.map((item, idx) => (
                              <div key={idx} className="flex flex-col justify-center">
                                <div className="flex justify-between items-center text-xs mb-1.5">
                                  <span className="font-semibold text-foreground/80 font-sans">{item.label}</span>
                                  <span className="font-mono font-bold text-foreground">{item.score}%</span>
                                </div>
                                <div className="w-full bg-slate-100 dark:bg-[#1e2230] h-2 rounded-full overflow-hidden">
                                  <div
                                    className="h-full rounded-full"
                                    style={{ backgroundColor: item.color, width: `${item.score}%` }}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </Card>
                      </div>

                      {/* HTML page summary and stats */}
                      <Card className="bg-card border-border p-6 rounded-2xl shadow-xs">
                        <div className="text-[9px] font-mono text-muted-foreground tracking-wider mb-2">
                          PAGE INFO // 03
                        </div>
                        <h3 className="text-base font-bold font-display text-foreground mb-4">HTML page metadata</h3>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
                          
                          <div className="md:col-span-2 flex flex-col gap-4">
                            <div className="p-3 bg-muted border border-border rounded-xl">
                              <span className="text-[10px] font-mono text-muted-foreground uppercase">Meta title</span>
                              <p className="text-xs font-semibold text-foreground mt-1 select-all font-sans leading-relaxed">
                                {results.scrapedData.title.content || "Missing title tag"}
                              </p>
                            </div>

                            <div className="p-3 bg-muted border border-border rounded-xl">
                              <span className="text-[10px] font-mono text-muted-foreground uppercase">Meta description</span>
                              <p className="text-xs text-foreground/80 mt-1 leading-relaxed select-all font-sans">
                                {results.scrapedData.description.content || "Missing meta description tag"}
                              </p>
                            </div>

                            <div className="flex items-center gap-2 px-1 text-[11px] text-muted-foreground">
                              <span className="font-mono uppercase text-[9px] bg-muted border border-border px-1.5 py-0.5 rounded text-muted-foreground">URL</span>
                              <a href={results.scrapedData.url} target="_blank" rel="noreferrer" className="hover:text-blue-500 dark:hover:text-blue-400 transition-colors inline-flex items-center gap-1 font-mono truncate">
                                {results.scrapedData.url}
                                <ArrowSquareOut className="h-3 w-3" />
                              </a>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-3.5 bg-muted/40 p-4 border border-border rounded-xl h-full justify-center">
                            <div className="flex flex-col">
                              <span className="text-[9px] text-muted-foreground uppercase tracking-wider font-mono">Status code</span>
                              <span className="text-base font-mono font-bold text-emerald-600 dark:text-emerald-450 mt-1 bg-emerald-500/5 border border-emerald-500/10 rounded px-2 py-0.5 self-start">
                                {results.scrapedData.statusCode}
                              </span>
                            </div>

                            <div className="flex flex-col">
                              <span className="text-[9px] text-muted-foreground uppercase tracking-wider font-mono">Response time</span>
                              <span className="text-base font-mono font-bold text-foreground mt-1">
                                {results.scrapedData.responseTime}s
                              </span>
                            </div>

                            <div className="flex flex-col">
                              <span className="text-[9px] text-muted-foreground uppercase tracking-wider font-mono">Word count</span>
                              <span className="text-base font-mono font-bold text-foreground mt-1">
                                {results.scrapedData.wordCount}
                              </span>
                            </div>

                            <div className="flex flex-col">
                              <span className="text-[9px] text-muted-foreground uppercase tracking-wider font-mono">File size</span>
                              <span className="text-base font-mono font-bold text-foreground mt-1">
                                {results.scrapedData.fileSizeKb} KB
                              </span>
                            </div>

                            <div className="flex flex-col col-span-2 border-t border-border pt-2.5">
                              <span className="text-[9px] text-muted-foreground uppercase tracking-wider font-mono">Page Language</span>
                              <span className="text-xs font-mono font-semibold text-foreground/80 mt-1 uppercase">
                                {results.scrapedData.language}
                              </span>
                            </div>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  )}

                  {activeReportTab === "tasks" && (
                    <motion.div
                      key="tasks-tab"
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                    >
                      {results.aiAnalysis?.criticalFixes && results.aiAnalysis.criticalFixes.length > 0 ? (
                        <Card className="bg-card border-border p-6 rounded-2xl shadow-xs">
                          <div className="text-[9px] font-mono text-muted-foreground tracking-wider mb-2">
                            PRIORITY CHECKLIST // 04
                          </div>
                          <h3 className="text-base font-bold font-display text-foreground mb-4">Tasks sorted by priority</h3>
                          
                          <div className="overflow-x-auto">
                            <table className="w-full text-left text-xs border-collapse">
                              <thead>
                                <tr className="border-b border-border text-muted-foreground uppercase tracking-wider text-[9px] font-mono">
                                  <th className="py-2.5 pr-4 font-semibold">To-Do Action Item</th>
                                  <th className="py-2.5 px-4 font-semibold">Category</th>
                                  <th className="py-2.5 px-4 font-semibold w-24">Importance</th>
                                  <th className="py-2.5 pl-4 font-semibold w-28 text-right">Severity</th>
                                </tr>
                              </thead>
                              <tbody>
                                {results.aiAnalysis.criticalFixes.map((fix, idx) => (
                                  <tr key={idx} className="border-b border-border hover:bg-muted/40 transition-colors">
                                    <td className="py-3.5 pr-4 align-top">
                                      <div className="font-semibold text-foreground font-sans">{fix.title}</div>
                                      <p className="text-[11px] text-muted-foreground mt-1 leading-relaxed font-sans">{fix.description}</p>
                                    </td>
                                    <td className="py-3.5 px-4 align-top font-medium text-muted-foreground/85 font-sans">{fix.category}</td>
                                    <td className="py-3.5 px-4 align-top font-medium text-muted-foreground/85 font-sans">{fix.importance || "Very important"}</td>
                                    <td className="py-3.5 pl-4 align-top text-right">
                                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                                        fix.type === "error" 
                                          ? "bg-rose-500/5 border border-rose-500/10 text-rose-500" 
                                          : "bg-amber-500/5 border border-amber-500/10 text-amber-500"
                                      }`}>
                                        {fix.type}
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </Card>
                      ) : (
                        <Card className="bg-card border-border p-8 rounded-2xl text-center text-xs text-muted-foreground font-sans">
                          🎉 Great job! No critical issues or fixes detected on this page.
                        </Card>
                      )}
                    </motion.div>
                  )}

                  {activeReportTab === "audits" && (
                    <motion.div
                      key="audits-tab"
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="flex flex-col gap-4"
                    >
                      {/* Sub-tabs horizontal bar scrollable */}
                      <div className="flex border-b border-border overflow-x-auto scrollbar-none gap-2">
                        {DETAILED_TABS.map((tab) => {
                          const isActive = activeDetailedTab.id === tab.id;
                          const tabItems = results.aiAnalysis?.[tab.key] || [];
                          const failCount = tabItems.filter((i: any) => i.status === "error").length;

                          return (
                            <button
                              key={tab.id}
                              onClick={() => setActiveDetailedTab(tab)}
                              className={`py-2 px-3.5 font-display text-xs font-semibold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                                isActive
                                  ? "border-[#ffafcc] text-foreground font-bold"
                                  : "border-transparent text-muted-foreground hover:text-foreground"
                              }`}
                            >
                              <span>{tab.label}</span>
                              {failCount > 0 && (
                                <span className="bg-rose-500/10 border border-rose-500/20 text-rose-500 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full">
                                  {failCount}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>

                      {/* Tab content checklist view */}
                      <div className="flex flex-col gap-4 mt-2">
                        {(() => {
                          const tabItems = results.aiAnalysis?.[activeDetailedTab.key] as CheckItem[] | undefined;
                          
                          if (!tabItems || tabItems.length === 0) {
                            return (
                              <div className="p-8 text-center text-xs text-muted-foreground bg-card border border-border rounded-2xl font-sans">
                                No checklists analyzed for this section.
                              </div>
                            );
                          }

                          return tabItems.map((item, idx) => (
                            <Card key={idx} className="bg-card border-border p-5 rounded-2xl shadow-xs text-foreground flex flex-col gap-4 border-l-4" style={{ borderLeftColor: item.status === "pass" ? "#10b981" : item.status === "warning" ? "#f59e0b" : "#ef4444" }}>
                              
                              <div className="flex items-start justify-between gap-4">
                                <div className="flex items-center gap-2.5">
                                  <StatusIcon status={item.status} />
                                  <span className="font-bold text-sm text-foreground font-display">{item.name}</span>
                                </div>
                                
                                <div className="flex items-center gap-2 text-[10px] font-mono text-muted-foreground">
                                  <span className="bg-muted text-muted-foreground px-1.5 py-0.5 rounded">Score: {item.score}</span>
                                  <span className="border border-border px-1.5 py-0.5 rounded">{item.importance}</span>
                                </div>
                              </div>

                              {item.value && (
                                <div className="p-2.5 bg-muted border border-border rounded-lg text-[11px] font-mono text-muted-foreground select-all leading-normal">
                                  {item.value}
                                </div>
                              )}

                              {item.checks && item.checks.length > 0 && (
                                <ul className="flex flex-col gap-2 pl-6 list-none text-xs text-foreground/80 leading-normal font-sans">
                                  {item.checks.map((chk, cIdx) => (
                                    <li key={cIdx} className="relative before:content-['✓'] before:absolute before:-left-5 before:text-emerald-500 before:font-bold">
                                      {chk}
                                    </li>
                                  ))}
                                </ul>
                              )}

                              {item.tip && (
                                <div className="mt-1 p-3.5 bg-blue-500/5 dark:bg-blue-500/10 border border-blue-500/10 rounded-xl text-[11px] text-blue-600 dark:text-blue-400 leading-relaxed font-medium font-sans">
                                  {item.tip}
                                </div>
                              )}

                            </Card>
                          ));
                        })()}
                      </div>
                    </motion.div>
                  )}

                  {activeReportTab === "social" && (
                    <motion.div
                      key="social-tab"
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                    >
                      <OpenGraphPreview scrapedData={results.scrapedData} />
                    </motion.div>
                  )}

                  {activeReportTab === "backlinks" && (
                    <motion.div
                      key="backlinks-tab"
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                    >
                      {results.aiAnalysis?.backlinkStrategy && results.aiAnalysis.backlinkStrategy.length > 0 ? (
                        <Card className="bg-card border-border p-6 rounded-2xl shadow-xs">
                          <div className="text-[9px] font-mono text-muted-foreground tracking-wider mb-2">
                            OFF-PAGE STRATEGY // 06
                          </div>
                          <h3 className="text-base font-bold font-display text-foreground mb-4">Organic Link & Authority Strategy</h3>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {results.aiAnalysis.backlinkStrategy.map((item, idx) => (
                              <div key={idx} className="p-4 bg-muted border border-border rounded-xl flex flex-col gap-2">
                                <span className="text-xs font-bold text-foreground font-sans">{item.recommendation}</span>
                                <div className="text-[11px] text-muted-foreground leading-relaxed font-sans">
                                  <span className="text-[9px] uppercase tracking-wider text-[#ffafcc] font-mono font-bold block mb-1">Action step</span>
                                  {item.actionItem}
                                </div>
                              </div>
                            ))}
                          </div>
                        </Card>
                      ) : (
                        <Card className="bg-card border-border p-8 rounded-2xl text-center text-xs text-muted-foreground font-sans">
                          No link strategies generated for this page.
                        </Card>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

            </motion.section>
          ) : null}
        </AnimatePresence>
      </main>

      {/* Footer Navigation (Replicated from page.tsx) */}
      <footer className="border-t border-border bg-card py-12 px-6 md:px-12 text-left text-xs text-muted-foreground font-sans mt-auto">
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <SeoBeaconLogo size={18} />
              <span className="font-extrabold text-sm font-display text-foreground select-none">SeoBeacon</span>
            </div>
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              Grade your website's search value, instantaneously. Comprehensive on-page and off-page AI diagnostics.
            </p>
            <div className="flex items-center gap-3.5 mt-2">
              <a href="https://github.com/lazyshrey/seo-beacon" target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-foreground transition-colors" title="GitHub">
                <GithubLogo className="h-5 w-5" />
              </a>
              <a href="https://x.com/lazy_shrey" target="_blank" rel="noreferrer" className="text-muted-foreground hover:text-foreground transition-colors" title="Twitter">
                <TwitterLogo className="h-5 w-5" />
              </a>
            </div>
          </div>
          
          <div className="flex flex-col gap-2.5">
            <span className="font-bold text-[11px] uppercase tracking-wider text-foreground font-display">Product</span>
            <a href="/#features" className="hover:text-foreground transition-colors text-[11px]">Core Features</a>
            <a href="/#pricing" className="hover:text-foreground transition-colors text-[11px]">MIT License</a>
            <a href="https://github.com/lazyshrey/seo-beacon" target="_blank" rel="noreferrer" className="hover:text-foreground transition-colors text-[11px]">GitHub Repo</a>
          </div>

          <div className="flex flex-col gap-2.5">
            <span className="font-bold text-[11px] uppercase tracking-wider text-foreground font-display">Developer</span>
            <a href="https://lazyshrey.in" target="_blank" rel="noreferrer" className="hover:text-foreground transition-colors text-[11px]">Portfolio Website</a>
            <a href="mailto:5aprilshrey@gmail.com" className="hover:text-foreground transition-colors text-[11px]">Contact Email</a>
            <a href="https://payments.cashfree.com/forms/shrey" target="_blank" rel="noreferrer" className="hover:text-foreground transition-colors text-[11px]">Support & Tips</a>
          </div>

          <div className="flex flex-col gap-2.5">
            <span className="font-bold text-[11px] uppercase tracking-wider text-foreground font-display">Resources</span>
            <a href="https://lazyshrey.in" target="_blank" rel="noreferrer" className="hover:text-foreground transition-colors text-[11px]">Creator Hub</a>
            <a href="https://github.com/lazyshrey/seo-beacon" target="_blank" rel="noreferrer" className="hover:text-foreground transition-colors text-[11px]">MIT Source Files</a>
          </div>
        </div>

        <div className="max-w-5xl mx-auto border-t border-border pt-6 text-center text-[10px] text-muted-foreground font-mono flex flex-col sm:flex-row items-center justify-between gap-4">
          <span>&copy; {new Date().getFullYear()} SeoBeacon. Open-source under MIT License. All rights reserved.</span>
          <span>
            Designed by Shrey Jaiswal — <a href="https://lazyshrey.in" target="_blank" rel="noreferrer" className="hover:text-foreground underline transition-colors decoration-[#ffafcc]">lazyshrey.in</a>
          </span>
        </div>
      </footer>
    </div>
  );
}

export default function ReportPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col min-h-screen bg-background text-foreground justify-center items-center font-sans gap-3">
        <div className="relative w-12 h-12 flex items-center justify-center">
          <div className="absolute inset-0 border-4 border-slate-200 dark:border-slate-800 rounded-full" />
          <div className="absolute inset-0 border-4 border-t-[#cdb4db] border-r-[#bde0fe] rounded-full animate-spin" />
        </div>
        <span className="text-xs text-muted-foreground mt-2 font-mono">Loading SeoBeacon diagnostics panel...</span>
      </div>
    }>
      <ReportContent />
    </Suspense>
  );
}
