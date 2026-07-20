/**
 * LandingPage — ClassifAi enterprise marketing page (dark obsidian theme)
 *
 * Design matches the provided HTML spec:
 *   - Palette: obsidian #0B0F19 background, slate surfaces, white text
 *   - Fonts: Hanken Grotesk (body/headings) + JetBrains Mono (technical)
 *   - Icons: Material Symbols Outlined (loaded via index.html <link>)
 *   - ADR-0006 hybrid radius: structural containers → 0px, interactive → rounded-md
 *
 * Fonts and Material Symbols are declared in index.html so they are available here.
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

/* ── Small helpers ──────────────────────────────────────────────────────────── */
function Icon({ name, className = '' }) {
  return (
    <span className={`material-symbols-outlined ${className}`}>{name}</span>
  );
}

/* ════════════════════════════════════════════════════════════════════════════ */
export default function LandingPage() {
  const navigate = useNavigate();
  const [email, setEmail]         = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [scrolled, setScrolled]   = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleDemoSubmit = (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setSubmitted(true);
  };

  return (
    <div
      className="font-body-md text-on-surface overflow-x-hidden"
      style={{ background: '#0B0F19', minHeight: '100vh' }}
    >

      {/* ═══════════════════════════════════════════════════════════════════════
          HEADER
      ═══════════════════════════════════════════════════════════════════════ */}
      <header
        className={`
          h-shell-header-height fixed top-0 left-0 right-0 z-50
          backdrop-blur-md razor-border-b flex items-center px-gutter
          transition-all duration-200
          ${scrolled ? 'bg-background/95 shadow-2xl' : 'bg-background/80'}
        `}
      >
        <div className="flex items-center justify-between w-full max-w-7xl mx-auto">

          {/* Brand */}
          <div className="flex items-center space-x-8">
            <span
              className="font-technical-md text-headline-sm tracking-tighter text-white cursor-pointer"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              ClassifAi
            </span>
            <nav className="hidden md:flex space-x-6">
              {[
                { label: 'Features',       href: '#features' },
                { label: 'Security Matrix',href: '#security' },
                { label: 'SLA Engine',     href: '#sla'      },
                { label: 'Pricing',        href: '#pricing'  },
              ].map(({ label, href }) => (
                <a
                  key={label}
                  href={href}
                  className="font-label-caps text-on-secondary-container hover:text-white transition-colors"
                  style={{ fontSize: 13, textDecoration: 'none' }}
                >
                  {label}
                </a>
              ))}
            </nav>
          </div>

          {/* CTA */}
          <button
            onClick={() => navigate('/login')}
            className="bg-primary text-on-primary font-title-md px-4 py-1.5 rounded-md hover:opacity-90 transition-all flex items-center gap-2"
            style={{ fontSize: 13, fontWeight: 700 }}
          >
            Launch App
            <Icon name="arrow_right_alt" className="!text-[18px]" />
          </button>

        </div>
      </header>

      <main className="pt-shell-header-height">

        {/* ═════════════════════════════════════════════════════════════════════
            HERO
        ═════════════════════════════════════════════════════════════════════ */}
        <section className="relative min-h-[716px] flex flex-col items-center justify-center text-center px-gutter py-24 razor-border-b overflow-hidden">

          {/* Ambient glow blobs */}
          <div className="absolute inset-0 z-0 pointer-events-none opacity-20">
            <div
              className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full"
              style={{ background: 'rgba(190,198,224,0.2)', filter: 'blur(120px)' }}
            />
            <div
              className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full"
              style={{ background: 'rgba(152,128,93,0.10)', filter: 'blur(120px)' }}
            />
          </div>

          <div className="relative z-10 max-w-4xl mx-auto">

            {/* Eyebrow */}
            <div className="inline-flex items-center space-x-2 px-3 py-1 bg-surface-container-high razor-border mb-8">
              <span className="font-technical-md text-[10px] text-on-primary-container tracking-widest uppercase">
                Integration Active
              </span>
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              <span className="font-technical-md text-[10px] text-white">IBM watsonx.ai</span>
            </div>

            {/* H1 */}
            <h1
              className="font-display-sm leading-[1.1] mb-6 tracking-tight font-bold"
              style={{ fontSize: 'clamp(36px, 6vw, 64px)' }}
            >
              Automate Enterprise Support <br />
              with <span className="text-on-primary-container">Zero Triage Delay</span>.
            </h1>

            {/* Subtitle */}
            <p className="font-body-md text-on-surface-variant max-w-2xl mx-auto mb-10 leading-relaxed">
              Powered by high-density multi-tenant architecture and departmental isolation.
              Deploy autonomous routing hubs that manage enterprise-scale tickets with
              cryptographic security and real-time watsonx.ai inference.
            </p>

            {/* Email form / success state */}
            {submitted ? (
              <div
                className="inline-flex items-center gap-3 px-5 py-3 razor-border"
                style={{
                  background: 'rgba(16,185,129,0.08)',
                  border: '1px solid rgba(16,185,129,0.35)',
                  borderRadius: 6,
                  color: '#34d399', fontSize: 14, fontWeight: 600,
                }}
              >
                <Icon name="check_circle" className="!text-[18px]" />
                Demo request received — we'll be in touch.
              </div>
            ) : (
              <form
                onSubmit={handleDemoSubmit}
                className="flex flex-col sm:flex-row items-center justify-center gap-0 w-full max-w-md mx-auto"
              >
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                  placeholder="corporate@enterprise.com"
                  className="w-full h-12 bg-surface-container-low razor-border border-r-0 focus:outline-none focus:ring-1 focus:ring-outline text-white px-4 placeholder:text-outline-variant font-technical-md"
                />
                <button
                  type="submit"
                  className="w-full sm:w-auto whitespace-nowrap h-12 px-8 bg-white text-black font-title-md rounded-md sm:ml-[-2px] transition-transform active:scale-95 z-10 hover:opacity-90"
                  style={{ fontWeight: 700, fontSize: 13 }}
                >
                  Request Demo Access
                </button>
              </form>
            )}

            {/* Social proof strip */}
            <div className="mt-12 flex items-center justify-center space-x-12 opacity-50 grayscale contrast-125">
              <span className="font-technical-md text-[10px]">TCK-ID: 8842-X</span>
              <span className="font-technical-md text-[10px]">AUTH: MT-ISOLATE</span>
              <span className="font-technical-md text-[10px]">NODE: US-EAST-1</span>
            </div>
          </div>
        </section>

        {/* ═════════════════════════════════════════════════════════════════════
            FEATURE MATRIX
        ═════════════════════════════════════════════════════════════════════ */}
        <section id="features" className="grid grid-cols-1 md:grid-cols-3 razor-border-b">

          {/* Column 1 — AI Routing Hub */}
          <div className="p-12 razor-border-r flex flex-col hover:bg-surface-container-low transition-colors group">
            <div className="mb-8">
              <Icon name="hub" className="text-on-primary-container !text-[32px] mb-4 block" />
              <h3 className="font-headline-sm text-headline-sm mb-4">AI Routing Hub</h3>
              <p className="font-body-sm text-on-surface-variant leading-relaxed mb-6">
                An autonomous Triage Engine utilizing a 60% confidence gate sorting protocol.
                Redirect workloads instantly based on semantic intent and agent capability matrices.
              </p>
            </div>
            <div className="mt-auto">
              <div className="flex items-center space-x-2 mb-2">
                <div className="h-1 flex-1 bg-surface-variant">
                  <div className="h-full bg-on-primary-container" style={{ width: '60%' }} />
                </div>
                <span className="font-technical-md text-[10px] text-on-primary-container">60% CONFIDENCE</span>
              </div>
              <a href="#pricing" className="font-technical-md text-white group-hover:underline cursor-pointer" style={{ textDecoration: 'none', fontSize: 12 }}>
                View Schema ➔
              </a>
            </div>
          </div>

          {/* Column 2 — Data Security */}
          <div id="security" className="p-12 razor-border-r flex flex-col hover:bg-surface-container-low transition-colors group">
            <div className="mb-8">
              <Icon name="shield_lock" className="text-on-primary-container !text-[32px] mb-4 block" />
              <h3 className="font-headline-sm text-headline-sm mb-4">Data Security</h3>
              <p className="font-body-sm text-on-surface-variant leading-relaxed mb-6">
                Hardened Departmental Isolation walls prevent cross-tenant data leakage.
                Every object storage attachment is encrypted at the tenant-root level with
                zero-trust handshake.
              </p>
            </div>
            <div className="mt-auto">
              <div className="flex space-x-2">
                {['lock', 'key', 'verified_user'].map(icon => (
                  <div key={icon} className="w-8 h-8 razor-border flex items-center justify-center bg-surface-container-highest">
                    <Icon name={icon} className="!text-[16px]" />
                  </div>
                ))}
              </div>
              <span className="block mt-4 font-technical-md text-[10px] text-white">AES-256 COMPLIANT</span>
            </div>
          </div>

          {/* Column 3 — SLA Target Radar */}
          <div id="sla" className="p-12 flex flex-col hover:bg-surface-container-low transition-colors group">
            <div className="mb-8">
              <Icon name="radar" className="text-on-primary-container !text-[32px] mb-4 block" />
              <h3 className="font-headline-sm text-headline-sm mb-4">SLA Target Radar</h3>
              <p className="font-body-sm text-on-surface-variant leading-relaxed mb-6">
                Dynamic Deadline Management with smart countdown bars. System automatically
                pauses timers during pending-customer states to ensure accurate performance metrics.
              </p>
            </div>
            <div className="mt-auto space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-technical-md text-[10px]">TICKET #829</span>
                <span className="text-error font-technical-md text-[10px]">04:12:00</span>
              </div>
              <div className="h-1 bg-surface-variant overflow-hidden">
                <div className="h-full bg-error" style={{ width: '85%' }} />
              </div>
              <a href="#" className="font-technical-md text-[10px] text-white group-hover:underline cursor-pointer" style={{ textDecoration: 'none', display: 'block' }}>
                Open Dashboard ➔
              </a>
            </div>
          </div>

        </section>

        {/* ═════════════════════════════════════════════════════════════════════
            PRODUCT PREVIEW (Bento-style)
        ═════════════════════════════════════════════════════════════════════ */}
        <section className="py-24 px-gutter razor-border-b" style={{ background: 'rgba(2,6,23,0.30)' }}>
          <div className="max-w-7xl mx-auto">

            {/* Section header row */}
            <div className="flex flex-col md:flex-row items-end justify-between mb-16">
              <div className="max-w-xl">
                <h2 className="font-display-sm text-[32px] mb-4">The Command Center</h2>
                <p className="text-on-surface-variant font-body-sm">
                  High-density interfaces designed for expert support engineers.
                  Minimal friction, maximal data visibility.
                </p>
              </div>
              <div className="flex space-x-4 mt-8 md:mt-0">
                <button
                  className="h-10 px-6 razor-border bg-surface-container hover:bg-surface-container-high transition-all font-title-md rounded-md"
                  style={{ fontSize: 13, fontWeight: 600 }}
                >
                  Docs
                </button>
                <button
                  onClick={() => navigate('/login')}
                  className="h-10 px-6 bg-white text-black font-title-md rounded-md hover:opacity-90 transition-all"
                  style={{ fontSize: 13, fontWeight: 700 }}
                >
                  View Live Demo
                </button>
              </div>
            </div>

            {/* Bento grid */}
            <div className="grid grid-cols-12 gap-4" style={{ height: 600 }}>

              {/* Main workspace tile */}
              <div className="col-span-12 md:col-span-8 razor-border bg-surface relative overflow-hidden group">
                <div
                  className="w-full h-full"
                  style={{
                    background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 40%, #0b1c30 100%)',
                    display: 'flex', flexDirection: 'column',
                    padding: 24, gap: 12,
                  }}
                >
                  {/* Simulated ticket rows */}
                  {[
                    { id: 'TCK-8842', dept: 'IT',      status: 'IN_PROGRESS', priority: 'HIGH',     ai: '94%' },
                    { id: 'TCK-8841', dept: 'HR',      status: 'PENDING',     priority: 'MEDIUM',   ai: '87%' },
                    { id: 'TCK-8839', dept: 'Finance', status: 'OPEN',        priority: 'CRITICAL', ai: '71%' },
                    { id: 'TCK-8837', dept: 'IT',      status: 'RESOLVED',    priority: 'LOW',      ai: '96%' },
                  ].map(row => (
                    <div
                      key={row.id}
                      className="flex items-center gap-4 razor-border px-4 py-3 bg-surface-container"
                      style={{ fontSize: 12 }}
                    >
                      <span className="font-technical-md text-on-primary-container w-24 flex-shrink-0">{row.id}</span>
                      <span
                        className="font-technical-md px-2 py-0.5 rounded-md flex-shrink-0"
                        style={{
                          fontSize: 10, fontWeight: 700,
                          background: row.priority === 'CRITICAL' ? 'rgba(186,26,26,0.18)' : 'rgba(59,130,246,0.12)',
                          color:      row.priority === 'CRITICAL' ? '#fca5a5' : '#93c5fd',
                        }}
                      >
                        {row.priority}
                      </span>
                      <span className="text-on-secondary-container flex-1">{row.dept}</span>
                      <span className="font-technical-md text-[10px] text-on-primary-container">{row.status}</span>
                      <span className="font-technical-md text-[10px] text-emerald-400 ml-auto">{row.ai} AI</span>
                    </div>
                  ))}
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-surface to-transparent pointer-events-none" />
                <div className="absolute bottom-8 left-8">
                  <span className="font-technical-md text-[10px] text-on-primary-container uppercase tracking-widest">Core Workspace</span>
                  <h4 className="font-headline-sm mt-2">Unified Message Streams</h4>
                </div>
              </div>

              {/* Side tiles */}
              <div className="col-span-12 md:col-span-4 grid grid-rows-2 gap-4">
                <div className="razor-border bg-surface-container p-8 flex flex-col justify-center">
                  <Icon name="analytics" className="text-on-primary-container mb-4 block" />
                  <h4 className="font-title-md mb-2" style={{ fontWeight: 600 }}>Real-time Inference</h4>
                  <p className="font-body-sm text-on-surface-variant">
                    Watch watsonx.ai classify intent in <span className="text-white font-technical-md">200ms</span>.
                  </p>
                </div>
                <div className="razor-border bg-surface-container p-8 flex flex-col justify-center">
                  <Icon name="inventory_2" className="text-on-primary-container mb-4 block" />
                  <h4 className="font-title-md mb-2" style={{ fontWeight: 600 }}>Object Storage</h4>
                  <p className="font-body-sm text-on-surface-variant">
                    Unlimited attachments with per-file security scanning.
                  </p>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ═════════════════════════════════════════════════════════════════════
            PRICING
        ═════════════════════════════════════════════════════════════════════ */}
        <section id="pricing" className="py-24 px-gutter">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="font-display-sm mb-4" style={{ fontSize: 'clamp(28px, 4vw, 40px)' }}>
              Transparent Enterprise Pricing
            </h2>
            <p className="text-on-surface-variant font-body-md">One tier. Total isolation. Infinite scale.</p>
          </div>

          <div className="max-w-xl mx-auto razor-border bg-surface-container overflow-hidden relative">
            {/* Preferred badge */}
            <div className="absolute top-0 right-0 p-4">
              <span className="px-3 py-1 bg-on-primary-container/20 text-white font-technical-md text-[10px] tracking-widest razor-border">
                PREFERRED
              </span>
            </div>

            {/* Price header */}
            <div className="p-12 text-center razor-border-b">
              <h3 className="font-headline-sm text-headline-sm mb-2 text-on-primary-container">Enterprise Plan</h3>
              <div className="flex items-baseline justify-center space-x-2">
                <span className="font-display-sm font-bold" style={{ fontSize: 56 }}>$19</span>
                <span className="text-on-surface-variant font-body-md">/ agent / month</span>
              </div>
            </div>

            {/* Feature list + CTA */}
            <div className="p-12 bg-surface-container-low">
              <ul className="space-y-6 mb-12">
                {[
                  'Infinite Multi-Tenant Isolation',
                  'Unified Message Streams (Omnichannel)',
                  'Full Object Storage Attachment Integration',
                  'Custom SLA Sliders Control Board',
                  'IBM watsonx.ai Classification Engine',
                  'Real-Time WebSocket Comment Feed',
                  'Round-Robin Fair-Share Assignment',
                  'Priority Escalation Automation',
                ].map(feature => (
                  <li key={feature} className="flex items-start space-x-3 text-on-surface-variant font-body-md">
                    <Icon name="check_circle" className="text-white !text-[20px] flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              <button
                onClick={() => navigate('/login')}
                className="w-full py-4 bg-white text-black font-title-md rounded-md hover:scale-[1.01] transition-transform active:scale-95"
                style={{ fontWeight: 700, fontSize: 14 }}
              >
                Deploy ClassifAi Now
              </button>

              <p className="mt-6 text-center font-technical-md text-[11px] text-outline uppercase tracking-widest">
                Billed annually. Custom instance hosting available.
              </p>
            </div>
          </div>
        </section>

      </main>

      {/* ═══════════════════════════════════════════════════════════════════════
          FOOTER
      ═══════════════════════════════════════════════════════════════════════ */}
      <footer className="py-12 px-gutter razor-border-b bg-surface-container-lowest">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex flex-col items-center md:items-start">
            <span className="font-technical-md text-title-md text-white" style={{ fontWeight: 700 }}>ClassifAi</span>
            <span className="font-body-sm text-on-surface-variant mt-1">
              © {new Date().getFullYear()} Enterprise Systems Inc.
            </span>
          </div>
          <div className="flex space-x-8">
            {['Privacy', 'Security', 'API Reference', 'Compliance'].map(item => (
              <a
                key={item}
                href="#"
                className="font-label-caps text-outline hover:text-white transition-colors"
                style={{ fontSize: 12, textDecoration: 'none' }}
              >
                {item}
              </a>
            ))}
          </div>
          <div className="flex items-center space-x-4 opacity-50">
            <Icon name="terminal" className="!text-[18px]" />
            <span className="font-technical-md text-[10px]">v2.4.0-stable</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
