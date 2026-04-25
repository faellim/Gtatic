import { formatDate, games, matchStatuses, normalize } from "./state.js";

const statusClass = (status) => status === "Live" ? "status-live" : status === "Finished" ? "status-finished" : "";

export const setActiveNav = () => {
    const currentPage = document.body.dataset.page;
    document.querySelectorAll(".site-nav a").forEach((link) => {
        const page = link.getAttribute("href").replace(".html", "") || "home";
        const normalizedPage = page === "index" ? "home" : page;
        if (normalizedPage === currentPage) link.classList.add("is-active");
    });
};

export const setupMenu = () => {
    const toggle = document.querySelector(".nav-toggle");
    const nav = document.querySelector(".site-nav");
    if (!toggle || !nav) return;

    toggle.addEventListener("click", () => {
        const isOpen = nav.classList.toggle("is-open");
        document.body.classList.toggle("menu-open", isOpen);
        toggle.setAttribute("aria-expanded", String(isOpen));
        toggle.setAttribute("aria-label", isOpen ? "Close menu" : "Open menu");
    });
};

export const setupTheme = () => {
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

export const setupBackToTop = () => {
    const button = document.querySelector("[data-back-to-top]");
    if (!button) return;
    window.addEventListener("scroll", () => {
        button.classList.toggle("is-visible", window.scrollY > 420);
    }, { passive: true });
    button.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
};

export const showDataSource = (message, source) => {
    const banner = document.querySelector("[data-source-banner]");
    if (!banner) return;
    banner.textContent = message;
    banner.dataset.source = source;
    banner.hidden = false;
};

const createFilterButtons = (container, values, onSelect) => {
    if (!container) return;
    container.innerHTML = values.map((value, index) => (
        `<button class="filter-button ${index === 0 ? "active" : ""}" type="button" data-filter="${value}">${value}</button>`
    )).join("");

    container.addEventListener("click", (event) => {
        const button = event.target.closest("[data-filter]");
        if (!button) return;
        container.querySelectorAll(".filter-button").forEach((item) => item.classList.remove("active"));
        button.classList.add("active");
        onSelect(button.dataset.filter);
    });
};

const newsCard = (item) => `
    <article class="news-card">
        <img src="${item.image}" alt="${item.category} news artwork" width="360" height="150" loading="lazy">
        <div class="news-card-content">
            <span class="badge">${item.category}</span>
            <h3>${item.title}</h3>
            <p>${item.summary}</p>
            <p class="card-meta">${formatDate(item.date)}</p>
        </div>
    </article>
`;

const matchCard = (item) => `
    <article class="match-card">
        <span class="status-badge ${statusClass(item.status)}">${item.status}</span>
        <h3>${item.event}</h3>
        <p class="match-meta">${item.game} | ${formatDate(item.date)} | ${item.time}</p>
        <div class="match-teams">
            <div class="team">
                <img src="${item.teamALogo}" alt="${item.teamA} logo" width="52" height="52" loading="lazy">
                <span>${item.teamA}</span>
            </div>
            <span class="versus">VS</span>
            <div class="team">
                <img src="${item.teamBLogo}" alt="${item.teamB} logo" width="52" height="52" loading="lazy">
                <span>${item.teamB}</span>
            </div>
        </div>
    </article>
`;

const eventCard = (item) => `
    <article class="event-card">
        <span class="badge">${item.game}</span>
        <h3>${item.name}</h3>
        <p class="event-meta">${formatDate(item.date)} | ${item.location}</p>
        <a class="btn btn-ghost" href="#" aria-label="View details for ${item.name}">View details</a>
    </article>
`;

const changePill = (change) => {
    if (Number(change) > 0) return `<span class="change up">+${change}</span>`;
    if (Number(change) < 0) return `<span class="change down">${change}</span>`;
    return `<span class="change neutral">0</span>`;
};

const rankingItem = (item, index, type) => {
    const position = item.position || index + 1;
    const value = type === "players" ? `${Number(item.rating).toFixed(2)} rating` : `${item.points} pts`;
    const detail = type === "players" ? item.team : item.game;
    return `
        <li class="ranking-item top-${position}">
            <span class="medal">${position}</span>
            <img class="ranking-avatar" src="${type === "players" ? item.image : item.logo}" alt="${item.name}" width="52" height="52" loading="lazy">
            <span class="ranking-name">
                <strong>${item.name}</strong>
                <span class="ranking-meta"><img src="${item.flag}" alt="" width="20" height="14" loading="lazy"> ${detail} | ${value}</span>
            </span>
            ${changePill(item.change)}
        </li>
    `;
};

export const renderHome = (data) => {
    const featuredNews = document.querySelector("[data-featured-news]");
    const upcomingMatches = document.querySelector("[data-upcoming-matches]");
    const stats = document.querySelectorAll("[data-stat]");

    if (featuredNews) featuredNews.innerHTML = data.news.filter((item) => item.featured).slice(0, 3).map(newsCard).join("");
    if (upcomingMatches) upcomingMatches.innerHTML = data.matches.filter((item) => item.status !== "Finished").slice(0, 3).map(matchCard).join("");

    const values = {
        teams: `${data.teams.length}+`,
        matches: `${data.matches.length}+`,
        games: `${new Set(data.matches.map((item) => item.game)).size || 4}`
    };
    stats.forEach((stat) => {
        stat.textContent = values[stat.dataset.stat] || stat.textContent;
    });
};

export const renderNewsPage = (data) => {
    const list = document.querySelector("[data-news-list]");
    const search = document.querySelector("[data-news-search]");
    const empty = document.querySelector("[data-news-empty]");
    let activeGame = "All";
    if (!list) return;

    const render = () => {
        const query = normalize(search?.value || "");
        const filtered = data.news.filter((item) => {
            const matchesGame = activeGame === "All" || item.category === activeGame;
            const text = normalize(`${item.title} ${item.summary} ${item.category}`);
            return matchesGame && text.includes(query);
        });
        list.innerHTML = filtered.map(newsCard).join("");
        if (empty) empty.hidden = filtered.length > 0;
    };

    createFilterButtons(document.querySelector("[data-news-filters]"), games, (value) => {
        activeGame = value;
        render();
    });
    search?.addEventListener("input", render);
    render();
};

export const renderMatchesPage = (data) => {
    const list = document.querySelector("[data-match-list]");
    const search = document.querySelector("[data-match-search]");
    const empty = document.querySelector("[data-match-empty]");
    let activeGame = "All";
    let activeStatus = "All";
    if (!list) return;

    const render = () => {
        const query = normalize(search?.value || "");
        const filtered = data.matches.filter((item) => {
            const matchesGame = activeGame === "All" || item.game === activeGame;
            const matchesStatus = activeStatus === "All" || item.status === activeStatus;
            const text = normalize(`${item.teamA} ${item.teamB} ${item.game} ${item.event} ${item.status}`);
            return matchesGame && matchesStatus && text.includes(query);
        });
        list.innerHTML = filtered.map(matchCard).join("");
        if (empty) empty.hidden = filtered.length > 0;
    };

    createFilterButtons(document.querySelector("[data-match-filters]"), games, (value) => {
        activeGame = value;
        render();
    });
    createFilterButtons(document.querySelector("[data-status-filters]"), matchStatuses, (value) => {
        activeStatus = value;
        render();
    });
    search?.addEventListener("input", render);
    render();
};

export const renderEventsPage = (data) => {
    const futureList = document.querySelector("[data-future-events]");
    const pastList = document.querySelector("[data-past-events]");
    if (futureList) futureList.innerHTML = data.events.filter((item) => item.status !== "Past").map(eventCard).join("");
    if (pastList) pastList.innerHTML = data.events.filter((item) => item.status === "Past").map(eventCard).join("");
};

export const renderRankingPage = (data) => {
    const teamList = document.querySelector("[data-team-ranking]");
    const playerList = document.querySelector("[data-player-ranking]");
    const filters = document.querySelector("[data-ranking-filters]");
    const search = document.querySelector("[data-ranking-search]");
    let activeTab = "teams";
    if (!teamList || !playerList) return;

    const render = () => {
        const query = normalize(search?.value || "");
        teamList.innerHTML = data.teams
            .filter((item) => normalize(`${item.name} ${item.game}`).includes(query))
            .slice(0, 30)
            .map((item, index) => rankingItem(item, index, "teams"))
            .join("");
        playerList.innerHTML = data.players
            .filter((item) => normalize(`${item.name} ${item.team}`).includes(query))
            .slice(0, 30)
            .map((item, index) => rankingItem(item, index, "players"))
            .join("");
        document.querySelectorAll("[data-ranking-section]").forEach((section) => {
            section.hidden = section.dataset.rankingSection !== activeTab;
        });
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

export const setupContactForm = () => {
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
