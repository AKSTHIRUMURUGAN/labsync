export default function PricingSection() {
  const plans = [
    {
      name: 'Starter',
      price: '₹4,999',
      period: '/mo',
      desc: 'For small departments just getting started.',
      features: [
        'Up to 200 students',
        '3 faculty accounts',
        '5 experiment templates',
        'PDF export',
        'Email support',
        { text: 'Analytics dashboard', disabled: true },
        { text: 'API access', disabled: true },
      ],
    },
    {
      name: 'Professional',
      price: '₹12,999',
      period: '/mo',
      desc: 'For full departments with multiple labs.',
      popular: true,
      features: [
        'Up to 1,000 students',
        'Unlimited faculty',
        'Unlimited templates',
        'PDF export + print',
        'Analytics dashboard',
        'Priority support',
        { text: 'API access', disabled: true },
      ],
    },
    {
      name: 'Institution',
      price: 'Custom',
      period: '',
      desc: 'For entire colleges with all departments.',
      features: [
        'Unlimited students',
        'Unlimited everything',
        'HOD + Principal dashboards',
        'API access',
        'AI plagiarism detection',
        'Dedicated onboarding',
        'SLA & compliance reports',
      ],
    },
  ];

  return (
    <section className="py-24 px-8 bg-[var(--paper2)]" id="pricing">
      <div className="max-w-[1100px] mx-auto text-center">
        <div className="reveal">
          <div className="inline-flex items-center gap-1.5 bg-[var(--accent3)] text-[var(--accent)] rounded-full px-3.5 py-1.5 text-xs font-semibold mb-4 font-['Syne']">
            Pricing
          </div>
          <h2 className="text-[clamp(1.9rem,4vw,3rem)] font-extrabold text-[var(--ink)] leading-[1.15] mb-4 font-['Syne']">
            Simple, institution-friendly pricing
          </h2>
          <p className="text-[1.05rem] text-[var(--ink3)] font-light mx-auto mt-3 leading-[1.7]">
            Annual billing. No setup fees. Cancel anytime.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          {plans.map((plan, i) => (
            <div
              key={i}
              className={`bg-white border-[1.5px] border-[var(--paper3)] rounded-2xl p-8 relative transition-all duration-300 reveal reveal-delay-${i + 1} ${
                plan.popular ? 'border-[var(--accent)] scale-[1.03]' : ''
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[var(--accent)] text-white text-[0.72rem] font-bold px-3.5 py-1.5 rounded-full font-['Syne'] whitespace-nowrap">
                  Most Popular
                </div>
              )}
              <div className="font-['Syne'] font-extrabold text-base text-[var(--ink3)] mb-2 uppercase tracking-wider">{plan.name}</div>
              <div className="font-['Syne'] font-extrabold text-[2.5rem] text-[var(--ink)] leading-none mb-1">
                {plan.price}
                <span className="text-base font-normal text-[var(--ink3)]">{plan.period}</span>
              </div>
              <p className="text-[0.83rem] text-[var(--ink3)] mb-6 pb-6 border-b border-[var(--paper3)]">{plan.desc}</p>
              <ul className="list-none flex flex-col gap-3 mb-8">
                {plan.features.map((feature, j) => {
                  const isDisabled = typeof feature === 'object' && feature.disabled;
                  const text = typeof feature === 'string' ? feature : feature.text;
                  return (
                    <li key={j} className="flex items-start gap-2.5 text-[0.85rem] text-[var(--ink3)]">
                      <span className={`flex-shrink-0 mt-0.5 font-bold ${isDisabled ? 'text-[var(--paper3)]' : 'text-[var(--green)]'}`}>
                        {isDisabled ? '✕' : '✓'}
                      </span>
                      {text}
                    </li>
                  );
                })}
              </ul>
              <a
                href="#"
                className={`w-full flex items-center justify-center px-5 py-3 rounded-lg font-medium text-sm cursor-pointer transition-all duration-200 no-underline ${
                  plan.popular
                    ? 'bg-[var(--accent)] text-white border-[1.5px] border-[var(--accent)] hover:bg-[var(--accent2)] hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(26,86,255,0.25)]'
                    : 'bg-transparent text-[var(--ink)] border-[1.5px] border-[rgba(10,15,30,0.15)] hover:border-[var(--accent)] hover:text-[var(--accent)]'
                }`}
              >
                {i === 2 ? 'Contact sales' : 'Get started'}
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
