# GTATIC

GTATIC is a professional static e-sports portal built with HTML, CSS and vanilla JavaScript. It is designed for portfolio use, GitHub Pages, Vercel, or any static host, while still supporting a hybrid data layer for teams, players, rankings, and local assets.

## Preview

![GTATIC preview](assets/ui/gtatic.png)

## Demo

Suggested GitHub Pages URL:

```text
https://faellim.github.io/gtatic
```

## Features

- Hybrid data system: BALLDONTLIE basic API, local JSON fallback, embedded fallback, and local assets
- Free-tier friendly API usage with cache and cooldown
- Updated team ranking and player ranking with local images
- BLAST-based team logo mapping for ranked teams
- Search and filters for rankings, news, and matches
- Mobile-first responsive layout
- Dark/light theme with `localStorage`
- Accessible focus states, labels, and semantic markup
- Contact form validation with success feedback
- Basic SEO and Open Graph tags on every page

## Tech Stack

- HTML5
- CSS3
- Vanilla JavaScript
- Local JSON data files
- Local SVG, PNG, and JPG assets

## Folder Structure

```text
/
|-- assets
|   |-- flags
|   |-- icons
|   |-- images
|   |-- players
|   |-- teams
|   `-- ui
|-- css
|   `-- style.css
|-- data
|   |-- events.json
|   |-- matches.json
|   |-- news.json
|   |-- players.json
|   `-- teams.json
|-- js
|   |-- api.js
|   |-- fallback-data.js
|   |-- script.js
|   |-- state.js
|   `-- ui.js
|-- .gitignore
|-- LICENSE
|-- contato.html
|-- eventos.html
|-- index.html
|-- noticias.html
|-- partidas.html
|-- ranking.html
`-- README.md
```

## Hybrid Data System

GTATIC does not depend entirely on external APIs.

Loading order:

1. Try BALLDONTLIE free endpoints for basic team and player data.
2. Use cached API data when available.
3. Fall back to local JSON files in `/data`.
4. Fall back to embedded data in `js/fallback-data.js` when needed.
5. Render only local images from `/assets`.

If API data is unavailable, the site displays:

```text
Using offline data
```

## BALLDONTLIE API

The project uses the BALLDONTLIE CS2 API with the free tier. The free tier exposes `Teams`, `Players`, `Tournaments`, and `Tournament Teams`, but does not expose `Rankings` or `Matches`.

To respect the 5 requests/minute free limit, GTATIC currently calls only:

```text
GET https://api.balldontlie.io/cs/v1/teams?per_page=100
GET https://api.balldontlie.io/cs/v1/players?per_page=100&active=true
```

Rankings, ratings, and matches remain local because those endpoints are not available in the free plan. If the API returns `429`, the project enters a temporary cooldown and keeps rendering offline data without breaking the UI.

## Local Assets

The project avoids hotlinked images in the final UI.

- Team logos live in `/assets/teams`
- Player images live in `/assets/players`
- Country flags live in `/assets/flags`
- UI artwork and placeholders live in `/assets/ui`

Mappings in `js/state.js` and `js/fallback-data.js` connect ranking names to local files. Missing assets fall back gracefully so the layout remains stable.

## Run Locally

Because the project fetches local JSON files, run it through a static server:

```bash
npx serve .
```

or:

```bash
python -m http.server 4173
```

Then open:

```text
http://127.0.0.1:4173
```

## Future Improvements

- Add real detail pages for teams, players, matches, and news
- Add build-time image optimization
- Add automated accessibility tests
- Add service worker caching for stronger offline support
- Add visual regression screenshots for UI QA

## Author

Developed by Rafael as a front-end portfolio project.

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE).
