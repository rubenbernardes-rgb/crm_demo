import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

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
      <div className="sticky top-0 z-20 flex items-center gap-3.5 border-b bg-background px-7 py-4">
        <div>
          {back && (
            <Button variant="ghost" size="sm" className="mb-1 -ml-2 px-2 text-muted-foreground" asChild>
              <Link to={back.to}>
                <ChevronLeft size={15} />
                {back.label}
              </Link>
            </Button>
          )}
          <h1 className="text-lg font-semibold tracking-tight">
            {title}
            {crumb && <span className="font-medium text-muted-foreground"> · {crumb}</span>}
          </h1>
        </div>
        {actions && <div className="ml-auto flex items-center gap-2">{actions}</div>}
      </div>
      <div className="w-full max-w-[1180px] px-7 pb-16 pt-6">{children}</div>
    </>
  );
}

export function Loading({ label = "Loading…" }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground">
      <Loader2 className="animate-spin" size={18} />
      {label}
    </div>
  );
}

export function ErrorState({ message }: { message: string }) {
  return (
    <div className="my-6 rounded-md border border-destructive/20 bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive">
      {message}
    </div>
  );
}
