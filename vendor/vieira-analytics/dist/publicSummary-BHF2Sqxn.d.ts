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
/** Hosts de desenvolvimento local — contador sempre renderiza (mesmo com 0 / sem summary). */
declare function isLocalDevHost(hostname?: string): boolean;
type VisitCountVisibilityOptions = {
    /** Força modo local (testes). Se omitido, usa `isLocalDevHost()`. */
    local?: boolean;
};
declare function shouldShowVisitCount(summary: PublicSummary | null, options?: VisitCountVisibilityOptions): boolean;
/** Label do rodapé; em local sempre retorna texto (0 se sem summary). */
declare function resolveVisitCountLabel(summary: PublicSummary | null, options?: VisitCountVisibilityOptions): string | null;
/**
 * Lê o resumo público de pageviews (30d). Falha silenciosa → `null`.
 */
declare function fetchPublicSummary(projectKey: string, options?: FetchPublicSummaryOptions): Promise<PublicSummary | null>;

export { type FetchPublicSummaryOptions as F, type PublicSummary as P, type VisitCountVisibilityOptions as V, formatVisitCountLabel as a, fetchPublicSummary as f, isLocalDevHost as i, resolveVisitCountLabel as r, shouldShowVisitCount as s };
