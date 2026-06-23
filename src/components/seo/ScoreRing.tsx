"use client";

import { useEffect, useState } from "react";
import { motion, useSpring, useTransform } from "framer-motion";

interface ScoreRingProps {
  score: number;
}

export function ScoreRing({ score }: ScoreRingProps) {
  const [displayScore, setDisplayScore] = useState(0);

  const springValue = useSpring(0, {
    stiffness: 70,
    damping: 18,
  });

  useEffect(() => {
    springValue.set(score);
  }, [score, springValue]);

  useEffect(() => {
    const unsubscribe = springValue.on("change", (latest) => {
      setDisplayScore(Math.round(latest));
    });
    return () => unsubscribe();
  }, [springValue]);

  const radius = 80;
  const strokeWidth = 10;
  const circumference = 2 * Math.PI * radius;
  
  const strokeDashoffset = useTransform(
    springValue,
    [0, 100],
    [circumference, 0]
  );

  const getColor = (s: number) => {
    if (s >= 80) return "text-emerald-600 dark:text-emerald-450 stroke-emerald-500";
    if (s >= 50) return "text-amber-600 dark:text-amber-450 stroke-amber-500";
    return "text-rose-600 dark:text-rose-450 stroke-rose-500";
  };

  const getLabel = (s: number) => {
    if (s >= 80) return "Healthy";
    if (s >= 50) return "Needs Audit";
    return "Critical Issues";
  };

  const activeColor = getColor(displayScore);

  return (
    <div className="flex flex-col items-center justify-center p-6 bg-card border border-border rounded-2xl relative overflow-hidden shadow-xs w-full h-full">
      <div className="absolute top-3 left-3 text-[9px] font-mono text-muted-foreground tracking-wider">
        METRIC // 01
      </div>

      <div className="relative w-44 h-44 flex items-center justify-center mt-3">
        {/* Soft pastel decorative gradient background */}
        <div className="absolute inset-4 rounded-full bg-gradient-to-tr from-[#cdb4db]/5 via-[#ffc8dd]/5 to-[#bde0fe]/5 blur-md" />
        
        {/* SVG Progress Circle */}
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 200 200">
          <circle
            cx="100"
            cy="100"
            r={radius}
            className="stroke-slate-100 dark:stroke-slate-800 fill-none"
            strokeWidth={strokeWidth}
          />
          <motion.circle
            cx="100"
            cy="100"
            r={radius}
            className={`fill-none ${activeColor.split(" ")[2] || activeColor.split(" ")[1]}`}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            style={{ strokeDashoffset }}
            strokeLinecap="round"
          />
        </svg>

        {/* Text score indicator */}
        <div className="absolute flex flex-col items-center justify-center select-none">
          <motion.span 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`text-5xl font-display font-extrabold tracking-tight ${activeColor.split(" ")[0]} ${activeColor.split(" ")[1]}`}
          >
            {displayScore}%
          </motion.span>
          <span className="text-[9px] uppercase tracking-[0.25em] text-muted-foreground font-bold mt-0.5">
            ON-PAGE SCORE
          </span>
        </div>
      </div>

      <div className="mt-4 text-center">
        <div className={`text-sm font-semibold font-display uppercase tracking-wider ${activeColor.split(" ")[0]} ${activeColor.split(" ")[1]}`}>
          {getLabel(displayScore)}
        </div>
        <p className="text-[10px] text-muted-foreground mt-1 max-w-[150px] leading-relaxed">
          Aggregated technical audit score of your website
        </p>
      </div>
    </div>
  );
}
