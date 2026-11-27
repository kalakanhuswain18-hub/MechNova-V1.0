
import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  RefreshCw,
  Cpu,
  Zap,
  ShieldAlert,
  Clock3,
  ChevronRight,
  Activity,
  Wrench,
} from "lucide-react";

const API = "http://127.0.0.1:8000";

function getStatus(rul) {
  const value = Number(rul);

  if (!Number.isFinite(value)) return "unknown";
  if (value <= 20) return "critical";
  if (value <= 50) return "warning";

  return "normal";
}

function normalizeRecords(data) {
  if (Array.isArray(data)) return data;

  if (Array.isArray(data?.machines)) return data.machines;
  if (Array.isArray(data?.attention_required)) return data.attention_required;
  if (Array.isArray(data?.records)) return data.records;
  if (Array.isArray(data?.items)) return data.items;

  return [];
}

export default function AttentionRequired() {
  const [machines, setMachines] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function fetchAttentionData() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API}/api/v1/dashboard/attention-required`
      );

      if (!response.ok) {
        throw new Error("Unable to fetch attention-required machines");
      }

      const data = await response.json();

      const records = normalizeRecords(data);

      setMachines(
        [...records].sort(
          (a, b) =>
            Number(a.predicted_rul) - Number(b.predicted_rul)
        )
      );

    } catch (err) {
      console.error("Attention API error:", err);
      setError(err.message || "Unable to load attention data");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchAttentionData();
  }, []);

  const criticalMachines = useMemo(
    () => machines.filter(
      (machine) => getStatus(machine.predicted_rul) === "critical"
    ),
    [machines]
  );

  const warningMachines = useMemo(
    () => machines.filter(
      (machine) => getStatus(machine.predicted_rul) === "warning"
    ),
    [machines]
  );

  const filteredMachines = useMemo(() => {
    if (filter === "critical") return criticalMachines;
    if (filter === "warning") return warningMachines;

    return machines;
  }, [filter, machines, criticalMachines, warningMachines]);

  return (
    <div className="dashboard-content space-y-6">

      {/* INTRO */}
      <section className="hero-section">
        <div className="hero-copy">

          <div className="flex items-center gap-3 mb-4">
            <span className="live-badge">
              <span className="pulse-dot" />
              MAINTENANCE PRIORITY
            </span>
          </div>

          <h1 className="hero-headline">
            Attention <span className="gradient-headline">Required.</span>
          </h1>

          <p className="hero-description">
            Identify machines approaching failure and prioritize maintenance.
          </p>

        </div>

        <button
          className="export-button"
          onClick={fetchAttentionData}
          disabled={loading}
        >
          <RefreshCw
            size={16}
            className={loading ? "animate-spin" : ""}
          />
          Refresh Data
        </button>
      </section>

      {/* ERROR */}
      {error && (
        <div className="api-error">
          <AlertTriangle size={17} />
          <span>{error}</span>
          <button onClick={fetchAttentionData}>Retry</button>
        </div>
      )}

      {/* SUMMARY */}
      <section className="kpi-grid">

        <PriorityCard
          title="Total Attention"
          value={loading ? "..." : machines.length}
          subtitle="Machines flagged by API"
          icon={<ShieldAlert size={20} />}
          accent="default"
        />

        <PriorityCard
          title="Critical"
          value={loading ? "..." : criticalMachines.length}
          subtitle="20 or fewer RUL cycles"
          icon={<Zap size={20} />}
          accent="red"
        />

        <PriorityCard
          title="Warning"
          value={loading ? "..." : warningMachines.length}
          subtitle="21–50 RUL cycles"
          icon={<AlertTriangle size={20} />}
          accent="yellow"
        />

      </section>

      {/* PRIORITY NOTICE */}
      <section className="priority-notice">
        <div className="priority-notice-icon">
          <Wrench size={22} />
        </div>

        <div>
          <h3>Maintenance Priority Queue</h3>
          <p>
            Machines are ordered by predicted remaining useful life.
            Review critical assets first.
          </p>
        </div>
      </section>

      {/* MACHINE LIST */}
      <section className="panel p-5">

        <div className="panel-heading mb-5">
          <div>
            <h3>Maintenance Queue</h3>
            <p>Latest stored predictions requiring attention</p>
          </div>

          <span className="chart-tag">
            {filteredMachines.length} MACHINES
          </span>
        </div>

        {/* FILTERS */}
        <div className="machine-filter-group mb-5">

          {["all", "critical", "warning"].map((item) => (
            <button
              key={item}
              onClick={() => setFilter(item)}
              className={`machine-filter ${
                filter === item ? "active" : ""
              }`}
            >
              {item.toUpperCase()}
            </button>
          ))}

        </div>

        {loading ? (
          <div className="text-center py-16 text-gray-400">
            Loading maintenance queue...
          </div>
        ) : filteredMachines.length === 0 ? (
          <div className="attention-empty">

            <div className="attention-empty-icon">
              <Activity size={28} />
            </div>

            <h3>No machines in this queue</h3>

            <p>
              {machines.length === 0
                ? "The API returned no machines requiring attention."
                : "No machines match the selected filter."}
            </p>

          </div>
        ) : (
          <div className="attention-list">

            {filteredMachines.map((machine, index) => {
              const status = getStatus(machine.predicted_rul);

              return (
                <article
                  key={machine.id ?? machine.unit}
                  className={`attention-machine-card ${status}`}
                >

                  <div className="attention-machine-icon">
                    {status === "critical"
                      ? <Zap size={23} />
                      : <AlertTriangle size={23} />}
                  </div>

                  <div className="attention-machine-main">

                    <div className="attention-machine-heading">

                      <h3>
                        UNIT-{String(machine.unit).padStart(3, "0")}
                      </h3>

                      <span className={`machine-status-label ${status}`}>
                        <span />
                        {status.toUpperCase()}
                      </span>

                    </div>

                    <div className="attention-machine-meta">

                      <span>
                        <Cpu size={14} />
                        Cycle {machine.last_cycle ?? "—"}
                      </span>

                      <span>
                        <Clock3 size={14} />
                        {machine.model_name || "Prediction model"}
                      </span>

                    </div>

                    <div className="attention-rul-track">

                      <div className="attention-rul-label">
                        <span>Predicted Remaining Useful Life</span>

                        <strong>
                          {Number(machine.predicted_rul).toFixed(2)} cycles
                        </strong>
                      </div>

                      <div className="attention-rul-bar">
                        <div
                          className="attention-rul-fill"
                          style={{
                            width: `${Math.max(
                              0,
                              Math.min(
                                Number(machine.predicted_rul) / 125 * 100,
                                100
                              )
                            )}%`,
                          }}
                        />
                      </div>

                    </div>

                  </div>

                  <div className="attention-priority">
                    <span>PRIORITY</span>
                    <strong>#{index + 1}</strong>
                  </div>

                </article>
              );
            })}

          </div>
        )}

        <div className="machine-table-footer">
          <span>
            Showing {filteredMachines.length} of {machines.length} machines
          </span>

          <span>Source: MechNova API</span>
        </div>

      </section>

      {/* ENGINEERING NOTE */}
      <div className="attention-disclaimer">
        <AlertTriangle size={15} />
        <span>
          RUL thresholds are prototype classification thresholds.
          They are not certified industrial safety limits.
        </span>
      </div>

    </div>
  );
}


function PriorityCard({
  title,
  value,
  subtitle,
  icon,
  accent,
}) {
  return (
    <div className={`metric-card ${accent}`}>

      <div className="metric-top">
        <p>{title}</p>

        <div className="metric-icon">
          {icon}
        </div>
      </div>

      <h2 className="metric-value">{value}</h2>

      <div className="metric-bottom">
        <span>{subtitle}</span>
      </div>

    </div>
  );
}
