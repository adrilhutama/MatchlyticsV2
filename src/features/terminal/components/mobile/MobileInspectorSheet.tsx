import React, { useState } from "react";
import { X } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@shared/components/ui/tabs.js";
import { MobileInspectorEdgeTab } from "./MobileInspectorEdgeTab.js";
import { MobileInspectorMatrixTab } from "./MobileInspectorMatrixTab.js";
import { MobileInspectorProjectionsTab } from "./MobileInspectorProjectionsTab.js";
import type { SanitizedMatch } from "@core/types/domain.js";
import type { MatchEdge } from "../../hooks/useTerminalData.js";

export interface MobileInspectorSheetProps {
  match: SanitizedMatch | null;
  edge?: MatchEdge;
  onClose: () => void;
}

export const MobileInspectorSheet = React.memo(function MobileInspectorSheet({
  match,
  edge,
  onClose,
}: MobileInspectorSheetProps) {
  const [activeTab, setActiveTab] = useState("edge");

  if (!match) return null;

  return (
    <div className="fixed inset-0 z-40 bg-zinc-950 overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 z-10 border-b border-zinc-800/80 bg-zinc-950/95 px-4 py-3 backdrop-blur-md">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-mono text-sm font-semibold text-zinc-100">
              {match.homeTeam} vs {match.awayTeam}
            </p>
            <p className="text-xs font-mono text-zinc-500">
              {match.kickoff.toLocaleString()}
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-2 text-zinc-500 hover:text-zinc-300"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      <div className="px-4 py-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="edge">Edge</TabsTrigger>
            <TabsTrigger value="matrix">Matrix</TabsTrigger>
            <TabsTrigger value="projections">Projections</TabsTrigger>
          </TabsList>

          <TabsContent value="edge">
            <MobileInspectorEdgeTab match={match} edge={edge} />
          </TabsContent>

          <TabsContent value="matrix">
            <MobileInspectorMatrixTab match={match} />
          </TabsContent>

          <TabsContent value="projections">
            <MobileInspectorProjectionsTab match={match} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
});
