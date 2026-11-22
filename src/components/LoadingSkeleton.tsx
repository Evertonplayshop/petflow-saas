interface LoadingSkeletonProps {
  rows?: number;
}

export function LoadingSkeleton({ rows = 4 }: LoadingSkeletonProps) {
  return (
    <div className="space-y-3" aria-busy="true" aria-label="Carregando dados">
      {Array.from({ length: rows }).map((_, idx) => (
        <div
          key={idx}
          className="flex h-10 items-center justify-between gap-4 rounded-lg border border-[#EDF2EF] bg-[#F9FBFA] px-4"
        >
          <div className="h-3.5 w-1/3 animate-pulse rounded bg-[#E2EBE6]" />
          <div className="h-3.5 w-1/4 animate-pulse rounded bg-[#E2EBE6]" />
          <div className="h-3.5 w-16 animate-pulse rounded bg-[#E2EBE6]" />
        </div>
      ))}
    </div>
  );
}
