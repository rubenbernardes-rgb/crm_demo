import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft } from "lucide-react";

interface PageProps {
  title: string;
  crumb?: ReactNode;
  back?: { to: string; label: string };
  actions?: ReactNode;
  children: ReactNode;
}

export function Page({ title, crumb, back, actions, children }: PageProps) {
  return (
    <>
      <div className="topbar">
        <div>
          {back && (
            <Link to={back.to} className="back-link">
              <ChevronLeft size={15} />
              {back.label}
            </Link>
          )}
          <h1>
            {title}
            {crumb && <span className="crumb"> · {crumb}</span>}
          </h1>
        </div>
        {actions && <div className="topbar-actions">{actions}</div>}
      </div>
      <div className="content">{children}</div>
    </>
  );
}

export function Loading({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="loading">
      <span className="spinner" style={{ display: "inline-block", verticalAlign: "middle", marginRight: 8 }} />
      {label}
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return <div className="error-box" style={{ margin: "24px 0" }}>{message}</div>;
}
