# Wedding Invitation Website

A royal-style (maroon & gold) wedding invitation: envelope intro, countdown, story, ceremony card, photo gallery with lightbox, venue with Google Map, and optional background music. Plain HTML/CSS/JS — no build step.

## Customize
1. Open `config.js` and edit names, date/time, venue, address, Google Maps link, story text.
2. Photos: create an `images/` folder, add your photos, and set `src` in the `gallery` list (e.g. `"images/1.jpg"`). Set `storyPhoto` too.
3. Music (optional): add `music/song.mp3` and set `music: "music/song.mp3"`.

## Run locally
Just open `index.html` in a browser, or:
```
npx serve .
```

## Deploy to Vercel
- Push this folder to a GitHub repo → import it at vercel.com → Deploy (Framework preset: "Other").
- Or with the CLI: `npm i -g vercel` then run `vercel` inside this folder.
