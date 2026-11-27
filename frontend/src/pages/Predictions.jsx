
import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import {
  Activity,
  Cpu,
  RefreshCw,
  Search,
  AlertTriangle,
  ShieldCheck,
  Zap,
  TrendingDown,
  Clock3,
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

  return (
    data?.predictions ||
    data?.items ||
    data?.results ||
    []
  );
}

export default function Predictions() {
  const { searchQuery = "" } = useOutletContext() || {};

  const [predictions, setPredictions] = useState([]);
  const [filter, setFilter] = useState("all");
  const [localSearch, setLocalSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch prediction records
  async function fetchPredictions() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API}/api/v1/predictions?skip=0&limit=100`
      );

      if (!response.ok) {
        throw new Error("Unable to fetch prediction records");
      }

      const data = await response.json();

      const records = normalizeRecords(data);

      setPredictions(
        [...records].sort((a, b) => {
          const dateA = new Date(a.created_at || 0).getTime();
          const dateB = new Date(b.created_at || 0).getTime();

          return dateB - dateA;
        })
      );

    } catch (err) {
      console.error("Predictions API error:", err);
      setError(err.message || "Unable to load predictions");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchPredictions();
  }, []);

  // Prediction statistics
  const statistics = useMemo(() => {
    return predictions.reduce(
      (result, prediction) => {
        result[getStatus(prediction.predicted_rul)]++;
        return result;
      },
      {
        normal: 0,
        warning: 0,
        critical: 0,
        unknown: 0,
      }
    );
  }, [predictions]);

  // Filter and search records
  const filteredPredictions = useMemo(() => {
    const query = `${searchQuery} ${localSearch}`
      .toLowerCase()
      .trim();

    return predictions.filter((prediction) => {
      const status = getStatus(prediction.predicted_rul);

      const matchesStatus =
        filter === "all" || status === filter;

      const matchesSearch =
        !query ||
        String(prediction.unit).toLowerCase().includes(query) ||
        `unit-${prediction.unit}`.toLowerCase().includes(query) ||
        String(prediction.model_name || "")
          .toLowerCase()
          .includes(query);

      return matchesStatus && matchesSearch;
    });
  }, [predictions, filter, searchQuery, localSearch]);

  const averageRul = predictions.length
    ? predictions.reduce(
        (sum, item) => sum + (Number(item.predicted_rul) || 0),
        0
      ) / predictions.length
    : 0;

  return (
    <div className="dashboard-content space-y-6">

      {/* PAGE INTRO */}
      <section className="hero-section">
        <div className="hero-copy">

          <div className="flex items-center gap-3 mb-4">
            <span className="live-badge">
              <span className="pulse-dot" />
              PREDICTION ENGINE
            </span>
          </div>

          <h1 className="hero-headline">
            Prediction <span className="gradient-headline">Center.</span>
          </h1>

          <p className="hero-description">
            Analyze machine health predictions and remaining useful life.
          </p>

        </div>

        <button
          className="export-button"
          onClick={fetchPredictions}
          disabled={loading}
        >
          <RefreshCw
            size={16}
            className={loading ? "animate-spin" : ""}
          />
          Refresh Predictions
        </button>
      </section>

      {/* ERROR */}
      {error && (
        <div className="api-error">
          <AlertTriangle size={17} />
          <span>{error}</span>
          <button onClick={fetchPredictions}>
            Retry
          </button>
        </div>
      )}

      {/* SUMMARY CARDS */}
      <section className="kpi-grid">

        <SummaryCard
          title="Total Predictions"
          value={loading ? "..." : predictions.length}
          subtitle="Stored prediction records"
          icon={<Activity size={20} />}
        />

        <SummaryCard
          title="Normal"
          value={loading ? "..." : statistics.normal}
          subtitle="Above 50 RUL cycles"
          icon={<ShieldCheck size={20} />}
          accent="green"
        />

        <SummaryCard
          title="Warning"
          value={loading ? "..." : statistics.warning}
          subtitle="21–50 RUL cycles"
          icon={<AlertTriangle size={20} />}
          accent="yellow"
        />

        <SummaryCard
          title="Critical"
          value={loading ? "..." : statistics.critical}
          subtitle="20 or fewer RUL cycles"
          icon={<Zap size={20} />}
          accent="red"
        />

      </section>

      {/* MODEL INSIGHT */}
      <section className="prediction-insight-grid">

        <div className="prediction-insight-card">
          <div className="prediction-insight-icon">
            <TrendingDown size={21} />
          </div>

          <div>
            <p>Average Predicted RUL</p>

            <h3>
              {loading ? "..." : averageRul.toFixed(2)}
              <span> cycles</span>
            </h3>

            <small>Across loaded prediction records</small>
          </div>
        </div>

        <div className="prediction-insight-card">
          <div className="prediction-insight-icon">
            <Cpu size={21} />
          </div>

          <div>
            <p>Prediction Model</p>
            <h3>XGBoost</h3>
            <small>Selected validation model</small>
          </div>
        </div>

        <div className="prediction-insight-card">
          <div className="prediction-insight-icon">
            <Clock3 size={21} />
          </div>

          <div>
            <p>Data Source</p>
            <h3>MySQL</h3>
            <small>Stored prediction history</small>
          </div>
        </div>

      </section>

      {/* PREDICTION HISTORY */}
      <section className="panel p-5">

        <div className="panel-heading mb-5">
          <div>
            <h3>Prediction History</h3>
            <p>Machine-wise stored prediction results</p>
          </div>

          <span className="chart-tag">
            {filteredPredictions.length} RECORDS
          </span>
        </div>

        {/* SEARCH AND FILTER */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-5">

          <div className="command-search machine-search">
            <Search size={17} />

            <input
              value={localSearch}
              onChange={(event) =>
                setLocalSearch(event.target.value)
              }
              placeholder="Search unit or model..."
            />
          </div>

          <div className="machine-filter-group">
            {["all", "normal", "warning", "critical"].map((item) => (
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

        </div>

        {/* TABLE */}
        {loading ? (
          <div className="text-center py-16 text-gray-400">
            Loading prediction history...
          </div>
        ) : filteredPredictions.length === 0 ? (
          <div className="prediction-empty">
            <Activity size={30} />

            <h3>No prediction records found</h3>

            <p>
              Try another filter or refresh the prediction data.
            </p>
          </div>
        ) : (
          <div className="table-wrapper">

            <table className="machine-table">

              <thead>
                <tr>
                  <th>MACHINE ID</th>
                  <th>LAST CYCLE</th>
                  <th>PREDICTED RUL</th>
                  <th>HEALTH STATUS</th>
                  <th>MODEL</th>
                  <th>CREATED AT</th>
                </tr>
              </thead>

              <tbody>
                {filteredPredictions.map((prediction, index) => {
                  const status = getStatus(
                    prediction.predicted_rul
                  );

                  return (
                    <tr key={prediction.id ?? `${prediction.unit}-${index}`}>

                      <td className="machine-id-cell">
                        <span className="machine-mini-icon">
                          <Cpu size={16} />
                        </span>

                        UNIT-{String(prediction.unit).padStart(3, "0")}
                      </td>

                      <td>
                        {prediction.last_cycle ?? "—"}
                      </td>

                      <td className="font-semibold">
                        {Number.isFinite(Number(prediction.predicted_rul))
                          ? `${Number(prediction.predicted_rul).toFixed(2)} cycles`
                          : "—"}
                      </td>

                      <td>
                        <StatusLabel status={status} />
                      </td>

                      <td className="record-type">
                        {prediction.model_name || "—"}
                      </td>

                      <td className="text-xs text-gray-400">
                        {prediction.created_at
                          ? new Date(prediction.created_at).toLocaleString()
                          : "—"}
                      </td>

                    </tr>
                  );
                })}
              </tbody>

            </table>

          </div>
        )}

        <div className="machine-table-footer">
          <span>
            Showing {filteredPredictions.length} of {predictions.length} records
          </span>

          <span>Source: MechNova Prediction API</span>
        </div>

      </section>

      {/* MODEL INFORMATION */}
      <div className="prediction-footnote">
        <Activity size={15} />

        <span>
          RUL health classifications use the current prototype thresholds.
          Average RUL is calculated from the currently loaded records.
        </span>
      </div>

    </div>
  );
}


// SUMMARY CARD
function SummaryCard({
  title,
  value,
  subtitle,
  icon,
  accent = "default",
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


// STATUS LABEL
function StatusLabel({ status }) {
  return (
    <span className={`machine-status-label ${status}`}>
      <span />
      {status.toUpperCase()}
    </span>
  );
}
