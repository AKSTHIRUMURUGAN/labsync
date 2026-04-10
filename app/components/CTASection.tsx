export default function CTASection() {
  const badges = ['No credit card required', 'Free onboarding call', 'Cancel anytime', 'NAAC compliance ready'];

  return (
    <section className="py-28 px-8 text-center relative overflow-hidden bg-[var(--ink)]">
      <div className="absolute w-[800px] h-[800px] rounded-full bg-[radial-gradient(circle,rgba(26,86,255,0.2)_0%,transparent_70%)] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      
      <div className="relative z-10 reveal">
        <div className="inline-flex items-center gap-1.5 bg-[rgba(26,86,255,0.3)] text-[#7da8ff] rounded-full px-3.5 py-1.5 text-xs font-semibold mb-4 mx-auto font-['Syne']">
          Get started today
        </div>
        <h2 className="text-[clamp(1.9rem,4vw,3rem)] font-extrabold text-white leading-[1.15] max-w-[600px] mx-auto mb-4 font-['Syne']">
          Ready to transform your lab program?
        </h2>
        <p className="text-[1.05rem] text-[rgba(255,255,255,0.5)] font-light max-w-[480px] mx-auto mt-3 mb-10 leading-[1.7]">
          Join 240+ institutions already running LabSync. Setup takes 10 minutes. Your first session starts today.
        </p>
        <div className="flex gap-3 justify-center flex-wrap">
          <a
            href="/register"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-[10px] font-medium text-base cursor-pointer transition-all duration-200 no-underline bg-[var(--accent)] text-white border-[1.5px] border-[var(--accent)] hover:bg-[var(--accent2)] hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(26,86,255,0.25)]"
          >
            Start free 30-day trial
          </a>
          <a
            href="/login"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-[10px] font-medium text-base cursor-pointer transition-all duration-200 no-underline bg-[rgba(255,255,255,0.08)] text-white border-[1.5px] border-[rgba(255,255,255,0.15)] hover:bg-[rgba(255,255,255,0.12)]"
          >
            Schedule a demo
          </a>
        </div>
        <div className="flex justify-center gap-4 flex-wrap mt-8">
          {badges.map((badge) => (
            <span key={badge} className="flex items-center gap-1.5 text-[rgba(255,255,255,0.5)] text-[0.82rem]">
              <span className="text-[var(--green)]">✓</span>
              {badge}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
