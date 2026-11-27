
import { useEffect, useMemo, useState } from "react";
import { useOutletContext } from "react-router-dom";
import {
  Cpu,
  Search,
  RefreshCw,
  Activity,
  AlertTriangle,
  ShieldCheck,
  ChevronRight,
  ArrowLeft,
  Clock3,
  Factory,
  Zap,
} from "lucide-react";

const API = "http://127.0.0.1:8000";

function getStatus(rul) {
  const value = Number(rul);

  if (!Number.isFinite(value)) return "unknown";
  if (value <= 20) return "critical";
  if (value <= 50) return "warning";

  return "normal";
}

function formatDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleString();
}

export default function Machines() {
  const { searchQuery = "" } = useOutletContext() || {};

  const [machines, setMachines] = useState([]);
  const [selectedMachine, setSelectedMachine] = useState(null);
  const [machineDetails, setMachineDetails] = useState(null);

  const [filter, setFilter] = useState("all");
  const [localSearch, setLocalSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [error, setError] = useState("");

  // Fetch latest stored machine predictions
  
  // Fetch latest prediction for every unique machine
  async function fetchMachines() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(
        `${API}/api/v1/machines`
      );

      if (!response.ok) {
        throw new Error("Unable to fetch machine inventory");
      }

      const data = await response.json();

      setMachines(
        Array.isArray(data.machines) ? data.machines : []
      );

    } catch (err) {
      console.error("Machines API error:", err);
      setError(err.message || "Unable to load machines");
    } finally {
      setLoading(false);
    }
  }


  useEffect(() => {
    fetchMachines();
  }, []);

  // Fetch one machine's prediction history/details
  async function openMachine(machine) {
    try {
      setSelectedMachine(machine);
      setMachineDetails(null);
      setDetailsLoading(true);
      setError("");

      const response = await fetch(
        `${API}/api/v1/predictions/${machine.unit}`
      );

      if (!response.ok) {
        throw new Error("Unable to fetch machine details");
      }

      const data = await response.json();

      setMachineDetails(data);

    } catch (err) {
      console.error("Machine detail error:", err);
      setError(err.message || "Unable to load machine details");
    } finally {
      setDetailsLoading(false);
    }
  }

  // Filter and search
  const filteredMachines = useMemo(() => {
    const query = `${searchQuery} ${localSearch}`
      .toLowerCase()
      .trim();

    return machines.filter((machine) => {
      const status = getStatus(machine.predicted_rul);

      const matchesStatus =
        filter === "all" || status === filter;

      const matchesSearch =
        !query ||
        String(machine.unit).toLowerCase().includes(query) ||
        `unit-${machine.unit}`.toLowerCase().includes(query) ||
        String(machine.model_name || "").toLowerCase().includes(query);

      return matchesStatus && matchesSearch;
    });
  }, [machines, filter, searchQuery, localSearch]);

  const counts = useMemo(() => {
    return machines.reduce(
      (result, machine) => {
        result[getStatus(machine.predicted_rul)]++;
        return result;
      },
      { normal: 0, warning: 0, critical: 0, unknown: 0 }
    );
  }, [machines]);

  return (
    <div className="dashboard-content space-y-6">

      {/* PAGE INTRO */}
      <section className="hero-section">
        <div className="hero-copy">
          <div className="flex items-center gap-3 mb-4">
            <span className="live-badge">
              <span className="pulse-dot" />
              MACHINE INVENTORY
            </span>
          </div>

          <h1 className="hero-headline">
            Machine <span className="gradient-headline">Explorer.</span>
          </h1>

          <p className="hero-description">
            Inspect individual assets, predictions and machine health.
          </p>
        </div>

        <button
          className="export-button"
          onClick={fetchMachines}
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
          <button
            onClick={
              selectedMachine
                ? () => openMachine(selectedMachine)
                : fetchMachines
            }
          >
            Retry
          </button>
        </div>
      )}

      {/* MACHINE DIRECTORY */}
      {!selectedMachine && (
        <>
          {/* SUMMARY */}
          <section className="kpi-grid">
           <SummaryCard
  title="Total Machines"
  value={loading ? "..." : machines.length}
  subtitle="Unique registered machines"
  icon={<Factory size={20} />}
/>
            <SummaryCard
              title="Normal"
              value={loading ? "..." : counts.normal}
              subtitle="Above 50 RUL cycles"
              icon={<ShieldCheck size={20} />}
              accent="green"
            />

            <SummaryCard
              title="Warning"
              value={loading ? "..." : counts.warning}
              subtitle="21–50 RUL cycles"
              icon={<AlertTriangle size={20} />}
              accent="yellow"
            />

            <SummaryCard
              title="Critical"
              value={loading ? "..." : counts.critical}
              subtitle="20 or fewer RUL cycles"
              icon={<Zap size={20} />}
              accent="red"
            />
          </section>

          {/* INVENTORY TABLE */}
          <section className="panel p-5">

            <div className="panel-heading mb-5">
              <div>
                <h3>Machine Inventory</h3>
                <p>Latest prediction for each unique machine</p>
              </div>

             <span className="chart-tag">
  {filteredMachines.length} MACHINES
</span>
            </div>

            {/* SEARCH */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-5">

              <div className="command-search machine-search">
                <Search size={17} />

                <input
                  value={localSearch}
                  onChange={(event) =>
                    setLocalSearch(event.target.value)
                  }
                  placeholder="Search machine ID or model..."
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

            {loading ? (
              <div className="text-center py-16 text-gray-400">
                Loading machine inventory...
              </div>
            ) : filteredMachines.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                No matching machine records found.
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
                      <th>DETAILS</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredMachines.map((machine, index) => {
                      const status = getStatus(machine.predicted_rul);

                      return (
                        <tr key={machine.id ?? `${machine.unit}-${index}`}>

                          <td className="machine-id-cell">
                            <span className="machine-mini-icon">
                              <Cpu size={16} />
                            </span>

                            UNIT-{String(machine.unit).padStart(3, "0")}
                          </td>

                          <td>
                            {machine.last_cycle ?? "—"}
                          </td>

                          <td className="font-semibold">
                            {Number.isFinite(Number(machine.predicted_rul))
                              ? `${Number(machine.predicted_rul).toFixed(2)} cycles`
                              : "—"}
                          </td>

                          <td>
                            <StatusLabel status={status} />
                          </td>

                          <td className="record-type">
                            {machine.model_name || "—"}
                          </td>

                          <td>
                            <button
                              onClick={() => openMachine(machine)}
                              className="machine-detail-button"
                            >
                              View <ChevronRight size={15} />
                            </button>
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
  Showing {filteredMachines.length} of {machines.length} machines
</span>
              <span>Source: MechNova API</span>
            </div>

          </section>
        </>
      )}

      {/* MACHINE DETAILS */}
      {selectedMachine && (
        <section className="space-y-5">

          <button
            onClick={() => {
              setSelectedMachine(null);
              setMachineDetails(null);
              setError("");
            }}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-lime-400"
          >
            <ArrowLeft size={17} />
            Back to Machine Inventory
          </button>

          <div className="panel p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">

              <div>
                <span className="section-label">
                  MACHINE DETAILS
                </span>

                <h2 className="text-2xl font-bold mt-2">
                  UNIT-{String(selectedMachine.unit).padStart(3, "0")}
                </h2>

                <p className="text-sm text-gray-400 mt-2">
                  Industrial asset prediction profile
                </p>
              </div>

              <StatusLabel
                status={getStatus(selectedMachine.predicted_rul)}
              />

            </div>
          </div>

          <section className="kpi-grid">

            <SummaryCard
              title="Predicted RUL"
              value={`${Number(selectedMachine.predicted_rul).toFixed(2)}`}
              subtitle="Remaining useful life · cycles"
              icon={<Activity size={20} />}
            />

            <SummaryCard
              title="Last Cycle"
              value={selectedMachine.last_cycle ?? "—"}
              subtitle="Latest recorded cycle"
              icon={<Clock3 size={20} />}
            />

            <SummaryCard
              title="Model"
              value={selectedMachine.model_name || "—"}
              subtitle="Prediction model"
              icon={<Cpu size={20} />}
            />

          </section>

          <div className="panel p-5">

            <div className="panel-heading mb-5">
              <div>
                <h3>Prediction Information</h3>
                <p>Stored machine prediction details</p>
              </div>
            </div>

            {detailsLoading ? (
              <div className="text-center py-12 text-gray-400">
                Loading machine details...
              </div>
            ) : machineDetails ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                {Object.entries(machineDetails).map(([key, value]) => (
                  <div
                    key={key}
                    className="rounded-lg border border-[var(--border)] p-4"
                  >
                    <p className="text-xs uppercase tracking-wider text-gray-500">
                      {key.replaceAll("_", " ")}
                    </p>

                    <p className="mt-2 font-semibold break-words">
                      {value === null || value === undefined
                        ? "—"
                        : typeof value === "object"
                          ? JSON.stringify(value)
                          : String(value)}
                    </p>
                  </div>
                ))}

              </div>
            ) : (
              <div className="text-gray-400 text-center py-8">
                No additional details available.
              </div>
            )}

          </div>

        </section>
      )}

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
        <div className="metric-icon">{icon}</div>
      </div>

      <h2 className="metric-value">{value}</h2>

      <div className="metric-bottom">
        <span>{subtitle}</span>
      </div>
    </div>
  );
}
