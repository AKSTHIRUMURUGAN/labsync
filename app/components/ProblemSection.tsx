export default function ProblemSection() {
  const problems = [
    { icon: '📋', bg: 'rgba(255,75,85,0.1)', title: 'Mass copying culture', desc: 'Students copy each other\'s results — nothing is original, nothing is learned.' },
    { icon: '🌳', bg: 'rgba(255,176,32,0.1)', title: 'Massive paper waste', desc: 'Thousands of lab manuals printed annually per college, most discarded after grading.' },
    { icon: '🔍', bg: 'rgba(26,86,255,0.1)', title: 'No faculty verification', desc: 'Faculty cannot confirm whether experiments were actually performed in real-time.' },
    { icon: '💸', bg: 'rgba(0,200,150,0.1)', title: 'Students pay ghostwriters', desc: 'Some students pay others ₹200–₹500 to fill manuals — pure academic fraud.' },
  ];

  return (
    <section className="py-12 sm:py-16 md:py-24 px-4 sm:px-6 md:px-8" id="problem">
      <div className="max-w-[1100px] mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16 items-center">
          <div className="reveal">
            <div className="inline-flex items-center gap-1.5 bg-[var(--accent3)] text-[var(--accent)] rounded-full px-3 sm:px-3.5 py-1.5 text-xs font-semibold mb-3 sm:mb-4 font-['Syne']">
              The Problem
            </div>
            <h2 className="text-[1.75rem] sm:text-[2.2rem] md:text-[2.5rem] lg:text-[3rem] font-extrabold text-[var(--ink)] leading-[1.15] mb-3 sm:mb-4 font-['Syne']">
              Traditional lab records are broken.
            </h2>
            <p className="text-sm sm:text-base md:text-[1.05rem] text-[var(--ink3)] font-light max-w-[560px] leading-[1.7]">
              Engineering colleges across India lose thousands of hours to manual lab records — with zero accountability and massive paper waste.
            </p>
            <div className="mt-6 sm:mt-8 flex gap-4 sm:gap-6 flex-wrap">
              <div>
                <div className="font-['Syne'] font-extrabold text-[1.5rem] sm:text-[2rem] text-[var(--red)]">72%</div>
                <div className="text-[0.75rem] sm:text-[0.83rem] text-[var(--ink3)]">of students copy records</div>
              </div>
              <div>
                <div className="font-['Syne'] font-extrabold text-[1.5rem] sm:text-[2rem] text-[var(--amber)]">₹840</div>
                <div className="text-[0.75rem] sm:text-[0.83rem] text-[var(--ink3)]">avg cost per year</div>
              </div>
              <div>
                <div className="font-['Syne'] font-extrabold text-[1.5rem] sm:text-[2rem] text-[var(--accent)]">0%</div>
                <div className="text-[0.75rem] sm:text-[0.83rem] text-[var(--ink3)]">digital verification</div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:gap-3 reveal reveal-delay-2">
            {problems.map((problem, i) => (
              <div
                key={i}
                className="flex items-start gap-3 sm:gap-4 bg-white border border-[var(--paper3)] rounded-lg sm:rounded-xl px-4 sm:px-6 py-4 sm:py-5 transition-all duration-250 hover:border-[var(--accent)] hover:translate-x-1"
              >
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-[10px] flex items-center justify-center flex-shrink-0 text-base sm:text-lg" style={{ background: problem.bg }}>
                  {problem.icon}
                </div>
                <div>
                  <h4 className="text-[0.85rem] sm:text-[0.95rem] font-bold font-['Syne'] text-[var(--ink)] mb-1">{problem.title}</h4>
                  <p className="text-[0.75rem] sm:text-[0.85rem] text-[var(--ink3)] leading-[1.5]">{problem.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
