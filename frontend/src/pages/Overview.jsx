
import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";

import {
  Activity,
  Factory,
  AlertTriangle,
  Zap,
  ShieldCheck,
  RefreshCw,
  CircleDot,
  Cpu,
  ArrowUpRight,
} from "lucide-react";

import { getHealthSummary } from "../api";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// Illustrative chart data - not live telemetry
const chartData = [
  { time: "08:00", rul: 110 },
  { time: "09:00", rul: 105 },
  { time: "10:00", rul: 98 },
  { time: "11:00", rul: 94 },
  { time: "12:00", rul: 88 },
  { time: "13:00", rul: 82 },
  { time: "14:00", rul: 76 },
  { time: "15:00", rul: 72 },
];

// Illustrative machine records - live alert integration pending
const demoMachines = [
  { id: "UNIT-081", rul: "5.44", status: "Critical", color: "red" },
  { id: "UNIT-034", rul: "12.80", status: "Critical", color: "red" },
  { id: "UNIT-055", rul: "27.30", status: "Warning", color: "yellow" },
  { id: "UNIT-019", rul: "38.65", status: "Warning", color: "yellow" },
];

export default function Overview() {
  const { searchQuery = "" } = useOutletContext() || {};

  const [health, setHealth] = useState({
    total_machines: 0,
    normal: 0,
    warning: 0,
    critical: 0,
  });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch dashboard data from FastAPI
  async function fetchDashboardData() {
    try {
      setLoading(true);

      const data = await getHealthSummary();

      setHealth(data);
      setError("");
    } catch (err) {
      console.error("Dashboard API error:", err);

      setError(
        "Unable to load live machine data. Check backend connection."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Normal machine percentage
  const normalPercentage =
    health.total_machines > 0
      ? (health.normal / health.total_machines) * 100
      : 0;

  // Filter illustrative machine records using Layout search
  const filteredMachines = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();

    if (!query) return demoMachines;

    return demoMachines.filter((machine) =>
      machine.id.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  return (
    <div className="dashboard-content">

      {/* HERO SECTION */}
      <section className="hero-section">

        <div className="hero-copy">

          <div className="flex flex-wrap items-center gap-3 mb-5">

            <span className="live-badge">
              <span className="pulse-dot" />
              LIVE MONITORING
            </span>

            <span className="environment-label">
              DEVELOPMENT ENVIRONMENT
            </span>

          </div>

          <h1 className="hero-headline">
            Predict the Failure.
            <span className="gradient-headline">
              {" "}Prevent the Downtime.
            </span>
          </h1>

          <p className="hero-description">
            Intelligent predictive maintenance and machine health analytics.
          </p>

        </div>

        <button
          className="export-button"
          onClick={fetchDashboardData}
          disabled={loading}
        >
          <RefreshCw
            size={16}
            className={loading ? "animate-spin" : ""}
          />

          Refresh Data
        </button>

      </section>

      {/* API ERROR */}
      {error && (
        <div className="api-error">

          <AlertTriangle size={17} />

          <span>{error}</span>

          <button onClick={fetchDashboardData}>
            Retry
          </button>

        </div>
      )}

      {/* KPI CARDS */}
      <section className="kpi-grid">

        <MetricCard
          title="Total Machines"
          value={loading ? "..." : health.total_machines}
          subtitle="Monitored assets"
          icon={<Factory size={20} />}
          trend="Database"
          accent="default"
        />

        <MetricCard
          title="Normal Health"
          value={loading ? "..." : health.normal}
          subtitle="Healthy machines"
          icon={<Activity size={20} />}
          trend="Stable"
          accent="green"
        />

        <MetricCard
          title="Warning"
          value={loading ? "..." : health.warning}
          subtitle="Early attention needed"
          icon={<AlertTriangle size={20} />}
          trend="Monitor"
          accent="yellow"
        />

        <MetricCard
          title="Critical"
          value={loading ? "..." : health.critical}
          subtitle="Immediate attention"
          icon={<Zap size={20} />}
          trend="Priority"
          accent="red"
        />

      </section>

      {/* ANALYTICS */}
      <section className="analytics-grid">

        {/* RUL PERFORMANCE CHART */}
        <div className="panel analytics-panel chart-panel">

          <div className="panel-heading">

            <div>

              <div className="panel-title-row">
                <h3>RUL Performance</h3>
                <span className="demo-label">DEMO</span>
              </div>

              <p>Remaining useful life trend</p>

            </div>

            <span className="chart-tag">
              LAST 8 CYCLES
            </span>

          </div>

          <div className="chart-container">

            <ResponsiveContainer width="100%" height="100%">

              <AreaChart
                data={chartData}
                margin={{
                  top: 10,
                  right: 10,
                  left: -15,
                  bottom: 0,
                }}
              >

                <defs>

                  <linearGradient
                    id="rulGradient"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >

                    <stop
                      offset="0%"
                      stopColor="#a3ff12"
                      stopOpacity={0.28}
                    />

                    <stop
                      offset="95%"
                      stopColor="#a3ff12"
                      stopOpacity={0}
                    />

                  </linearGradient>

                </defs>

                <CartesianGrid
                  stroke="var(--chart-grid)"
                  vertical={false}
                />

                <XAxis
                  dataKey="time"
                  stroke="var(--chart-text)"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11 }}
                />

                <YAxis
                  stroke="var(--chart-text)"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11 }}
                />

                <Tooltip
                  contentStyle={{
                    background: "var(--tooltip-bg)",
                    border: "1px solid var(--border)",
                    borderRadius: 9,
                    color: "var(--text-primary)",
                    fontSize: 12,
                  }}
                />

                <Area
                  type="monotone"
                  dataKey="rul"
                  stroke="#a3ff12"
                  strokeWidth={2.5}
                  fill="url(#rulGradient)"
                  activeDot={{
                    r: 5,
                    fill: "#a3ff12",
                  }}
                />

              </AreaChart>

            </ResponsiveContainer>

          </div>

          <div className="chart-footer">

            <span>
              <span className="legend-dot" />
              RUL trend
            </span>

            <span>
              Illustrative data · Not live telemetry
            </span>

          </div>

        </div>

        {/* FLEET HEALTH */}
        <div className="panel analytics-panel fleet-panel">

          <div className="panel-heading">

            <div>
              <h3>Fleet Health</h3>
              <p>Machine condition distribution</p>
            </div>

            <ShieldCheck
              size={20}
              className="panel-heading-icon"
            />

          </div>

          <div className="health-visual">

            <div
              className="health-ring"
              style={{
                background: `conic-gradient(
                  #a3ff12 0% ${
                    health.total_machines
                      ? (health.normal / health.total_machines) * 100
                      : 0
                  }%,
                  #f5bd45 ${
                    health.total_machines
                      ? (health.normal / health.total_machines) * 100
                      : 0
                  }% ${
                    health.total_machines
                      ? ((health.normal + health.warning) /
                          health.total_machines) *
                        100
                      : 0
                  }%,
                  #ff6262 ${
                    health.total_machines
                      ? ((health.normal + health.warning) /
                          health.total_machines) *
                        100
                      : 0
                  }% 100%
                )`,
              }}
            >

              <div className="health-ring-inner">

                <span className="health-percentage">
                  {loading
                    ? "--"
                    : `${normalPercentage.toFixed(1)}%`}
                </span>

                <span className="health-ring-label">
                  NORMAL
                </span>

              </div>

            </div>

          </div>

          <div className="health-legend">

            <HealthRow
              label="Normal"
              value={loading ? "..." : health.normal}
              color="green"
            />

            <HealthRow
              label="Warning"
              value={loading ? "..." : health.warning}
              color="yellow"
            />

            <HealthRow
              label="Critical"
              value={loading ? "..." : health.critical}
              color="red"
            />

          </div>

        </div>

      </section>

      {/* ATTENTION REQUIRED */}
      <section className="panel attention-panel">

        <div className="panel-heading attention-heading">

          <div>

            <div className="panel-title-row">
              <h3>Attention Required</h3>
              <span className="demo-label">DEMO</span>
            </div>

            <p>
              Illustrative machine records — live alert integration pending
            </p>

          </div>

          <div className="attention-count">

            <AlertTriangle size={15} />

            {health.warning + health.critical} machines flagged by summary

          </div>

        </div>

        <div className="table-wrapper">

          <table className="machine-table">

            <thead>

              <tr>
                <th>MACHINE ID</th>
                <th>PREDICTED RUL</th>
                <th>HEALTH STATUS</th>
                <th>RECORD TYPE</th>
              </tr>

            </thead>

            <tbody>

              {filteredMachines.map((machine) => (

                <tr key={machine.id}>

                  <td className="machine-id-cell">

                    <span className="machine-mini-icon">
                      <Cpu size={16} />
                    </span>

                    {machine.id}

                  </td>

                  <td>
                    {machine.rul} cycles
                  </td>

                  <td>

                    <span className={`status ${machine.color}`}>

                      <CircleDot size={11} />

                      {machine.status}

                    </span>

                  </td>

                  <td className="record-type">

                    <span>Illustrative</span>

                    <ArrowUpRight size={14} />

                  </td>

                </tr>

              ))}

              {filteredMachines.length === 0 && (

                <tr>
                  <td colSpan={4} className="empty-row">
                    No matching demo machines found.
                  </td>
                </tr>

              )}

            </tbody>

          </table>

        </div>

      </section>

    </div>
  );
}


// KPI CARD COMPONENT
function MetricCard({
  title,
  value,
  subtitle,
  icon,
  trend,
  accent,
}) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const target = Number(value);

    if (!Number.isFinite(target)) {
      setDisplayValue(value);
      return;
    }

    let startTime = null;
    let animationFrame;

    const duration = 2000;

    function animate(timestamp) {
      if (startTime === null) {
        startTime = timestamp;
      }

      const progress = Math.min(
        (timestamp - startTime) / duration,
        1
      );

      const eased = 1 - Math.pow(1 - progress, 3);

      setDisplayValue(Math.round(target * eased));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    }

    animationFrame = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationFrame);

  }, [value]);

  return (

    <div className={`metric-card ${accent}`}>

      <div className="metric-top">

        <p>{title}</p>

        <div className="metric-icon">
          {icon}
        </div>

      </div>

      <h2 className="metric-value">
        {displayValue}
      </h2>

      <div className="metric-bottom">

        <span>{subtitle}</span>

        <span className="metric-trend">
          {trend}
        </span>

      </div>

    </div>

  );
}


// HEALTH LEGEND COMPONENT
function HealthRow({ label, value, color }) {

  return (

    <div className="health-row">

      <div className="health-row-label">

        <span className={`health-dot ${color}`} />

        {label}

      </div>

      <span className="health-row-value">
        {value}
      </span>

    </div>

  );

}
