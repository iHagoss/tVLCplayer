import { TraktCredentials } from "@/types";
import { saveTraktCredentials, loadTraktCredentials } from "@/storage/settingsStorage";

const TRAKT_API_BASE = "https://api.trakt.tv";
const TRAKT_CLIENT_ID = process.env.EXPO_PUBLIC_TRAKT_CLIENT_ID || "YOUR_TRAKT_CLIENT_ID";
const TRAKT_CLIENT_SECRET = process.env.EXPO_PUBLIC_TRAKT_CLIENT_SECRET || "YOUR_TRAKT_CLIENT_SECRET";

export interface DeviceCodeResponse {
  device_code: string;
  user_code: string;
  verification_url: string;
  expires_in: number;
  interval: number;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  scope: string;
  created_at: number;
}

export interface TraktUser {
  username: string;
  private: boolean;
  name: string;
  vip: boolean;
  ids: {
    slug: string;
    uuid: string;
  };
}

export interface ScrobbleData {
  movie?: {
    title: string;
    year?: number;
    ids?: {
      imdb?: string;
      tmdb?: number;
      slug?: string;
    };
  };
  show?: {
    title: string;
    year?: number;
    ids?: {
      imdb?: string;
      tmdb?: number;
      slug?: string;
    };
  };
  episode?: {
    season: number;
    number: number;
    title?: string;
    ids?: {
      imdb?: string;
      tmdb?: number;
    };
  };
  progress: number;
  app_version?: string;
  app_date?: string;
}

export type ScrobbleAction = "start" | "pause" | "stop";

class TraktService {
  private credentials: TraktCredentials | null = null;
  private isInitialized = false;

  private getHeaders(includeAuth = true): Record<string, string> {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "trakt-api-version": "2",
      "trakt-api-key": TRAKT_CLIENT_ID,
    };

    if (includeAuth && this.credentials?.accessToken) {
      headers["Authorization"] = `Bearer ${this.credentials.accessToken}`;
    }

    return headers;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;
    
    try {
      this.credentials = await loadTraktCredentials();
      this.isInitialized = true;
    } catch (error) {
      console.error("Failed to initialize Trakt service:", error);
    }
  }

  async getDeviceCode(): Promise<DeviceCodeResponse> {
    const response = await fetch(`${TRAKT_API_BASE}/oauth/device/code`, {
      method: "POST",
      headers: this.getHeaders(false),
      body: JSON.stringify({
        client_id: TRAKT_CLIENT_ID,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to get device code: ${response.status}`);
    }

    return response.json();
  }

  async pollForToken(deviceCode: string): Promise<TokenResponse | null> {
    const response = await fetch(`${TRAKT_API_BASE}/oauth/device/token`, {
      method: "POST",
      headers: this.getHeaders(false),
      body: JSON.stringify({
        code: deviceCode,
        client_id: TRAKT_CLIENT_ID,
        client_secret: TRAKT_CLIENT_SECRET,
      }),
    });

    if (response.status === 400) {
      return null;
    }

    if (response.status === 410) {
      throw new Error("Device code expired");
    }

    if (response.status === 418) {
      throw new Error("User denied access");
    }

    if (response.status === 429) {
      throw new Error("Polling too fast");
    }

    if (!response.ok) {
      throw new Error(`Token request failed: ${response.status}`);
    }

    return response.json();
  }

  async refreshAccessToken(): Promise<boolean> {
    if (!this.credentials?.refreshToken) {
      return false;
    }

    try {
      const response = await fetch(`${TRAKT_API_BASE}/oauth/token`, {
        method: "POST",
        headers: this.getHeaders(false),
        body: JSON.stringify({
          refresh_token: this.credentials.refreshToken,
          client_id: TRAKT_CLIENT_ID,
          client_secret: TRAKT_CLIENT_SECRET,
          redirect_uri: "urn:ietf:wg:oauth:2.0:oob",
          grant_type: "refresh_token",
        }),
      });

      if (!response.ok) {
        return false;
      }

      const tokenData: TokenResponse = await response.json();
      
      const newCredentials: TraktCredentials = {
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        expiresAt: (tokenData.created_at + tokenData.expires_in) * 1000,
        username: this.credentials.username,
      };

      await saveTraktCredentials(newCredentials);
      this.credentials = newCredentials;
      
      return true;
    } catch (error) {
      console.error("Failed to refresh token:", error);
      return false;
    }
  }

  async getUserProfile(): Promise<TraktUser | null> {
    await this.ensureValidToken();

    try {
      const response = await fetch(`${TRAKT_API_BASE}/users/me`, {
        method: "GET",
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        return null;
      }

      return response.json();
    } catch (error) {
      console.error("Failed to get user profile:", error);
      return null;
    }
  }

  async saveTokens(tokenData: TokenResponse): Promise<TraktCredentials> {
    const user = await this.getUserProfileWithToken(tokenData.access_token);
    
    const credentials: TraktCredentials = {
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresAt: (tokenData.created_at + tokenData.expires_in) * 1000,
      username: user?.username || "Unknown",
    };

    await saveTraktCredentials(credentials);
    this.credentials = credentials;
    
    return credentials;
  }

  private async getUserProfileWithToken(accessToken: string): Promise<TraktUser | null> {
    try {
      const response = await fetch(`${TRAKT_API_BASE}/users/me`, {
        method: "GET",
        headers: {
          ...this.getHeaders(false),
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!response.ok) {
        return null;
      }

      return response.json();
    } catch (error) {
      return null;
    }
  }

  private async ensureValidToken(): Promise<boolean> {
    if (!this.credentials?.accessToken) {
      return false;
    }

    if (this.credentials.expiresAt && Date.now() >= this.credentials.expiresAt - 60000) {
      return this.refreshAccessToken();
    }

    return true;
  }

  async scrobble(action: ScrobbleAction, data: ScrobbleData): Promise<boolean> {
    const isValid = await this.ensureValidToken();
    if (!isValid) {
      console.warn("No valid Trakt token for scrobbling");
      return false;
    }

    try {
      const response = await fetch(`${TRAKT_API_BASE}/scrobble/${action}`, {
        method: "POST",
        headers: this.getHeaders(),
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        console.error(`Scrobble ${action} failed: ${response.status}`);
        return false;
      }

      return true;
    } catch (error) {
      console.error(`Scrobble ${action} error:`, error);
      return false;
    }
  }

  async scrobbleStart(data: ScrobbleData): Promise<boolean> {
    return this.scrobble("start", data);
  }

  async scrobblePause(data: ScrobbleData): Promise<boolean> {
    return this.scrobble("pause", data);
  }

  async scrobbleStop(data: ScrobbleData): Promise<boolean> {
    return this.scrobble("stop", data);
  }

  isAuthenticated(): boolean {
    return !!this.credentials?.accessToken;
  }

  getCredentials(): TraktCredentials | null {
    return this.credentials;
  }

  async disconnect(): Promise<void> {
    if (this.credentials?.accessToken) {
      try {
        await fetch(`${TRAKT_API_BASE}/oauth/revoke`, {
          method: "POST",
          headers: this.getHeaders(false),
          body: JSON.stringify({
            token: this.credentials.accessToken,
            client_id: TRAKT_CLIENT_ID,
            client_secret: TRAKT_CLIENT_SECRET,
          }),
        });
      } catch (error) {
        console.error("Failed to revoke token:", error);
      }
    }

    this.credentials = null;
  }
}

export const traktService = new TraktService();

export function createScrobbleData(
  imdbId: string | undefined,
  title: string,
  season?: number,
  episode?: number,
  progress: number = 0
): ScrobbleData {
  if (season !== undefined && episode !== undefined) {
    return {
      show: {
        title: title,
        ids: imdbId ? { imdb: imdbId } : undefined,
      },
      episode: {
        season,
        number: episode,
      },
      progress: Math.min(100, Math.max(0, progress)),
      app_version: "1.0.0",
    };
  }

  return {
    movie: {
      title: title,
      ids: imdbId ? { imdb: imdbId } : undefined,
    },
    progress: Math.min(100, Math.max(0, progress)),
    app_version: "1.0.0",
  };
}
