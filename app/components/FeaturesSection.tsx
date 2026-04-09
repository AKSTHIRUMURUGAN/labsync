export default function FeaturesSection() {
  const features = [
    {
      icon: <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />,
      title: 'Digital Template System',
      desc: 'Coordinators define structured experiment templates. Students fill standardized forms — no blank pages, no random writing.',
    },
    {
      icon: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />,
      title: 'Live Session Control',
      desc: 'Faculty starts a session → students can submit. No pre/post faking. Timestamps logged for every entry.',
    },
    {
      icon: <path d="M15 10l-4 4L9 12M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />,
      title: 'Approval Workflow',
      desc: 'Submitted → Faculty Review → Approved or Rejected with inline comments. Full audit trail preserved forever.',
      featured: true,
    },
    {
      icon: <path d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />,
      title: 'Proof-Based Submission',
      desc: 'Students upload real photos of their experiment output. Stored securely on Cloudinary — verifiable evidence.',
    },
    {
      icon: <path d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />,
      title: 'Analytics Dashboard',
      desc: 'HOD and Principal get real-time views of submission rates, faculty performance, and department compliance.',
    },
    {
      icon: <path d="M17 17H17.01M3 10h18M3 6h18M3 14h18M3 18h10" />,
      title: 'One-Click PDF Export',
      desc: 'Generate beautifully formatted lab manuals as PDFs. Download, print, or archive to Cloudflare R2 permanently.',
    },
  ];

  return (
    <section className="py-12 sm:py-16 md:py-24 px-4 sm:px-6 md:px-8 bg-[var(--paper2)]" id="features">
      <div className="max-w-[1100px] mx-auto">
        <div className="text-center mb-4 reveal">
          <div className="inline-flex items-center gap-1.5 bg-[var(--accent3)] text-[var(--accent)] rounded-full px-3 sm:px-3.5 py-1.5 text-xs font-semibold mb-3 sm:mb-4 font-['Syne']">
            Features
          </div>
          <h2 className="text-[1.75rem] sm:text-[2.2rem] md:text-[2.5rem] lg:text-[3rem] font-extrabold text-[var(--ink)] leading-[1.15] max-w-[90%] sm:max-w-[500px] mx-auto mb-3 sm:mb-4 font-['Syne'] px-2">
            Everything your lab needs, nothing it doesn't
          </h2>
          <p className="text-sm sm:text-base md:text-[1.05rem] text-[var(--ink3)] font-light mx-auto leading-[1.7] px-2">
            Built for real academic workflows — not generic project management tools.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6 mt-8 sm:mt-12 md:mt-16">
          {features.map((feature, i) => (
            <div
              key={i}
              className={`bg-white border border-[var(--paper3)] rounded-xl sm:rounded-2xl p-6 sm:p-7 md:p-8 relative overflow-hidden transition-all duration-300 reveal reveal-delay-${(i % 3) + 1} ${
                feature.featured
                  ? 'bg-[var(--ink)] border-[var(--ink)]'
                  : 'hover:border-[rgba(26,86,255,0.25)] hover:-translate-y-1 hover:shadow-[0_16px_40px_rgba(10,15,30,0.08)]'
              }`}
            >
              {!feature.featured && (
                <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(26,86,255,0.04)_0%,transparent_60%)] opacity-0 transition-opacity duration-300 hover:opacity-100" />
              )}
              <div
                className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center mb-4 sm:mb-5 ${
                  feature.featured ? 'bg-[rgba(26,86,255,0.3)]' : 'bg-[var(--accent3)]'
                }`}
              >
                <svg viewBox="0 0 24 24" className={`w-5 h-5 sm:w-5.5 sm:h-5.5 fill-none stroke-[1.8] stroke-linecap-round stroke-linejoin-round ${feature.featured ? 'stroke-white' : 'stroke-[var(--accent)]'}`}>
                  {feature.icon}
                </svg>
              </div>
              <h3 className={`text-base sm:text-[1.05rem] font-bold mb-2 font-['Syne'] ${feature.featured ? 'text-white' : 'text-[var(--ink)]'}`}>
                {feature.title}
              </h3>
              <p className={`text-[0.8rem] sm:text-[0.88rem] leading-[1.6] ${feature.featured ? 'text-[rgba(255,255,255,0.6)]' : 'text-[var(--ink3)]'}`}>
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
