
import { getCookies, setCookie } from "https://deno.land/std@0.144.0/http/cookie.ts";

export class SpotifyApi {
    baseAccountUrl = "https://accounts.spotify.com";
    baseApiUrl = "https://api.spotify.com";

    authorizeResponse(_req: Request): Response {
        const clientId = Deno.env.get('SPOTIFY_CLIENT_ID') || '';
        const scope = 'user-read-private user-read-email';

        const redirectUrl = new URL(`${this.baseAccountUrl}/authorize`);
        redirectUrl.searchParams.append('response_type', 'code');
        redirectUrl.searchParams.append('client_id', clientId);
        redirectUrl.searchParams.append('scope', scope);
        redirectUrl.searchParams.append('redirect_uri', new URL(_req.url).origin + '/callback');
        // redirectUrl.searchParams.append('state', state);
        return Response.redirect(redirectUrl);
    }

    async getTokenResponse(_req: Request): Promise<Response> {
        const url = new URL(_req.url);
        const code = url.searchParams.get("code") || '';
        const state = url.searchParams.get("state") || '';

        const clientId = Deno.env.get("SPOTIFY_CLIENT_ID") || "";
        const clientSecret = Deno.env.get("SPOTIFY_CLIENT_SECRET") || "";

        const tokenResponse = await fetch(`${this.baseAccountUrl}/api/token`, {
            method: "POST",
            headers: {
                "Authorization": `Basic ${btoa(clientId + ':' + clientSecret)}`,
                "Content-Type": "application/x-www-form-urlencoded",
            },
            body: new URLSearchParams({
                code: code,
                redirect_uri: (new URL(_req.url).origin + '/callback'),
                grant_type: 'authorization_code'
            })
        });

        const data = await tokenResponse.json();
        const { access_token, expires_in } = data;

        const response = new Response(null, {
            status: 302,
            headers: {
                "location": new URL(_req.url).origin,
            },
        });
        setCookie(response.headers, {
            name: "spotify_token",
            value: access_token,
            maxAge: expires_in,
            httpOnly: true,
        });
        return response;
    }

    apiRequest(req: Request, url: string): Promise<Response> {
        const maybeAccessToken = getCookies(req.headers)["spotify_token"];
        if (!maybeAccessToken) {
            return Promise.reject(new Error("No access token"));
        }
        return fetch(`${this.baseApiUrl}/${url}`, {
            headers: {
                Authorization: `Bearer ${maybeAccessToken}`
            }
        });
    }

    getUserProfile(req: Request): Promise<Response> {
        return spotifyApi.apiRequest(req, 'v1/me');
    }
}

export const spotifyApi = new SpotifyApi();