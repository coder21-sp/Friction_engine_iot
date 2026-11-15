'use client';

export function HeatmapGrid({
  items,
}: {
  items: Array<{
    id: string;
    label: string;
    value: number;
    sublabel?: string;
  }>;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4">
      {items.map((item) => {
        const color =
          item.value >= 0.75
            ? ' '
            : item.value >= 0.5
              ? ' '
              : item.value >= 0.3
                ? ' '
                : ' ';

        return (
          <div
            key={item.id}
            className={`rounded-sm border border-border  ${color} p-4   transition-transform duration-300 `}
          >
            <p className="text-xs uppercase tracking-wide opacity-80">{item.sublabel || 'Live'}</p>
            <h3 className="mt-2 text-sm font-semibold">{item.label}</h3>
            <p className="mt-3 text-3xl font-semibold">{Math.round(item.value * 100)}</p>
          </div>
        );
      })}
    </div>
  );
}
