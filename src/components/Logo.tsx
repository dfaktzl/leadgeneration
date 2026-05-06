import { Terminal } from "lucide-react";

export function Logo({ className }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 font-bold tracking-tight ${className ?? ""}`}>
      <span
        className="inline-flex items-center justify-center h-8 w-8 rounded-md bg-primary text-primary-foreground"
        style={{ boxShadow: "var(--shadow-glow)" }}
        aria-hidden
      >
        <Terminal size={16} strokeWidth={2.5} />
      </span>
      <span>
        Matt<span className="text-primary">.</span>tech
      </span>
    </span>
  );
}
