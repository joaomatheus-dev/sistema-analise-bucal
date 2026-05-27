import { useEffect, useMemo, useState } from "react";

const CHART_COLORS = [
  "#8b1e3f",
  "#a5284b",
  "#c44368",
  "#d96b8a",
  "#e4a0b3",
  "#6c1028",
  "#b24141",
  "#7a2540",
  "#c97a92",
  "#f0c7d2"
];

function buildPieSegments(items) {
  let cumulative = 0;

  return items.map((item, index) => {
    const percentage = Number(item.percentage || 0);
    const startAngle = cumulative * 3.6 - 90;
    const endAngle = (cumulative + percentage) * 3.6 - 90;
    cumulative += percentage;

    const largeArc = percentage > 50 ? 1 : 0;
    const radius = 90;
    const center = 110;
    const startRadians = (startAngle * Math.PI) / 180;
    const endRadians = (endAngle * Math.PI) / 180;

    const x1 = center + radius * Math.cos(startRadians);
    const y1 = center + radius * Math.sin(startRadians);
    const x2 = center + radius * Math.cos(endRadians);
    const y2 = center + radius * Math.sin(endRadians);

    const path = `M ${center} ${center} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;

    return {
      ...item,
      color: CHART_COLORS[index % CHART_COLORS.length],
      path
    };
  });
}

function AdminDashboardPage({ api, onMessage }) {
  const [universities, setUniversities] = useState([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDashboard() {
      setLoading(true);

      try {
        const data = await api("/api/dashboard/universities");
        setUniversities(data.universities || []);
        setTotalUsers(Number(data.totalUsers || 0));
      } catch (error) {
        onMessage({ text: error.message, type: "error" });
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  const resolvedTotalUsers = useMemo(
    () => totalUsers || universities.reduce((sum, item) => sum + Number(item.total || 0), 0),
    [totalUsers, universities]
  );

  const chartItems = useMemo(
    () =>
      buildPieSegments(
        universities.map((item) => ({
          ...item,
          percentage:
            Number(item.percentage || 0) ||
            (resolvedTotalUsers ? (Number(item.total || 0) * 100) / resolvedTotalUsers : 0)
        }))
      ),
    [universities, resolvedTotalUsers]
  );

  return (
    <section className="stack">
      <section className="hero-banner compact-hero">
        <div className="hero-banner-copy">
          <p className="hero-kicker">Dashboard</p>
          <h2>Faculdades dos usuários</h2>
        </div>
        <div className="metrics-pill">
          <span>{chartItems.length} faculdades</span>
          <span>{resolvedTotalUsers} usuário(s)</span>
        </div>
      </section>

      <section className="dashboard-layout">
        <article className="form-card dashboard-chart-card">
          {loading ? <p>Carregando dashboard...</p> : null}
          {!loading && chartItems.length === 0 ? (
            <p>Nenhuma faculdade foi cadastrada por usuários até o momento.</p>
          ) : null}
          {!loading && chartItems.length > 0 ? (
            <div className="dashboard-chart-wrap">
              <div className="dashboard-pie-shell" aria-label="Gráfico de pizza de faculdades">
                <svg viewBox="0 0 220 220" className="dashboard-pie-chart" role="img">
                  {chartItems.map((item) => (
                    <path key={item.name} d={item.path} fill={item.color} stroke="#ffffff" strokeWidth="2" />
                  ))}
                  <circle cx="110" cy="110" r="44" fill="#ffffff" />
                  <text x="110" y="102" textAnchor="middle" className="dashboard-pie-total">
                    {resolvedTotalUsers}
                  </text>
                  <text x="110" y="122" textAnchor="middle" className="dashboard-pie-label">
                    usuários
                  </text>
                </svg>
              </div>

              <div className="dashboard-legend">
                {chartItems.map((item) => (
                  <article key={item.name} className="dashboard-legend-card">
                    <div className="dashboard-legend-top">
                      <span
                        className="dashboard-color-dot"
                        style={{ backgroundColor: item.color }}
                        aria-hidden="true"
                      />
                      <strong>{item.name}</strong>
                    </div>
                    <div className="dashboard-legend-meta">
                      <span>{item.total} usuário(s)</span>
                      <b>{Number(item.percentage || 0).toFixed(1)}%</b>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          ) : null}
        </article>
      </section>
    </section>
  );
}

export default AdminDashboardPage;
