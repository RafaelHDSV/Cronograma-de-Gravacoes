import * as react_jsx_runtime from 'react/jsx-runtime';
export { F as FetchPublicSummaryOptions, P as PublicSummary, V as VisitCountVisibilityOptions, f as fetchPublicSummary, a as formatVisitCountLabel, i as isLocalDevHost, r as resolveVisitCountLabel, s as shouldShowVisitCount } from './publicSummary-BHF2Sqxn.js';

type VisitCountFooterProps = {
    projectKey: string;
    /** Override do host da API (default: produção). */
    apiHost?: string;
    className?: string;
};
/**
 * Contador público de visitas (últimos 30 dias). Em localhost / 127.0.0.1 / [::1]
 * sempre renderiza (mesmo com 0 ou falha da API). Em produção só aparece com
 * pageviews > 0. Não dispara coleta.
 */
declare function VisitCountFooter({ projectKey, apiHost, className }: VisitCountFooterProps): react_jsx_runtime.JSX.Element | null;

interface VieiraAnalyticsProps {
    projectKey: string;
    respectDnt?: boolean;
}
declare function VieiraAnalytics(props: VieiraAnalyticsProps): null;

export { VieiraAnalytics, type VieiraAnalyticsProps, VisitCountFooter, type VisitCountFooterProps };
