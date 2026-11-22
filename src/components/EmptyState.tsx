import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-[#CBD8D1] bg-[#F9FBFA] px-6 py-10 text-center">
      <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-[#E9F4EE] text-[#20483B]">
        <Icon className="h-5 w-5" />
      </div>
      <h3 className="mt-3.5 text-sm font-semibold text-[#102D27]">{title}</h3>
      <p className="mt-1.5 max-w-md text-xs leading-relaxed text-[#5C6B66]">
        {description}
      </p>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="mt-4 inline-flex items-center justify-center rounded-lg bg-[#102D27] px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-[#20483B] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#102D27] whitespace-nowrap shrink-0 cursor-pointer"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
