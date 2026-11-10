interface PublicSummary {
    projectKey: string;
    period: '30d';
    pageviews: number;
    asOf: string;
}
interface FetchPublicSummaryOptions {
    /** Host da API sem path (ex.: https://analytics.getvieira.com). Default: produção. */
    apiHost?: string;
    period?: '30d';
    /** Timeout em ms. Default: 3000. */
    timeoutMs?: number;
    signal?: AbortSignal;
    fetchImpl?: typeof fetch;
}
declare function formatVisitCountLabel(pageviews: number): string;
declare function shouldShowVisitCount(summary: PublicSummary | null): boolean;
/**
 * Lê o resumo público de pageviews (30d). Falha silenciosa → `null`.
 */
declare function fetchPublicSummary(projectKey: string, options?: FetchPublicSummaryOptions): Promise<PublicSummary | null>;

export { type FetchPublicSummaryOptions as F, type PublicSummary as P, formatVisitCountLabel as a, fetchPublicSummary as f, shouldShowVisitCount as s };
