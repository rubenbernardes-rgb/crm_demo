import { useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { Building2, LayoutDashboard, Users, Briefcase, LayoutGrid, Moon, Sun } from "lucide-react";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/organizations", label: "Organizations", icon: Building2 },
  { to: "/contacts", label: "Contacts", icon: Users },
  { to: "/deals", label: "Deals", icon: Briefcase },
  { to: "/pipeline", label: "Pipeline", icon: LayoutGrid },
];

// Stored choice wins; otherwise follow the system preference.
function initialDark(): boolean {
  const stored = localStorage.getItem("crm-theme");
  if (stored === "dark" || stored === "light") return stored === "dark";
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function Layout() {
  const [dark, setDark] = useState(initialDark);

  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("crm-theme", next ? "dark" : "light");
  };

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">C</div>
          <div className="brand-name">
            Personal CRM
          </div>
          <button
            type="button"
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
            title={dark ? "Switch to light theme" : "Switch to dark theme"}
          >
            {dark ? <Sun /> : <Moon />}
          </button>
        </div>
        <nav className="nav">
          {NAV.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
              >
                <Icon />
                {item.label}
              </NavLink>
            );
          })}
        </nav>
        <div className="sidebar-footer">Local &amp; private — your data lives on this machine.</div>
      </aside>
      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}
