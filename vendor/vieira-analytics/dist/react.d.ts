import * as react_jsx_runtime from 'react/jsx-runtime';
export { F as FetchPublicSummaryOptions, P as PublicSummary, f as fetchPublicSummary, a as formatVisitCountLabel, s as shouldShowVisitCount } from './publicSummary-BYRY9kjD.js';

interface VisitCountFooterProps {
    projectKey: string;
    /** Host da API sem path. Default: produção. */
    apiHost?: string;
    className?: string;
}
/**
 * Linha de rodapé com pageviews dos últimos 30 dias.
 * Não dispara coleta; falha silenciosa (não renderiza).
 */
declare function VisitCountFooter({ projectKey, apiHost, className }: VisitCountFooterProps): react_jsx_runtime.JSX.Element | null;

interface VieiraAnalyticsProps {
    projectKey: string;
    respectDnt?: boolean;
}
declare function VieiraAnalytics(props: VieiraAnalyticsProps): null;

export { VieiraAnalytics, type VieiraAnalyticsProps, VisitCountFooter, type VisitCountFooterProps };
