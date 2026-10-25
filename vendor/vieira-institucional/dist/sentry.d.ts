import * as react from 'react';
import { ReactNode } from 'react';

interface InitSentryOptions {
    dsn?: string;
    /** SHA do commit do deploy. */
    release?: string;
    environment?: string;
    /** Só envia erros de scripts servidos por estes hosts. */
    allowUrls?: Array<string | RegExp>;
    /** Normalmente `import.meta.env.PROD`. */
    enabled?: boolean;
}
/** Liga o Sentry só quando habilitado e com DSN. Devolve true se inicializou. */
declare function initSentry({ dsn, release, environment, allowUrls, enabled }: InitSentryOptions): boolean;
interface AppErrorBoundaryProps {
    children: ReactNode;
}
/** Error boundary da raiz: captura no Sentry (se ligado) e mostra o ErrorPage com o código do evento. */
declare function AppErrorBoundary({ children }: AppErrorBoundaryProps): react.JSX.Element;

export { AppErrorBoundary, type AppErrorBoundaryProps, type InitSentryOptions, initSentry };
