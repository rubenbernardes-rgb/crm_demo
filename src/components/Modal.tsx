import type { ReactNode } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface ModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md";
}

export function Modal({ open, title, onClose, children, footer, size = "md" }: ModalProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      <DialogContent
        aria-describedby={undefined}
        className={cn(size === "sm" ? "sm:max-w-[420px]" : "sm:max-w-[520px]")}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <div>{children}</div>
        {footer && (
          <DialogFooter className="border-t pt-4">{footer}</DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
