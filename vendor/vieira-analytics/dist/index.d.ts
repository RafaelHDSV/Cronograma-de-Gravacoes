interface VieiraConfig {
    projectKey: string;
    respectDnt?: boolean;
}
interface ClientContext {
    deviceType: 'mobile' | 'tablet' | 'desktop';
    browser: string | null;
    os: string | null;
}
interface PageviewPayload {
    projectKey: string;
    type: 'pageview';
    path: string;
    referrer: string;
    language: string;
    screen: string;
    timezone: string;
    client: ClientContext;
    utm?: {
        source?: string;
        medium?: string;
        campaign?: string;
    };
    sessionId: string;
    timestamp: string;
}

declare function trackPageview(config: VieiraConfig): void;

declare const OPT_OUT_STORAGE_KEY = "vieira:analytics:optout";
/** Flag de sessão no `globalThis`, lida também por `@vieira/institucional`. */
declare const OPT_OUT_MEMORY_KEY = "__vieiraAnalyticsOptOut";
declare function isOptedOut(): boolean;
declare function optOut(): void;
declare function optIn(): void;

export { OPT_OUT_MEMORY_KEY, OPT_OUT_STORAGE_KEY, type PageviewPayload, type VieiraConfig, isOptedOut, optIn, optOut, trackPageview };
