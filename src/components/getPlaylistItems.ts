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

export const getInitialReleaseDate = async (item: Song, accessToken: string): Promise<string> => {
    const trackName = item.name;
    const artistName = item.artists
    const initialGuess = item.releaseDate;
    const query = encodeURIComponent(`artist:${artistName} track:${trackName}`);
    const url = `https://api.spotify.com/v1/search?type=track&q=${query}&limit=50`;

    const response = await fetch(url, {
        headers: {
            Authorization: `Bearer ${accessToken}`,
        },
    });

    if (response.status === 401) {

        await onTokenExpiry()
        return await getInitialReleaseDate(item, accessToken)
    }

    if (!response.ok) {

        throw new Error(`Request failed with status: ${response.status}`);
    }
    const trackInfo: SpotifySearchTracksResponse = await response.json();
    if (!trackInfo.tracks.items.length) {
        return initialGuess;
    }
    const earliestReleaseDate = trackInfo.tracks.items.reduce(
        (earliest, current) => {
            if (current.album.release_date < earliest) {
                return current.album.release_date;
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
        const songs = data.items.map((item: PlaylistedTrack) => {
            const track = item.track as Track;
            return {
                id: track.id,
                name: track.name,
                artists: track.artists.map((artist) => artist.name).join(", "),
                releaseDate: track.album.release_date
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
