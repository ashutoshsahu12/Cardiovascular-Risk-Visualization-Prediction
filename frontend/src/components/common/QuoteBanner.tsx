import React, { useState } from 'react';
import { Heart, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';

const HEART_HEALTH_QUOTES = [
  {
    text: "Take care of your heart, and your heart will take care of you.",
    theme: "Cardiovascular Wellness"
  },
  {
    text: "Every healthy choice you make today is an investment in your cardiovascular tomorrow.",
    theme: "Daily Prevention"
  },
  {
    text: "Listening to your body's vital signals is the first step toward lasting heart wellness.",
    theme: "Proactive Health"
  },
  {
    text: "A strong heart is built one conscious, gentle decision at a time.",
    theme: "Sustainable Habits"
  }
];

export const QuoteBanner: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  const prevQuote = () => {
    setCurrentIndex((prev) => (prev === 0 ? HEART_HEALTH_QUOTES.length - 1 : prev - 1));
  };

  const nextQuote = () => {
    setCurrentIndex((prev) => (prev === HEART_HEALTH_QUOTES.length - 1 ? 0 : prev + 1));
  };

  const quote = HEART_HEALTH_QUOTES[currentIndex];

  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-teal-50/90 via-sky-50/70 to-slate-50/80 border border-teal-100/80 rounded-2xl px-5 py-3.5 shadow-xs transition-all">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Small Heart Icon & Quote Content */}
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-8 h-8 rounded-full bg-teal-600/10 border border-teal-500/20 flex items-center justify-center text-teal-600 shrink-0 shadow-2xs">
            <Heart className="w-4 h-4 fill-teal-600/20 text-teal-600" />
          </div>

          <div className="min-w-0">
            <p className="text-xs sm:text-sm font-medium text-slate-700 italic tracking-tight leading-snug truncate sm:whitespace-normal">
              "{quote.text}"
            </p>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] font-semibold text-teal-700 tracking-wide uppercase">
                {quote.theme}
              </span>
              <span className="text-[10px] text-slate-400">• Heart Health Wisdom</span>
            </div>
          </div>
        </div>

        {/* Right: Subtle Next/Prev Controls */}
        <div className="flex items-center gap-1 shrink-0 text-slate-400">
          <button
            type="button"
            onClick={prevQuote}
            aria-label="Previous heart health quote"
            className="w-6 h-6 rounded-lg hover:bg-white hover:text-slate-700 flex items-center justify-center transition-colors"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <span className="text-[10px] font-medium text-slate-400 px-1">
            {currentIndex + 1}/{HEART_HEALTH_QUOTES.length}
          </span>
          <button
            type="button"
            onClick={nextQuote}
            aria-label="Next heart health quote"
            className="w-6 h-6 rounded-lg hover:bg-white hover:text-slate-700 flex items-center justify-center transition-colors"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
