# Merienda Rush!

An original time-management cooking game. You run a Filipino street food stall in a busy
barangay: cook turon, maruya, banana cue, kamote cue, fishball, kikiam and palamig before your
customers run out of patience.

Plain HTML, CSS and JavaScript. No frameworks, no build step, no backend, no image or sound
files (everything is drawn on a canvas and every sound is made with the Web Audio API).

## Play

- Online: `https://<your-username>.github.io/merienda-rush/` (after you turn on GitHub Pages, see below)
- Offline: double-click `index.html`

Controls: tap or drag ingredients from the trays onto the stations, then serve the finished food
to the customer. Keyboard: `P` / `Esc` pause, `M` mute.

## Files

| File | What it does |
|---|---|
| `index.html` | Page, HUD and all menu screens |
| `style.css` | Layout and screen styles |
| `script.js` | Starts the game |
| `js/data.js` | Foods, recipes, days, customers, Taglish lines, upgrades |
| `js/audio.js` | Sound effects (Web Audio API) |
| `js/art.js` | All drawings: street, jeepney, customers, foods, stations |
| `js/ui.js` | Title, how-to-play, day select, results, shop, HUD |
| `js/game.js` | Game rules, input (mouse and touch), saving, main loop |

Progress, coins, upgrades and best scores are saved in the browser's `localStorage`.

## Put it on GitHub Pages

1. On github.com, click **New repository**. Name it `merienda-rush`, set it to **Public**, and
   don't add a README (this folder already has one). Click **Create repository**.
2. Open a terminal in this folder and run (replace `<your-username>`):

   ```bash
   git init
   git add .
   git commit -m "Merienda Rush! first version"
   git branch -M main
   git remote add origin https://github.com/<your-username>/merienda-rush.git
   git push -u origin main
   ```

   The first push may open a browser window asking you to sign in to GitHub.
3. On the repository page, go to **Settings → Pages**. Under **Build and deployment**, set
   **Source** to **Deploy from a branch**, choose **main** and **/ (root)**, then click **Save**.
4. Wait 1–2 minutes and refresh the Pages settings. Your link appears at the top:
   `https://<your-username>.github.io/merienda-rush/`

To update the game later: `git add .`, `git commit -m "what changed"`, `git push`. Pages
rebuilds by itself within a minute or two.
