// src/cms/components/report/jasperCredentials.test.ts
//
// Pins the Jasper sign-in contract: username "[tenant]_[username]"
// (SKYICT_wisarud.tec) and the TENANT's default password (Skyict@123).
//
// The important half is the null cases. A missing tenant/user must produce a
// null username so openReport.ts can fall back to the shared account instead of
// submitting "undefined_wisarud.tec"; an unconfigured tenant must produce a null
// password instead of a guessed one.
import { describe, expect, it } from "vitest";
import {
  buildJasperUsername,
  resolveJasperLogin,
  resolveJasperPassword,
} from "./jasperCredentials";

const FORMAT = "[tenant]_[username]";

const PASSWORDS: Record<string, string> = {
  SKYICT: "Skyict@123",
  SKYCC: "Skycc@123",
};

describe("buildJasperUsername", () => {
  it("joins the tenant and the signed-in username", () => {
    expect(
      buildJasperUsername(FORMAT, { tenant: "SKYICT", username: "wisarud.tec" }),
    ).toBe("SKYICT_wisarud.tec");
  });

  it("trims surrounding whitespace on both parts", () => {
    expect(
      buildJasperUsername(FORMAT, { tenant: " SKYICT ", username: " wisarud.tec\n" }),
    ).toBe("SKYICT_wisarud.tec");
  });

  it("returns null when the tenant is missing", () => {
    expect(buildJasperUsername(FORMAT, { username: "wisarud.tec" })).toBeNull();
    expect(buildJasperUsername(FORMAT, { tenant: null, username: "wisarud.tec" })).toBeNull();
    expect(buildJasperUsername(FORMAT, { tenant: "   ", username: "wisarud.tec" })).toBeNull();
  });

  it("returns null when the username is missing", () => {
    expect(buildJasperUsername(FORMAT, { tenant: "SKYICT" })).toBeNull();
    expect(buildJasperUsername(FORMAT, { tenant: "SKYICT", username: "" })).toBeNull();
  });

  it("keeps `$` sequences in the values literal", () => {
    expect(
      buildJasperUsername(FORMAT, { tenant: "SKY$ICT", username: "a$&b" }),
    ).toBe("SKY$ICT_a$&b");
  });

  it("honours whatever the configured format adds around the tokens", () => {
    expect(
      buildJasperUsername("[tenant]-[username]@cc", {
        tenant: "SKYICT",
        username: "wisarud.tec",
      }),
    ).toBe("SKYICT-wisarud.tec@cc");
  });

  it("returns null when the format renders to nothing", () => {
    expect(buildJasperUsername("   ", { tenant: "SKYICT", username: "wisarud.tec" })).toBeNull();
  });
});

describe("resolveJasperPassword", () => {
  it("returns the tenant's default password", () => {
    expect(resolveJasperPassword(PASSWORDS, { tenant: "SKYICT" })).toBe("Skyict@123");
    expect(resolveJasperPassword(PASSWORDS, { tenant: "SKYCC" })).toBe("Skycc@123");
  });

  it("matches the tenant key regardless of casing or padding", () => {
    expect(resolveJasperPassword(PASSWORDS, { tenant: " skyict " })).toBe("Skyict@123");
    expect(resolveJasperPassword({ " skycc ": "Skycc@123" }, { tenant: "SKYCC" })).toBe("Skycc@123");
  });

  it("does not depend on the signed-in username", () => {
    expect(
      resolveJasperPassword(PASSWORDS, { tenant: "SKYICT", username: "someone.else" }),
    ).toBe("Skyict@123");
  });

  it("returns null for a tenant with no configured password", () => {
    expect(resolveJasperPassword(PASSWORDS, { tenant: "SKY-AI" })).toBeNull();
  });

  it("returns null when the tenant is missing or the map is absent", () => {
    expect(resolveJasperPassword(PASSWORDS, {})).toBeNull();
    expect(resolveJasperPassword(PASSWORDS, { tenant: "  " })).toBeNull();
    expect(resolveJasperPassword(undefined, { tenant: "SKYICT" })).toBeNull();
  });

  it("returns null when the configured entry is blank", () => {
    expect(resolveJasperPassword({ SKYICT: "   " }, { tenant: "SKYICT" })).toBeNull();
  });
});

describe("resolveJasperLogin", () => {
  it("resolves the username and the tenant default password together", () => {
    expect(
      resolveJasperLogin(
        { jasperUsernameFormat: FORMAT, jasperDefaultPasswords: PASSWORDS },
        { tenant: "SKYICT", username: "wisarud.tec" },
      ),
    ).toEqual({ username: "SKYICT_wisarud.tec", password: "Skyict@123" });
  });

  it("resolves both halves independently when one is missing", () => {
    expect(
      resolveJasperLogin(
        { jasperUsernameFormat: FORMAT, jasperDefaultPasswords: PASSWORDS },
        { tenant: "SKYICT" },
      ),
    ).toEqual({ username: null, password: "Skyict@123" });

    expect(
      resolveJasperLogin(
        { jasperUsernameFormat: FORMAT, jasperDefaultPasswords: PASSWORDS },
        { tenant: "SKY-AI", username: "wisarud.tec" },
      ),
    ).toEqual({ username: "SKY-AI_wisarud.tec", password: null });
  });
});
