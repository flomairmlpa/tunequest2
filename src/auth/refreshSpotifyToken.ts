import { redirectToSpotifyLogin } from "./redirectToSpotifyLogin";

export interface SpotifyTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope?: string;
}
/**
 * Refreshes the Spotify access token using the given refresh token.
 * 
 * @param refreshToken The refresh_token previously obtained from Spotify
 * @param clientId Your Spotify client ID
 * @returns A promise resolving to the new token response (including access_token and possibly a new refresh_token)
 */
export async function refreshSpotifyToken(
  refreshToken: string,
  clientId: string
): Promise<SpotifyTokenResponse> {
  const params = new URLSearchParams();
  params.append('grant_type', 'refresh_token');
  params.append('refresh_token', refreshToken);
  params.append('client_id', clientId);  // PKCE doesn't require the client secret

  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params.toString(),
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error('Error refreshing token:', errorData);
    throw new Error('Failed to refresh token');
  }

  const tokenData: SpotifyTokenResponse = await response.json();
  return tokenData;
}



export async function onTokenExpiry() {
  // Suppose you have stored the refreshToken somewhere (e.g., localStorage):
  const refreshToken = localStorage.getItem('spotify_refresh_token');
  const clientId = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID || "";

  if (!refreshToken) {
    redirectToSpotifyLogin();
    throw new Error('No refresh token available');
  }

  try {
    const newTokenData = await refreshSpotifyToken(refreshToken, clientId);
    console.log('New tokens:', newTokenData);

    // Store the new access token
    localStorage.setItem('spotify_access_token', newTokenData.access_token);

    // Spotify may or may not return a new refresh_token
    if (newTokenData.refresh_token) {
      localStorage.setItem('spotify_refresh_token', newTokenData.refresh_token);
    }
    return newTokenData.access_token;
  } catch (error) {
    redirectToSpotifyLogin();
  }
}