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

export { type PageviewPayload, type VieiraConfig, trackPageview };
