"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Globe, Image as ImageIcon, WarningCircle, CheckCircle } from "@phosphor-icons/react";

interface OpenGraphPreviewProps {
  scrapedData: {
    url: string;
    title: { content: string | null };
    description: { content: string | null };
    openGraph: {
      title: string | null;
      description: string | null;
      image: string | null;
      url: string | null;
    };
    twitter: {
      card: string | null;
      title: string | null;
      description: string | null;
      image: string | null;
    };
  };
}

export function OpenGraphPreview({ scrapedData }: OpenGraphPreviewProps) {
  const [platform, setPlatform] = useState<"facebook" | "x">("facebook");

  const { openGraph, twitter, title, description, url } = scrapedData;

  let domain = "";
  try {
    domain = new URL(url).hostname;
  } catch {
    domain = url || "website.com";
  }

  const ogTitle = openGraph.title || title.content || "Untitled Page";
  const ogDesc = openGraph.description || description.content || "No description provided. Add an og:description tag to display description text on social previews.";
  const ogImg = openGraph.image || twitter.image || null;

  const twTitle = twitter.title || ogTitle;
  const twDesc = twitter.description || ogDesc;
  const twImg = twitter.image || ogImg;

  const audit = [
    { name: "og:title", exists: !!openGraph.title, desc: "Displays title on Facebook, etc." },
    { name: "og:description", exists: !!openGraph.description, desc: "Displays description text on social cards." },
    { name: "og:image", exists: !!openGraph.image, desc: "Displays target image in social previews." },
    { name: "og:url", exists: !!openGraph.url, desc: "Ensures shares point to the correct canonical URL." },
    { name: "twitter:card", exists: !!twitter.card, desc: "Instructs X on how to render the card style." },
  ];

  return (
    <div className="flex flex-col gap-6 p-6 bg-card border border-border rounded-2xl h-full relative overflow-hidden shadow-xs">
      <div className="absolute top-3 left-3 text-[9px] font-mono text-muted-foreground tracking-wider">
        PREVIEW // 02
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-border pb-4 mt-3 gap-3">
        <div className="text-left">
          <h3 className="text-foreground font-semibold tracking-tight text-base font-display">
            Social Preview Debugger
          </h3>
          <p className="text-[11px] text-muted-foreground mt-0.5 font-sans">
            Inspect social card generation on platforms.
          </p>
        </div>

        {/* Platform switcher */}
        <div className="flex bg-muted p-0.5 rounded-lg border border-border text-[10px] font-mono self-start sm:self-auto">
          <button
            onClick={() => setPlatform("facebook")}
            className={`px-3 py-1.5 rounded-md font-medium transition-all cursor-pointer ${
              platform === "facebook"
                ? "bg-card text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Facebook
          </button>
          <button
            onClick={() => setPlatform("x")}
            className={`px-3 py-1.5 rounded-md font-medium transition-all cursor-pointer ${
              platform === "x"
                ? "bg-card text-foreground shadow-xs"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            X (Twitter)
          </button>
        </div>
      </div>

      {/* Main Preview Frame */}
      <div className="flex-1 flex flex-col justify-center min-h-[220px]">
        <AnimatePresence mode="wait">
          {platform === "facebook" ? (
            <motion.div
              key="facebook"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ type: "spring", stiffness: 120, damping: 18 }}
              className="w-full max-w-md mx-auto bg-[#f2f3f5] dark:bg-[#18191a] border border-slate-200 dark:border-[#2f3031] rounded-lg overflow-hidden flex flex-col"
            >
              <div className="relative aspect-[1.91/1] w-full bg-slate-200 dark:bg-[#242526] flex items-center justify-center border-b border-slate-200 dark:border-[#2f3031]">
                {ogImg ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={ogImg}
                    alt="OpenGraph Preview"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLElement).style.display = "none";
                    }}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 gap-2 select-none">
                    <ImageIcon className="h-8 w-8 opacity-45" />
                    <span className="text-[10px] font-mono tracking-tighter uppercase opacity-65">No og:image tag</span>
                  </div>
                )}
              </div>
              <div className="p-3.5 bg-white dark:bg-[#242526] flex flex-col gap-1 text-left">
                <span className="text-[10px] text-slate-400 dark:text-slate-500 uppercase tracking-wider font-mono font-medium">
                  {domain}
                </span>
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 line-clamp-1 font-display">
                  {ogTitle}
                </span>
                <p className="text-[10px] text-slate-550 dark:text-slate-400 line-clamp-2 leading-relaxed">
                  {ogDesc}
                </p>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="x"
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ type: "spring", stiffness: 120, damping: 18 }}
              className="w-full max-w-md mx-auto bg-white dark:bg-black border border-slate-200 dark:border-zinc-800 rounded-xl overflow-hidden flex flex-col"
            >
              <div className="relative aspect-[1.91/1] w-full bg-slate-100/60 dark:bg-zinc-950 flex items-center justify-center border-b border-slate-200 dark:border-zinc-850">
                {twImg ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={twImg}
                    alt="X Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 gap-2 select-none">
                    <ImageIcon className="h-8 w-8 opacity-45" />
                    <span className="text-[10px] font-mono tracking-tighter uppercase opacity-65">No twitter:image tag</span>
                  </div>
                )}
              </div>
              <div className="p-3 bg-white dark:bg-black flex flex-col gap-0.5 text-left">
                <div className="flex items-center gap-1.5 text-[10px] text-slate-400 dark:text-slate-500 font-mono">
                  <Globe className="h-3.5 w-3.5" />
                  <span>{domain}</span>
                </div>
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 line-clamp-1 mt-0.5 font-display">
                  {twTitle}
                </span>
                <p className="text-[10px] text-slate-550 dark:text-slate-400 line-clamp-2 leading-relaxed mt-0.5">
                  {twDesc}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Social Tags Audit checklist */}
      <div className="border-t border-border pt-4 flex flex-col gap-2.5">
        <span className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground font-bold mb-1 font-display">
          Social Sharing Checklist
        </span>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {audit.map((item, idx) => (
            <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-muted/40 border border-border/80">
              <div className="flex flex-col text-left">
                <span className="text-[11px] font-mono text-foreground font-medium">
                  {item.name}
                </span>
                <span className="text-[9px] text-muted-foreground line-clamp-1">
                  {item.desc}
                </span>
              </div>
              {item.exists ? (
                <CheckCircle className="h-4.5 w-4.5 text-emerald-500 shrink-0" />
              ) : (
                <WarningCircle className="h-4.5 w-4.5 text-amber-500 shrink-0" />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
