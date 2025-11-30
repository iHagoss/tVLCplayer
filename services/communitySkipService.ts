import { SkipMarker } from "@/types";

export interface IntroHaterResponse {
  intro?: {
    start: number;
    end: number;
  };
  outro?: {
    start: number;
    end: number;
  };
}

export interface StremioSkipResponse {
  intro?: {
    start: number;
    end: number;
  };
  outro?: {
    start: number;
    end: number;
  };
  s?: number;
  e?: number;
}

class CommunitySkipService {
  private readonly INTRO_HATER_API = "https://api.intros.ai";
  private readonly STREMIO_SKIP_API = "https://skips.stremio.ml";
  
  private cache: Map<string, SkipMarker[]> = new Map();
  private cacheTTL = 24 * 60 * 60 * 1000; // 24 hours
  private lastFetchTime: Map<string, number> = new Map();

  async getSkipMarkersForEpisode(
    imdbId: string,
    season: number,
    episode: number
  ): Promise<SkipMarker[]> {
    const cacheKey = `${imdbId}_s${String(season).padStart(2, "0")}e${String(episode).padStart(2, "0")}`;
    const lastFetch = this.lastFetchTime.get(cacheKey);
    const cached = this.cache.get(cacheKey);

    if (cached && lastFetch && Date.now() - lastFetch < this.cacheTTL) {
      return cached;
    }

    try {
      // Fetch from both sources in parallel
      const [introHaterMarkers, stremioMarkers] = await Promise.all([
        this.getIntroHaterMarkers(imdbId, season, episode),
        this.getStremioSkipMarkers(imdbId, season, episode),
      ]);

      // Merge results, preferring IntroHater if both have data
      const allMarkers = [...introHaterMarkers];
      
      // Add Stremio markers if not already covered
      for (const marker of stremioMarkers) {
        const exists = allMarkers.some(
          m => m.type === marker.type && Math.abs(m.startTime - marker.startTime) < 2
        );
        if (!exists) {
          allMarkers.push(marker);
        }
      }

      // Cache the merged result
      this.cache.set(cacheKey, allMarkers);
      this.lastFetchTime.set(cacheKey, Date.now());

      return allMarkers;
    } catch (error) {
      console.error("Failed to fetch community skip markers:", error);
      return [];
    }
  }

  private async getIntroHaterMarkers(
    imdbId: string,
    season: number,
    episode: number
  ): Promise<SkipMarker[]> {
    try {
      const episodeId = `${imdbId}_s${String(season).padStart(2, "0")}e${String(episode).padStart(2, "0")}`;
      const response = await fetch(
        `${this.INTRO_HATER_API}/v1/episodes?tvdb_id=${episodeId}`,
        { 
          headers: { "Accept": "application/json" },
          timeout: 5000,
        }
      );

      if (!response.ok) {
        return [];
      }

      const data: IntroHaterResponse = await response.json();
      return this.convertToSkipMarkers(data, "IntroHater");
    } catch (error) {
      console.error("Failed to fetch IntroHater markers:", error);
      return [];
    }
  }

  private async getStremioSkipMarkers(
    imdbId: string,
    season: number,
    episode: number
  ): Promise<SkipMarker[]> {
    try {
      // Stremio skip button API format
      const response = await fetch(
        `${this.STREMIO_SKIP_API}/api/episodes/${imdbId}/${season}/${episode}`,
        { 
          headers: { "Accept": "application/json" },
          timeout: 5000,
        }
      );

      if (!response.ok) {
        return [];
      }

      const data: StremioSkipResponse = await response.json();
      return this.convertToSkipMarkers(data, "Stremio");
    } catch (error) {
      console.error("Failed to fetch Stremio skip markers:", error);
      return [];
    }
  }

  private convertToSkipMarkers(
    data: IntroHaterResponse | StremioSkipResponse,
    source: "IntroHater" | "Stremio"
  ): SkipMarker[] {
    const markers: SkipMarker[] = [];

    if (data.intro?.start !== undefined && data.intro?.end !== undefined) {
      markers.push({
        type: "intro",
        startTime: data.intro.start,
        endTime: data.intro.end,
        source: "fingerprint",
      });
    }

    if (data.outro?.start !== undefined && data.outro?.end !== undefined) {
      markers.push({
        type: "credits",
        startTime: data.outro.start,
        endTime: data.outro.end,
        source: "fingerprint",
      });
    }

    return markers;
  }

  clearCache(): void {
    this.cache.clear();
    this.lastFetchTime.clear();
  }
}

export const communitySkipService = new CommunitySkipService();
