// 1. Define the shape of the response you expect (optional but recommended)

import { onTokenExpiry } from "@/auth/refreshSpotifyToken";
import { PlaylistedTrack, Track } from "@spotify/web-api-ts-sdk";
import { Song } from "./state";
interface SpotifyTrack {
    id: string;
    name: string;
    artists: Array<{
        id: string;
        name: string;
    }>;
    album: {
        id: string;
        release_date: string;
    };
    // Add other properties as needed (album, duration_ms, etc.)
}

interface SpotifySearchTracksResponse {
    tracks: {
        items: SpotifyTrack[];
        limit: number;
        offset: number;
        total: number;
        next: string | null;
        // ... other properties
    };
}

export const getInitialReleaseDate = async (
    item: Song, 
    accessToken: string,
    retryCount: number = 0
): Promise<string> => {
    const MAX_RETRIES = 1;
    const trackName = item.name;
    const artistName = item.artists;
    const initialGuess = item.releaseDate;
    
    // Clean up track and artist names for better search results
    const cleanTrackName = trackName
        .replace(/\s*\(.*?\)\s*/g, '') // Remove parenthetical content like "(Remastered)"
        .replace(/\s*-\s*.*$/g, '')     // Remove suffix after dash like "- Radio Edit"
        .trim();
    
    const query = encodeURIComponent(`artist:${artistName} track:${cleanTrackName}`);
    const url = `https://api.spotify.com/v1/search?type=track&q=${query}&limit=50`;

    const response = await fetch(url, {
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
    });

    if (response.status === 401) {
        if (retryCount >= MAX_RETRIES) {
            console.warn("Max retries reached for token refresh");
            return initialGuess;
        }
        const newToken = await onTokenExpiry();
        if (newToken) {
            return await getInitialReleaseDate(item, newToken, retryCount + 1);
        }
        return initialGuess;
    }

    if (!response.ok) {
        console.error(`Request failed with status: ${response.status}`);
        return initialGuess;
    }
    
    const trackInfo: SpotifySearchTracksResponse = await response.json();
    if (!trackInfo.tracks.items.length) {
        return initialGuess;
    }
    
    // Filter to only include tracks that match the artist
    const artistLower = artistName.toLowerCase();
    const matchingTracks = trackInfo.tracks.items.filter(track =>
        track.artists.some(a => artistLower.includes(a.name.toLowerCase()))
    );
    
    const tracksToCheck = matchingTracks.length > 0 ? matchingTracks : trackInfo.tracks.items;
    
    const earliestReleaseDate = tracksToCheck.reduce(
        (earliest, current) => {
            const currentDate = current.album.release_date;
            // Compare as dates for robustness (handles YYYY, YYYY-MM, YYYY-MM-DD)
            if (currentDate.localeCompare(earliest) < 0) {
                return currentDate;
            }
            return earliest;
        },
        initialGuess
    );
    
    return earliestReleaseDate;
}
/**
 * Fetch all tracks from a Spotify playlist.
 * 
 * @param playlistId - The Spotify ID of the playlist
 * @param accessToken - A valid Spotify Web API access tokenOK. 
 * @returns A list of all track items in the specified playlist
 */
export async function fetchAllPlaylistTracks(
    playlistId: string,
    accessToken: string
): Promise<{ tracks: Song[], name: string }> {
    const allTracks: Song[] = []
    let offset = 0;
    const limit = 100; // Maximum allowed per request by Spotify API
    const infoResp = await fetch(
        `https://api.spotify.com/v1/playlists/${playlistId}`,
        {
            headers: {
                Authorization: `Bearer ${accessToken}`
            }
        }
    );
    const { name } = await infoResp.json()
    while (true) {
        // 2. Call the Spotify API for the current batch


        const response = await fetch(
            `https://api.spotify.com/v1/playlists/${playlistId}/tracks?limit=${limit}&offset=${offset}`,
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            }
        );
        if (response.status === 401) {

            const newToken = await onTokenExpiry()
            if (newToken) {
                window.location.href = "/"
                return await fetchAllPlaylistTracks(playlistId, newToken)
            }
        }

        if (!response.ok) {

            throw new Error(`Failed to fetch playlist tracks: ${response.statusText}`);
        }

        // 3. Parse the response
        const data: any = await response.json();

        // 4. Append the items to your allTracks array
        // Skip local files and podcast episodes, which cannot be played as tracks
        const songs = data.items.filter((item: PlaylistedTrack) => (item.track as Track | null)?.album).map((item: PlaylistedTrack) => {
            const track = item.track as Track;
            return {
                id: track.id,
                name: track.name,
                artists: track.artists.map((artist) => artist.name).join(", "),
                releaseDate: track.album.release_date,
                image: track.album.images?.[0]?.url,
            };
        });
        allTracks.push(...songs);

        // 5. If there's no "next" URL, we've fetched all items
        if (!data.next) {
            break;
        }

        // 6. Update offset to fetch the next batch
        offset += data.items.length;
    }

    return { tracks: allTracks, name };
}

/** Fetches a single track, including its album cover. */
export const fetchSong = async (trackId: string, token: string): Promise<Song> => {
  const response = await fetch(`https://api.spotify.com/v1/tracks/${trackId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error(`Track request failed: ${response.status}`);
  const track = await response.json();
  return {
    id: track.id,
    name: track.name,
    artists: track.artists.map((a: any) => a.name).join(", "),
    releaseDate: track.album.release_date,
    image: track.album.images?.[0]?.url,
  };
};
