import { generateRandomString, generateCodeChallenge } from "./utils";

/**
 * Initiates the Authorization Code with PKCE flow by:
 * 1) Generating a code verifier and code challenge
 * 2) Storing the code verifier (and a random state) in localStorage
 * 3) Redirecting to Spotify's /authorize endpoint with the correct query params
 */
export async function redirectToSpotifyLogin(): Promise<void> {
    // Replace with your actual client ID and redirect URI
    const clientId = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID || "";
    const scope = process.env.NEXT_PUBLIC_SPOTIFY_SCOPES || "";
    const redirectUri = process.env.NEXT_PUBLIC_SPOTIFY_REDIRECT_URI || "";

    // 1) Generate code verifier and code challenge
    const codeVerifier = generateRandomString(128);
    const codeChallenge = await generateCodeChallenge(codeVerifier);

    // 2) Store the code verifier and state in localStorage
    localStorage.setItem('spotify_code_verifier', codeVerifier);

    const state = generateRandomString(16);
    localStorage.setItem('spotify_auth_state', state);

    // 3) Build the /authorize query parameters
    const params = new URLSearchParams({
        response_type: 'code',
        client_id: clientId,
        scope: scope,
        redirect_uri: redirectUri,
        state: state,
        code_challenge_method: 'S256',
        code_challenge: codeChallenge,
    });

    // 4) Redirect the user
    window.location.href = `https://accounts.spotify.com/authorize?${params.toString()}`;
}
