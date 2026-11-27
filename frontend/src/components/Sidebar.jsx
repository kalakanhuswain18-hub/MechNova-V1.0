
import { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  Activity,
  LayoutDashboard,
  Factory,
  Cpu,
  AlertTriangle,
  Gauge,
  Settings,
  PanelLeft,
  Menu,
  X,
} from "lucide-react";

const navigation = [
  { label: "Overview", path: "/", icon: LayoutDashboard },
  { label: "Machine Groups", path: "/machine-groups", icon: Factory },
  { label: "Machines", path: "/machines", icon: Cpu },
  {
    label: "Attention Required",
    path: "/attention-required",
    icon: AlertTriangle,
  },
  { label: "Predictions", path: "/predictions", icon: Gauge },
];


function MechNovaLogo() {
  return (
    <svg viewBox="0 0 64 64" width="38" height="38" fill="none">

      {/* ROTATING OUTER GEAR */}
      <g className="mechnova-logo-gear">
        <path
          d="M26 4H38L40 10L46 13L52 10L59 20L55 25L56 32L62 36L58 48L51 48L46 53L46 60H34L31 54L24 52L18 56L9 48L12 42L10 35L4 31L8 19L15 19L20 14L20 7L26 4Z"
          stroke="#73877A"
          strokeWidth="2.5"
          strokeLinejoin="round"
        />
      </g>

      {/* STATIONARY INNER CIRCLE */}
      <circle
        cx="32"
        cy="32"
        r="17"
        stroke="#A3FF12"
        strokeWidth="2.5"
      />

      {/* STATIONARY HEARTBEAT */}
      <path
        d="M16 33H24L28 24L34 41L39 29L43 33H49"
        stroke="#A3FF12"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <circle cx="32" cy="32" r="3" fill="#A3FF12" />

    </svg>
  );
}


export default function Sidebar({ collapsed, onToggle }) {
  const [mobileOpen, setMobileOpen] = useState(false);

  function closeMobileMenu() {
    setMobileOpen(false);
  }

  return (
    <>
      {/* MOBILE MENU BUTTON */}
      <button
        type="button"
        className="mobile-menu-trigger"
        onClick={() => setMobileOpen(true)}
        aria-label="Open navigation menu"
        aria-expanded={mobileOpen}
      >
        <Menu size={23} />
      </button>

      {/* MOBILE BACKDROP */}
      <div
        className={`sidebar-backdrop ${mobileOpen ? "show" : ""}`}
        onClick={closeMobileMenu}
        aria-hidden="true"
      />

      {/* SIDEBAR */}
      <aside
        className={`sidebar ${
          collapsed ? "sidebar-collapsed" : "sidebar-expanded"
        } ${mobileOpen ? "mobile-sidebar-open" : ""} flex flex-col`}
      >
        <div className="sidebar-header">
          <div className={`brand-container ${collapsed ? "brand-centered" : ""}`}>
            <div className="brand-mark">
              <MechNovaLogo />
            </div>

            {!collapsed && (
              <div className="brand-copy">
                <h1 className="text-xl font-bold">MechNova</h1>
                <p className="text-[10px] tracking-[3px] text-gray-400">
                  INDUSTRIAL AI
                </p>
              </div>
            )}
          </div>

          <div className="sidebar-toggle-row">
            {/* DESKTOP COLLAPSE */}
            <button
              type="button"
              className="icon-button sidebar-toggle desktop-sidebar-toggle"
              onClick={onToggle}
              title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              <PanelLeft size={19} />
            </button>

            {/* MOBILE CLOSE */}
            <button
              type="button"
              className="mobile-sidebar-close"
              onClick={closeMobileMenu}
              aria-label="Close navigation menu"
            >
              <X size={22} />
            </button>
          </div>
        </div>

        {!collapsed && (
          <p className="section-label sidebar-section-label">
            WORKSPACE
          </p>
        )}

        <nav className="sidebar-navigation">
          {navigation.map(({ label, path, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              end={path === "/"}
              onClick={closeMobileMenu}
              className={({ isActive }) =>
                `nav-item ${isActive ? "active" : ""} ${
                  collapsed ? "nav-collapsed" : ""
                }`
              }
              title={collapsed ? label : ""}
            >
              <Icon size={19} />
              {!collapsed && <span>{label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-bottom">
          {!collapsed && (
            <p className="section-label sidebar-section-label">SYSTEM</p>
          )}

          <NavLink
            to="/settings"
            onClick={closeMobileMenu}
            className={({ isActive }) =>
              `nav-item ${isActive ? "active" : ""} ${
                collapsed ? "nav-collapsed" : ""
              }`
            }
            title={collapsed ? "Settings" : ""}
          >
            <Settings size={19} />
            {!collapsed && <span>Settings</span>}
          </NavLink>

          {!collapsed && (
            <div className="system-card">
              <div className="flex items-center gap-2 text-sm">
                <span className="pulse-dot" />
                System Operational
              </div>
              <p className="text-xs text-gray-500 mt-2">
                MechNova Engine v1.0
              </p>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
