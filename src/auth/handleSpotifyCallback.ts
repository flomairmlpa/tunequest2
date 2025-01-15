/**
 * Handles the Spotify callback by exchanging the authorization code for an access token.
 * Should be called on the redirect page (e.g., /spotify-callback) after user grants permission.
 */
export async function handleSpotifyCallback(): Promise<void> {
    // 1) Get the code and state from URL search params

    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    const state = urlParams.get('state');

    // 2) Retrieve stored state and verifier
    const storedState = localStorage.getItem('spotify_auth_state');
    const codeVerifier = localStorage.getItem('spotify_code_verifier');

    // Clear them so they can't be reused
    localStorage.removeItem('spotify_auth_state');
    localStorage.removeItem('spotify_code_verifier');

    // Basic validation
    if (!code || !state || !codeVerifier || state !== storedState) {
        // window.location.href = '/';
        throw new Error('State mismatch or missing code/verifier in callback.');
    }
    const currentUrl = new URL(window.location.href);
    // Replace with your actual client ID and redirect URI
    const clientId = process.env.NEXT_PUBLIC_SPOTIFY_CLIENT_ID || "";
    const scope = process.env.NEXT_PUBLIC_SPOTIFY_SCOPES || "";
    const redirectUriPRe = process.env.NEXT_PUBLIC_SPOTIFY_REDIRECT_URI || "";

    const redirectUri = currentUrl.origin + redirectUriPRe


    // 3) Exchange code for an access token
    const params = new URLSearchParams();
    params.append('grant_type', 'authorization_code');
    params.append('code', code);
    params.append('redirect_uri', redirectUri);
    params.append('client_id', clientId);
    params.append('code_verifier', codeVerifier);

    try {
        const response = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: params.toString(),
        });

        const tokenData = await response.json();

        if (response.ok) {
            // tokenData will include access_token, refresh_token, expires_in, etc.

            localStorage.setItem('spotify_access_token', tokenData.access_token);

            // Spotify may or may not return a new refresh_token

            localStorage.setItem('spotify_refresh_token', tokenData.refresh_token);
            window.location.href = "/player"     // Store tokens or handle them as needed in your app
        } else {

            window.location.href = '/';
        }
    } catch (error) {
        window.location.href = '/';
    }
}
