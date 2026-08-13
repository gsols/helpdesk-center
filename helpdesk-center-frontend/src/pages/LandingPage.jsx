import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BarChart3,
  BrainCircuit,
  CheckCircle2,
  ClipboardList,
  Clock3,
  LockKeyhole,
  MessageSquareText,
  Route,
  ShieldCheck,
  TicketCheck,
  UsersRound,
} from 'lucide-react';
import ClassifAiMark from '../components/ClassifAiMark';
import heroImage from '../assets/hero.svg';

const FEATURES = [
  {
    icon: BrainCircuit,
    title: 'AI triage',
    text: 'Classifies requests into HR, software, and hardware queues with confidence signals.',
  },
  {
    icon: Route,
    title: 'Smart routing',
    text: 'Moves tickets to the right team and keeps reroutes visible when ownership changes.',
  },
  {
    icon: Clock3,
    title: 'SLA tracking',
    text: 'Shows urgency, deadline pressure, and queue risk before work gets buried.',
  },
  {
    icon: MessageSquareText,
    title: 'Ticket context',
    text: 'Keeps notes, attachments, updates, and teammate handoffs connected to the request.',
  },
];

const ROLES = [
  ['Employees', 'Submit requests', 'Create tickets, upload attachments, and track progress.'],
  ['Agents', 'Resolve queues', 'Work assigned tickets and collaborate with teammates.'],
  ['Managers', 'Review risk', 'Monitor load, analytics, SLA exposure, and escalations.'],
  ['Admins', 'Manage setup', 'Maintain users, departments, and SLA rules.'],
];

const METRICS = [
  ['3', 'Departments'],
  ['4', 'Role spaces'],
  ['24/7', 'Visibility'],
];

function LogoLockup({ dark = false }) {
  return (
    <div className="landing-logo">
      <span className="landing-logo-mark">
        <ClassifAiMark size={25} />
      </span>
      <span>
        <span className={dark ? 'landing-logo-name is-dark' : 'landing-logo-name'}>
          Classif<span>Ai</span>
        </span>
        <span className={dark ? 'landing-logo-sub is-dark' : 'landing-logo-sub'}>
          Helpdesk Center
        </span>
      </span>
    </div>
  );
}

function SectionIntro({ eyebrow, title, text }) {
  return (
    <div className="landing-section-intro">
      <p>{eyebrow}</p>
      <h2>{title}</h2>
      <span>{text}</span>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, text }) {
  return (
    <article className="landing-card landing-feature-card">
      <span className="landing-icon">
        <Icon size={18} />
      </span>
      <h3>{title}</h3>
      <p>{text}</p>
    </article>
  );
}

function RoleCard({ title, label, text }) {
  return (
    <article className="landing-card landing-role-card">
      <div>
        <h3>{title}</h3>
        <span>{label}</span>
      </div>
      <p>{text}</p>
    </article>
  );
}

function HeroPreview() {
  return (
    <aside className="landing-preview" aria-label="Support workspace preview">
      <div className="landing-preview-top">
        <div>
          <span>Queue health</span>
          <strong>Operational</strong>
        </div>
        <span className="landing-live">LIVE</span>
      </div>

      <div className="landing-preview-body">
        <div className="landing-visual">
          <img src={heroImage} alt="ClassifAi support workspace illustration" />
        </div>

        <div className="landing-ticket">
          <div className="landing-ticket-head">
            <TicketCheck size={17} />
            <strong>Ticket triage</strong>
          </div>
          {['Employee request received', 'AI category prediction ready', 'Assigned to queue owner'].map((item, index) => (
            <div className="landing-step" key={item}>
              <span>{index + 1}</span>
              <p>{item}</p>
              {index === 2 && <CheckCircle2 size={15} />}
            </div>
          ))}
        </div>
      </div>

      <div className="landing-metrics">
        {METRICS.map(([value, label]) => (
          <div key={label}>
            <strong>{value}</strong>
            <span>{label}</span>
          </div>
        ))}
      </div>
    </aside>
  );
}

function MiniWorkflow() {
  return (
    <div className="landing-workflow-panel">
      {[
        ['Intake', 'Employee submits the issue with details and files.'],
        ['Classify', 'AI suggests department, priority, and confidence.'],
        ['Resolve', 'The right team works the ticket with shared context.'],
      ].map(([title, text], index) => (
        <div className="landing-workflow-item" key={title}>
          <span>{index + 1}</span>
          <div>
            <strong>{title}</strong>
            <p>{text}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

export default function LandingPage() {
  return (
    <main className="landing-page">
      <style>{landingStyles}</style>

      <header className="landing-header">
        <div className="landing-container landing-header-inner">
          <LogoLockup />
          <nav className="landing-nav" aria-label="Landing navigation">
            <a href="#features">Features</a>
            <a href="#roles">Roles</a>
            <a href="#workflow">Workflow</a>
          </nav>
          <Link to="/login" className="landing-button landing-button-primary">
            Login
            <ArrowRight size={16} />
          </Link>
        </div>
      </header>

      <section className="landing-container landing-hero">
        <div className="landing-hero-copy">
          <p className="landing-eyebrow">AI-assisted support operations</p>
          <h1>Helpdesk work, routed clearly.</h1>
          <p className="landing-lede">
            ClassifAi gives employees, agents, managers, and admins one simple place to submit,
            classify, track, and resolve support tickets.
          </p>

          <div className="landing-actions">
            <Link to="/login" className="landing-button landing-button-primary">
              Open workspace
              <ArrowRight size={16} />
            </Link>
            <a href="#features" className="landing-button landing-button-secondary">
              View features
            </a>
          </div>

          <div className="landing-checks">
            {[
              [ClipboardList, 'Ticket intake'],
              [ShieldCheck, 'Role access'],
              [BarChart3, 'Manager analytics'],
            ].map(([Icon, text]) => (
              <span key={text}>
                <Icon size={16} />
                {text}
              </span>
            ))}
          </div>
        </div>

        <HeroPreview />
      </section>

      <section className="landing-band" id="features">
        <div className="landing-container">
          <SectionIntro
            eyebrow="Core features"
            title="Built around the ticket lifecycle."
            text="The interface stays focused on the work: request, classify, route, resolve, and review."
          />
          <div className="landing-feature-grid">
            {FEATURES.map((feature) => (
              <FeatureCard key={feature.title} {...feature} />
            ))}
          </div>
        </div>
      </section>

      <section className="landing-container landing-section" id="roles">
        <SectionIntro
          eyebrow="Role workspaces"
          title="Every user lands where they need to work."
          text="Each dashboard is scoped to the person using it, without extra clutter."
        />
        <div className="landing-role-grid">
          {ROLES.map(([title, label, text]) => (
            <RoleCard key={title} title={title} label={label} text={text} />
          ))}
        </div>
      </section>

      <section className="landing-band" id="workflow">
        <div className="landing-container landing-workflow">
          <div>
            <p className="landing-eyebrow">Workflow</p>
            <h2>One clean path from request to resolution.</h2>
            <p>
              ClassifAi keeps support moving with fewer handoff gaps and clearer ownership at each
              step of the queue.
            </p>
            <div className="landing-workflow-note">
              <UsersRound size={18} />
              Built for HR, IT software, and IT hardware support teams.
            </div>
          </div>
          <MiniWorkflow />
        </div>
      </section>

      <footer className="landing-footer">
        <div className="landing-container landing-footer-inner">
          <LogoLockup dark />
          <Link to="/login" className="landing-button landing-button-light">
            Sign in
            <LockKeyhole size={16} />
          </Link>
        </div>
      </footer>
    </main>
  );
}

const landingStyles = `
.landing-page {
  min-height: 100vh;
  background: #f8f9ff;
  color: #0f172a;
  overflow-x: hidden;
}

.landing-container {
  width: min(1120px, calc(100vw - 40px));
  margin: 0 auto;
}

.landing-header {
  position: sticky;
  top: 0;
  z-index: 20;
  border-bottom: 1px solid #dbe3ef;
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(12px);
}

.landing-header-inner,
.landing-footer-inner {
  min-height: 64px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
}

.landing-logo {
  display: inline-flex;
  align-items: center;
  gap: 11px;
  min-width: 190px;
}

.landing-logo-mark {
  width: 38px;
  height: 38px;
  display: grid;
  place-items: center;
  border: 1px solid #dbe3ef;
  border-radius: 8px;
  background: #ffffff;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.06);
  flex: 0 0 auto;
}

.landing-logo-name,
.landing-logo-sub {
  display: block;
}

.landing-logo-name {
  font-size: 15px;
  line-height: 18px;
  font-weight: 850;
  color: #0f172a;
}

.landing-logo-name span {
  color: #2563eb;
}

.landing-logo-name.is-dark {
  color: #ffffff;
}

.landing-logo-sub {
  margin-top: 1px;
  font-family: 'JetBrains Mono', monospace;
  font-size: 10px;
  line-height: 14px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: #64748b;
}

.landing-logo-sub.is-dark {
  color: #94a3b8;
}

.landing-nav {
  display: flex;
  align-items: center;
  gap: 28px;
  font-size: 13px;
  font-weight: 700;
}

.landing-nav a {
  color: #475569;
  text-decoration: none;
}

.landing-nav a:hover {
  color: #0f172a;
}

.landing-button {
  height: 42px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 0 16px;
  border-radius: 8px;
  border: 1px solid transparent;
  font-size: 14px;
  font-weight: 800;
  text-decoration: none;
  white-space: nowrap;
  transition: background 150ms ease, border-color 150ms ease, color 150ms ease;
}

.landing-button-primary {
  background: #020617;
  color: #ffffff;
}

.landing-button-primary:hover {
  background: #1e293b;
}

.landing-button-secondary {
  border-color: #cbd5e1;
  background: #ffffff;
  color: #334155;
}

.landing-button-secondary:hover {
  border-color: #94a3b8;
  color: #0f172a;
}

.landing-button-light {
  background: #ffffff;
  color: #020617;
}

.landing-button-light:hover {
  background: #e2e8f0;
}

.landing-hero {
  min-height: 620px;
  display: grid;
  grid-template-columns: minmax(0, 0.95fr) minmax(420px, 1.05fr);
  align-items: center;
  gap: 56px;
  padding: 56px 0 72px;
}

.landing-eyebrow {
  width: fit-content;
  margin: 0 0 18px;
  padding: 6px 10px;
  border: 1px solid #bfdbfe;
  border-radius: 8px;
  background: #eff6ff;
  color: #1d4ed8;
  font-size: 11px;
  line-height: 14px;
  font-weight: 850;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.landing-hero h1 {
  max-width: 660px;
  margin: 0;
  color: #020617;
  font-size: clamp(42px, 5.2vw, 66px);
  line-height: 0.98;
  font-weight: 900;
}

.landing-lede,
.landing-workflow p,
.landing-section-intro span {
  color: #475569;
  font-size: 16px;
  line-height: 28px;
}

.landing-lede {
  max-width: 620px;
  margin: 24px 0 0;
}

.landing-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 32px;
}

.landing-checks {
  display: flex;
  flex-wrap: wrap;
  gap: 14px 22px;
  margin-top: 28px;
}

.landing-checks span,
.landing-workflow-note {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #334155;
  font-size: 13px;
  font-weight: 750;
}

.landing-checks svg,
.landing-workflow-note svg {
  color: #2563eb;
}

.landing-preview,
.landing-card,
.landing-workflow-panel {
  border: 1px solid #dbe3ef;
  border-radius: 8px;
  background: #ffffff;
  box-shadow: 0 12px 32px rgba(15, 23, 42, 0.06);
}

.landing-preview {
  overflow: hidden;
}

.landing-preview-top,
.landing-metrics {
  display: grid;
  grid-template-columns: 1fr auto;
  align-items: center;
  gap: 16px;
  padding: 18px;
}

.landing-preview-top {
  border-bottom: 1px solid #e2e8f0;
}

.landing-preview-top span,
.landing-metrics span {
  display: block;
  color: #64748b;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.landing-preview-top strong {
  display: block;
  margin-top: 2px;
  font-size: 18px;
  line-height: 24px;
}

.landing-live {
  padding: 5px 8px;
  border-radius: 999px;
  background: #ecfdf5;
  color: #047857 !important;
}

.landing-preview-body {
  display: grid;
  grid-template-columns: 0.85fr 1.15fr;
  min-height: 300px;
}

.landing-visual {
  display: grid;
  place-items: center;
  border-right: 1px solid #e2e8f0;
  background: #f8fafc;
}

.landing-visual img {
  width: min(210px, 80%);
  height: auto;
  object-fit: contain;
}

.landing-ticket {
  padding: 18px;
}

.landing-ticket-head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 14px;
  color: #0f172a;
  font-size: 14px;
}

.landing-ticket-head svg {
  color: #2563eb;
}

.landing-step {
  display: grid;
  grid-template-columns: 30px 1fr auto;
  align-items: center;
  gap: 10px;
  margin-top: 10px;
  padding: 11px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #f8fafc;
}

.landing-step span,
.landing-workflow-item > span {
  width: 30px;
  height: 30px;
  display: grid;
  place-items: center;
  border-radius: 8px;
  background: #ffffff;
  color: #334155;
  font-size: 12px;
  font-weight: 850;
  box-shadow: inset 0 0 0 1px #dbe3ef;
}

.landing-step p {
  margin: 0;
  color: #334155;
  font-size: 13px;
  line-height: 18px;
  font-weight: 750;
}

.landing-step svg {
  color: #059669;
}

.landing-metrics {
  grid-template-columns: repeat(3, 1fr);
  border-top: 1px solid #e2e8f0;
}

.landing-metrics strong {
  display: block;
  color: #020617;
  font-size: 24px;
  line-height: 30px;
}

.landing-band {
  border-top: 1px solid #dbe3ef;
  border-bottom: 1px solid #dbe3ef;
  background: #ffffff;
  padding: 72px 0;
}

.landing-section {
  padding: 72px 0;
}

.landing-section-intro {
  max-width: 680px;
  margin: 0 auto;
  text-align: center;
}

.landing-section-intro p {
  margin: 0 0 10px;
  color: #2563eb;
  font-size: 11px;
  line-height: 14px;
  font-weight: 850;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.landing-section-intro h2,
.landing-workflow h2 {
  margin: 0;
  color: #020617;
  font-size: clamp(28px, 3.2vw, 38px);
  line-height: 1.1;
  font-weight: 900;
}

.landing-section-intro span {
  display: block;
  margin-top: 14px;
}

.landing-feature-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
  margin-top: 40px;
}

.landing-card {
  padding: 22px;
}

.landing-feature-card {
  min-height: 220px;
}

.landing-icon {
  width: 42px;
  height: 42px;
  display: grid;
  place-items: center;
  margin-bottom: 20px;
  border-radius: 8px;
  background: #020617;
  color: #ffffff;
}

.landing-card h3 {
  margin: 0;
  color: #0f172a;
  font-size: 16px;
  line-height: 22px;
  font-weight: 850;
}

.landing-card p {
  margin: 9px 0 0;
  color: #475569;
  font-size: 14px;
  line-height: 23px;
}

.landing-role-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  margin-top: 40px;
}

.landing-role-card {
  min-height: 136px;
}

.landing-role-card div {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.landing-role-card span {
  padding: 5px 8px;
  border: 1px solid #bfdbfe;
  border-radius: 999px;
  background: #eff6ff;
  color: #1d4ed8;
  font-size: 11px;
  line-height: 14px;
  font-weight: 850;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  white-space: nowrap;
}

.landing-workflow {
  display: grid;
  grid-template-columns: minmax(0, 0.8fr) minmax(420px, 1.2fr);
  align-items: center;
  gap: 48px;
}

.landing-workflow > div > p:not(.landing-eyebrow) {
  max-width: 520px;
  margin: 16px 0 0;
}

.landing-workflow-note {
  margin-top: 26px;
}

.landing-workflow-panel {
  padding: 20px;
}

.landing-workflow-item {
  display: grid;
  grid-template-columns: 30px 1fr;
  gap: 14px;
  padding: 16px;
  border-bottom: 1px solid #e2e8f0;
}

.landing-workflow-item:last-child {
  border-bottom: none;
}

.landing-workflow-item strong {
  display: block;
  color: #0f172a;
  font-size: 15px;
  line-height: 20px;
}

.landing-workflow-item p {
  margin: 4px 0 0;
  color: #475569;
  font-size: 14px;
  line-height: 22px;
}

.landing-footer {
  background: #020617;
  color: #ffffff;
}

@media (max-width: 960px) {
  .landing-nav {
    display: none;
  }

  .landing-hero,
  .landing-workflow {
    grid-template-columns: 1fr;
  }

  .landing-preview-body {
    grid-template-columns: 1fr;
  }

  .landing-visual {
    min-height: 230px;
    border-right: none;
    border-bottom: 1px solid #e2e8f0;
  }

  .landing-feature-grid,
  .landing-role-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .landing-container {
    width: min(100% - 28px, 1120px);
  }

  .landing-header-inner {
    min-height: 58px;
    gap: 12px;
  }

  .landing-logo {
    min-width: 0;
  }

  .landing-logo-sub {
    display: none;
  }

  .landing-hero {
    min-height: auto;
    gap: 32px;
    padding: 36px 0 52px;
  }

  .landing-hero h1 {
    font-size: 40px;
  }

  .landing-actions {
    align-items: stretch;
    flex-direction: column;
  }

  .landing-feature-grid,
  .landing-role-grid,
  .landing-metrics {
    grid-template-columns: 1fr;
  }

  .landing-role-card div {
    flex-direction: column;
  }

  .landing-band,
  .landing-section {
    padding: 52px 0;
  }

  .landing-footer-inner {
    align-items: flex-start;
    flex-direction: column;
    padding: 18px 0;
  }
}
`;
