import * as react from 'react';
import { ComponentPropsWithRef, ReactNode } from 'react';

/** A service token as the settings page sees it: never the hash. */
interface ServiceTokenView {
    id: string;
    name: string;
    scopes: string[];
    created: string;
    source: 'file' | 'env';
    revoked: boolean;
    revokedAt?: string;
}
interface ServiceTokenListResponse {
    tokens: ServiceTokenView[];
}
interface ServiceTokenRevokeResponse {
    tokens: ServiceTokenView[];
}

interface UseServiceTokens {
    /** undefined until the first load finishes. */
    tokens: ServiceTokenView[] | undefined;
    loading: boolean;
    error: string | null;
    reload: () => void;
    /** Revokes the token with this id and replaces `tokens` with the server's new list. Throws the ApiError on failure. */
    revoke: (id: string) => Promise<void>;
}
/** Loads the app's service tokens from `url` (GET) and revokes one with POST `${url}/<id>/revoke`.
 *  The server side is `mountServiceTokenRoutes` from `@nish/ui/server/hono`. */
declare function useServiceTokens(url?: string): UseServiceTokens;
interface ServiceTokensSectionProps extends Omit<ComponentPropsWithRef<"section">, "title" | "children"> {
    /** undefined = loading. */
    tokens: ServiceTokenView[] | undefined;
    error?: string | null;
    onRetry?: () => void;
    /** Revokes the token. Reject to keep the dialog open with the error. */
    onRevoke: (id: string) => Promise<void>;
    /** Default: the `serviceTokens` string ("Service tokens"). */
    title?: ReactNode;
    /** Default: the `serviceTokensIntro` string. */
    description?: ReactNode;
    /** Anchor id on the section. Default "service-tokens". */
    id?: string;
    className?: string;
    /** Shown when the list is empty. Default "No service tokens. No machine client can read this app." */
    emptyMessage?: ReactNode;
    /** The body of the revoke confirmation. Default explains that the token stops working and cannot be restored. */
    revokeBody?: ReactNode;
    /** The "created <date>" part of a token's description. Default `created ${when}`. */
    createdLabel?: (when: string) => string;
    /** Added to the description of a token that comes from the SERVICE_TOKENS environment variable. Default "from SERVICE_TOKENS". */
    envSourceLabel?: string;
}
/** The settings block that lists an app's service tokens with a Revoke button each. */
declare function ServiceTokensSection({ tokens, error, onRetry, onRevoke, title: titleProp, description: descriptionProp, id, className, emptyMessage, revokeBody, createdLabel, envSourceLabel, ...rest }: ServiceTokensSectionProps): react.JSX.Element;

export { ServiceTokensSection, useServiceTokens };
export type { ServiceTokenListResponse, ServiceTokenRevokeResponse, ServiceTokenView, ServiceTokensSectionProps, UseServiceTokens };
