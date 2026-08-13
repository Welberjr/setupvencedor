export function BrandMark() {
  return <svg aria-label="Setup Vencedor" className="brand-mark" role="img" viewBox="0 0 64 64">
    <title>Setup Vencedor</title>
    <defs>
      <linearGradient id="sv-surface" x1="7" x2="56" y1="5" y2="61"><stop stopColor="#242a31" /><stop offset=".58" stopColor="#080b0f" /><stop offset="1" stopColor="#050608" /></linearGradient>
      <linearGradient id="sv-ribbon" x1="15" x2="52" y1="16" y2="48"><stop stopColor="#e2ff38" /><stop offset=".45" stopColor="#baff12" /><stop offset="1" stopColor="#57ca12" /></linearGradient>
      <linearGradient id="sv-edge" x1="22" x2="39" y1="12" y2="48"><stop stopColor="#f3ff9c" stopOpacity=".85" /><stop offset="1" stopColor="#69df10" stopOpacity="0" /></linearGradient>
    </defs>
    <rect fill="url(#sv-surface)" height="62" rx="18" width="62" x="1" y="1" />
    <rect fill="none" height="61" opacity=".42" rx="17.5" stroke="#b8ff45" width="61" x="1.5" y="1.5" />
    <g data-testid="brand-mark-ribbon" fill="none" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 20c3.1-5 10.9-6.2 17.1-4.2 5.1 1.6 7.4 5.2 6.2 8.9-1.2 3.6-4.9 4.5-10.2 5.5-5.8 1.1-9.7 2.1-10 6.4-.3 4.3 4.2 7.7 10.6 7.7 4.2 0 8.1-1.5 10.8-4.5" stroke="#345914" strokeWidth="11" transform="translate(0 2.2)" />
      <path d="M14 20c3.1-5 10.9-6.2 17.1-4.2 5.1 1.6 7.4 5.2 6.2 8.9-1.2 3.6-4.9 4.5-10.2 5.5-5.8 1.1-9.7 2.1-10 6.4-.3 4.3 4.2 7.7 10.6 7.7 4.2 0 8.1-1.5 10.8-4.5" stroke="url(#sv-ribbon)" strokeWidth="9" />
      <path d="M39 17 48 45 57 17" stroke="#2f6615" strokeWidth="11" transform="translate(0 2.2)" />
      <path d="M39 17 48 45 57 17" stroke="url(#sv-ribbon)" strokeWidth="9" />
      <path d="M17 20c3.2-3.2 9.1-4.1 13.2-2.5" opacity=".72" stroke="url(#sv-edge)" strokeWidth="2" />
    </g>
  </svg>
}
