// src/cms/components/report/jasperCredentials.ts
//
// Jasper runs one account per tenant (name pattern `<tenant>_<username>`) and
// each tenant account has its own default password, so the tenant "SKYICT" with
// the signed-in user "wisarud.tec" signs in as "SKYICT_wisarud.tec" /
// "Skyict@123". Both rules live in reportConfig.json
// (`jasperUsernameFormat`, `jasperDefaultPasswords`) so the convention can change
// without a code change; this module only applies them.
//
// The password is the TENANT's default, not the signed-in user's own password:
// the app never holds that (login sends it to the BFF and drops it).
//
// Kept pure and SDK-free on purpose: it is called from ReportComponet.tsx and
// covered by jasperCredentials.test.ts.

/** Placeholder for the tenant name the user signed in with (`user.organization`). */
const TENANT_TOKEN = /\[tenant\]/g;

/** Placeholder for the signed-in user's login name (`user.username`). */
const USERNAME_TOKEN = /\[username\]/g;

export interface JasperIdentity {
  /** Tenant name from the signed-in user, e.g. "SKYICT" / "SKY-AI". */
  tenant?: string | null;
  /** Login name of the signed-in user, e.g. "wisarud.tec". */
  username?: string | null;
}

/** The two rules from reportConfig.json that decide what Jasper is sent. */
export interface JasperLoginConfig {
  jasperUsernameFormat: string;
  jasperDefaultPasswords?: Record<string, string>;
}

export interface ResolvedJasperLogin {
  /** Rendered username, or null when the tenant/user pair is incomplete. */
  username: string | null;
  /** The tenant's default password, or null when the tenant has no entry. */
  password: string | null;
}

const normalizePart = (value?: string | null): string =>
  typeof value === "string" ? value.trim() : "";

/**
 * Renders the Jasper login username from the configured format.
 *
 * Returns `null` when either part is missing — never a half-built value such as
 * "undefined_wisarud.tec" or "_wisarud.tec". `user.organization` is backfilled
 * at login but is not guaranteed to arrive from the BFF, so the caller must
 * decide what to do with a `null` (openReport.ts falls back to the shared
 * account from VITE_JASPER_USERNAME and says so in the console).
 */
export function buildJasperUsername(
  format: string,
  identity: JasperIdentity,
): string | null {
  const tenant = normalizePart(identity.tenant);
  const loginUsername = normalizePart(identity.username);

  if (!tenant || !loginUsername) {
    return null;
  }

  // Replacer functions, not string arguments: `$&`, `$1` and friends in a
  // string replacement are interpreted by String#replace, so a tenant or
  // username containing `$` would be mangled.
  const withTenant = format.replace(TENANT_TOKEN, () => tenant);
  const built = withTenant.replace(USERNAME_TOKEN, () => loginUsername).trim();

  return built === "" ? null : built;
}

/**
 * Looks up the tenant's default Jasper password.
 *
 * Matching is trim + case-insensitive because `user.organization` comes from a
 * server payload whose casing/whitespace we do not control — the same
 * convention `resolveFixture` uses in @/core/mocks/entitlements. An unknown
 * tenant returns `null` rather than a guess, so the caller can fall back to the
 * shared account loudly instead of silently trying a made-up password.
 */
export function resolveJasperPassword(
  defaultPasswords: Record<string, string> | undefined | null,
  identity: JasperIdentity,
): string | null {
  const tenant = normalizePart(identity.tenant);

  if (!tenant || !defaultPasswords) {
    return null;
  }

  const wantedKey = tenant.toUpperCase();

  for (const [key, value] of Object.entries(defaultPasswords)) {
    if (normalizePart(key).toUpperCase() !== wantedKey) {
      continue;
    }
    const password = normalizePart(value);
    if (password) {
      return password;
    }
  }

  return null;
}

/** Both halves of the Jasper sign-in, each null when it cannot be resolved. */
export function resolveJasperLogin(
  config: JasperLoginConfig,
  identity: JasperIdentity,
): ResolvedJasperLogin {
  return {
    username: buildJasperUsername(config.jasperUsernameFormat, identity),
    password: resolveJasperPassword(config.jasperDefaultPasswords, identity),
  };
}
