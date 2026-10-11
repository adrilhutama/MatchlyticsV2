import React from "react";
import { DevModeSwitch } from "@features/auth/components/DevModeSwitch.js";
import { MobileTerminalView } from "./components/mobile/MobileTerminalView.js";

/**
 * TerminalContainer — mobile-first root component.
 *
 * On larger screens wraps the mobile view in a centered viewport
 * (max-w-md) to preserve the mobile experience on desktop for now.
 */
export function TerminalContainer() {
  return (
    <div className="min-h-screen bg-black text-zinc-100">
      <div className="mx-auto max-w-md border-x border-zinc-800/40 shadow-2xl min-h-screen bg-zinc-950">
        <MobileTerminalView />
      </div>
      <DevModeSwitch />
    </div>
  );
}
