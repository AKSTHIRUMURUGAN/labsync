export default function HowItWorksSection() {
  const steps = [
    { num: '1', title: 'Coordinator builds template', desc: 'Define observation fields, required inputs, and experiment structure once.' },
    { num: '2', title: 'Faculty creates lab group', desc: 'Add students, assign experiments, configure your class for the semester.' },
    { num: '3', title: 'Students submit live', desc: 'Fill observations, upload proof photos, and submit during active sessions only.' },
    { num: '4', title: 'Faculty verifies & approves', desc: 'Review, approve or reject with comments. Records stored permanently.' },
  ];

  return (
    <section className="py-24 px-8" id="how-it-works">
      <div className="max-w-[1100px] mx-auto text-center">
        <div className="reveal">
          <div className="inline-flex items-center gap-1.5 bg-[var(--accent3)] text-[var(--accent)] rounded-full px-3.5 py-1.5 text-xs font-semibold mb-4 font-['Syne']">
            How it works
          </div>
          <h2 className="text-[clamp(1.9rem,4vw,3rem)] font-extrabold text-[var(--ink)] leading-[1.15] mb-4 font-['Syne']">
            Live in 4 simple steps
          </h2>
          <p className="text-[1.05rem] text-[var(--ink3)] font-light mx-auto mt-3 leading-[1.7]">
            From setup to first verified submission in under 10 minutes.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-0 mt-16 relative">
          <div className="absolute top-7 left-[12%] right-[12%] h-px bg-[linear-gradient(90deg,transparent,var(--paper3),transparent)] hidden md:block" />
          
          {steps.map((step, i) => (
            <div key={i} className={`text-center px-4 relative reveal reveal-delay-${i + 1}`}>
              <div className="w-14 h-14 rounded-full border-[1.5px] border-[var(--paper3)] bg-white flex items-center justify-center mx-auto mb-5 font-['Syne'] font-extrabold text-lg text-[var(--accent)] relative z-10 transition-all duration-300 hover:bg-[var(--accent)] hover:text-white hover:border-[var(--accent)] hover:scale-110">
                {step.num}
              </div>
              <h4 className="font-['Syne'] font-bold text-[0.95rem] text-[var(--ink)] mb-2">{step.title}</h4>
              <p className="text-[0.83rem] text-[var(--ink3)] leading-[1.5]">{step.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
