'use client';

import { useEffect, useState } from 'react';

export default function Hero() {
  const [subCount, setSubCount] = useState(38);
  const [progress, setProgress] = useState(76);

  useEffect(() => {
    const interval = setInterval(() => {
      const r = Math.random();
      if (r > 0.6 && subCount < 52) {
        setSubCount((prev) => {
          const newCount = prev + 1;
          setProgress(Math.round((newCount / 52) * 100));
          return newCount;
        });
      }
    }, 3200);
    return () => clearInterval(interval);
  }, [subCount]);

  return (
    <section className="min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 md:px-8 py-20 sm:py-24 md:py-28 text-center relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 z-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_0%,rgba(26,86,255,0.07)_0%,transparent_70%),radial-gradient(ellipse_40%_30%_at_80%_80%,rgba(0,200,150,0.05)_0%,transparent_60%),var(--paper)]" />
      
      {/* Grid */}
      <div className="absolute inset-0 z-0 bg-[linear-gradient(rgba(10,15,30,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(10,15,30,0.04)_1px,transparent_1px)] bg-[length:40px_40px] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,black_30%,transparent_100%)]" />

      {/* Content */}
      <div className="relative z-10 max-w-[800px] w-full">
        <div className="inline-flex items-center gap-2 bg-white border border-[rgba(26,86,255,0.2)] rounded-full px-3 sm:px-4 py-1.5 sm:py-2 text-[0.7rem] sm:text-[0.82rem] font-medium text-[var(--accent)] mb-6 sm:mb-8 animate-fade-up">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--green)] animate-pulse-dot" />
          <span className="hidden sm:inline">Now serving 240+ engineering colleges across India</span>
          <span className="sm:hidden">240+ colleges across India</span>
        </div>

        <h1 className="text-[2rem] sm:text-[2.8rem] md:text-[3.5rem] lg:text-[5rem] font-extrabold leading-[1.1] sm:leading-[1.05] text-[var(--ink)] mb-4 sm:mb-6 [animation:fadeUp_0.8s_0.1s_ease_both] font-['Syne'] px-2">
          The <span className="relative inline-block text-[var(--accent)]">
            <span className="relative">Digital Lab Manual</span>
            <span className="absolute bottom-[-2px] sm:bottom-[-4px] left-0 right-0 h-0.5 sm:h-1 bg-[var(--green)] rounded-sm animate-line-grow" />
          </span>
          <br />
          Platform for Modern
          <br />
          Academic Labs
        </h1>

        <p className="text-sm sm:text-base md:text-[1.15rem] font-light text-[var(--ink3)] max-w-[90%] sm:max-w-[560px] mx-auto mb-6 sm:mb-10 [animation:fadeUp_0.8s_0.2s_ease_both] px-2">
          Replace paper-based lab records with a structured, verified, eco-friendly digital system. Built for students, faculty, and institutions.
        </p>

        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-center flex-wrap [animation:fadeUp_0.8s_0.3s_ease_both] mb-8 sm:mb-12 px-4">
          <a
            href="#"
            className="inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3 sm:py-3.5 rounded-[10px] font-medium text-sm sm:text-base cursor-pointer transition-all duration-200 no-underline bg-[var(--accent)] text-white border-[1.5px] border-[var(--accent)] hover:bg-[var(--accent2)] hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(26,86,255,0.25)]"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round">
              <path d="M8 2l6 6-6 6M2 8h12" />
            </svg>
            Start free trial
          </a>
          <a
            href="#"
            className="inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3 sm:py-3.5 rounded-[10px] font-medium text-sm sm:text-base cursor-pointer transition-all duration-200 no-underline bg-transparent text-[var(--ink)] border-[1.5px] border-[rgba(10,15,30,0.15)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              <circle cx="8" cy="8" r="6" />
              <path d="M6 5.5l4 2.5-4 2.5z" fill="currentColor" />
            </svg>
            Watch demo
          </a>
        </div>

        <div className="[animation:fadeUp_0.8s_0.4s_ease_both] flex flex-col sm:flex-row items-center gap-3 sm:gap-4 justify-center flex-wrap px-4">
          <div className="flex">
            {['KR', 'PM', 'AS', 'VN', '+'].map((initial, i) => (
              <span
                key={i}
                className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border-[2.5px] border-[var(--paper)] bg-[var(--accent3)] flex items-center justify-center text-[0.65rem] sm:text-[0.7rem] font-bold text-[var(--accent)] -ml-1.5 sm:-ml-2 first:ml-0 font-['Syne']"
              >
                {initial}
              </span>
            ))}
          </div>
          <div className="text-center sm:text-left">
            <div className="text-[#fbbf24] text-xs sm:text-sm">★★★★★</div>
            <p className="text-[0.75rem] sm:text-[0.85rem] text-[var(--ink3)]">
              <strong className="text-[var(--ink)]">4.9/5</strong> from 1,200+ reviews
            </p>
          </div>
          <span className="hidden sm:inline text-[var(--paper3)]">|</span>
          <p className="text-[0.75rem] sm:text-[0.85rem] text-[var(--ink3)]">
            <strong className="text-[var(--ink)]">Zero setup</strong> — live in 10 min
          </p>
        </div>
      </div>

      {/* Dashboard Preview */}
      <div className="relative z-10 mt-8 sm:mt-12 max-w-[900px] w-full px-4 [animation:fadeUp_0.8s_0.5s_ease_both]">
        <div className="bg-white border border-[rgba(10,15,30,0.1)] rounded-xl sm:rounded-2xl overflow-hidden shadow-[0_16px_40px_rgba(10,15,30,0.08),0_0_0_1px_rgba(10,15,30,0.04)] sm:shadow-[0_32px_80px_rgba(10,15,30,0.12),0_0_0_1px_rgba(10,15,30,0.04)]">
          {/* Preview Bar */}
          <div className="bg-[var(--paper2)] border-b border-[var(--paper3)] px-3 sm:px-4 py-2 sm:py-2.5 flex items-center gap-1.5 sm:gap-2">
            <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-[#ff5f56]" />
            <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-[#ffbd2e] ml-1 sm:ml-1.5" />
            <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-[#27c93f] ml-1 sm:ml-1.5" />
            <span className="flex-1 text-center text-[0.65rem] sm:text-xs text-[var(--ink3)]">LabSync Dashboard</span>
          </div>

          {/* Preview Body */}
          <div className="p-3 sm:p-4 md:p-6 grid grid-cols-1 md:grid-cols-[180px_1fr] lg:grid-cols-[200px_1fr] gap-3 sm:gap-4 min-h-[250px] sm:min-h-[300px]">
            {/* Sidebar - Hidden on mobile */}
            <div className="hidden md:flex flex-col gap-2">
              <div className="text-[0.65rem] sm:text-[0.7rem] font-bold uppercase tracking-wider text-[var(--ink3)] px-2 sm:px-3 py-1 font-['Syne'] mb-1">Navigation</div>
              <div className="px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg text-[0.7rem] sm:text-xs font-medium flex items-center gap-2 text-[var(--accent)] bg-[var(--accent3)]">
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3 sm:w-3.5 sm:h-3.5 flex-shrink-0">
                  <rect x="1" y="1" width="6" height="6" rx="1" />
                  <rect x="9" y="1" width="6" height="6" rx="1" />
                  <rect x="1" y="9" width="6" height="6" rx="1" />
                  <rect x="9" y="9" width="6" height="6" rx="1" />
                </svg>
                Dashboard
              </div>
            </div>

            {/* Main Content */}
            <div className="flex flex-col gap-2 sm:gap-3">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <h4 className="text-[0.8rem] sm:text-[0.95rem] font-bold font-['Syne'] text-[var(--ink)]">CS Lab – Data Structures</h4>
                <div className="inline-flex items-center gap-1 px-2 py-0.5 sm:py-1 rounded-full text-[0.6rem] sm:text-[0.68rem] font-semibold bg-[rgba(0,200,150,0.1)] text-[#00a07a] whitespace-nowrap">
                  ● Live Session
                </div>
              </div>

              <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                <div className="bg-[var(--paper)] rounded-md sm:rounded-lg p-2 sm:p-3 border border-[var(--paper3)]">
                  <div className="text-[0.6rem] sm:text-[0.7rem] text-[var(--ink3)] mb-0.5 sm:mb-1">Submissions</div>
                  <div className="text-lg sm:text-[1.3rem] font-bold font-['Syne'] text-[var(--accent)]">{subCount}</div>
                </div>
                <div className="bg-[var(--paper)] rounded-md sm:rounded-lg p-2 sm:p-3 border border-[var(--paper3)]">
                  <div className="text-[0.6rem] sm:text-[0.7rem] text-[var(--ink3)] mb-0.5 sm:mb-1">Approved</div>
                  <div className="text-lg sm:text-[1.3rem] font-bold font-['Syne'] text-[var(--green)]">29</div>
                </div>
                <div className="bg-[var(--paper)] rounded-md sm:rounded-lg p-2 sm:p-3 border border-[var(--paper3)]">
                  <div className="text-[0.6rem] sm:text-[0.7rem] text-[var(--ink3)] mb-0.5 sm:mb-1">Pending</div>
                  <div className="text-lg sm:text-[1.3rem] font-bold font-['Syne'] text-[var(--amber)]">9</div>
                </div>
              </div>

              <div className="flex items-center gap-2 text-[0.7rem] sm:text-xs">
                <span className="text-[var(--ink3)] min-w-[60px] sm:min-w-[80px] text-[0.65rem] sm:text-xs">Completion</span>
                <div className="flex-1 h-1 bg-[var(--paper3)] rounded-sm overflow-hidden">
                  <div className="h-full bg-[var(--accent)] rounded-sm transition-all duration-1000 ease-out" style={{ width: `${progress}%` }} />
                </div>
                <span className="text-[0.65rem] sm:text-xs font-semibold text-[var(--ink)]">{progress}%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
