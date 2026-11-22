import type { TimeSeriesPoint } from '../types/dashboard';

interface ChartPanelProps {
  title: string;
  subtitle: string;
  series: TimeSeriesPoint[];
  valuePrefix?: string;
  variant?: 'bar' | 'area';
  isConfigured: boolean;
  isLoading?: boolean;
  emptyMessage: string;
}

export function ChartPanel({
  title,
  subtitle,
  series,
  valuePrefix = '',
  variant = 'bar',
  isConfigured,
  isLoading = false,
  emptyMessage,
}: ChartPanelProps) {
  const hasValues = series.length > 0 && series.some((pt) => pt.value > 0);
  const maxVal = hasValues ? Math.max(...series.map((s) => s.value), 1) : 1;

  return (
    <section className="rounded-xl border border-[#DDE6E1] bg-white p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-[#EDF2EF] pb-3.5">
        <div>
          <h2 className="text-sm font-semibold text-[#102D27]">{title}</h2>
          <p className="mt-0.5 text-xs text-[#5C6B66]">{subtitle}</p>
        </div>
        <span className="font-mono text-xs text-[#5C6B66] tabular-nums">
          {isConfigured ? (hasValues ? 'Últimos 7 dias' : 'Sem lançamentos') : 'Não conectado'}
        </span>
      </div>

      <div className="mt-4">
        {isLoading ? (
          <div className="h-52 w-full animate-pulse rounded-lg bg-[#F4F7F5]" />
        ) : !isConfigured || !hasValues ? (
          <div className="relative flex h-52 flex-col items-center justify-center rounded-lg border border-dashed border-[#D3DFD8] bg-[#F9FBFA] px-4 text-center">
            {/* Subtle structural grid lines in SVG */}
            <svg
              className="pointer-events-none absolute inset-0 h-full w-full opacity-45"
              preserveAspectRatio="none"
              viewBox="0 0 400 180"
              aria-hidden="true"
            >
              <line x1="0" y1="36" x2="400" y2="36" stroke="#DDE6E1" strokeDasharray="4 4" />
              <line x1="0" y1="72" x2="400" y2="72" stroke="#DDE6E1" strokeDasharray="4 4" />
              <line x1="0" y1="108" x2="400" y2="108" stroke="#DDE6E1" strokeDasharray="4 4" />
              <line x1="0" y1="144" x2="400" y2="144" stroke="#DDE6E1" />
            </svg>
            <div className="relative z-10 max-w-sm">
              <p className="text-xs font-semibold text-[#102D27]">
                {!isConfigured
                  ? 'Conexão Supabase pendente'
                  : 'Nenhum dado registrado no período'}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-[#5C6B66]">
                {emptyMessage}
              </p>
            </div>
          </div>
        ) : (
          <div className="h-52 w-full">
            <svg
              viewBox="0 0 420 180"
              className="h-full w-full overflow-visible"
              role="img"
              aria-label={title}
            >
              {/* Horizontal reference lines */}
              {[30, 70, 110, 150].map((y) => (
                <line
                  key={y}
                  x1="28"
                  y1={y}
                  x2="412"
                  y2={y}
                  stroke="#E8EFEA"
                  strokeWidth="1"
                />
              ))}

              {variant === 'area' ? (
                <>
                  {(() => {
                    const stepX =
                      series.length > 1 ? 360 / (series.length - 1) : 360;
                    const points = series.map((pt, idx) => {
                      const x = 40 + idx * stepX;
                      const y = 148 - (pt.value / maxVal) * 112;
                      return { x, y, pt };
                    });
                    const linePath = points
                      .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
                      .join(' ');
                    const areaPath = `${linePath} L ${
                      points[points.length - 1].x
                    } 150 L ${points[0].x} 150 Z`;

                    return (
                      <>
                        <path d={areaPath} fill="#B8F0D1" fillOpacity="0.45" />
                        <path
                          d={linePath}
                          fill="none"
                          stroke="#102D27"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        {points.map(({ x, y, pt }) => (
                          <g key={pt.label}>
                            <circle
                              cx={x}
                              cy={y}
                              r="4"
                              fill="#102D27"
                              stroke="#FFFFFF"
                              strokeWidth="1.5"
                            />
                            <text
                              x={x}
                              y="168"
                              textAnchor="middle"
                              className="fill-[#5C6B66] font-mono text-[10px]"
                            >
                              {pt.label}
                            </text>
                            <title>
                              {`${pt.label}: ${valuePrefix}${pt.value}`}
                            </title>
                          </g>
                        ))}
                      </>
                    );
                  })()}
                </>
              ) : (
                <>
                  {series.map((pt, idx) => {
                    const slotWidth = 370 / series.length;
                    const barWidth = Math.min(32, slotWidth * 0.56);
                    const x = 36 + idx * slotWidth + (slotWidth - barWidth) / 2;
                    const height = Math.max(4, (pt.value / maxVal) * 112);
                    const y = 150 - height;

                    return (
                      <g key={pt.label}>
                        <rect
                          x={x}
                          y={y}
                          width={barWidth}
                          height={height}
                          rx="4"
                          fill="#20483B"
                        />
                        <text
                          x={x + barWidth / 2}
                          y="168"
                          textAnchor="middle"
                          className="fill-[#5C6B66] font-mono text-[10px]"
                        >
                          {pt.label}
                        </text>
                        <title>
                          {`${pt.label}: ${valuePrefix}${pt.value}`}
                        </title>
                      </g>
                    );
                  })}
                </>
              )}
            </svg>
          </div>
        )}
      </div>
    </section>
  );
}
