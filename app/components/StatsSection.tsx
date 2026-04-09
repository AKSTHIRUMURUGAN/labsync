export default function StatsSection() {
  const stats = [
    { value: '240+', label: 'Colleges onboarded' },
    { value: '1.2M+', label: 'Lab submissions processed' },
    { value: '98.4%', label: 'Faculty satisfaction rate' },
    { value: '₹0', label: 'Paper cost after LabSync' },
  ];

  return (
    <section className="py-20 px-8 bg-[var(--accent)] text-center">
      <div className="max-w-[1100px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {stats.map((stat, i) => (
            <div key={i} className={`reveal ${i > 0 ? `reveal-delay-${i}` : ''}`}>
              <div className="font-['Syne'] font-extrabold text-5xl text-white leading-none">{stat.value}</div>
              <div className="text-sm text-[rgba(255,255,255,0.7)] mt-2">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
