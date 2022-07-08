/** @jsx h */
/** @jsxFrag Fragment */
import { h } from "preact";
import Counter from "../islands/Counter.tsx";
import { Handlers, PageProps } from "$fresh/server.ts";
import { getCookies, setCookie } from "https://deno.land/std@0.144.0/http/cookie.ts";
import { spotifyApi } from "../spotify.ts";

export const handler: Handlers = {
  async GET(_req, _ctx) {
    const maybeAccessToken = getCookies(_req.headers)["spotify_token"];
    if (maybeAccessToken) {
      const userProfileResponse = await spotifyApi.getUserProfile(_req);
      const userData = await userProfileResponse.json()
      console.log('data', userData);
      // const userData = await gitHubApi.getUserData(maybeAccessToken);
      if (userData) {
        return _ctx.render(userData);
      }
      console.log('maybe', maybeAccessToken);
    }
    
    return _ctx.render();
  },
};

export default function Home({ url, data }: PageProps) {
  return data ? (
    <div>
      <h1>{data.display_name}</h1>
      <img src={data.images.find(i => i).url} alt="profile image" />
    </div>
  ) : (
    <div>
      <div id="login">
        <h1>First, log in to spotify</h1>
        <a href="/login">Log in</a>
      </div>
      <div id="loggedin">
      </div>
    </div>
  );
}
