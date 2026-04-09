export default function TestimonialsSection() {
  const testimonials = [
    {
      avatar: 'DR',
      bg: '#e8f0ff',
      color: 'var(--accent)',
      name: 'Dr. Rajendran S.',
      role: 'HOD, CSE — NIT Trichy',
      text: '"Submission compliance went from 61% to 97% in one semester. The session control feature alone justifies the entire investment."',
    },
    {
      avatar: 'PM',
      bg: 'rgba(0,200,150,0.1)',
      color: 'var(--green)',
      name: 'Prof. Meena K.',
      role: 'Lab Faculty — SRM Institute',
      text: '"I used to spend 3 hours verifying paper records after each lab. Now it\'s 20 minutes on my phone. Students actually do the work now."',
    },
    {
      avatar: 'VN',
      bg: 'rgba(255,176,32,0.12)',
      color: 'var(--amber)',
      name: 'Vikram N. (Student)',
      role: '3rd Year ECE — VIT Vellore',
      text: '"Honestly, filling the digital form during the actual experiment made me understand the concepts way better. No more blind copying."',
    },
  ];

  return (
    <section className="bg-[var(--paper2)] py-24 px-8" id="testimonials">
      <div className="max-w-[1100px] mx-auto">
        <div className="text-center reveal">
          <div className="inline-flex items-center gap-1.5 bg-[var(--accent3)] text-[var(--accent)] rounded-full px-3.5 py-1.5 text-xs font-semibold mb-4 font-['Syne']">
            Testimonials
          </div>
          <h2 className="text-[clamp(1.9rem,4vw,3rem)] font-extrabold text-[var(--ink)] leading-[1.15] font-['Syne']">
            What faculty actually say
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
          {testimonials.map((testimonial, i) => (
            <div key={i} className={`bg-white border border-[var(--paper3)] rounded-2xl p-7 reveal reveal-delay-${i + 1}`}>
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-11 h-11 rounded-full flex items-center justify-center font-['Syne'] font-extrabold text-[0.9rem]"
                  style={{ background: testimonial.bg, color: testimonial.color }}
                >
                  {testimonial.avatar}
                </div>
                <div>
                  <h5 className="font-['Syne'] font-bold text-[0.9rem] text-[var(--ink)]">{testimonial.name}</h5>
                  <p className="text-[0.78rem] text-[var(--ink3)]">{testimonial.role}</p>
                </div>
              </div>
              <div className="text-[#fbbf24] text-sm mb-3">★★★★★</div>
              <p className="text-[0.88rem] text-[var(--ink3)] leading-[1.7] italic">{testimonial.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
