"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
  Link as LinkIcon,
  ShieldCheck,
  Browser,
  HardDrives,
  Gauge,
  GithubLogo,
  TwitterLogo
} from "@phosphor-icons/react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { SeoBeaconLogo } from "@/components/brand/logo";

export default function Home() {
  const [url, setUrl] = useState("");
  const [theme, setTheme] = useState<"light" | "dark" | null>(null);
  const [giftOpened, setGiftOpened] = useState(false);
  const router = useRouter();

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

  const handleAnalyze = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    
    // Normalize URL
    let normalized = url.trim();
    if (!/^https?:\/\//i.test(normalized)) {
      normalized = `https://${normalized}`;
    }
    
    router.push(`/report?url=${encodeURIComponent(normalized)}`);
  };

  // Features list
  const coreFeatures = [
    {
      icon: <Browser className="h-6 w-6 text-[#cdb4db]" />,
      title: "Meta Data & Header Tags",
      desc: "Deep validation of Title tags, Description content, Canonical URLs, and Robots meta tags to secure proper crawling."
    },
    {
      icon: <Gauge className="h-6 w-6 text-[#ffc8dd]" />,
      title: "Page Content Quality",
      desc: "Audits word counts, text-to-HTML density, keyword placements, and analyzes missing image alt tags for accessibility."
    },
    {
      icon: <Cpu className="h-6 w-6 text-[#ffafcc]" />,
      title: "Heading Structure Outline",
      desc: "Maps and validates the hierarchical outline sequence of H1, H2, and H3 elements to ensure logical reading outline."
    },
    {
      icon: <LinkIcon className="h-6 w-6 text-[#bde0fe]" />,
      title: "Link Quality & Anchors",
      desc: "Checks internal vs external ratios, detects broken/empty anchor URLs, and details nofollow attribute spread."
    },
    {
      icon: <HardDrives className="h-6 w-6 text-[#a2d2ff]" />,
      title: "Server Configuration",
      desc: "Measures request speed latency, HTML payload byte sizes, gzip compression detection, and SSL encryption status."
    },
    {
      icon: <ShieldCheck className="h-6 w-6 text-[#cdb4db]" />,
      title: "Social Preview Cards",
      desc: "Reviews Facebook OpenGraph and Twitter card integration with live visual snippet debugger drafts."
    }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground transition-colors duration-250 font-sans">
      {/* Header Navigation */}
      <header className="border-b border-border bg-card/75 backdrop-blur-md sticky top-0 z-50 px-6 md:px-12 py-4 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2.5">
          <a 
            href="/"
            id="brand-logo" 
            className="font-extrabold text-lg tracking-tight font-display text-foreground select-none hover:opacity-90 transition-opacity flex items-center gap-2"
          >
            <SeoBeaconLogo size={22} />
            <span>SeoBeacon</span>
          </a>
        </div>

        {/* Navbar links */}
        <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-muted-foreground font-sans">
          <a href="#features" className="hover:text-foreground transition-colors">Features</a>
          <a href="#workflow" className="hover:text-foreground transition-colors">How it works</a>
          <a href="#pricing" className="hover:text-foreground transition-colors">License</a>
          <a href="#faq" className="hover:text-foreground transition-colors">FAQ</a>
        </nav>

        <div className="flex items-center gap-4 text-xs">
          {theme !== null && (
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-muted hover:bg-slate-200 dark:hover:bg-[#1e2230] text-slate-650 dark:text-slate-400 transition-colors border border-border cursor-pointer flex items-center justify-center"
              aria-label="Toggle dark mode"
              title={theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
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

      {/* Main Container */}
      <main className="flex-1 w-full flex flex-col items-center">
        
        {/* 1. Hero Landing Section */}
        <section className="w-full max-w-5xl mx-auto px-4 md:px-8 py-16 md:py-20 flex flex-col items-center text-center gap-6 relative">
          
          {/* Main Headline */}
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight font-display text-foreground max-w-3xl leading-[1.05] mb-2 animate-in fade-in slide-in-from-top-6 duration-650">
            Grade your website's search value, <span className="bg-gradient-to-r from-[#ffafcc] via-[#cdb4db] to-[#a2d2ff] bg-clip-text text-transparent">instantaneously.</span>
          </h1>
          
          {/* Supporting Subtitle Tagline */}
          <p className="text-xs sm:text-sm text-muted-foreground max-w-2xl leading-relaxed mb-6 font-sans">
            Get instant Seobility-grade technical audits, structural outline diagnostics, real-time social card debug previews, and custom AI-generated organic backlink checklists in seconds.
          </p>

          {/* Large search input */}
          <div className="w-full">
            <form onSubmit={handleAnalyze} className="w-full max-w-2xl mx-auto">
              <div className="relative flex flex-col sm:flex-row items-stretch sm:items-center bg-card border border-border rounded-2xl p-2 gap-2 transition-all duration-300 shadow-[0_15px_30px_-5px_rgba(205,180,219,0.15)] focus-within:shadow-[0_15px_30px_-5px_rgba(205,180,219,0.25)] focus-within:border-[#cdb4db]">
                <div className="flex items-center gap-3 flex-1 min-w-0 px-3 py-2 sm:py-0">
                  <Globe className="h-5 w-5 text-muted-foreground shrink-0" />
                  <Input
                    type="text"
                    placeholder="Enter website URL to grade (e.g. yoursite.com)"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="bg-transparent border-0 ring-0 focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-slate-400 dark:placeholder:text-slate-500 text-foreground text-sm py-0 h-auto flex-1 min-w-0 font-sans"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={!url.trim()}
                  className="bg-gradient-to-r from-[#a2d2ff] via-[#cdb4db] to-[#ffc8dd] hover:opacity-90 active:scale-[0.99] transition-all text-slate-800 font-bold px-7 py-3 h-11 rounded-xl flex items-center justify-center gap-2 cursor-pointer text-xs"
                >
                  <span>Analyze Web Page</span>
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </form>
          </div>

          {/* Quick check indicators */}
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 mt-2 text-[11px] font-mono text-muted-foreground animate-in fade-in duration-800">
            <span className="flex items-center gap-1.5">
              <span className="text-emerald-500 font-bold">✓</span> 60+ On-Page Checkpoints
            </span>
            <span className="flex items-center gap-1.5">
              <span className="text-emerald-500 font-bold">✓</span> OpenGraph Debugger
            </span>
            <span className="flex items-center gap-1.5">
              <span className="text-emerald-500 font-bold">✓</span> Groq Llama 3.3 Analysis
            </span>
          </div>

          {/* Premium browser dashboard mockup */}
          <div className="relative w-full max-w-3xl mx-auto mt-12 select-none group">
            {/* Decorative ambient glow background */}
            <div className="absolute -inset-4 bg-gradient-to-tr from-[#cdb4db]/15 via-[#ffc8dd]/20 to-[#a2d2ff]/15 rounded-[2.5rem] blur-3xl opacity-75 group-hover:opacity-100 transition-opacity duration-500" />
            
            {/* Browser mockup container */}
            <div className="relative bg-card border border-border rounded-2xl shadow-xl overflow-hidden flex flex-col">
              {/* Browser titlebar */}
              <div className="flex items-center justify-between px-4 py-3 bg-muted border-b border-border select-none">
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full bg-rose-500/80 border border-rose-600/10" />
                  <span className="h-2.5 w-2.5 rounded-full bg-amber-400/80 border border-amber-500/10" />
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500/80 border border-emerald-600/10" />
                </div>
                <div className="bg-card px-8 py-0.5 rounded border border-border text-[9px] font-mono text-muted-foreground w-40 truncate">
                  seobeacon.app/audit
                </div>
                <div className="w-10" />
              </div>
              
              {/* Browser body preview */}
              <div className="p-5 sm:p-6 flex flex-col gap-4 text-left relative bg-linear-to-b from-card to-background/50 border-t border-border">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-6 items-stretch">
                  {/* Score Ring Mock */}
                  <div className="md:col-span-4 bg-muted/20 border border-border/80 p-5 rounded-2xl flex flex-col items-center justify-center text-center relative overflow-hidden group/ring">
                    {/* Inner glowing core */}
                    <div className="absolute inset-8 bg-[#ffafcc]/5 dark:bg-[#a2d2ff]/5 rounded-full blur-xl pointer-events-none" />
                    
                    <div className="relative w-24 h-24 flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                        <defs>
                          <linearGradient id="mockScoreGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#ffafcc" />
                            <stop offset="50%" stopColor="#cdb4db" />
                            <stop offset="100%" stopColor="#a2d2ff" />
                          </linearGradient>
                        </defs>
                        {/* Outer track */}
                        <circle cx="50" cy="50" r="40" className="stroke-slate-100 dark:stroke-slate-800 fill-none" strokeWidth="6" />
                        {/* Inner detail guideline track */}
                        <circle cx="50" cy="50" r="34" className="stroke-slate-200/40 dark:stroke-slate-800/40 fill-none" strokeWidth="1" strokeDasharray="3 3" />
                        {/* Animated main progress stroke */}
                        <motion.circle
                          cx="50"
                          cy="50"
                          r="40"
                          stroke="url(#mockScoreGrad)"
                          className="fill-none"
                          strokeWidth="6"
                          strokeDasharray="251.2"
                          initial={{ strokeDashoffset: 251.2 }}
                          animate={{ strokeDashoffset: 251.2 - (251.2 * 0.84) }}
                          transition={{ duration: 2, ease: "easeOut" }}
                          strokeLinecap="round"
                        />
                      </svg>
                      {/* Central score indicator */}
                      <div className="absolute flex flex-col items-center justify-center">
                        <span className="text-xl font-extrabold font-display bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">84%</span>
                        <span className="text-[7px] font-mono text-muted-foreground uppercase tracking-widest font-bold mt-0.5">Grade</span>
                      </div>
                    </div>
                    <span className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold mt-3 font-display">SEO Score</span>
                  </div>
                  
                  {/* Progress Bars Mock */}
                  <div className="md:col-span-8 bg-muted/20 border border-border/80 p-5 rounded-2xl flex flex-col justify-center gap-4">
                    <div className="flex flex-col gap-1.5">
                      <div className="flex justify-between items-center text-[10px] font-bold text-muted-foreground">
                        <span className="font-display">Metadata audit</span>
                        <span className="font-mono text-foreground">82%</span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-[#1e2230] h-2 rounded-full overflow-hidden border border-border/50">
                        <motion.div 
                          className="bg-[#cdb4db] h-full rounded-full shadow-[0_0_8px_rgba(205,180,219,0.3)]"
                          initial={{ width: "0%" }}
                          animate={{ width: "82%" }}
                          transition={{ duration: 1.6, ease: "easeOut", delay: 0.2 }}
                        />
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-1.5">
                      <div className="flex justify-between items-center text-[10px] font-bold text-muted-foreground">
                        <span className="font-display">Page quality metrics</span>
                        <span className="font-mono text-foreground">75%</span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-[#1e2230] h-2 rounded-full overflow-hidden border border-border/50">
                        <motion.div 
                          className="bg-[#ffc8dd] h-full rounded-full shadow-[0_0_8px_rgba(255,200,221,0.3)]"
                          initial={{ width: "0%" }}
                          animate={{ width: "75%" }}
                          transition={{ duration: 1.6, ease: "easeOut", delay: 0.4 }}
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <div className="flex justify-between items-center text-[10px] font-bold text-muted-foreground">
                        <span className="font-display">Page structure & tags</span>
                        <span className="font-mono text-foreground">95%</span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-[#1e2230] h-2 rounded-full overflow-hidden border border-border/50">
                        <motion.div 
                          className="bg-[#a2d2ff] h-full rounded-full shadow-[0_0_8px_rgba(162,210,255,0.3)]"
                          initial={{ width: "0%" }}
                          animate={{ width: "95%" }}
                          transition={{ duration: 1.6, ease: "easeOut", delay: 0.6 }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

        </section>

        {/* 2. Core Audits / Features Section */}
        <section id="features" className="w-full border-t border-border bg-card/30 py-20 px-4 md:px-8">
          <div className="max-w-5xl mx-auto flex flex-col gap-12 text-left">
            <div className="max-w-2xl">
              <h2 className="text-3xl font-extrabold font-display text-foreground leading-tight">
                60+ Checkpoints, Scanned in Real-Time.
              </h2>
              <p className="text-sm text-muted-foreground mt-2 font-sans">
                SeoBeacon processes your page structure, tags, assets, and latency using the exact standards of professional SEO crawler suites.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {coreFeatures.map((feat, idx) => (
                <Card key={idx} className="bg-card border-border p-6 rounded-2xl flex flex-col gap-4 shadow-xs">
                  <div className="p-2.5 bg-muted rounded-xl self-start">
                    {feat.icon}
                  </div>
                  <div>
                    <h4 className="font-bold text-sm font-display text-foreground">{feat.title}</h4>
                    <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed font-sans">{feat.desc}</p>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* 3. How it Works Workflow Section */}
        <section id="workflow" className="w-full border-t border-border py-20 px-4 md:px-8 bg-background">
          <div className="max-w-5xl mx-auto flex flex-col gap-12 text-left">
            <div className="max-w-2xl">
              <h2 className="text-3xl font-extrabold font-display text-foreground leading-tight">
                Audit Blueprint Process
              </h2>
              <p className="text-sm text-muted-foreground mt-2 font-sans">
                Our analysis engine combines direct tag scraping and AI evaluation to deliver structured action items.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 relative">
              <div className="flex flex-col gap-3">
                <div className="w-8 h-8 rounded-full bg-[#cdb4db]/20 border border-[#cdb4db] text-slate-800 dark:text-[#cdb4db] font-mono font-bold flex items-center justify-center text-xs">
                  01
                </div>
                <h4 className="font-bold text-sm font-display mt-1">Crawl Page</h4>
                <p className="text-xs text-muted-foreground leading-relaxed font-sans">
                  The parser issues clean connection handshakes, scraping titles, headings, image alt texts, and outbound links.
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <div className="w-8 h-8 rounded-full bg-[#ffc8dd]/20 border border-[#ffc8dd] text-slate-800 dark:text-[#ffc8dd] font-mono font-bold flex items-center justify-center text-xs">
                  02
                </div>
                <h4 className="font-bold text-sm font-display mt-1">Validate Rules</h4>
                <p className="text-xs text-muted-foreground leading-relaxed font-sans">
                  Validates sizes, counts, and duplicates against industry best practices (e.g. 30-60 character titles, unique headings).
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <div className="w-8 h-8 rounded-full bg-[#bde0fe]/20 border border-[#bde0fe] text-slate-800 dark:text-[#bde0fe] font-mono font-bold flex items-center justify-center text-xs">
                  03
                </div>
                <h4 className="font-bold text-sm font-display mt-1">AI Diagnostics</h4>
                <p className="text-xs text-muted-foreground leading-relaxed font-sans">
                  Passes structured tag trees to Groq Llama 3.3 to determine categories scores, critical fixes, and backlink plans.
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <div className="w-8 h-8 rounded-full bg-[#a2d2ff]/20 border border-[#a2d2ff] text-slate-800 dark:text-[#a2d2ff] font-mono font-bold flex items-center justify-center text-xs">
                  04
                </div>
                <h4 className="font-bold text-sm font-display mt-1">Ship Report</h4>
                <p className="text-xs text-muted-foreground leading-relaxed font-sans">
                  Renders results in a vertical report on a separate page with tabs, checklists, previews, and priority to-do cards.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* 4. Creative Gift Box License / Pricing Section */}
        <section id="pricing" className="w-full border-t border-border bg-card/30 py-20 px-4 md:px-8">
          <div className="max-w-5xl mx-auto flex flex-col gap-12 text-center items-center">
            <div className="max-w-xl mx-auto">
              <h2 className="text-3xl font-extrabold font-display text-foreground leading-tight">
                Open Source & Community Built
              </h2>
              <p className="text-sm text-muted-foreground mt-2 font-sans">
                SeoBeacon is fully public and transparent. Click the gift box below to reveal licensing and support details.
              </p>
            </div>

            <div className="max-w-md mx-auto w-full flex flex-col items-center min-h-[360px] justify-center">
              <AnimatePresence mode="wait">
                {!giftOpened ? (
                  <motion.div
                    key="gift-box"
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="flex flex-col items-center gap-6 cursor-pointer py-10 group"
                    onClick={() => setGiftOpened(true)}
                  >
                    <motion.div
                      animate={{
                        y: [0, -4, 0],
                        rotate: [0, -1.5, 1.5, -1.5, 0]
                      }}
                      transition={{
                        repeat: Infinity,
                        duration: 2.2,
                        ease: "easeInOut"
                      }}
                      className="relative w-36 h-36 flex items-center justify-center filter drop-shadow-md"
                    >
                      {/* Interactive Gift Box SVG */}
                      <svg className="w-full h-full transition-transform duration-300 group-hover:scale-105" viewBox="0 0 100 100" fill="none">
                        {/* Ribbon bow loop left */}
                        <path d="M50,30 C30,10 20,20 48,30" fill="#ffafcc" stroke="#e08da8" strokeWidth="1.5" />
                        {/* Ribbon bow loop right */}
                        <path d="M50,30 C70,10 80,20 52,30" fill="#ffafcc" stroke="#e08da8" strokeWidth="1.5" />
                        {/* Box Lid */}
                        <rect x="15" y="30" width="70" height="15" rx="3" fill="#cdb4db" stroke="#b49ac2" strokeWidth="2" />
                        {/* Box Body */}
                        <path d="M19,45 L81,45 L77,88 C76,92 73,95 69,95 L31,95 C27,95 24,92 23,88 Z" fill="#bde0fe" stroke="#9bbfe2" strokeWidth="2" />
                        {/* Ribbon Vertical */}
                        <rect x="44" y="30" width="12" height="65" fill="#ffc8dd" />
                        {/* Ribbon Horizontal */}
                        <rect x="15" y="30" width="70" height="4" fill="#ffc8dd" />
                        {/* Shadow lines */}
                        <line x1="44" y1="45" x2="44" y2="95" stroke="#ffafcc" strokeWidth="1" />
                        <line x1="56" y1="45" x2="56" y2="95" stroke="#ffafcc" strokeWidth="1" />
                      </svg>
                    </motion.div>
                    
                    <div className="text-center">
                      <h3 className="font-bold text-base font-display text-foreground group-hover:text-[#cdb4db] transition-colors">
                        Unwrap SeoBeacon
                      </h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        Click the gift box to reveal its license and options.
                      </p>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="unwrapped-card"
                    initial={{ scale: 0.9, opacity: 0, y: 15 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 120, damping: 18 }}
                    className="w-full"
                  >
                    <Card className="bg-card border-border p-8 rounded-2xl flex flex-col justify-between shadow-md relative overflow-hidden text-left border-[#ffafcc]">
                      <div className="absolute top-0 right-0 bg-[#ffafcc] text-slate-900 text-[9px] font-mono font-bold px-3 py-1 uppercase rounded-bl-lg select-none">
                        Free & Open Source
                      </div>
                      
                      <div className="flex flex-col gap-4">
                        <div>
                          <h3 className="font-bold text-lg font-display text-foreground">100% Free Forever</h3>
                          <p className="text-xs text-muted-foreground mt-1 font-sans">
                            SeoBeacon is built for developers and builders. No subscriptions, no credits, no paywall gates.
                          </p>
                        </div>
                        
                        <ul className="text-xs text-foreground/80 flex flex-col gap-2.5 border-t border-border pt-4 font-sans">
                          <li className="flex items-center gap-2">
                            <span className="text-[#cdb4db] font-bold">✓</span> Unlimited single-page diagnostics
                          </li>
                          <li className="flex items-center gap-2">
                            <span className="text-[#cdb4db] font-bold">✓</span> Complete 60+ Seobility check audit tabs
                          </li>
                          <li className="flex items-center gap-2">
                            <span className="text-[#cdb4db] font-bold">✓</span> Live social cards preview snippet debugger
                          </li>
                          <li className="flex items-center gap-2">
                            <span className="text-[#cdb4db] font-bold">✓</span> Built-in caching to avoid rate limits
                          </li>
                          <li className="flex items-center gap-2">
                            <span className="text-[#cdb4db] font-bold">✓</span> MIT Licensed — clone, edit, or self-host
                          </li>
                        </ul>
                      </div>
                      
                      <div className="flex flex-col gap-2.5 mt-8">
                        <a 
                          href="https://github.com/lazyshrey/seo-beacon" 
                          target="_blank" 
                          rel="noreferrer"
                          className="bg-slate-800 text-white dark:bg-slate-200 dark:text-slate-850 hover:opacity-95 text-center font-bold py-2.5 rounded-lg text-xs flex items-center justify-center gap-2 cursor-pointer transition-all border border-transparent"
                        >
                          <GithubLogo className="h-4 w-4" />
                          <span>Star on GitHub</span>
                        </a>
                        <a 
                          href="https://payments.cashfree.com/forms/shrey" 
                          target="_blank" 
                          rel="noreferrer"
                          className="bg-gradient-to-r from-[#a2d2ff] via-[#cdb4db] to-[#ffc8dd] text-slate-800 hover:opacity-90 text-center font-bold py-2.5 rounded-lg text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                        >
                          <span>Support Shrey Jaiswal</span>
                        </a>
                      </div>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </section>

        {/* 5. FAQ Section */}
        <section id="faq" className="w-full border-t border-border py-20 px-4 md:px-8 bg-background">
          <div className="max-w-3xl mx-auto flex flex-col gap-12 text-left">
            <div className="text-center">
              <h2 className="text-3xl font-extrabold font-display text-foreground leading-tight">
                Frequently Asked Questions
              </h2>
              <p className="text-sm text-muted-foreground mt-2 font-sans">
                Everything you need to know about the SeoBeacon audit crawler.
              </p>
            </div>

            <div className="flex flex-col gap-6">
              <div className="p-5 bg-card border border-border rounded-2xl flex flex-col gap-2">
                <h4 className="font-bold text-sm text-foreground font-display">How does SeoBeacon calculate the SEO Score?</h4>
                <p className="text-xs text-muted-foreground leading-relaxed font-sans">
                  The score is calculated as a weighted average of individual checkpoints across six categories: Metadata tags, page structure headings, link layouts, performance latency, asset alt text, and social sharing previews.
                </p>
              </div>

              <div className="p-5 bg-card border border-border rounded-2xl flex flex-col gap-2">
                <h4 className="font-bold text-sm text-foreground font-display">Does it support client-side JavaScript frameworks?</h4>
                <p className="text-xs text-muted-foreground leading-relaxed font-sans">
                  SeoBeacon is a standard static HTML tag scraper. It audits the initial HTML returned by the server, which is the most critical payload search crawlers receive. Fully dynamic single page apps (SPAs) are audited based on their server-side rendering (SSR) payloads.
                </p>
              </div>

              <div className="p-5 bg-card border border-border rounded-2xl flex flex-col gap-2">
                <h4 className="font-bold text-sm text-foreground font-display">What AI model is used for the diagnostics?</h4>
                <p className="text-xs text-muted-foreground leading-relaxed font-sans">
                  We use the Groq Llama-3.3-70b-versatile model in JSON response mode, feeding it exact, structured Cheerio scrape logs. This produces reliable, context-specific recommendations without hallucinating.
                </p>
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="border-t border-border bg-card py-12 px-6 md:px-12 text-left text-xs text-muted-foreground font-sans">
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
            <a href="#features" className="hover:text-foreground transition-colors text-[11px]">Core Features</a>
            <a href="#pricing" className="hover:text-foreground transition-colors text-[11px]">MIT License</a>
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
