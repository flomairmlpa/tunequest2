/**
 * Generates a random string for the code verifier or state parameter.
 */
export function generateRandomString(length: number): string {
    const possible =
        'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let text = '';
    for (let i = 0; i < length; i++) {
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
}

/**
 * Encodes an ArrayBuffer to a base64url string (RFC4648).
 * Replaces + with -, / with _, and removes any trailing =.
 */
export function base64urlencode(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Creates a code challenge from a code verifier using SHA-256.
 */
export async function generateCodeChallenge(
    verifier: string
): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(verifier);

    const digest = await crypto.subtle.digest('SHA-256', data);
    return base64urlencode(digest);
}
