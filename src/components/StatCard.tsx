import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  label: string;
  value: string;
  helperText: string;
  icon: LucideIcon;
  isLoading?: boolean;
  tone?: 'default' | 'alert';
}

export function StatCard({
  label,
  value,
  helperText,
  icon: Icon,
  isLoading = false,
  tone = 'default',
}: StatCardProps) {
  return (
    <div className="flex flex-col justify-between rounded-xl border border-[#DDE6E1] bg-white p-4 transition-colors hover:border-[#BFD1C7]">
      <div className="flex items-start justify-between gap-2.5">
        <p className="text-xs font-medium leading-snug text-[#5C6B66]">{label}</p>
        <div
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
            tone === 'alert'
              ? 'bg-[#FEF3C7] text-[#B45309]'
              : 'bg-[#F4F7F5] text-[#20483B]'
          }`}
          aria-hidden="true"
        >
          <Icon className="h-4 w-4" />
        </div>
      </div>

      <div className="mt-3">
        {isLoading ? (
          <div className="h-8 w-24 animate-pulse rounded bg-[#EBF1EE]" />
        ) : (
          <p
            className={`font-mono text-2xl font-semibold tracking-tight tabular-nums ${
              tone === 'alert' ? 'text-[#B45309]' : 'text-[#102D27]'
            }`}
          >
            {value}
          </p>
        )}
        <p className="mt-2 text-[11px] text-[#64748B] leading-snug">{helperText}</p>
      </div>
    </div>
  );
}
