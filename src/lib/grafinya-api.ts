/**
 * Графиня API Client
 *
 * Full-featured client for the Graphinya monitoring platform REST API.
 * Handles JWT authentication, refresh tokens, and all major endpoints.
 */

export interface GraphinyaConfig {
  baseUrl: string; // e.g. "http://192.168.0.1:5000"
  frontendUrl: string; // e.g. "http://192.168.0.1"
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  role: string;
  isActive: boolean;
}

// ---- Dashboard types ----
export interface Dashboard {
  _id: string;
  title: string;
  description?: string;
  tags?: string[];
  isFavorite?: boolean;
  createdBy?: string;
  createdAt: string;
  updatedAt: string;
  widgets?: Widget[];
  variables?: DashboardVariable[];
  refreshTime?: number;
}

export interface DashboardVariable {
  name: string;
  type: string;
  dataSourceId?: string;
  query?: string;
  values?: string[];
  current?: string;
}

export interface Widget {
  id: string;
  title: string;
  type: string;
  cols?: number;
  rows?: number;
  x?: number;
  y?: number;
  dataSourceId?: string;
  query?: string;
  moduleData?: Record<string, unknown>;
  refreshTime?: number;
}

// ---- Data Source types ----
export interface DataSource {
  _id: string;
  name: string;
  pluginId: string;
  pluginName?: string;
  type?: string;
  fields: DataSourceField[];
  isDefault?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DataSourceField {
  code: string;
  name: string;
  type: string;
  value?: string;
  description?: string;
  placeholder?: string;
  required?: boolean;
}

// ---- Plugin types ----
export interface Plugin {
  _id: string;
  name: string;
  title?: string;
  version: string;
  description?: string;
  baseUrl?: string;
  status?: string;
  createdAt: string;
  updatedAt: string;
}

// ---- Module types ----
export interface Module {
  id: string;
  name: string;
  version: string;
  title: { lang: string; value: string }[];
  description: { lang: string; value: string }[];
  baseUrl: string;
  frontendHost: string;
  scope: string;
  entryPoint: string;
  components: string[];
  isActive: boolean;
  canAddToDashboard?: boolean;
  settings?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

// ---- Query result types ----
export interface QueryResult {
  status: number;
  frames: QueryFrame[];
}

export interface QueryFrame {
  refID: string;
  fields: QueryField[];
}

export interface QueryField {
  name: string;
  refID: string;
  values: Record<string, string | number>[];
}

// ---- Palette types ----
export interface Palette {
  _id: string;
  name: string;
  colors: string[];
  createdAt: string;
  updatedAt: string;
}

// ---- Health check ----
export interface HealthStatus {
  status: string;
  uptime?: number;
  version?: string;
}

// ---- API Error ----
export class GraphinyaAPIError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
    this.name = "GraphinyaAPIError";
  }
}

/**
 * Graphinya API Client
 */
export class GraphinyaClient {
  private config: GraphinyaConfig;
  private tokens: AuthTokens | null = null;

  constructor(config: GraphinyaConfig) {
    this.config = config;
  }

  // ---- Config ----
  getConfig(): GraphinyaConfig {
    return this.config;
  }

  setConfig(config: GraphinyaConfig) {
    this.config = config;
  }

  // ---- Auth ----
  setTokens(tokens: AuthTokens) {
    this.tokens = tokens;
  }

  getTokens(): AuthTokens | null {
    return this.tokens;
  }

  clearTokens() {
    this.tokens = null;
  }

  isAuthenticated(): boolean {
    return this.tokens !== null;
  }

  // ---- Internal fetch ----
  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.config.baseUrl}/api/v1${path}`;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(options.headers as Record<string, string>),
    };

    if (this.tokens?.accessToken) {
      headers["Authorization"] = `Bearer ${this.tokens.accessToken}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (response.status === 401 && this.tokens?.refreshToken) {
      const refreshed = await this.refreshTokens();
      if (refreshed && this.tokens) {
        headers["Authorization"] = `Bearer ${this.tokens.accessToken}`;
        const retryResponse = await fetch(url, { ...options, headers });
        if (!retryResponse.ok) {
          const error = await retryResponse.json().catch(() => ({}));
          throw new GraphinyaAPIError(
            retryResponse.status,
            error.code || "UNKNOWN",
            error.message || `Request failed: ${retryResponse.status}`
          );
        }
        return retryResponse.json();
      }
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new GraphinyaAPIError(
        response.status,
        error.code || "UNKNOWN",
        error.message || `Request failed: ${response.status}`
      );
    }

    return response.json();
  }

  // ---- Auth API ----
  async login(username: string, password: string): Promise<AuthTokens> {
    const result = await this.request<{ accessToken: string; refreshToken: string }>(
      "/auth/login",
      {
        method: "POST",
        body: JSON.stringify({ username, password }),
      }
    );
    this.tokens = {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
    };
    return this.tokens;
  }

  async refreshTokens(): Promise<boolean> {
    if (!this.tokens?.refreshToken) return false;
    try {
      const result = await this.request<{ accessToken: string; refreshToken: string }>(
        "/auth/refresh",
        {
          method: "POST",
          body: JSON.stringify({ refreshToken: this.tokens.refreshToken }),
        }
      );
      this.tokens = {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      };
      return true;
    } catch {
      this.tokens = null;
      return false;
    }
  }

  async logout(): Promise<void> {
    try {
      await this.request("/auth/logout", { method: "POST" });
    } finally {
      this.tokens = null;
    }
  }

  async getMe(): Promise<User> {
    return this.request("/auth/me");
  }

  async changePassword(oldPassword: string, newPassword: string): Promise<void> {
    await this.request("/auth/change-password", {
      method: "POST",
      body: JSON.stringify({ oldPassword, newPassword }),
    });
  }

  // ---- Health ----
  async healthCheck(): Promise<HealthStatus> {
    const url = `${this.config.baseUrl}/healthz`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new GraphinyaAPIError(response.status, "HEALTH_CHECK_FAILED", "Health check failed");
    }
    return response.json().catch(() => ({ status: "ok" }));
  }

  // ---- Dashboards API ----
  async getDashboards(): Promise<Dashboard[]> {
    return this.request("/dashboards");
  }

  async getDashboard(id: string): Promise<Dashboard> {
    return this.request(`/dashboards/${id}`);
  }

  async createDashboard(data: Partial<Dashboard>): Promise<Dashboard> {
    return this.request("/dashboards", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateDashboard(id: string, data: Partial<Dashboard>): Promise<Dashboard> {
    return this.request(`/dashboards/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async deleteDashboard(id: string): Promise<void> {
    await this.request(`/dashboards/${id}`, { method: "DELETE" });
  }

  async toggleFavorite(id: string): Promise<Dashboard> {
    return this.request(`/dashboards/${id}/favorite`, { method: "POST" });
  }

  // ---- Data Sources API ----
  async getDataSources(): Promise<DataSource[]> {
    return this.request("/datasources");
  }

  async getDataSource(id: string): Promise<DataSource> {
    return this.request(`/datasources/${id}`);
  }

  async createDataSource(data: Partial<DataSource>): Promise<DataSource> {
    return this.request("/datasources", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  async updateDataSource(id: string, data: Partial<DataSource>): Promise<DataSource> {
    return this.request(`/datasources/${id}`, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async deleteDataSource(id: string): Promise<void> {
    await this.request(`/datasources/${id}`, { method: "DELETE" });
  }

  async testDataSource(id: string): Promise<{ status: boolean; message?: string }> {
    return this.request(`/datasources/${id}/test`, { method: "POST" });
  }

  // ---- Plugins API ----
  async getPlugins(): Promise<Plugin[]> {
    return this.request("/plugins");
  }

  async getPlugin(id: string): Promise<Plugin> {
    return this.request(`/plugins/${id}`);
  }

  async getPluginWellKnown(pluginBaseUrl: string): Promise<{
    name: string;
    title: { lang: string; value: string }[];
    version: string;
    description: { lang: string; value: string }[];
    baseUrl: string;
  }> {
    return this.request(`${pluginBaseUrl}/api/v1/well-known`);
  }

  // ---- Modules API ----
  async getModules(): Promise<Module[]> {
    return this.request("/modules");
  }

  async getModule(id: string): Promise<Module> {
    return this.request(`/modules/${id}`);
  }

  // ---- Query API ----
  async executeQuery(data: {
    dataSourceId: string;
    queries: Array<{
      refID: string;
      maxDataPoints?: number;
      timeRange?: { from: number; to: number };
      json: string;
    }>;
    variables?: Record<string, unknown>;
  }): Promise<QueryResult> {
    return this.request("/query", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // ---- Variables API ----
  async getVariableValues(
    dataSourceId: string,
    json: string,
    variables?: Record<string, unknown>
  ): Promise<Array<{ label: string; value: string }>> {
    return this.request("/variables/values", {
      method: "POST",
      body: JSON.stringify({ dataSourceId, json, variables }),
    });
  }

  // ---- Palettes API ----
  async getPalettes(): Promise<Palette[]> {
    return this.request("/palettes");
  }

  async createPalette(data: { name: string; colors: string[] }): Promise<Palette> {
    return this.request("/palettes", {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  // ---- Users API (admin) ----
  async getUsers(): Promise<User[]> {
    return this.request("/users");
  }

  // ---- Proxy for modules ----
  async moduleProxy(moduleId: string, path: string, body?: unknown): Promise<unknown> {
    return this.request(`/modules/${moduleId}/proxy/${path}`, {
      method: body ? "POST" : "GET",
      body: body ? JSON.stringify(body) : undefined,
    });
  }
}

// ---- Singleton ----
let clientInstance: GraphinyaClient | null = null;

export function getGraphinyaClient(config?: GraphinyaConfig): GraphinyaClient {
  if (!clientInstance && config) {
    clientInstance = new GraphinyaClient(config);
  }
  if (!clientInstance) {
    // Default placeholder - will be configured later
    clientInstance = new GraphinyaClient({ baseUrl: "", frontendUrl: "" });
  }
  return clientInstance;
}

export function resetGraphinyaClient() {
  clientInstance = null;
}
