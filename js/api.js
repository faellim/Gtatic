import { BALLDONTLIE_API_KEY, BALLDONTLIE_BASE_URL, DATA_FILES, normalize, withAssets } from "./state.js";

const CACHE_KEY = "gtatic-balldontlie-basic-v1";
const COOLDOWN_KEY = "gtatic-balldontlie-cooldown-until";
const CACHE_TTL = 1000 * 60 * 60;
const COOLDOWN_TTL = 1000 * 60 * 10;
const REQUEST_TIMEOUT = 6500;

const readCache = () => {
    try {
        const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || "null");
        if (!cached || Date.now() - cached.time > CACHE_TTL) return null;
        return cached.data;
    } catch {
        return null;
    }
};

const writeCache = (data) => {
    try {
        localStorage.setItem(CACHE_KEY, JSON.stringify({ time: Date.now(), data }));
    } catch {
        // Cache is optional and must not break the site.
    }
};

const apiInCooldown = () => Number(localStorage.getItem(COOLDOWN_KEY) || 0) > Date.now();
const startApiCooldown = () => {
    try {
        localStorage.setItem(COOLDOWN_KEY, String(Date.now() + COOLDOWN_TTL));
    } catch {
        // Cooldown is a safety net only.
    }
};

const fetchJson = async (url, options = {}) => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
    try {
        const response = await fetch(url, { ...options, signal: controller.signal });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return await response.json();
    } finally {
        clearTimeout(timer);
    }
};

const loadLocalData = async () => {
    const entries = await Promise.all(Object.entries(DATA_FILES).map(async ([key, url]) => [key, await fetchJson(url)]));
    return Object.fromEntries(entries);
};

const asArray = (payload) => Array.isArray(payload) ? payload : payload?.data || [];

const loadBallDontLieBasicData = async () => {
    const cached = readCache();
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
    writeCache(data);
    return { data, source: "api" };
};

const mergeBallDontLieBasicData = (localData, apiData) => {
    const apiTeamsByName = new Map(apiData.teams.map((team) => [normalize(team.name), team]));
    const apiPlayersByName = new Map(apiData.players.map((player) => [normalize(player.nickname || player.full_name), player]));

    const teams = localData.teams.map((team) => {
        const apiTeam = apiTeamsByName.get(normalize(team.name));
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
    teams: (data.teams || []).map(withAssets.team),
    players: (data.players || []).map(withAssets.player),
    matches: (data.matches || []).map(withAssets.match),
    news: (data.news || []).map(withAssets.news),
    events: data.events || []
});

export const loadHybridData = async () => {
    const localData = await loadLocalData();

    try {
        const result = await loadBallDontLieBasicData();
        const merged = mergeBallDontLieBasicData(localData, result.data);
        const message = result.source === "cache"
            ? "Using cached BALLDONTLIE basic data + local rankings"
            : "Using BALLDONTLIE basic data + local rankings";
        return { data: enrich(merged), source: result.source, message };
    } catch (error) {
        console.warn("BALLDONTLIE API unavailable, loading fallback JSON.", error);
        startApiCooldown();
        return { data: enrich(localData), source: "offline", message: "Using offline data" };
    }
};
