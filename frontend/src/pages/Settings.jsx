
import { useEffect, useState } from "react";
import {
  Settings as SettingsIcon,
  Activity,
  Database,
  Server,
  Cpu,
  RefreshCw,
  AlertTriangle,
  Info,
  Gauge,
  Bell,
  Mail,
  Wrench,
  Users,
  KeyRound,
  Building2,
  ShieldCheck,
  LockKeyhole,
  Clock,
  CheckCircle2,
} from "lucide-react";

const API = "http://127.0.0.1:8000";

export default function Settings() {
  const [systemHealth, setSystemHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // V1.0 notification demo state only
  const [notifications, setNotifications] = useState({
    email: true,
    critical: true,
    health: false,
    maintenance: true,
  });

  async function fetchSystemHealth() {
    try {
      setLoading(true);
      setError("");

      const response = await fetch(`${API}/api/v1/system/health`);

      if (!response.ok) {
        throw new Error("Unable to fetch system health");
      }

      const data = await response.json();
      setSystemHealth(data);
    } catch (err) {
      console.error("System health error:", err);
      setError(err.message || "System health unavailable");
      setSystemHealth(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchSystemHealth();
  }, []);

  function toggleNotification(key) {
    setNotifications((previous) => ({
      ...previous,
      [key]: !previous[key],
    }));
  }

  const backendOnline = Boolean(systemHealth);
  const databaseStatus = getDatabaseStatus(systemHealth);

  return (
    <div className="dashboard-content space-y-6">

      {/* PAGE HEADER */}
      <section className="hero-section">
        <div className="hero-copy">
          <div className="flex items-center gap-3 mb-4">
            <span className="live-badge">
              <span className="pulse-dot" />
              SYSTEM CONFIGURATION
            </span>
          </div>

          <h1 className="hero-headline">
            System <span className="gradient-headline">Settings.</span>
          </h1>

          <p className="hero-description">
            Monitor application health, infrastructure, notifications
            and platform configuration.
          </p>
        </div>

        <button
          className="export-button"
          onClick={fetchSystemHealth}
          disabled={loading}
        >
          <RefreshCw
            size={16}
            className={loading ? "animate-spin" : ""}
          />
          Refresh Status
        </button>
      </section>

      {/* ERROR */}
      {error && (
        <div className="api-error">
          <AlertTriangle size={17} />
          <span>{error}</span>
          <button onClick={fetchSystemHealth}>Retry</button>
        </div>
      )}

      {/* SYSTEM STATUS */}
      <section className="panel p-5">
        <div className="panel-heading mb-5">
          <div>
            <h3>Infrastructure Overview</h3>
            <p>Current connection and application health</p>
          </div>

          <span className="chart-tag">LIVE STATUS</span>
        </div>

        <div className="settings-status-grid">
          <StatusCard
            icon={<Server size={21} />}
            title="FastAPI Backend"
            value={
              loading
                ? "Checking..."
                : backendOnline
                  ? "Connected"
                  : "Unavailable"
            }
            status={
              loading
                ? "checking"
                : backendOnline
                  ? "online"
                  : "offline"
            }
          />

          <StatusCard
            icon={<Database size={21} />}
            title="Database"
            value={loading ? "Checking..." : databaseStatus}
            status={
              loading
                ? "checking"
                : databaseStatus.toLowerCase().includes("connected")
                  ? "online"
                  : "unknown"
            }
          />

          <StatusCard
            icon={<Activity size={21} />}
            title="System Health"
            value={
              loading
                ? "Checking..."
                : backendOnline
                  ? "Responding"
                  : "Unavailable"
            }
            status={
              loading
                ? "checking"
                : backendOnline
                  ? "online"
                  : "offline"
            }
          />
        </div>
      </section>

      {/* NOTIFICATION SETTINGS - V1.0 DEMO */}
      <section className="panel p-5">
        <div className="panel-heading mb-5">
          <div className="flex items-center gap-3">
            <div className="settings-status-icon">
              <Bell size={21} />
            </div>

            <div>
              <h3>Notification Preferences</h3>
              <p>Configure your machine alert preferences</p>
            </div>
          </div>

          <span className="chart-tag">V1.0 DEMO</span>
        </div>

        <div className="flex items-center justify-between gap-3 mb-5 rounded-xl border border-lime-400/20 bg-lime-400/5 p-3">
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Info size={16} className="text-lime-400 shrink-0" />
            Demo controls only. Actual notifications are not sent.
          </div>
          <span className="text-xs text-lime-400 font-semibold">
            PREVIEW
          </span>
        </div>

        <div className="space-y-3">
          <NotificationRow
            icon={<Mail size={19} />}
            title="Email Notifications"
            description="Receive platform notification updates through email."
            checked={notifications.email}
            onChange={() => toggleNotification("email")}
          />

          <NotificationRow
            icon={<AlertTriangle size={19} />}
            title="Critical Machine Alerts"
            description="Get notified when a machine reaches critical health."
            checked={notifications.critical}
            onChange={() => toggleNotification("critical")}
          />

          <NotificationRow
            icon={<Activity size={19} />}
            title="Machine Health Updates"
            description="Receive updates about machine health status."
            checked={notifications.health}
            onChange={() => toggleNotification("health")}
          />

          <NotificationRow
            icon={<Wrench size={19} />}
            title="Maintenance Reminders"
            description="Get reminders for upcoming maintenance activities."
            checked={notifications.maintenance}
            onChange={() => toggleNotification("maintenance")}
          />
        </div>

        <div className="mt-5 text-xs text-gray-500">
          Preferences are temporary and reset when the page is reloaded.
          Notification delivery will be implemented in a future version.
        </div>
      </section>

      {/* AUTHENTICATION SETTINGS - V2.0 */}
      <section className="panel p-5">
        <div className="panel-heading mb-5">
          <div className="flex items-center gap-3">
            <div className="settings-status-icon">
              <ShieldCheck size={21} />
            </div>

            <div>
              <h3>Authentication & Security</h3>
              <p>Enterprise identity and access management</p>
            </div>
          </div>

          <span className="chart-tag">COMING IN V2.0</span>
        </div>

        <div className="rounded-xl border border-lime-400/20 bg-lime-400/5 p-4 mb-5">
          <div className="flex items-center gap-2 mb-2">
            <LockKeyhole size={18} className="text-lime-400" />
            <strong className="text-sm text-lime-400">
              Enterprise Security Module
            </strong>
          </div>

          <p className="text-sm text-gray-400 leading-relaxed">
            Authentication, organization management and role-based
            access control are planned for MechNova V2.0.
          </p>
        </div>

        <div className="settings-info-grid">
          <FeatureRow
            icon={<Users size={18} />}
            title="User Management"
            description="Manage employees and platform users."
          />

          <FeatureRow
            icon={<KeyRound size={18} />}
            title="Login & Password"
            description="Secure login, password reset and sessions."
          />

          <FeatureRow
            icon={<Building2 size={18} />}
            title="Organization Management"
            description="Separate access for different companies."
          />

          <FeatureRow
            icon={<ShieldCheck size={18} />}
            title="Role-Based Access"
            description="Control access according to user roles."
          />
        </div>

        <div className="mt-6">
          <h4 className="text-sm font-semibold mb-3 text-gray-300">
            Planned User Roles
          </h4>

          <div className="flex flex-wrap gap-2">
            {["Super Admin", "Admin", "Engineer", "Operator", "Viewer"].map(
              (role) => (
                <span
                  key={role}
                  className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-gray-300"
                >
                  {role}
                </span>
              )
            )}
          </div>
        </div>
      </section>

      {/* APPLICATION CONFIGURATION */}
      <section className="panel p-5">
        <div className="panel-heading mb-5">
          <div>
            <h3>Application Information</h3>
            <p>MechNova platform configuration</p>
          </div>

          <SettingsIcon size={20} className="text-lime-400" />
        </div>

        <div className="settings-info-grid">
          <InfoRow label="Application" value="MechNova V1.0" />
          <InfoRow label="Platform" value="Industrial Predictive Maintenance" />
          <InfoRow label="Backend Framework" value="FastAPI" />
          <InfoRow label="Frontend Framework" value="React + Vite" />
          <InfoRow label="Database" value="MySQL" />
          <InfoRow label="ORM" value="SQLAlchemy" />
          <InfoRow label="ML Framework" value="Scikit-learn + XGBoost" />
          <InfoRow label="Experiment Tracking" value="MLflow" />
        </div>
      </section>

      {/* ML CONFIGURATION */}
      <section className="panel p-5">
        <div className="panel-heading mb-5">
          <div>
            <h3>Machine Learning Configuration</h3>
            <p>Current prototype prediction configuration</p>
          </div>

          <Cpu size={21} className="text-lime-400" />
        </div>

        <div className="settings-info-grid">
          <InfoRow label="Selected Validation Model" value="XGBoost" />
          <InfoRow label="Prediction Target" value="Remaining Useful Life (RUL)" />
          <InfoRow label="Dataset" value="NASA C-MAPSS FD001" />
          <InfoRow label="Feature Count" value="19" />
          <InfoRow label="Preprocessing" value="StandardScaler" />
          <InfoRow label="Prediction Unit" value="Cycles" />
        </div>

        <div className="settings-thresholds">
          <h4>
            <Gauge size={17} />
            Health Classification Thresholds
          </h4>

          <div className="threshold-row">
            <span className="threshold-dot normal" />
            <span>Normal</span>
            <strong>RUL above 50 cycles</strong>
          </div>

          <div className="threshold-row">
            <span className="threshold-dot warning" />
            <span>Warning</span>
            <strong>RUL 21–50 cycles</strong>
          </div>

          <div className="threshold-row">
            <span className="threshold-dot critical" />
            <span>Critical</span>
            <strong>RUL 20 cycles or below</strong>
          </div>
        </div>
      </section>

      {/* RAW HEALTH RESPONSE */}
      <section className="panel p-5">
        <div className="panel-heading mb-5">
          <div>
            <h3>System Health Response</h3>
            <p>Data returned by the FastAPI health endpoint</p>
          </div>

          <span className="chart-tag">API DIAGNOSTICS</span>
        </div>

        {loading ? (
          <div className="text-center py-8 text-gray-400">
            Checking system...
          </div>
        ) : systemHealth ? (
          <div className="settings-json-grid">
            {Object.entries(systemHealth).map(([key, value]) => (
              <InfoRow
                key={key}
                label={key.replaceAll("_", " ")}
                value={
                  typeof value === "object" && value !== null
                    ? JSON.stringify(value)
                    : String(value ?? "—")
                }
              />
            ))}
          </div>
        ) : (
          <div className="text-sm text-gray-400 py-5">
            No health response available.
          </div>
        )}
      </section>

      {/* ENGINEERING NOTICE */}
      <div className="settings-note">
        <Info size={16} />
        <span>
          This page currently provides read-only configuration visibility
          and local notification previews. Authentication and actual
          notification delivery are planned for future releases.
        </span>
      </div>

    </div>
  );
}


// STATUS CARD
function StatusCard({ icon, title, value, status }) {
  return (
    <div className={`settings-status-card ${status}`}>
      <div className="settings-status-icon">
        {icon}
      </div>

      <div>
        <p>{title}</p>
        <h3>{value}</h3>

        <span className="settings-connection-label">
          <span />
          {status === "online"
            ? "OPERATIONAL"
            : status === "offline"
              ? "OFFLINE"
              : status === "checking"
                ? "CHECKING"
                : "NOT REPORTED"}
        </span>
      </div>
    </div>
  );
}


// NOTIFICATION DEMO ROW

function NotificationRow({ icon, title, description, checked, onChange }) {
  return (
    <div className="settings-notification-row">
      <div className="settings-notification-content">
        <div className="settings-notification-icon">
          {icon}
        </div>

        <div>
          <h4>{title}</h4>
          <p>{description}</p>
        </div>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={title}
        onClick={onChange}
        className={`settings-toggle ${checked ? "active" : ""}`}
      />
    </div>
  );
}



// AUTHENTICATION FEATURE ROW
function FeatureRow({ icon, title, description }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.02] p-4">
      <div className="text-lime-400 shrink-0 mt-0.5">
        {icon}
      </div>

      <div>
        <h4 className="text-sm font-semibold text-gray-200">
          {title}
        </h4>

        <p className="text-xs text-gray-500 mt-1">
          {description}
        </p>

        <span className="inline-flex items-center gap-1 mt-2 text-[10px] font-semibold tracking-wide text-lime-400">
          <Clock size={11} />
          PLANNED FOR V2.0
        </span>
      </div>
    </div>
  );
}


// INFORMATION ROW
function InfoRow({ label, value }) {
  return (
    <div className="settings-info-row">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}


// DATABASE STATUS
function getDatabaseStatus(data) {
  if (!data || typeof data !== "object") return "Not reported";

  const candidates = [
    data.database,
    data.db,
    data.database_status,
    data.db_status,
  ];

  const value = candidates.find(
    (item) => typeof item === "string"
  );

  if (!value) return "Not reported";

  return value.toLowerCase().includes("connect")
    || value.toLowerCase().includes("healthy")
    ? "Connected"
    : value;
}
