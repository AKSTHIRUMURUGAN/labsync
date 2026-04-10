'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 60);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-[100] flex items-center justify-between px-4 sm:px-6 md:px-10 py-3 md:py-4 bg-[rgba(247,246,242,0.85)] backdrop-blur-[12px] border-b border-[rgba(10,15,30,0.06)] transition-all duration-300 ${
        scrolled ? 'shadow-[0_4px_20px_rgba(10,15,30,0.06)]' : ''
      }`}
    >
      <Link href="#" className="flex items-center gap-2 sm:gap-2.5 font-['Syne'] font-extrabold text-lg sm:text-xl text-[var(--ink)] no-underline">
        <div className="w-[30px] h-[30px] sm:w-[34px] sm:h-[34px] bg-[var(--accent)] rounded-lg flex items-center justify-center">
          <svg viewBox="0 0 20 20" className="w-[16px] h-[16px] sm:w-[18px] sm:h-[18px] fill-white">
            <path d="M3 4h14v2H3zM3 9h10v2H3zM3 14h12v2H3z" />
          </svg>
        </div>
        LabSync
      </Link>

      <ul className="hidden lg:flex gap-6 xl:gap-8 list-none">
        <li>
          <Link href="#features" className="text-sm font-medium text-[var(--ink3)] no-underline transition-colors duration-200 hover:text-[var(--ink)]">
            Features
          </Link>
        </li>
        <li>
          <Link href="#how-it-works" className="text-sm font-medium text-[var(--ink3)] no-underline transition-colors duration-200 hover:text-[var(--ink)]">
            How it works
          </Link>
        </li>
        <li>
          <Link href="#pricing" className="text-sm font-medium text-[var(--ink3)] no-underline transition-colors duration-200 hover:text-[var(--ink)]">
            Pricing
          </Link>
        </li>
        <li>
          <Link href="#testimonials" className="text-sm font-medium text-[var(--ink3)] no-underline transition-colors duration-200 hover:text-[var(--ink)]">
            Reviews
          </Link>
        </li>
      </ul>

      <div className="flex gap-2 items-center">
        <Link
          href="/login"
          className="hidden sm:inline-flex items-center gap-2 px-3 sm:px-4 md:px-5 py-2 md:py-2.5 rounded-lg font-['DM_Sans'] font-medium text-xs sm:text-sm cursor-pointer transition-all duration-200 no-underline bg-transparent text-[var(--ink)] border-[1.5px] border-[rgba(10,15,30,0.15)] hover:border-[var(--accent)] hover:text-[var(--accent)]"
        >
          Sign in
        </Link>
        <Link
          href="/register"
          className="inline-flex items-center gap-2 px-3 sm:px-4 md:px-5 py-2 md:py-2.5 rounded-lg font-['DM_Sans'] font-medium text-xs sm:text-sm cursor-pointer transition-all duration-200 no-underline bg-[var(--accent)] text-white border-[1.5px] border-[var(--accent)] hover:bg-[var(--accent2)] hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(26,86,255,0.25)]"
        >
          Get started
        </Link>
      </div>
    </nav>
  );
}
