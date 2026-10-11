import * as RadixDialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";

export function Dialog({
  open,
  onOpenChange,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      {children}
    </RadixDialog.Root>
  );
}

export function DialogTrigger({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RadixDialog.Trigger asChild>{children}</RadixDialog.Trigger>
  );
}

export function DialogContent({
  children,
  title,
  className,
}: {
  children: React.ReactNode;
  title?: string;
  className?: string;
}) {
  return (
    <RadixDialog.Portal>
      <RadixDialog.Overlay className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
      <RadixDialog.Content
        className={
          "fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-lg border border-zinc-700 bg-zinc-950 p-6 shadow-2xl data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%]" +
          (className ? ` ${className}` : "")
        }
      >
        {title && (
          <div className="flex items-center justify-between mb-4">
            <RadixDialog.Title className="text-sm font-mono font-semibold text-zinc-100">
              {title}
            </RadixDialog.Title>
            <RadixDialog.Close asChild>
              <button className="rounded p-1 text-zinc-500 hover:text-zinc-300 transition-colors">
                <X size={14} />
              </button>
            </RadixDialog.Close>
          </div>
        )}
        {children}
      </RadixDialog.Content>
    </RadixDialog.Portal>
  );
}

export function DialogHeader({ children }: { children: React.ReactNode }) {
  return <div className="mb-4">{children}</div>;
}

export function DialogTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-sm font-mono font-semibold text-zinc-100">{children}</h2>
  );
}
