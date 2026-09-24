import type { LucideIcon } from "lucide-react";

export function PageHeader({ title, description, icon: Icon, actions }: { title: string; description?: string; icon?: LucideIcon; actions?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex items-center gap-3 min-w-0">
        {Icon && <div className="hidden size-11 shrink-0 place-items-center rounded-xl bg-card text-royal shadow-soft ring-1 ring-border sm:grid"><Icon className="size-5" /></div>}
        <div className="min-w-0">
          <h1 className="text-2xl font-extrabold tracking-tight text-navy">{title}</h1>
          {description && <p className="mt-0.5 text-sm text-muted-foreground">{description}</p>}
        </div>
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}
