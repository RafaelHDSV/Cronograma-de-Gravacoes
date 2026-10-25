import * as react from 'react';
import { ReactNode } from 'react';

declare const SUPPORT_EMAIL = "rafaelvieira1720@gmail.com";
declare const SUPPORT_SLA = "at\u00E9 5 dias \u00FAteis";
declare const DATA_SUBJECT_SLA = "at\u00E9 15 dias";
declare const CONTROLLER_NAME = "Rafael Vieira";
type LegalBasis = 'contrato' | 'consentimento' | 'legitimo_interesse';
interface DataGroup {
    /** Nome do grupo, ex.: "Conta", "Diário de leitura". */
    group: string;
    items: string[];
    /** Para que o app usa esse grupo. */
    purpose: string;
    basis: LegalBasis;
}
interface Processor {
    name: string;
    purpose: string;
    /** País ou região onde o dado é processado, quando conhecido. */
    location?: string;
}
type SensitiveKind = 'saude' | 'financeiro' | 'terceiros';
interface InstitucionalRoutes {
    home: string;
    privacy: string;
    terms: string;
    /** Tela de entrada, para quem não está logado. */
    signIn?: string;
}
interface InstitucionalConfig {
    appName: string;
    /** Identificador curto, usado no nome do arquivo exportado e no assunto do e-mail. */
    appSlug: string;
    /** URL pública canônica (VITE_PUBLIC_URL). */
    publicUrl: string;
    /** true para apps com conta: liga privacidade, termos, aceite e dados da conta. */
    hasAccount: boolean;
    /** O app publica /privacidade e /termos. Padrão: igual a hasAccount. */
    legalPages?: boolean;
    /** Versão vigente dos textos legais, AAAA-MM-DD. Mudar a versão reabre o aceite para todos. */
    legalVersion: string;
    /** Uma frase sobre o que o app faz, usada no objeto dos termos. */
    description: string;
    dataInventory: DataGroup[];
    processors: Processor[];
    sensitive?: SensitiveKind[];
    /** Avisos de domínio, ex.: "não substitui orientação médica". */
    domainNotices?: string[];
    /** Consentimento destacado para dados de saúde (LGPD art. 11, I). */
    healthConsent?: 'required' | 'optional';
    /** O app trata dados de terceiros cadastrados pelo cliente (ex.: Devos). */
    processesThirdPartyData?: {
        subjects: string;
        description: string;
    };
    /** Parágrafos extras da política, específicos do app. */
    extraPrivacyNotes?: string[];
    routes?: Partial<InstitucionalRoutes>;
}
declare const DEFAULT_ROUTES: InstitucionalRoutes;
declare function defineInstitucionalConfig(config: InstitucionalConfig): InstitucionalConfig;
declare function hasLegalPages(config: InstitucionalConfig): boolean;
declare function resolveRoutes(config: InstitucionalConfig): InstitucionalRoutes;
declare function formatLegalDate(version: string): string;
declare function deletedAccountMessage(appName: string): string;
declare function supportMailto(appName: string, subject?: string): string;

interface InternalLinkProps {
    to: string;
    className?: string;
    children?: ReactNode;
}
/** Assinatura chamável e não ComponentType: o `Link` do react-router declara `to: To`, mais largo que string. */
type LinkComponent = (props: InternalLinkProps) => ReactNode;
interface InstitucionalContextValue {
    config: InstitucionalConfig;
    Link: LinkComponent;
}
interface InstitucionalProviderProps {
    config: InstitucionalConfig;
    /** Componente de link do router (ex.: `Link` do react-router-dom). Sem ele, usa `<a href>`. */
    linkComponent?: LinkComponent;
    children: ReactNode;
}
declare function InstitucionalProvider({ config, linkComponent, children }: InstitucionalProviderProps): react.JSX.Element;
declare function useInstitucional(): InstitucionalContextValue;

interface AccountDataSectionProps {
    /** Devolve o objeto que vai para o JSON baixado. */
    onExport: () => Promise<unknown>;
    /** Exclui a conta; deve lançar Error com mensagem legível quando falhar (ex.: senha incorreta). */
    onDelete: (password: string) => Promise<void>;
    className?: string;
}
/** Seção "Privacidade e dados" das configurações: baixar os dados e excluir a conta. */
declare function AccountDataSection({ onExport, onDelete, className }: AccountDataSectionProps): react.JSX.Element;

interface ErrorPageProps {
    /** Código do evento no Sentry, quando houver. */
    eventId?: string | null;
    onReload?: () => void;
}
/**
 * Tela "algo deu errado". Usa `<a href>` de propósito: depois de um erro de renderização,
 * uma navegação completa é mais segura que reaproveitar a árvore do React.
 */
declare function ErrorPage({ eventId, onReload }: ErrorPageProps): react.JSX.Element;

interface HealthConsentProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
    error?: string | null;
    /** O que o app faz com dados de saúde, em uma frase. */
    description: string;
    id?: string;
}
/** Consentimento específico e destacado para dados de saúde (LGPD art. 11, I). */
declare function HealthConsent({ checked, onChange, error, description, id }: HealthConsentProps): react.JSX.Element;

interface LegalAcceptance {
    termsVersion: string;
    privacyVersion: string;
    acceptedAt: string;
    healthConsentVersion?: string | null;
    healthConsentAt?: string | null;
    healthConsentRevokedAt?: string | null;
}
interface AcceptInput {
    healthConsent: boolean;
}
interface LegalGateProps {
    /** `undefined` enquanto carrega; `null` quando a conta nunca aceitou. */
    acceptance: LegalAcceptance | null | undefined;
    onAccept: (input: AcceptInput) => Promise<void>;
    onSignOut?: () => void;
    /** Obrigatório quando o app pede consentimento de saúde. */
    healthConsentDescription?: string;
    children: ReactNode;
}
declare function needsLegalAcceptance(acceptance: LegalAcceptance | null | undefined, legalVersion: string, healthConsent?: 'required' | 'optional'): boolean;
/** Bloqueia a área logada até a conta aceitar a versão vigente dos termos e da política. */
declare function LegalGate({ acceptance, onAccept, onSignOut, healthConsentDescription, children }: LegalGateProps): react.JSX.Element;

interface LegalLinksProps {
    className?: string;
    /** Mostra "Suporte: e-mail — resposta em até 5 dias úteis". */
    showSupport?: boolean;
}
/** Bloco compacto para o menu ou as configurações da área logada ("Ajuda e contato"). */
declare function LegalLinks({ className, showSupport }: LegalLinksProps): react.JSX.Element;

interface LegalPageProps {
    kind: 'privacy' | 'terms';
    /** Destino do link de volta. Padrão: routes.home. */
    backHref?: string;
    /** Rótulo ao lado do ícone. Padrão: "Início". */
    backLabel?: string;
    /** Dentro do chrome do app (área logada): sem viewport cheia, sem rodapé próprio. */
    embedded?: boolean;
}
declare function LegalPage({ kind, backHref, backLabel, embedded }: LegalPageProps): react.JSX.Element;

interface NotFoundPageProps {
    /** Destino do botão Início (home logada ou tela de entrada). Padrão: routes.home. */
    homeHref?: string;
}
declare function NotFoundPage({ homeHref }: NotFoundPageProps): react.JSX.Element;

interface SeoProps {
    /** Nome da página. O título final é "<title> · <App>". Sem title, fica só o nome do app. */
    title?: string;
    description?: string;
    noindex?: boolean;
    /** Caminho canônico; padrão é o pathname atual. */
    path?: string;
}
/**
 * Metadados por rota, aplicados no cliente. Robôs de preview (LinkedIn, WhatsApp) não executam JS:
 * o Open Graph de compartilhamento vive no index.html de cada app.
 */
declare function Seo({ title, description, noindex, path }: SeoProps): null;

interface SiteFooterProps {
    className?: string;
}
/** Rodapé institucional: Privacidade e Termos. Sem nome do app e sem e-mail de suporte. */
declare function SiteFooter({ className }: SiteFooterProps): react.JSX.Element | null;

interface SupportLinkProps {
    subject?: string;
    className?: string;
    children?: ReactNode;
}
declare function SupportLink({ subject, className, children }: SupportLinkProps): react.JSX.Element;

interface TermsAcceptanceProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
    /** Mensagem exibida quando o envio foi tentado sem marcar. */
    error?: string | null;
    id?: string;
}
/** Checkbox obrigatório do cadastro. Desmarcado por padrão; links abrem em nova aba. */
declare function TermsAcceptance({ checked, onChange, error, id }: TermsAcceptanceProps): react.JSX.Element;

export { type AcceptInput, AccountDataSection, type AccountDataSectionProps, CONTROLLER_NAME, DATA_SUBJECT_SLA, DEFAULT_ROUTES, type DataGroup, ErrorPage, type ErrorPageProps, HealthConsent, type HealthConsentProps, type InstitucionalConfig, InstitucionalProvider, type InstitucionalProviderProps, type InstitucionalRoutes, type InternalLinkProps, type LegalAcceptance, type LegalBasis, LegalGate, type LegalGateProps, LegalLinks, type LegalLinksProps, LegalPage, type LegalPageProps, type LinkComponent, NotFoundPage, type NotFoundPageProps, type Processor, SUPPORT_EMAIL, SUPPORT_SLA, type SensitiveKind, Seo, type SeoProps, SiteFooter, type SiteFooterProps, SupportLink, type SupportLinkProps, TermsAcceptance, type TermsAcceptanceProps, defineInstitucionalConfig, deletedAccountMessage, formatLegalDate, hasLegalPages, needsLegalAcceptance, resolveRoutes, supportMailto, useInstitucional };
