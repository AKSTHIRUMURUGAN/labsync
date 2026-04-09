export default function LogosSection() {
  const logos = ['NIT TRICHY', 'ANNA UNIVERSITY', 'VIT VELLORE', 'SRM INSTITUTE', 'PSG COIMBATORE', 'SASTRA'];

  return (
    <div className="py-10 px-8 text-center border-t border-b border-[var(--paper3)]">
      <p className="text-xs font-medium text-[var(--ink3)] uppercase tracking-widest mb-6">Trusted by leading institutions</p>
      <div className="flex justify-center items-center gap-12 flex-wrap">
        {logos.map((logo) => (
          <span key={logo} className="font-['Syne'] font-bold text-[0.95rem] text-[var(--paper3)] tracking-wider grayscale opacity-40">
            {logo}
          </span>
        ))}
      </div>
    </div>
  );
}
