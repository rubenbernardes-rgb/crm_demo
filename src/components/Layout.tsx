import { NavLink, Outlet } from "react-router-dom";
import { Building2, LayoutDashboard, Users, Briefcase, LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/organizations", label: "Organizations", icon: Building2 },
  { to: "/contacts", label: "Contacts", icon: Users },
  { to: "/deals", label: "Deals", icon: Briefcase },
  { to: "/pipeline", label: "Pipeline", icon: LayoutGrid },
];

export function Layout() {
  return (
    <div className="grid min-h-screen grid-cols-[248px_1fr]">
      <aside className="sticky top-0 flex h-screen flex-col border-r bg-card px-3.5 py-5">
        <div className="mb-5 flex items-center gap-2.5 px-1.5">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-primary text-lg font-extrabold text-primary-foreground">
            C
          </div>
          <div className="text-[15px] font-bold tracking-tight">Personal CRM</div>
        </div>
        <nav className="flex flex-col gap-0.5">
          {NAV.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
                    isActive && "bg-primary/10 font-semibold text-primary"
                  )
                }
              >
                <Icon size={17} />
                {item.label}
              </NavLink>
            );
          })}
        </nav>
        <div className="mt-auto border-t px-2.5 pt-3 text-xs text-muted-foreground">
          Local &amp; private — your data lives on this machine.
        </div>
      </aside>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
