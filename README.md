# IMPORTANT
Using the Spotify API to creat Games like e.g. [Games or trivia quizzes is against the their terms and conditions](https://developer.spotify.com/compliance-tips#disallowed-use-cases). Therefor use/host it at your own risk.

# TuneQuest

Welcome to TuneQuest, a music guessing game that will put your music knowledge to the test! 
Inspired by the board game Hitster, TuneQuest brings the excitement and challenge of guessing iconic tracks right to your table.
Are you a music aficionado? A casual listener? Or just someone who loves a good challenge? TuneQuest has something for everyone. 
With the whole Spotify library to choose from, there's always a new challenge awaiting you.
How well do you know your favorite artists' discographies? 
Can you pinpoint the exact year that legendary albums were released? 
TuneQuest will push your memory and musical knowledge to the limit as you compete against friends or test your skills solo.

## Important Notes

Due to the Spotify API restrictions, the game can only be played by users with a Spotify Premium account.
Also due to the nature of web browsers in general, the first scanned song may not play automatically and you may have to click on the play button to start the song.
This is a feature of the web browsers to prevent autoplaying of media content that is often times unwanted by the user.

## Timeline Mode

`/timeline` is a pass-and-play version of the board game for 1 to 6 players on one phone. Every player starts
with one revealed song; on their turn a song from the selected playlist plays and they tap where it belongs in their
timeline. Correctly placed songs are kept, wrong ones are discarded, and the first player to reach the goal (5, 7, 10
or 15 songs) wins. Solo players have to reach the goal before making 3 mistakes. The game is saved in the browser, so a
reload doesn't end it.

## Original Hitster Cards

The scanner also reads the QR codes of original Hitster cards (`www.hitstergame.com/<lang>/<card>` and
`www.hitstergame.com/<lang>/<sku>/<card>`). The `/api/hitster` route resolves them to Spotify tracks using a snapshot
of the official Hitster database in `data/hitster-cards.json`. Cards of editions released after the snapshot are looked
up in the live database (`https://hitster.jumboplay.com/hitster-assets/gameset_database.json`, cached for 24 hours;
override with `HITSTER_DATABASE_URL`).

To update the snapshot:

```bash
node scripts/build-hitster-cards.mjs
```

## Getting Started

If you want to run this project, you need to create a `.env` file in the root of the project with the following content:

```env
SPOTIFY_AUTHORIZE_URL=https://accounts.spotify.com/authorize
SPOTIFY_API_TOKEN_URL=https://accounts.spotify.com/api/token
SPOTIFY_REDIRECT_URI=http://localhost:3000/player
SPOTIFY_CLIENT_SECRET=xxx
SPOTIFY_CLIENT_ID=xxx
SPOTIFY_SCOPES=user-modify-playback-state streaming user-read-email user-read-private
NEXT_PUBLIC_TUNEQUEST_CREATE_URL=http://localhost:5173
```

To run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

To build the project:

```bash
npm run build
# or
yarn build
# or
pnpm build
# or
bun build
```

To run the non development server:

```bash
npm run start
# or
yarn start
# or
pnpm start
# or
bun start
```

## Docker

Build the docker image:
```bash
docker build -t tunequest .
```

Create the following `docker-compose.yaml` file:
```dockerfile
services:
  tunequest:
    container_name: tunequest
    image: tunequest
    restart: unless-stopped
    ports:
      - 3000:3000
```

Run the docker image with docker compose:
```bash
docker-compose up -d
```

# TODO
- [ ] Add compatibility with the original Hitster cards
  - This is a painstaking process, as the original Hitster cards are not available online and I have to manually type them in.
  - I will start with the cards I own and if you want to help me, please let me know.
- [ ] Add better error handling
- [ ] Improve the Docker Image to not bake in some of the environment variables
- [ ] Publish Docker image to Docker Hub
  - If someone wants to help me with this, please let me know.
