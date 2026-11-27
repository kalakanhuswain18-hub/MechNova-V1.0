
import { useEffect, useState } from "react";
import {
  Factory,
  Cpu,
  Activity,
  ChevronRight,
  ArrowLeft,
  RefreshCw,
  AlertTriangle,
  ShieldCheck,
  Layers3,
  Cog,
  Zap,
} from "lucide-react";

const API = "http://127.0.0.1:8000";

function getMachineStatus(machine) {
  const status = String(
    machine.health_status || machine.status || ""
  ).toLowerCase();

  if (status.includes("critical")) return "critical";
  if (status.includes("warning") || status.includes("warn")) {
    return "warning";
  }
  if (status.includes("normal")) return "normal";

  const rul = Number(machine.predicted_rul);

  if (Number.isFinite(rul)) {
    if (rul <= 20) return "critical";
    if (rul <= 50) return "warning";
    return "normal";
  }

  return "unknown";
}

function getGroupHealth(machines) {
  const counts = {
    normal: 0,
    warning: 0,
    critical: 0,
    unknown: 0,
  };

  machines.forEach((machine) => {
    counts[getMachineStatus(machine)]++;
  });

  let status = "unknown";

  if (counts.critical > 0) status = "critical";
  else if (counts.warning > 0) status = "warning";
  else if (counts.normal === machines.length && machines.length > 0) {
    status = "normal";
  }

  return { ...counts, status };
}

// Animated industrial machine illustration
function MachineAnimation({ status }) {
  return (
    <div className={`machine-animation machine-${status}`}>
      <div className="machine-light" />

      <svg
        viewBox="0 0 220 135"
        className="machine-svg"
        role="img"
        aria-label={`Animated ${status} industrial machine`}
      >
        {/* Machine base */}
        <path
          d="M15 112 H205 L198 126 H22 Z"
          className="machine-metal"
        />

        {/* Main machine body */}
        <rect
          x="34"
          y="42"
          width="112"
          height="67"
          rx="8"
          className="machine-body"
        />

        <rect
          x="44"
          y="51"
          width="92"
          height="48"
          rx="4"
          className="machine-panel"
        />

        {/* Motor */}
        <rect
          x="52"
          y="65"
          width="48"
          height="25"
          rx="5"
          className="machine-motor"
        />

        <path
          d="M58 61 V55 M66 61 V55 M74 61 V55 M82 61 V55 M90 61 V55"
          className="machine-lines"
        />

        {/* Rotating gear */}
       
<g transform="translate(120 76)">

  {/* Symmetrical rotating outer gear */}
  <g className="machine-gear">

    <circle
      r="23"
      className="machine-gear-teeth"
    />

    {/* Eight equal gear teeth */}
    {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
      <rect
        key={angle}
        x="-5"
        y="-31"
        width="10"
        height="12"
        rx="2"
        className="machine-gear-teeth"
        transform={`rotate(${angle})`}
      />
    ))}

  </g>

  {/* Stationary center */}
  <circle
    r="16"
    className="machine-gear-inner"
  />

  <circle
    r="6"
    className="machine-gear-hole"
  />

</g>


        {/* Conveyor */}
        <rect
          x="151"
          y="91"
          width="56"
          height="13"
          rx="4"
          className="machine-conveyor"
        />

        <g className="machine-belt">
          <circle cx="158" cy="97" r="3" />
          <circle cx="174" cy="97" r="3" />
          <circle cx="190" cy="97" r="3" />
        </g>

        {/* Moving piston */}
        <g className="machine-piston">
          <rect
            x="166"
            y="40"
            width="19"
            height="35"
            rx="4"
            className="machine-cylinder"
          />
          <path
            d="M175 75 V89"
            className="machine-piston-rod"
          />
        </g>

        {/* Running indicator */}
        <circle cx="48" cy="48" r="3" className="machine-indicator" />

      </svg>

      <div className="machine-running-label">
        <span className="machine-running-dot" />
        {status === "normal"
          ? "MACHINE RUNNING"
          : status === "warning"
            ? "INSPECTION REQUIRED"
            : status === "critical"
              ? "CRITICAL CONDITION"
              : "STATUS UNKNOWN"}
      </div>
    </div>
  );
}

export default function MachineGroups() {
  const [groups, setGroups] = useState([]);
  const [groupDetails, setGroupDetails] = useState({});
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [machines, setMachines] = useState([]);

  const [loading, setLoading] = useState(true);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [error, setError] = useState("");

  async function fetchGroups() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API}/api/v1/machine-groups`);

      if (!response.ok) {
        throw new Error("Unable to fetch machine groups");
      }

      const data = await response.json();
      const groupList = data.groups || [];

      setGroups(groupList);

      // Fetch machine details for each group to calculate its health.
      const results = await Promise.all(
        groupList.map(async (group) => {
          try {
            const result = await fetch(
              `${API}/api/v1/machine-groups/${group.start_unit}-${group.end_unit}`
            );

            if (!result.ok) {
              throw new Error("Group details unavailable");
            }

            const details = await result.json();

            return {
              key: `${group.start_unit}-${group.end_unit}`,
              machines: details.machines || [],
            };
          } catch (err) {
            console.error("Group health error:", err);

            return {
              key: `${group.start_unit}-${group.end_unit}`,
              machines: [],
            };
          }
        })
      );

      const detailsMap = {};

      results.forEach((item) => {
        detailsMap[item.key] = item.machines;
      });

      setGroupDetails(detailsMap);

    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to load groups");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchGroups();
  }, []);

  async function openGroup(group) {
    try {
      setSelectedGroup(group);
      setMachines([]);
      setDetailsLoading(true);
      setError("");

      const response = await fetch(
        `${API}/api/v1/machine-groups/${group.start_unit}-${group.end_unit}`
      );

      if (!response.ok) {
        throw new Error("Unable to fetch machine details");
      }

      const data = await response.json();

      setMachines(data.machines || []);

    } catch (err) {
      setError(err.message || "Failed to load machine details");
    } finally {
      setDetailsLoading(false);
    }
  }

  const totalMachines = groups.reduce(
    (sum, group) => sum + Number(group.machine_count || 0),
    0
  );

  const totalHealth = Object.values(groupDetails)
    .flat()
    .reduce(
      (result, machine) => {
        result[getMachineStatus(machine)]++;
        return result;
      },
      { normal: 0, warning: 0, critical: 0, unknown: 0 }
    );

  const selectedHealth = {
    normal: machines.filter((m) => getMachineStatus(m) === "normal").length,
    warning: machines.filter((m) => getMachineStatus(m) === "warning").length,
    critical: machines.filter((m) => getMachineStatus(m) === "critical").length,
  };

  const selectedStatus = getGroupHealth(machines).status;

  return (
    <div className="dashboard-content machine-groups-page">

      {/* INTRO */}
      <section className="hero-section">
        <div className="hero-copy">
          <div className="flex items-center gap-3 mb-4">
            <span className="live-badge">
              <span className="pulse-dot" />
              FLEET MONITORING
            </span>
          </div>

          <h1 className="hero-headline">
            Machine <span className="gradient-headline">Groups.</span>
          </h1>

          <p className="hero-description">
            Live machine visualization and predictive health monitoring.
          </p>
        </div>

        <button
          className="export-button"
          onClick={fetchGroups}
          disabled={loading}
        >
          <RefreshCw
            size={16}
            className={loading ? "animate-spin" : ""}
          />
          Refresh Data
        </button>
      </section>

      {error && (
        <div className="api-error">
          <AlertTriangle size={17} />
          <span>{error}</span>
          <button onClick={selectedGroup
            ? () => openGroup(selectedGroup)
            : fetchGroups}
          >
            Retry
          </button>
        </div>
      )}

      {/* GROUP DIRECTORY */}
      {!selectedGroup && (
        <>
          <section className="kpi-grid">
            <SummaryCard
              title="Total Groups"
              value={loading ? "..." : groups.length}
              subtitle="Registered groups"
              icon={<Layers3 size={20} />}
            />

            <SummaryCard
              title="Total Machines"
              value={loading ? "..." : totalMachines}
              subtitle="Across all groups"
              icon={<Factory size={20} />}
            />

            <SummaryCard
              title="Normal Machines"
              value={loading ? "..." : totalHealth.normal}
              subtitle="Healthy status records"
              icon={<ShieldCheck size={20} />}
              accent="green"
            />

            <SummaryCard
              title="Warning / Critical"
              value={loading ? "..." : totalHealth.warning + totalHealth.critical}
              subtitle="Require attention"
              icon={<AlertTriangle size={20} />}
              accent="yellow"
            />
          </section>

          <section className="panel p-5">
            <div className="panel-heading mb-6">
              <div>
                <h3>Live Machine Directory</h3>
                <p>Animated equipment overview · Select a group for details</p>
              </div>

              <span className="chart-tag">
                {groups.length} GROUPS
              </span>
            </div>

            {loading ? (
              <div className="text-center py-16 text-gray-400">
                Loading machine fleet...
              </div>
            ) : (
              <div className="machine-group-grid">
                {groups.map((group) => {
                  const key = `${group.start_unit}-${group.end_unit}`;
                  const groupMachines = groupDetails[key] || [];
                  const health = getGroupHealth(groupMachines);

                  return (
                    <button
                      key={key}
                      onClick={() => openGroup(group)}
                      className={`machine-group-card status-${health.status}`}
                    >
                      <div className="machine-card-top">
                        <div>
                          <span className="machine-group-eyebrow">
                            INDUSTRIAL FLEET
                          </span>

                          <h3>{group.group_name}</h3>

                          <p>
                            Units {group.start_unit} – {group.end_unit}
                          </p>
                        </div>

                        <ChevronRight size={20} />
                      </div>

                      <MachineAnimation status={health.status} />

                      <div className="machine-card-stats">
                        <div>
                          <Cpu size={16} />
                          <span>{group.machine_count} Machines</span>
                        </div>

                        <span className={`machine-status-label ${health.status}`}>
                          <span />
                          {health.status.toUpperCase()}
                        </span>
                      </div>

                      <div className="machine-health-breakdown">
                        <span className="health-normal">
                          {health.normal} Normal
                        </span>
                        <span className="health-warning">
                          {health.warning} Warning
                        </span>
                        <span className="health-critical">
                          {health.critical} Critical
                        </span>
                      </div>

                      <div className="machine-card-bottom">
                        <span>VIEW MACHINE DETAILS</span>
                        <ChevronRight size={15} />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {!loading && groups.length === 0 && (
              <div className="text-center py-12 text-gray-400">
                No machine groups found.
              </div>
            )}
          </section>
        </>
      )}

      {/* SELECTED GROUP */}
      {selectedGroup && (
        <section className="space-y-5">

          <button
            onClick={() => {
              setSelectedGroup(null);
              setMachines([]);
              setError("");
            }}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-lime-400"
          >
            <ArrowLeft size={17} />
            Back to Machine Groups
          </button>

          <div className={`machine-detail-banner status-${selectedStatus}`}>
            <div>
              <span className="machine-group-eyebrow">
                MACHINE GROUP DETAILS
              </span>

              <h2>{selectedGroup.group_name}</h2>

              <p>
                Units {selectedGroup.start_unit} – {selectedGroup.end_unit}
              </p>
            </div>

            <MachineAnimation status={selectedStatus} />
          </div>

          <section className="kpi-grid">
            <SummaryCard
              title="Normal"
              value={detailsLoading ? "..." : selectedHealth.normal}
              subtitle="Healthy machines"
              icon={<ShieldCheck size={20} />}
              accent="green"
            />

            <SummaryCard
              title="Warning"
              value={detailsLoading ? "..." : selectedHealth.warning}
              subtitle="Inspection required"
              icon={<AlertTriangle size={20} />}
              accent="yellow"
            />

            <SummaryCard
              title="Critical"
              value={detailsLoading ? "..." : selectedHealth.critical}
              subtitle="Immediate attention"
              icon={<Zap size={20} />}
              accent="red"
            />
          </section>

          <div className="panel p-5">
            <div className="panel-heading mb-5">
              <div>
                <h3>Machine Inventory</h3>
                <p>Latest stored prediction for each machine</p>
              </div>
            </div>

            {detailsLoading ? (
              <div className="text-center py-12 text-gray-400">
                Loading machine details...
              </div>
            ) : machines.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                No machine records available.
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
                    </tr>
                  </thead>

                  <tbody>
                    {machines.map((machine) => {
                      const status = getMachineStatus(machine);

                      return (
                        <tr key={machine.unit}>
                          <td className="machine-id-cell">
                            <Cpu size={16} />
                            UNIT-{String(machine.unit).padStart(3, "0")}
                          </td>

                          <td>{machine.last_cycle ?? "—"}</td>

                          <td>
                            {Number(machine.predicted_rul).toFixed(2)} cycles
                          </td>

                          <td>
                            <span className={`machine-status-label ${status}`}>
                              <span />
                              {status.toUpperCase()}
                            </span>
                          </td>

                          <td>{machine.model_name || "—"}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  );
}

function SummaryCard({ title, value, subtitle, icon, accent = "default" }) {
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
