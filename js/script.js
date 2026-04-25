(function () {
    const DATA_FILES = {
        teams: "data/teams.json",
        players: "data/players.json",
        matches: "data/matches.json",
        news: "data/news.json",
        events: "data/events.json"
    };
    const BALLDONTLIE_BASE_URL = "https://api.balldontlie.io/cs/v1";
    const BALLDONTLIE_API_KEY = "d31f904f-f2a8-460e-aef1-3a59e0466224";
    const BALLDONTLIE_CACHE_KEY = "gtatic-balldontlie-basic-v1";
    const BALLDONTLIE_COOLDOWN_KEY = "gtatic-balldontlie-cooldown-until";
    const BALLDONTLIE_CACHE_TTL = 1000 * 60 * 60;
    const BALLDONTLIE_COOLDOWN_TTL = 1000 * 60 * 10;

    const fallbackData = window.GTATIC_FALLBACK_DATA || { teams: [], players: [], matches: [], news: [], events: [] };

    const teamLogos = {
        "Team Vitality": "assets/teams/team_vitality.png",
        "G2 Esports": "assets/teams/team_g2.png",
        "NAVI": "assets/teams/team_navi.png",
        "FaZe Clan": "assets/teams/team_faze.png",
        "Team Spirit": "assets/teams/team_spirit.png",
        "FURIA": "assets/teams/team_furia.png",
        "Astralis": "assets/teams/team_astralis.png",
        "paiN Gaming": "assets/teams/team_pain.png",
        "ENCE": "assets/teams/team_ence.png",
        "Cloud9": "assets/teams/team_cloud9.png",
        "Heroic": "assets/teams/team_heroic.png",
        "Ninjas in Pyjamas": "assets/teams/team_nip.png",
        "LOUD": "assets/teams/team_loud.png",
        "INTZ": "assets/teams/team_intz.png"
    };

    const playerImages = {
        ZywOo: "assets/players/player_zywoo.png",
        s1mple: "assets/players/player_s1mple.png",
        NiKo: "assets/players/player_niko.png",
        ropz: "assets/players/player_ropz.png",
        KSCERATO: "assets/players/player_kscerato.png",
        dev1ce: "assets/players/player_dev1ce.png",
        b1t: "assets/players/player_b1t.png",
        blameF: "assets/players/player_blamef.png",
        aleksiB: "assets/players/player_aleksib.png",
        roman: "assets/players/player_roman.png"
    };

    const countryFlags = {
        br: "assets/flags/br.svg", dk: "assets/flags/dk.svg", fr: "assets/flags/fr.svg",
        ua: "assets/flags/ua.svg", us: "assets/flags/us.svg", eu: "assets/flags/eu.svg",
        ru: "assets/flags/ru.svg", se: "assets/flags/se.svg", fi: "assets/flags/fi.svg",
        ba: "assets/flags/ba.svg", as: "assets/flags/as.svg", am: "assets/flags/am.svg",
        il: "assets/flags/il.svg", ee: "assets/flags/ee.svg", xk: "assets/flags/xk.svg",
        ca: "assets/flags/ca.svg", tr: "assets/flags/tr.svg", ar: "assets/flags/ar.svg",
        bg: "assets/flags/bg.svg", rs: "assets/flags/rs.svg", pl: "assets/flags/pl.svg",
        default: "assets/flags/default.svg"
    };

    Object.assign(teamLogos, window.GTATIC_TEAM_LOGOS || {});
    Object.assign(playerImages, window.GTATIC_PLAYER_IMAGES || {});

    const games = ["All", "CS2", "Valorant", "LoL", "Overwatch"];
    const statuses = ["All", "Live", "Upcoming", "Finished"];
    const defaults = {
        team: "assets/teams/default-team.svg",
        player: "assets/players/default-player.svg",
        flag: "assets/flags/default.svg",
        news: "assets/ui/news-default.svg"
    };

    const normalize = (value) => String(value || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const formatDate = (date) => new Intl.DateTimeFormat("en-US", { month: "short", day: "2-digit", year: "numeric" }).format(new Date(`${date}T12:00:00`));
    const fetchJson = async (url, options = {}) => {
        const response = await fetch(url, options);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
    };

    const loadLocalJson = async () => {
        const entries = await Promise.all(Object.entries(DATA_FILES).map(async ([key, path]) => [key, await fetchJson(path)]));
        return Object.fromEntries(entries);
    };

    const asArray = (payload) => Array.isArray(payload) ? payload : payload?.data || [];

    const readBallDontLieCache = () => {
        try {
            const cached = JSON.parse(localStorage.getItem(BALLDONTLIE_CACHE_KEY) || "null");
            if (!cached || Date.now() - cached.time > BALLDONTLIE_CACHE_TTL) return null;
            return cached.data;
        } catch {
            return null;
        }
    };

    const apiInCooldown = () => Number(localStorage.getItem(BALLDONTLIE_COOLDOWN_KEY) || 0) > Date.now();
    const startApiCooldown = () => {
        try {
            localStorage.setItem(BALLDONTLIE_COOLDOWN_KEY, String(Date.now() + BALLDONTLIE_COOLDOWN_TTL));
        } catch {
            // Cooldown is a safety net only.
        }
    };

    const writeBallDontLieCache = (data) => {
        try {
            localStorage.setItem(BALLDONTLIE_CACHE_KEY, JSON.stringify({ time: Date.now(), data }));
        } catch {
            // Cache is optional and may fail in private browsing.
        }
    };

    const loadBallDontLieBasicData = async () => {
        const cached = readBallDontLieCache();
        if (cached) return { data: cached, source: "cache" };
        if (apiInCooldown()) throw new Error("BALLDONTLIE cooldown active");

        const headers = { Authorization: BALLDONTLIE_API_KEY };
        const [teams, players] = await Promise.all([
            fetchJson(`${BALLDONTLIE_BASE_URL}/teams?per_page=100`, { headers }),
            fetchJson(`${BALLDONTLIE_BASE_URL}/players?per_page=100&active=true`, { headers })
        ]);
        const data = {
            teams: asArray(teams),
            players: asArray(players)
        };
        writeBallDontLieCache(data);
        return { data, source: "api" };
    };

    const mergeBallDontLieBasicData = (localData, apiData) => {
        const apiTeamsByName = new Map(apiData.teams.map((team) => [normalize(team.name), team]));
        const apiPlayersByName = new Map(apiData.players.map((player) => [normalize(player.nickname || player.full_name), player]));
        const teams = localData.teams.map((team) => {
            const apiTeam = apiTeamsByName.get(normalize(team.name)) || apiTeamsByName.get(normalize(team.name.replace("Natus Vincere", "NAVI")));
            return {
                ...team,
                apiId: apiTeam?.id || null,
                shortName: apiTeam?.short_name || team.shortName || team.name
            };
        });
        const players = localData.players.map((player) => {
            const apiPlayer = apiPlayersByName.get(normalize(player.name));
            return {
                ...player,
                apiId: apiPlayer?.id || null,
                fullName: apiPlayer?.full_name || player.fullName || player.name,
                age: apiPlayer?.age || null,
                team: apiPlayer?.team?.name || player.team
            };
        });
        return { ...localData, teams, players };
    };

    const enrich = (data) => ({
        teams: (data.teams || []).map((team) => ({ ...team, logo: teamLogos[team.name] || defaults.team, flag: countryFlags[String(team.country || "default").toLowerCase()] || defaults.flag })),
        players: (data.players || []).map((player) => ({ ...player, image: playerImages[player.name] || defaults.player, flag: countryFlags[String(player.country || "default").toLowerCase()] || defaults.flag })),
        matches: (data.matches || []).map((match) => ({ ...match, teamALogo: teamLogos[match.teamA] || defaults.team, teamBLogo: teamLogos[match.teamB] || defaults.team })),
        news: (data.news || []).map((item) => ({ ...item, image: item.image || defaults.news })),
        events: data.events || []
    });

    const loadData = async () => {
        if (window.location.protocol === "file:") {
            return { data: enrich(fallbackData), source: "embedded", message: "Using embedded offline data" };
        }

        let localData = fallbackData;
        let source = "embedded";
        let message = "Using embedded offline data";
        try {
            localData = await loadLocalJson();
            source = "offline";
            message = "Using offline data";
        } catch (error) {
            console.warn("Local JSON unavailable; using embedded fallback.", error);
        }

        try {
            const result = await loadBallDontLieBasicData();
            const merged = mergeBallDontLieBasicData(localData, result.data);
            const label = result.source === "cache" ? "Using cached BALLDONTLIE basic data + local rankings" : "Using BALLDONTLIE basic data + local rankings";
            return { data: enrich(merged), source: result.source, message: label };
        } catch (error) {
            console.warn("BALLDONTLIE API unavailable; using fallback data.", error);
            startApiCooldown();
            return { data: enrich(localData), source: "offline", message: "Using offline data" };
        }
    };

    const setActiveNav = () => {
        const currentPage = document.body.dataset.page;
        document.querySelectorAll(".site-nav a").forEach((link) => {
            const page = link.getAttribute("href").replace(".html", "");
            if ((page === "index" ? "home" : page) === currentPage) link.classList.add("is-active");
        });
    };

    const setupMenu = () => {
        const toggle = document.querySelector(".nav-toggle");
        const nav = document.querySelector(".site-nav");
        if (!toggle || !nav) return;
        toggle.addEventListener("click", () => {
            const isOpen = nav.classList.toggle("is-open");
            document.body.classList.toggle("menu-open", isOpen);
            toggle.setAttribute("aria-expanded", String(isOpen));
        });
    };

    const setupTheme = () => {
        const button = document.querySelector("[data-theme-toggle]");
        const savedTheme = localStorage.getItem("gtatic-theme") || "dark";
        document.documentElement.dataset.theme = savedTheme;
        if (button) button.textContent = savedTheme === "dark" ? "Light" : "Dark";
        button?.addEventListener("click", () => {
            const nextTheme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
            document.documentElement.dataset.theme = nextTheme;
            localStorage.setItem("gtatic-theme", nextTheme);
            button.textContent = nextTheme === "dark" ? "Light" : "Dark";
        });
    };

    const setupBackToTop = () => {
        const button = document.querySelector("[data-back-to-top]");
        if (!button) return;
        window.addEventListener("scroll", () => button.classList.toggle("is-visible", window.scrollY > 420), { passive: true });
        button.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
    };

    const showSource = (message, source) => {
        const banner = document.querySelector("[data-source-banner]");
        if (!banner) return;
        banner.textContent = message;
        banner.dataset.source = source;
        banner.hidden = false;
    };

    const filterButtons = (container, values, onSelect) => {
        if (!container) return;
        container.innerHTML = values.map((value, index) => `<button class="filter-button ${index === 0 ? "active" : ""}" type="button" data-filter="${value}">${value}</button>`).join("");
        container.addEventListener("click", (event) => {
            const button = event.target.closest("[data-filter]");
            if (!button) return;
            container.querySelectorAll(".filter-button").forEach((item) => item.classList.remove("active"));
            button.classList.add("active");
            onSelect(button.dataset.filter);
        });
    };

    const newsCard = (item) => `<article class="news-card"><img src="${item.image}" alt="${item.category} news artwork" width="360" height="150" loading="lazy"><div class="news-card-content"><span class="badge">${item.category}</span><h3>${item.title}</h3><p>${item.summary}</p><p class="card-meta">${formatDate(item.date)}</p></div></article>`;
    const statusClass = (status) => status === "Live" ? "status-live" : status === "Finished" ? "status-finished" : "";
    const matchCard = (item) => `<article class="match-card"><span class="status-badge ${statusClass(item.status)}">${item.status}</span><h3>${item.event}</h3><p class="match-meta">${item.game} | ${formatDate(item.date)} | ${item.time}</p><div class="match-teams"><div class="team"><img src="${item.teamALogo}" alt="${item.teamA} logo" width="52" height="52" loading="lazy"><span>${item.teamA}</span></div><span class="versus">VS</span><div class="team"><img src="${item.teamBLogo}" alt="${item.teamB} logo" width="52" height="52" loading="lazy"><span>${item.teamB}</span></div></div></article>`;
    const eventCard = (item) => `<article class="event-card"><span class="badge">${item.game}</span><h3>${item.name}</h3><p class="event-meta">${formatDate(item.date)} | ${item.location}</p><a class="btn btn-ghost" href="#" aria-label="View details for ${item.name}">View details</a></article>`;
    const changePill = (change) => Number(change) > 0 ? `<span class="change up">+${change}</span>` : Number(change) < 0 ? `<span class="change down">${change}</span>` : `<span class="change neutral">0</span>`;
    const rankingItem = (item, index, type) => {
        const position = item.position || index + 1;
        const value = type === "players" ? `${Number(item.rating).toFixed(2)} rating` : `${item.points} pts`;
        const detail = type === "players" ? item.team : item.game;
        const image = type === "players" ? item.image : item.logo;
        return `<li class="ranking-item top-${position}"><span class="medal">${position}</span><img class="ranking-avatar" src="${image}" alt="${item.name}" width="52" height="52" loading="lazy"><span class="ranking-name"><strong>${item.name}</strong><span class="ranking-meta"><img src="${item.flag}" alt="" width="20" height="14" loading="lazy"> ${detail} | ${value}</span></span>${changePill(item.change)}</li>`;
    };

    const renderHome = (data) => {
        const featuredNews = document.querySelector("[data-featured-news]");
        const upcomingMatches = document.querySelector("[data-upcoming-matches]");
        if (featuredNews) featuredNews.innerHTML = data.news.filter((item) => item.featured).slice(0, 3).map(newsCard).join("");
        if (upcomingMatches) upcomingMatches.innerHTML = data.matches.filter((item) => item.status !== "Finished").slice(0, 3).map(matchCard).join("");
        document.querySelectorAll("[data-stat]").forEach((stat) => {
            const values = { teams: `${data.teams.length}+`, matches: `${data.matches.length}+`, games: `${new Set(data.matches.map((item) => item.game)).size || 4}` };
            stat.textContent = values[stat.dataset.stat] || stat.textContent;
        });
    };

    const renderNews = (data) => {
        const list = document.querySelector("[data-news-list]");
        const search = document.querySelector("[data-news-search]");
        const empty = document.querySelector("[data-news-empty]");
        let activeGame = "All";
        if (!list) return;
        const render = () => {
            const query = normalize(search?.value || "");
            const filtered = data.news.filter((item) => (activeGame === "All" || item.category === activeGame) && normalize(`${item.title} ${item.summary} ${item.category}`).includes(query));
            list.innerHTML = filtered.map(newsCard).join("");
            if (empty) empty.hidden = filtered.length > 0;
        };
        filterButtons(document.querySelector("[data-news-filters]"), games, (value) => { activeGame = value; render(); });
        search?.addEventListener("input", render);
        render();
    };

    const renderMatches = (data) => {
        const list = document.querySelector("[data-match-list]");
        const search = document.querySelector("[data-match-search]");
        const empty = document.querySelector("[data-match-empty]");
        let activeGame = "All";
        let activeStatus = "All";
        if (!list) return;
        const render = () => {
            const query = normalize(search?.value || "");
            const filtered = data.matches.filter((item) => (activeGame === "All" || item.game === activeGame) && (activeStatus === "All" || item.status === activeStatus) && normalize(`${item.teamA} ${item.teamB} ${item.game} ${item.event} ${item.status}`).includes(query));
            list.innerHTML = filtered.map(matchCard).join("");
            if (empty) empty.hidden = filtered.length > 0;
        };
        filterButtons(document.querySelector("[data-match-filters]"), games, (value) => { activeGame = value; render(); });
        filterButtons(document.querySelector("[data-status-filters]"), statuses, (value) => { activeStatus = value; render(); });
        search?.addEventListener("input", render);
        render();
    };

    const renderEvents = (data) => {
        const futureList = document.querySelector("[data-future-events]");
        const pastList = document.querySelector("[data-past-events]");
        if (futureList) futureList.innerHTML = data.events.filter((item) => item.status !== "Past").map(eventCard).join("");
        if (pastList) pastList.innerHTML = data.events.filter((item) => item.status === "Past").map(eventCard).join("");
    };

    const renderRanking = (data) => {
        const teamList = document.querySelector("[data-team-ranking]");
        const playerList = document.querySelector("[data-player-ranking]");
        const filters = document.querySelector("[data-ranking-filters]");
        const search = document.querySelector("[data-ranking-search]");
        let activeTab = "teams";
        if (!teamList || !playerList) return;
        const render = () => {
            const query = normalize(search?.value || "");
            teamList.innerHTML = data.teams.filter((item) => normalize(`${item.name} ${item.game}`).includes(query)).slice(0, 30).map((item, index) => rankingItem(item, index, "teams")).join("");
            playerList.innerHTML = data.players.filter((item) => normalize(`${item.name} ${item.team}`).includes(query)).slice(0, 30).map((item, index) => rankingItem(item, index, "players")).join("");
            document.querySelectorAll("[data-ranking-section]").forEach((section) => { section.hidden = section.dataset.rankingSection !== activeTab; });
        };
        filters?.addEventListener("click", (event) => {
            const button = event.target.closest("[data-ranking-filter]");
            if (!button) return;
            filters.querySelectorAll(".filter-button").forEach((item) => item.classList.remove("active"));
            button.classList.add("active");
            activeTab = button.dataset.rankingFilter;
            render();
        });
        search?.addEventListener("input", render);
        render();
    };

    const setupContact = () => {
        const form = document.querySelector("[data-contact-form]");
        if (!form) return;
        const showError = (name, message) => {
            const field = form.querySelector(`[name="${name}"]`);
            const error = form.querySelector(`[data-error-for="${name}"]`);
            if (error) error.textContent = message;
            field?.setAttribute("aria-invalid", message ? "true" : "false");
        };
        form.addEventListener("submit", (event) => {
            event.preventDefault();
            const data = new FormData(form);
            const name = String(data.get("nome") || "").trim();
            const email = String(data.get("email") || "").trim();
            const message = String(data.get("mensagem") || "").trim();
            const emailIsValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
            showError("nome", name.length < 2 ? "Enter at least 2 characters." : "");
            showError("email", !emailIsValid ? "Enter a valid email." : "");
            showError("mensagem", message.length < 12 ? "Write a message with at least 12 characters." : "");
            if (name.length < 2 || !emailIsValid || message.length < 12) return;
            form.reset();
            const success = document.querySelector("[data-form-success]");
            if (success) success.hidden = false;
        });
    };

    const init = async () => {
        setActiveNav();
        setupMenu();
        setupTheme();
        setupBackToTop();
        setupContact();
        const { data, source, message } = await loadData();
        showSource(message, source);
        renderHome(data);
        renderNews(data);
        renderMatches(data);
        renderEvents(data);
        renderRanking(data);
    };

    init().catch((error) => {
        console.error("GTATIC failed to initialize.", error);
        const data = enrich(fallbackData);
        showSource("Using embedded offline data", "embedded");
        renderHome(data);
        renderNews(data);
        renderMatches(data);
        renderEvents(data);
        renderRanking(data);
    });
})();
