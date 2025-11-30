import { DebridSettings } from "@/types";

export type DebridServiceType = "realdebrid" | "alldebrid" | "premiumize" | "torbox";

export interface CacheStatus {
  isCached: boolean;
  files?: CachedFile[];
  error?: string;
}

export interface CachedFile {
  id: string;
  filename: string;
  filesize: number;
  link?: string;
}

export interface UnrestrictedLink {
  id: string;
  filename: string;
  mimeType: string;
  filesize: number;
  link: string;
  host: string;
  chunks: number;
  download: string;
  streamable: number;
}

const API_ENDPOINTS = {
  realdebrid: {
    base: "https://api.real-debrid.com/rest/1.0",
    cache: "/torrents/instantAvailability",
    unrestrict: "/unrestrict/link",
    user: "/user",
  },
  alldebrid: {
    base: "https://api.alldebrid.com/v4",
    cache: "/magnet/instant",
    unrestrict: "/link/unlock",
    user: "/user",
  },
  premiumize: {
    base: "https://www.premiumize.me/api",
    cache: "/cache/check",
    unrestrict: "/transfer/directdl",
    user: "/account/info",
  },
  torbox: {
    base: "https://api.torbox.app/v1/api",
    cache: "/torrents/checkcached",
    unrestrict: "/torrents/requestdl",
    user: "/user/me",
  },
};

class RealDebridClient {
  private apiKey: string;
  private baseUrl = API_ENDPOINTS.realdebrid.base;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private getHeaders(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.apiKey}`,
    };
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}${API_ENDPOINTS.realdebrid.user}`, {
        headers: this.getHeaders(),
      });
      return response.ok;
    } catch {
      return false;
    }
  }

  async checkCache(hashes: string[]): Promise<CacheStatus> {
    try {
      const hashList = hashes.join("/");
      const response = await fetch(
        `${this.baseUrl}${API_ENDPOINTS.realdebrid.cache}/${hashList}`,
        { headers: this.getHeaders() }
      );

      if (!response.ok) {
        return { isCached: false, error: `API error: ${response.status}` };
      }

      const data = await response.json();
      const hasCache = Object.keys(data).length > 0 && 
        Object.values(data).some((item: any) => Object.keys(item.rd || {}).length > 0);

      return { isCached: hasCache };
    } catch (error) {
      return { isCached: false, error: String(error) };
    }
  }

  async unrestrictLink(link: string): Promise<UnrestrictedLink | null> {
    try {
      const response = await fetch(`${this.baseUrl}${API_ENDPOINTS.realdebrid.unrestrict}`, {
        method: "POST",
        headers: {
          ...this.getHeaders(),
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: `link=${encodeURIComponent(link)}`,
      });

      if (!response.ok) {
        return null;
      }

      return response.json();
    } catch {
      return null;
    }
  }
}

class AllDebridClient {
  private apiKey: string;
  private baseUrl = API_ENDPOINTS.alldebrid.base;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private getUrl(endpoint: string): string {
    return `${this.baseUrl}${endpoint}?agent=StreamPlayer&apikey=${this.apiKey}`;
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(this.getUrl(API_ENDPOINTS.alldebrid.user));
      const data = await response.json();
      return data.status === "success";
    } catch {
      return false;
    }
  }

  async checkCache(magnets: string[]): Promise<CacheStatus> {
    try {
      const magnetParams = magnets.map((m, i) => `magnets[${i}]=${encodeURIComponent(m)}`).join("&");
      const response = await fetch(`${this.getUrl(API_ENDPOINTS.alldebrid.cache)}&${magnetParams}`);
      
      if (!response.ok) {
        return { isCached: false, error: `API error: ${response.status}` };
      }

      const data = await response.json();
      const hasCache = data.status === "success" && 
        data.data?.magnets?.some((m: any) => m.instant === true);

      return { isCached: hasCache };
    } catch (error) {
      return { isCached: false, error: String(error) };
    }
  }

  async unrestrictLink(link: string): Promise<{ link: string } | null> {
    try {
      const response = await fetch(
        `${this.getUrl(API_ENDPOINTS.alldebrid.unrestrict)}&link=${encodeURIComponent(link)}`
      );

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      if (data.status === "success" && data.data?.link) {
        return { link: data.data.link };
      }
      return null;
    } catch {
      return null;
    }
  }
}

class PremiumizeClient {
  private apiKey: string;
  private baseUrl = API_ENDPOINTS.premiumize.base;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private getHeaders(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.apiKey}`,
    };
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}${API_ENDPOINTS.premiumize.user}`, {
        headers: this.getHeaders(),
      });
      const data = await response.json();
      return data.status === "success";
    } catch {
      return false;
    }
  }

  async checkCache(hashes: string[]): Promise<CacheStatus> {
    try {
      const params = hashes.map((h, i) => `items[${i}]=${h}`).join("&");
      const response = await fetch(`${this.baseUrl}${API_ENDPOINTS.premiumize.cache}?${params}`, {
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        return { isCached: false, error: `API error: ${response.status}` };
      }

      const data = await response.json();
      const hasCache = data.status === "success" && 
        data.response?.some((cached: boolean) => cached === true);

      return { isCached: hasCache };
    } catch (error) {
      return { isCached: false, error: String(error) };
    }
  }

  async unrestrictLink(link: string): Promise<{ link: string } | null> {
    try {
      const response = await fetch(`${this.baseUrl}${API_ENDPOINTS.premiumize.unrestrict}`, {
        method: "POST",
        headers: {
          ...this.getHeaders(),
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: `src=${encodeURIComponent(link)}`,
      });

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      if (data.status === "success" && data.content?.[0]?.link) {
        return { link: data.content[0].link };
      }
      return null;
    } catch {
      return null;
    }
  }
}

class TorBoxClient {
  private apiKey: string;
  private baseUrl = API_ENDPOINTS.torbox.base;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  private getHeaders(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.apiKey}`,
    };
  }

  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}${API_ENDPOINTS.torbox.user}`, {
        headers: this.getHeaders(),
      });
      const data = await response.json();
      return data.success === true;
    } catch {
      return false;
    }
  }

  async checkCache(hashes: string[]): Promise<CacheStatus> {
    try {
      const hashParam = hashes.join(",");
      const response = await fetch(
        `${this.baseUrl}${API_ENDPOINTS.torbox.cache}?hash=${hashParam}`,
        { headers: this.getHeaders() }
      );

      if (!response.ok) {
        return { isCached: false, error: `API error: ${response.status}` };
      }

      const data = await response.json();
      const hasCache = data.success === true && 
        Object.values(data.data || {}).some((cached: any) => cached === true);

      return { isCached: hasCache };
    } catch (error) {
      return { isCached: false, error: String(error) };
    }
  }
}

class DebridService {
  private currentClient: RealDebridClient | AllDebridClient | PremiumizeClient | TorBoxClient | null = null;
  private currentService: DebridServiceType | null = null;

  configure(settings: DebridSettings): void {
    if (settings.service === "none" || !settings.apiKey) {
      this.currentClient = null;
      this.currentService = null;
      return;
    }

    this.currentService = settings.service;

    switch (settings.service) {
      case "realdebrid":
        this.currentClient = new RealDebridClient(settings.apiKey);
        break;
      case "alldebrid":
        this.currentClient = new AllDebridClient(settings.apiKey);
        break;
      case "premiumize":
        this.currentClient = new PremiumizeClient(settings.apiKey);
        break;
      case "torbox":
        this.currentClient = new TorBoxClient(settings.apiKey);
        break;
    }
  }

  async testConnection(): Promise<boolean> {
    if (!this.currentClient) {
      return false;
    }
    return this.currentClient.testConnection();
  }

  async checkCache(hashesOrMagnets: string[]): Promise<CacheStatus> {
    if (!this.currentClient) {
      return { isCached: false, error: "No debrid service configured" };
    }
    return this.currentClient.checkCache(hashesOrMagnets);
  }

  getServiceName(): string {
    switch (this.currentService) {
      case "realdebrid":
        return "Real-Debrid";
      case "alldebrid":
        return "AllDebrid";
      case "premiumize":
        return "Premiumize";
      case "torbox":
        return "TorBox";
      default:
        return "None";
    }
  }

  isConfigured(): boolean {
    return this.currentClient !== null;
  }
}

export const debridService = new DebridService();
