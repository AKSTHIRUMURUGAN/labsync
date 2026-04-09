export default function RolesSection() {
  const roles = [
    { icon: '🎓', bg: 'rgba(26,86,255,0.2)', title: 'Student', desc: 'View experiments, submit observations, upload proof, track approval status.' },
    { icon: '👨‍🏫', bg: 'rgba(0,200,150,0.2)', title: 'Lab Faculty', desc: 'Create sessions, verify submissions, approve or reject with feedback comments.' },
    { icon: '🧑‍💼', bg: 'rgba(255,176,32,0.2)', title: 'Coordinator', desc: 'Design standard templates, define observation formats, ensure uniformity.' },
    { icon: '🏫', bg: 'rgba(255,75,85,0.15)', title: 'HOD', desc: 'Monitor lab activity, track submission rates, view faculty performance metrics.' },
    { icon: '🎓', bg: 'rgba(180,180,180,0.2)', title: 'Principal', desc: 'Full access. Department-wise reports, system usage, and academic compliance.' },
  ];

  return (
    <section className="bg-[var(--ink)] py-24 px-8 relative overflow-hidden" id="roles">
      <div className="absolute w-[600px] h-[600px] rounded-full bg-[radial-gradient(circle,rgba(26,86,255,0.15)_0%,transparent_70%)] -top-[200px] -right-[100px] pointer-events-none" />
      
      <div className="max-w-[1100px] mx-auto relative">
        <div className="text-center reveal">
          <div className="inline-flex items-center gap-1.5 bg-[rgba(26,86,255,0.2)] text-[#7da8ff] rounded-full px-3.5 py-1.5 text-xs font-semibold mb-4 font-['Syne']">
            Role-Based Access
          </div>
          <h2 className="text-[clamp(1.9rem,4vw,3rem)] font-extrabold text-white leading-[1.15] mb-4 font-['Syne']">
            Designed for every stakeholder
          </h2>
          <p className="text-[1.05rem] text-[rgba(255,255,255,0.5)] font-light max-w-[480px] mx-auto mt-3 leading-[1.7]">
            Five distinct roles. Each with the exact permissions they need — nothing more, nothing less.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mt-12">
          {roles.map((role, i) => (
            <div
              key={i}
              className={`bg-[rgba(255,255,255,0.05)] border border-[rgba(255,255,255,0.08)] rounded-xl px-5 py-6 text-center transition-all duration-300 cursor-default reveal reveal-delay-${i === 4 ? 1 : i + 1} hover:bg-[rgba(26,86,255,0.15)] hover:border-[rgba(26,86,255,0.4)] hover:-translate-y-1`}
            >
              <div className="w-[52px] h-[52px] rounded-[14px] mx-auto mb-4 flex items-center justify-center text-2xl" style={{ background: role.bg }}>
                {role.icon}
              </div>
              <h4 className="font-['Syne'] font-bold text-[0.9rem] text-white mb-2">{role.title}</h4>
              <p className="text-[0.78rem] text-[rgba(255,255,255,0.45)] leading-[1.5]">{role.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
