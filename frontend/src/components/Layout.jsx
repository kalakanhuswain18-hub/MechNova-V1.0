
import { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import {
  Bell,
  Search,
  Sun,
  Moon,
  UserCircle,
  Wifi,
  ShieldCheck,
} from "lucide-react";

import Sidebar from "./Sidebar";

const pageTitles = {
  "/": {
    title: "Overview",
    subtitle: "Industrial intelligence at a glance",
  },
  "/machine-groups": {
    title: "Machine Groups",
    subtitle: "Monitor and manage machine groups",
  },
  "/machines": {
    title: "Machines",
    subtitle: "Explore your industrial machine fleet",
  },
  "/attention-required": {
    title: "Attention Required",
    subtitle: "Machines that need immediate attention",
  },
  "/predictions": {
    title: "Predictions",
    subtitle: "Predictive maintenance insights",
  },
  "/settings": {
    title: "Settings",
    subtitle: "Manage your platform preferences",
  },
};

// MECHNOVA MACHINE LOADER
function MachineLoader() {
  return (
    <div className="mechnova-loader">
      <div className="loader-content">

        <div className="machine-loader-visual">

          {/* OUTER ROTATING GEAR */}
          <svg
            className="loader-outer-gear"
            viewBox="0 0 120 120"
            fill="none"
          >
            <path
              d="M52 5 H68 L71 15 L80 18 L89 12 L101 24 L95 33 L99 42 L110 45 V62 L99 65 L96 74 L102 83 L90 95 L81 89 L72 93 L69 105 H52 L49 94 L40 91 L31 97 L19 85 L25 76 L21 67 L10 64 V47 L21 44 L24 35 L18 26 L30 14 L39 20 L48 16 Z"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinejoin="round"
            />
            <circle
              cx="60"
              cy="55"
              r="34"
              stroke="currentColor"
              strokeWidth="2"
              strokeDasharray="5 5"
              opacity="0.5"
            />
          </svg>

          {/* INNER ROTATING GEAR */}
          <svg
            className="loader-inner-gear"
            viewBox="0 0 80 80"
            fill="none"
          >
            <path
              d="M34 3 H46 L49 12 L57 15 L65 10 L72 18 L67 26 L70 34 L77 37 V47 L70 50 L67 58 L72 66 L64 74 L56 69 L48 72 L45 79 H34 L31 70 L23 67 L15 72 L7 64 L12 56 L9 48 L2 45 V35 L9 32 L12 24 L7 16 L15 8 L23 13 L31 10 Z"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinejoin="round"
            />
            <circle
              cx="40"
              cy="40"
              r="12"
              stroke="currentColor"
              strokeWidth="3"
            />
          </svg>

          {/* CENTER HUB */}
          <div className="loader-center">
            <div className="loader-center-dot" />
          </div>

          <span className="loader-scan-ring" />
        </div>

        <h1 className="loader-brand">
          MECH<span>NOVA</span>
        </h1>

        <p className="loader-caption">
          INDUSTRIAL INTELLIGENCE
        </p>

        <div className="loader-status">
          <span className="loader-status-dot" />
          INITIALIZING SYSTEM...
        </div>

      </div>
    </div>
  );
}

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false);
  const [theme, setTheme] = useState("dark");
  const [searchQuery, setSearchQuery] = useState("");
  const [isNavigating, setIsNavigating] = useState(true);

  const location = useLocation();

  const currentPage = pageTitles[location.pathname] || {
    title: "MechNova",
    subtitle: "Industrial Predictive Maintenance Platform",
  };

  // Show loader on initial load and every route change
  useEffect(() => {
    setIsNavigating(true);

    const timer = setTimeout(() => {
      setIsNavigating(false);
    }, 500);

    return () => clearTimeout(timer);
  }, [location.pathname]);

  return (
    <div className={`app-shell ${theme} min-h-screen flex`}>

      {/* SIDEBAR */}
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed(!collapsed)}
      />

      {/* MAIN AREA */}
      <div className="main-column min-w-0 flex-1 flex flex-col">

        {/* HEADER */}
        <header className="topbar">

          <div className="topbar-heading">
            <p>MECHNOVA / WORKSPACE</p>
            <h2>{currentPage.title}</h2>
          </div>

          {/* GLOBAL SEARCH */}
          <div className="command-search">
            <Search size={19} />
            <input
              type="text"
              placeholder="Search machines, predictions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <span className="search-shortcut">Ctrl K</span>
          </div>

          {/* HEADER ACTIONS */}
          <div className="header-actions">

            <div className="system-status">
              <Wifi size={16} />
              <span>System Online</span>
            </div>

            <button
              type="button"
              className="header-icon-button"
              aria-label="Notifications"
              title="Notifications"
            >
              <Bell size={19} />
              <span className="notification-dot" />
            </button>

            <button
              type="button"
              className="header-icon-button"
              aria-label="Toggle theme"
              title="Toggle theme"
              onClick={() =>
                setTheme((previous) =>
                  previous === "dark" ? "light" : "dark"
                )
              }
            >
              {theme === "dark" ? (
                <Sun size={19} />
              ) : (
                <Moon size={19} />
              )}
            </button>

            <button
              type="button"
              className="profile-button"
              title="User Profile"
            >
              <UserCircle size={22} />
            </button>

          </div>
        </header>

        {/* PAGE CONTENT */}
        <main className="main-content flex-1">
          <div className="page-subtitle">
            <p>{currentPage.subtitle}</p>
          </div>

          <Outlet
            context={{
              theme,
              searchQuery,
            }}
          />
        </main>

        {/* FOOTER */}
        <footer className="app-footer">
          <div className="footer-left">
            <span>© 2026 MechNova</span>
            <span className="footer-divider">·</span>
            <span>Predict the Failure. Prevent the Downtime.</span>
          </div>

          <div className="footer-right">
            <span className="footer-system-status">
              <ShieldCheck size={14} />
              Platform Operational
            </span>
            <span>Version 1.0.0</span>
          </div>
        </footer>

      </div>

      {/* FULL SCREEN MACHINE LOADER */}
      {isNavigating && <MachineLoader />}

    </div>
  );
}
