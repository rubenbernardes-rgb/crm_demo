import { NavLink, Outlet } from "react-router-dom";
import { Building2, LayoutDashboard, Users, Briefcase, LayoutGrid } from "lucide-react";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/organizations", label: "Organizations", icon: Building2 },
  { to: "/contacts", label: "Contacts", icon: Users },
  { to: "/deals", label: "Deals", icon: Briefcase },
  { to: "/pipeline", label: "Pipeline", icon: LayoutGrid },
];

export function Layout() {
  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">C</div>
          <div className="brand-name">
            Changed by the harness
          </div>
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
