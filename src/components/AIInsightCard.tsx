'use client';


interface AIInsightCardProps {
    insight: {
        id: string;
        insightType: string;
        detectedIssue: string;
        recommendation: string;
        confidenceLevel: number;
        impactScore: number;
    };
}

export function AIInsightCard({ insight }: AIInsightCardProps) {
    const isAnomaly = insight.insightType === 'anomaly';

    return (
        <article
            className="rounded-sm border border-border bg-card p-6"
        >
            <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                    <div className={`flex items-center gap-2 px-3 py-1 rounded-sm text-xs font-medium border ${isAnomaly
                            ? 'bg-red-500/10 text-red-800 dark:text-red-200 border-red-500/20'
                            : 'bg-indigo-500/10 text-indigo-800 dark:text-indigo-200 border-indigo-500/20'
                        }`}>

                        {insight.insightType.toUpperCase()}
                    </div>
                    <span className="text-xs text-muted-foreground">
                        {(insight.confidenceLevel * 100).toFixed(0)}% Confidence
                    </span>
                </div>

                <h3 className="text-lg font-semibold text-foreground mb-2">
                    {insight.detectedIssue}
                </h3>

                <p className="text-sm text-muted-foreground mb-4">
                    {insight.recommendation}
                </p>

                <div className="flex items-center justify-between mt-auto">
                    <div className="flex flex-col">
                        <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Impact Score</span>
                        <span className="text-xl font-bold text-foreground">{insight.impactScore.toFixed(1)}</span>
                    </div>

                </div>
            </div>
        </article>
    );
}
