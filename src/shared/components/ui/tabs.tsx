import * as RadixTabs from "@radix-ui/react-tabs";

export function Tabs({
  value,
  onValueChange,
  children,
}: {
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <RadixTabs.Root value={value} onValueChange={onValueChange}>
      {children}
    </RadixTabs.Root>
  );
}

export function TabsList({ children }: { children: React.ReactNode }) {
  return (
    <RadixTabs.List
      className="inline-flex h-9 w-full items-center justify-center rounded-lg bg-zinc-900 p-1 text-zinc-400 border border-zinc-800"
    >
      {children}
    </RadixTabs.List>
  );
}

export function TabsTrigger({
  value,
  children,
}: {
  value: string;
  children: React.ReactNode;
}) {
  return (
    <RadixTabs.Trigger
      value={value}
      className={
        "inline-flex flex-1 items-center justify-center whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-mono font-medium ring-offset-zinc-950 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-zinc-800 data-[state=active]:text-emerald-400 data-[state=active]:shadow-sm"
      }
    >
      {children}
    </RadixTabs.Trigger>
  );
}

export function TabsContent({
  value,
  children,
}: {
  value: string;
  children: React.ReactNode;
}) {
  return (
    <RadixTabs.Content
      value={value}
      className="mt-2 ring-offset-zinc-950 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500"
    >
      {children}
    </RadixTabs.Content>
  );
}
