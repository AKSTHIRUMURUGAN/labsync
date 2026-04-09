import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-[var(--ink2)] px-8 py-16 text-[rgba(255,255,255,0.5)]">
      <div className="max-w-[1100px] mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_1fr] gap-12 pb-12 border-b border-[rgba(255,255,255,0.08)]">
          <div>
            <Link href="#" className="flex items-center gap-2.5 font-['Syne'] font-extrabold text-xl text-white no-underline mb-4 inline-flex">
              <div className="w-[34px] h-[34px] bg-[var(--accent)] rounded-lg flex items-center justify-center">
                <svg viewBox="0 0 20 20" className="w-[18px] h-[18px] fill-white">
                  <path d="M3 4h14v2H3zM3 9h10v2H3zM3 14h12v2H3z" />
                </svg>
              </div>
              LabSync
            </Link>
            <p className="text-[0.85rem] leading-[1.7] max-w-[260px]">
              The trusted digital lab manual platform for engineering and science colleges across India.
            </p>
          </div>

          <div>
            <h5 className="font-['Syne'] font-bold text-[0.85rem] text-white mb-4 uppercase tracking-wider">Product</h5>
            <ul className="list-none flex flex-col gap-2.5">
              {['Features', 'Pricing', 'Changelog', 'Roadmap', 'API Docs'].map((item) => (
                <li key={item}>
                  <Link href="#" className="text-[0.85rem] text-[rgba(255,255,255,0.45)] no-underline transition-colors duration-200 hover:text-white">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h5 className="font-['Syne'] font-bold text-[0.85rem] text-white mb-4 uppercase tracking-wider">Company</h5>
            <ul className="list-none flex flex-col gap-2.5">
              {['About', 'Blog', 'Careers', 'Press', 'Contact'].map((item) => (
                <li key={item}>
                  <Link href="#" className="text-[0.85rem] text-[rgba(255,255,255,0.45)] no-underline transition-colors duration-200 hover:text-white">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h5 className="font-['Syne'] font-bold text-[0.85rem] text-white mb-4 uppercase tracking-wider">Legal</h5>
            <ul className="list-none flex flex-col gap-2.5">
              {['Privacy Policy', 'Terms of Service', 'Security', 'NAAC Compliance'].map((item) => (
                <li key={item}>
                  <Link href="#" className="text-[0.85rem] text-[rgba(255,255,255,0.45)] no-underline transition-colors duration-200 hover:text-white">
                    {item}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="pt-6 flex justify-between items-center flex-wrap gap-4">
          <p className="text-xs">© 2025 LabSync Technologies Pvt. Ltd. Made with ♥ in India.</p>
          <p className="text-[0.78rem]">Built on Next.js · MongoDB · Cloudflare R2 · Cloudinary</p>
        </div>
      </div>
    </footer>
  );
}
