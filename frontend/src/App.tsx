import './App.css';

const quickStats = [
  { label: 'Vehicles', value: '24' },
  { label: 'Drivers', value: '18' },
  { label: 'Active routes', value: '6' },
];

const modules = [
  'Fleet overview',
  'Driver management',
  'Vehicle records',
  'Scheduling',
];

export default function App() {
  return (
    <main className="shell">
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">Odoo 2026 frontend</p>
          <h1>Fleet operations, ready for product work.</h1>
          <p className="lede">
            A Vite + React + TypeScript starter with a clean layout, responsive
            structure, and room for your app modules.
          </p>

          <div className="stats" aria-label="project summary">
            {quickStats.map((stat) => (
              <article className="stat-card" key={stat.label}>
                <span>{stat.label}</span>
                <strong>{stat.value}</strong>
              </article>
            ))}
          </div>
        </div>

        <aside className="panel">
          <div className="panel-header">
            <span>Project modules</span>
            <span className="chip">Starter</span>
          </div>

          <ul className="module-list">
            {modules.map((module) => (
              <li key={module}>{module}</li>
            ))}
          </ul>
        </aside>
      </section>
    </main>
  );
}