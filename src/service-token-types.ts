// Types only: shared by the settings block (client) and @nish/ui/server, so the client bundle
// never pulls in node code.

/** A service token as the settings page sees it: never the hash. */
export interface ServiceTokenView {
  id: string;
  name: string;
  scopes: string[];
  created: string; // as committed (ISO date or datetime)
  source: 'file' | 'env'; // service-tokens.json or SERVICE_TOKENS
  revoked: boolean;
  revokedAt?: string; // ISO datetime
}
export interface ServiceTokenListResponse {
  tokens: ServiceTokenView[];
}
export interface ServiceTokenRevokeResponse {
  tokens: ServiceTokenView[];
}
