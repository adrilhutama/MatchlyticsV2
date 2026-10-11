import * as RadixDialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";

/**
 * Mobile bottom-sheet drawer with drag handle and slide transitions.
 */
export function Drawer({
  open,
  onOpenChange,
  children,
  title,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  title?: string;
}) {
  return (
    <RadixDialog.Root open={open} onOpenChange={onOpenChange}>
      <RadixDialog.Portal>
        <RadixDialog.Overlay className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <RadixDialog.Content
          className="fixed inset-x-0 bottom-0 z-50 mx-auto max-h-[85vh] w-full max-w-md translate-y-full rounded-t-xl border-t border-zinc-700 bg-zinc-950 p-4 shadow-2xl data-[state=open]:animate-slide-up data-[state=closed]:animate-slide-down"
          style={{
            animationDuration: "200ms",
            animationTimingFunction: "cubic-bezier(0.32, 0.72, 0, 1)",
          }}
        >
          {/* Drag handle */}
          <div className="flex justify-center mb-3">
            <div className="h-1 w-10 rounded-full bg-zinc-700" />
          </div>
          {/* Title */}
          {title && (
            <div className="flex items-center justify-between mb-3">
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
          {/* Scrollable content */}
          <div className="overflow-y-auto max-h-[calc(85vh-4rem)]">{children}</div>
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
}
