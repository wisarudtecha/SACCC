// src/core/utils/authService.ts
import { API_CONFIG, isSSOAvailable } from "@/core/config/api";
import { store } from "@/core/store";
import { authApi } from "@/core/store/api/authApi";
import { authGqlEndpoints } from "@/core/store/api/graphql/authGqlApi";
import { SYSTEM_ROLE, USE_GRAPHQL } from "@/core/utils/constants";
import { HttpClient } from "@/core/utils/httpClient";
import { PermissionManager } from "@/core/utils/permissionManager";
import { TokenManager } from "@/core/utils/tokenManager";
import type { LoginCredentials, LoginResponse, RegisterData, User } from "@/core/types/auth";
import type { Permission, Role } from "@/core/types/role";
import { AUTH_AUTHORITY_KEY, AUTH_LOCK_KEY, AUTH_SOURCE_KEY, SSO_TAKEOVER_KEY } from "@/cms/utils/constants";

export class AuthService {
  private static httpClient = HttpClient.getInstance();

  // Mock responses for demo mode
  private static createMockPermissions(): Permission[] {
    const mockRoleId = "d6381714-8e89-47de-9d16-859131cdc5dc";
    const mockOrgId = "434c0f16-b7ea-4a7b-a74b-e2e0f859f549";
    const now = new Date().toISOString();
    
    // Based on your API structure - creating comprehensive permissions
    const permissions = [
      // Dispatch permissions
      { permId: "dispatch.view", id: 88 },
      { permId: "dispatch.create", id: 89 },
      { permId: "dispatch.update", id: 90 },
      { permId: "dispatch.delete", id: 91 },
      
      // User permissions
      { permId: "user.view", id: 92 },
      { permId: "user.create", id: 93 },
      { permId: "user.edit", id: 94 },
      { permId: "user.delete", id: 95 },
      
      // Report permissions
      { permId: "report.view", id: 96 },
      { permId: "report.export", id: 97 },
      
      // Monitor permissions
      { permId: "monitor.live", id: 98 },
      { permId: "monitor.playback", id: 99 },
      
      // Additional CMS permissions
      { permId: "ticket.view", id: 100 },
      { permId: "ticket.create", id: 101 },
      { permId: "ticket.update", id: 102 },
      { permId: "ticket.delete", id: 103 },
      { permId: "workflow.view", id: 104 },
      { permId: "workflow.create", id: 105 },
      { permId: "workflow.update", id: 106 },
      { permId: "sop.view", id: 107 },
      { permId: "sop.create", id: 108 },
      { permId: "sop.update", id: 109 },
      { permId: "dashboard.view", id: 110 },
      { permId: "settings.view", id: 111 },
      { permId: "settings.update", id: 112 }
    ];

    return permissions.map((perm) => ({
      id: String(perm.id),
      orgId: mockOrgId,
      roleId: mockRoleId,
      permId: perm.permId,
      active: true,
      createdAt: now,
      updatedAt: now,
      createdBy: "system",
      updatedBy: "system",
      groupName: perm.permId.split(".")[0],
      permName: perm.permId.split(".")[1] || perm.permId,
    }));
  }

  private static createMockRole(): Role {
    const permissions = this.createMockPermissions();
    const now = new Date().toISOString();
    
    return {
      id: "d6381714-8e89-47de-9d16-859131cdc5dc",
      roleName: "Administrator",
      orgId: "434c0f16-b7ea-4a7b-a74b-e2e0f859f549",
      // permissions: permissions,
      permissions: permissions.map(p => p.permId),
      active: true,
      createdAt: now,
      updatedAt: now,
      createdBy: "system",
      updatedBy: "system"
    };
  }

  static createMockUser(
    username: string,
    // roleType: string = "admin"
  ): User {
    const role = this.createMockRole();
    // const permissions = PermissionManager.extractPermissionIds(role.permissions);
    const permissions = PermissionManager.extractPermissionIds(role.permissions as unknown as Permission[]);
    const now = new Date().toISOString();
    
    return {
      id: "1",
      username: username,
      name: username === "admin" ? "Admin Sky AI" : "Demo User",
      orgId: "434c0f16-b7ea-4a7b-a74b-e2e0f859f549",
      roleId: role.id,
      // role: role as User["role"],
      role: role.roleName.toLowerCase() as User["role"],
      department: "IT",
      lastLogin: new Date(),
      // permissions: role === "admin" ? ["read", "write", "delete", "admin"] : ["read", "write"],
      // permission: permissions,
      permission: permissions.reduce((acc: Record<string, string[]>, perm) => {
        const group = (typeof perm === "string")
          ? perm.split(".")[0]
          : (perm as Permission).groupName;
        const permId = (typeof perm === "string")
          ? perm
          : (perm as Permission).permId;
        if (!acc[group]) acc[group] = [];
        acc[group].push(permId);
        return acc;
      }, {}),
      organization: "SKY-AI",
      avatar: undefined,
      isEmailVerified: true,
      twoFactorEnabled: false,
      active: true,
      createdAt: now,
      updatedAt: now,
      createdBy: "system",
      updatedBy: "system"
    };
  }

  static createMockJWT(user: User): string {
    const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
    const payload = btoa(JSON.stringify({ 
      sub: user.id, 
      username: user.username,
      role: user.role,
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours from now
    }));
    const signature = btoa("mock_signature_" + Date.now());
    return `${header}.${payload}.${signature}`;
  }

  static async login(credentials: LoginCredentials): Promise<LoginResponse> {
    // console.log("🔐 Attempting login for:", credentials.username);
    
    try {
      const params: Record<string, string> = {
        username: credentials.username || "",
        password: credentials.password || "",
        organization: String(credentials.organization) || ""
      };
      
      if (API_CONFIG.DEMO_MODE) {
        // Demo mode - simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        if (credentials.username === "wisarud.tec" && credentials.password === "P@ssw0rd") {
          const mockUser = this.createMockUser(credentials.username);
          const accessToken = this.createMockJWT(mockUser);
          
          console.log("✅ Demo login successful");
          return {
            user: mockUser,
            accessToken: accessToken,
            refreshToken: "mock_refresh_token_" + Date.now(),
            expiresIn: 86400, // 24 hours
            tokenType: "Bearer"
          };
        }
        else {
          throw new Error("Invalid credentials. Use wisarud.tec / P@ssw0rd");
        }
      }
      else if (USE_GRAPHQL) {
        const response = await store.dispatch(authGqlEndpoints.login.initiate(params)).unwrap();

        return {
          accessToken: response.login.accessToken,
          refreshToken: response.login.refreshToken,
          expiresIn: response.login.expiresIn,
          user: response.login.user,
          tokenType: "Bearer"
        };
      }
      else {
        // Real API mode - make actual HTTP request
        // console.log("🌐 Making real API request to:", `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.LOGIN}`);

        // Real API mode
        params.rememberMe = String(credentials.rememberMe);
        params.twoFactorCode = credentials.twoFactorCode || "";
        params.captcha = credentials.captcha || "";
        params.token = credentials.token || "";
        // const params = {
        //   username: credentials.username || "",
        //   password: credentials.password || "",
        //   organization: String(credentials.organization) || "",
        //   rememberMe: String(credentials.rememberMe),
        //   twoFactorCode: credentials.twoFactorCode || "",
        //   captcha: credentials.captcha || "",
        //   token: credentials.token || ""
        // };

        const verify = (!credentials.username && !credentials.password && isSSOAvailable()) ? API_CONFIG.ENDPOINTS.VERIFY : undefined;
        const endpoint = verify || API_CONFIG.ENDPOINTS.LOGIN;

        // METHOD GET (suspended)
        // const queryParams = new URLSearchParams(params).toString();
        // const response = await this.httpClient.get<LoginResponse>(
        //   `${API_CONFIG.ENDPOINTS.LOGIN}?${queryParams}`
        // );

        // METHOD POST
        const response = await this.httpClient.post<LoginResponse>(
          endpoint, params
        );

        if (!response.data) {
          throw new Error(response.message || "Login failed");
        }

        // manual login success
        if (!verify) {
          sessionStorage.removeItem(AUTH_LOCK_KEY); // clear lock
          sessionStorage.setItem(AUTH_SOURCE_KEY, "manual");
          sessionStorage.setItem(AUTH_AUTHORITY_KEY, "manual");
          sessionStorage.removeItem(SSO_TAKEOVER_KEY); // optional
        }

        // const roleId = response?.data?.user?.roleId || ""
        // if (roleId) {
        //   const permissions = await this.httpClient.post<Permission[]>(
        //     `${API_CONFIG.ENDPOINTS.ROLE_PERMISSION_BY_ROLE_ID}${roleId}`
        //   );
        //   if (!permissions.data) {
        //     throw new Error(response.message || "No permission found");
        //   }
        //   const userWithRolePermissions = {
        //     accessToken: response.data.accessToken,
        //     refreshToken: response.data.refreshToken,
        //     user: { ...response.data.user, permissions: permissions.data.map(p => p.permId) },
        //     expiresIn: response.data.expiresIn || 86400,
        //     tokenType: response.data.tokenType || "Bearer",
        //   }
        //   return userWithRolePermissions;
        // }

        // console.log("✅ API login successful", response.data);
        return response.data;
      }
    }
    catch (error) {
      console.error("❌ Login failed:", error);

      // Enhance error messages based on mode
      if (error instanceof Error) {
        if (error.message.includes("CORS")) {
          throw new Error("CORS Error: Your backend server needs to allow requests from this frontend. Please configure CORS headers.");
        }
        else if (error.message.includes("Failed to fetch")) {
          throw new Error(`Cannot connect to backend server (${API_CONFIG.BASE_URL}). Please check if your server is running and CORS is configured.`);
        }
      }

      throw error;
    }
  }
  
  static async register(data: RegisterData): Promise<LoginResponse> {
    console.log("📝 Attempting registration for:", data.email);
    
    if (data.password !== data.confirmPassword) {
      throw new Error("Passwords do not match");
    }

    if (!data.acceptTerms) {
      throw new Error("You must accept the terms and conditions");
    }

    try {
      if (API_CONFIG.DEMO_MODE) {
        // Demo mode - simulate API call
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        const mockUser = this.createMockUser(data.email);
        const accessToken = this.createMockJWT(mockUser);
        
        console.log("✅ Demo registration successful");
        return {
          user: mockUser,
          accessToken: accessToken,
          refreshToken: "mock_refresh_token_" + Date.now(),
          expiresIn: 86400,
          tokenType: "Bearer"
        };
      }
      else {
        // Real API mode
        const response = await this.httpClient.post<LoginResponse>(
          API_CONFIG.ENDPOINTS.REGISTER,
          {
            name: data.name,
            username: data.username,
            password: data.password,
            department: data.department,
            role: data.role,
            acceptTerms: data.acceptTerms
          }
        );

        if (!response.success || !response.data) {
          throw new Error(response.message || "Registration failed");
        }

        console.log("✅ API registration successful");
        return response.data;
      }
    }
    catch (error) {
      console.error("❌ Registration failed:", error);
      throw error;
    }
  }
  
  static async refreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    console.log("🔄 Refreshing token...");
    
    try {
      if (API_CONFIG.DEMO_MODE) {
        // Demo mode - simulate API call
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const mockUser = this.createMockUser("wisarud.tec");
        const newAccessToken = this.createMockJWT(mockUser);
        
        console.log("✅ Demo token refreshed successfully");
        return {
          accessToken: newAccessToken,
          refreshToken: "new_mock_refresh_token_" + Date.now()
        };
      }
      else {
        // Real API mode - routes through GQL_AUTH ("/auth/refresh": AUTH_REFRESH_MUTATION)
        // const response = await this.httpClient.post<{ accessToken: string; refreshToken: string }>(
        //   API_CONFIG.ENDPOINTS.REFRESH,
        //   { refreshToken }
        // );
        // when GraphQL mode is enabled, or REST otherwise, via the shared hybrid base query.
        const result = await store.dispatch(
          authApi.endpoints.refreshToken.initiate({ refreshToken })
        ).unwrap();

        // GQL responses come back enveloped ({ data: { accessToken, refreshToken } }),
        // REST responses come back flat - support both.
        const payload = (result as unknown as { data?: { accessToken: string; refreshToken: string } })?.data
          ?? (result as unknown as { accessToken: string; refreshToken: string });

        // if (!response.status || !response.data) {
        //   throw new Error(response.message || "Token refresh failed");
        // }
        if (!payload?.accessToken || !payload?.refreshToken) {
          throw new Error("Token refresh failed");
        }

        console.log("✅ API token refreshed successfully");

        // return response.data;
        return {
          accessToken: payload.accessToken,
          refreshToken: payload.refreshToken
        };
      }
    }
    catch (error) {
      console.error("❌ Token refresh failed:", error);
      throw error;
    }
  }
  
  static async logout(): Promise<void> {
    console.log("🚪 Logging out...");
    
    try {
      if (API_CONFIG.DEMO_MODE) {
        // Demo mode - simulate API call
        await new Promise(resolve => setTimeout(resolve, 300));
        console.log("✅ Demo logout successful");
      }
      else {
        // Real API mode
        await this.httpClient.post(API_CONFIG.ENDPOINTS.LOGOUT);
        console.log("✅ API logout successful");
      }
    }
    catch (error) {
      console.error("❌ Logout failed:", error);
      // Don"t throw error on logout failure - still clear local data
    }
  }

  static async verifyToken(token: string): Promise<User> {
    console.log("🔍 Verifying token...");
    
    try {
      if (API_CONFIG.DEMO_MODE) {
        // Demo mode - simulate API call
        await new Promise(resolve => setTimeout(resolve, 200));
        
        if (TokenManager.isTokenExpired(token)) {
          throw new Error("Token expired");
        }
        
        const mockUser = this.createMockUser("wisarud.tec");
        console.log("✅ Demo token verified successfully");
        return mockUser;
      }
      else {
        // Real API mode
        const response = await this.httpClient.post<User>(
          API_CONFIG.ENDPOINTS.VERIFY,
          { token }
        );

        if (!response.success || !response.data) {
          throw new Error(response.message || "Token verification failed");
        }

        console.log("✅ API token verified successfully");
        return response.data;
      }
    }
    catch (error) {
      console.error("❌ Token verification failed:", error);
      throw error;
    }
  }

  static async forgotPassword(email: string): Promise<void> {
    console.log("📧 Sending password reset email to:", email);
    
    try {
      if (API_CONFIG.DEMO_MODE) {
        // Demo mode - simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log("✅ Demo password reset email sent");
      }
      else {
        // Real API mode
        const response = await this.httpClient.post(
          API_CONFIG.ENDPOINTS.FORGOT_PASSWORD,
          { email }
        );

        if (!response.success) {
          throw new Error(response.message || "Failed to send reset email");
        }

        console.log("✅ API password reset email sent");
      }
    }
    catch (error) {
      console.error("❌ Failed to send reset email:", error);
      throw error;
    }
  }

  static async resetPassword(token: string, newPassword: string): Promise<void> {
    console.log("🔑 Resetting password...");
    
    try {
      if (API_CONFIG.DEMO_MODE) {
        // Demo mode - simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log("✅ Demo password reset successful");
      }
      else {
        // Real API mode
        const response = await this.httpClient.post(
          API_CONFIG.ENDPOINTS.RESET_PASSWORD,
          { token, newPassword }
        );

        if (!response.success) {
          throw new Error(response.message || "Password reset failed");
        }

        console.log("✅ API password reset successful");
      }
    }
    catch (error) {
      console.error("❌ Password reset failed:", error);
      throw error;
    }
  }

  static async isSystemAdmin() {
    try {
      const storage = localStorage || sessionStorage || null;
      const raw = storage.getItem("profile");
      // if (!raw) {
      //   throw new Error("❌ No profile found");
      // }
      const profile: User = await JSON.parse(raw || "{}");
      return profile?.roleId === SYSTEM_ROLE;
    }
    catch (error) {
      console.error("❌ Error checking system admin status:", error);
      return false;
    }
  }
}
