export const DATA_FILES = {
    teams: "data/teams.json",
    players: "data/players.json",
    matches: "data/matches.json",
    news: "data/news.json",
    events: "data/events.json"
};

export const BALLDONTLIE_BASE_URL = "https://api.balldontlie.io/cs/v1";
export const BALLDONTLIE_API_KEY = "d31f904f-f2a8-460e-aef1-3a59e0466224";

export const DEFAULT_ASSETS = {
    team: "assets/teams/default-team.svg",
    player: "assets/players/default-player.svg",
    flag: "assets/flags/default.svg",
    news: "assets/ui/news-default.svg"
};

export const teamLogos = {

    "Vitality": "assets/teams/vitality-blast.svg",
    "Natus Vincere": "assets/teams/natus-vincere-blast.svg",
    "Falcons": "assets/teams/falcons-blast.svg",
    "FUT": "assets/teams/fut-blast.svg",
    "Spirit": "assets/teams/spirit-blast.svg",
    "Astralis": "assets/teams/astralis-blast.svg",
    "The MongolZ": "assets/teams/the-mongolz-blast.png",
    "FURIA": "assets/teams/furia-blast.svg",
    "MOUZ": "assets/teams/mouz-blast.svg",
    "PARIVISION": "assets/teams/parivision-blast.png",
    "Aurora": "assets/teams/aurora-blast.svg",
    "G2": "assets/teams/g2-blast.svg",
    "3DMAX": "assets/teams/3dmax-blast.png",
    "B8": "assets/teams/b8-blast.svg",
    "paiN": "assets/teams/pain-blast.svg",
    "9z": "assets/teams/9z-blast.svg",
    "Legacy": "assets/teams/legacy-blast.svg",
    "Monte": "assets/teams/monte-blast.svg",
    "HEROIC": "assets/teams/heroic-blast.svg",
    "BIG": "assets/teams/big-blast.svg",
    "BetBoom": "assets/teams/betboom-blast.png",
    "Alliance": "assets/teams/alliance-blast.svg",
    "GamerLegion": "assets/teams/gamerlegion-blast.svg",
    "MIBR": "assets/teams/mibr-blast.png",
    "FOKUS": "assets/teams/fokus.svg",
    "EYEBALLERS": "assets/teams/eyeballers.svg",
    "M80": "assets/teams/m80-blast.svg",
    "Ninjas in Pyjamas": "assets/teams/ninjas-in-pyjamas-blast.svg",
    "Nemesis": "assets/teams/nemesis.svg",
    "NRG": "assets/teams/nrg-blast.png"

};

export const playerImages = {

    "ZywOo": "assets/players/zywoo-lp.jpg",
    "donk": "assets/players/donk-lp.jpg",
    "flameZ": "assets/players/flamez-lp.jpg",
    "m0NESY": "assets/players/m0nesy-lp.jpg",
    "Banjo": "assets/players/banjo-blast.jpg",
    "Staehr": "assets/players/staehr-lp.jpg",
    "ropz": "assets/players/ropz-lp.jpg",
    "insani": "assets/players/insani-lp.jpg",
    "KSCERATO": "assets/players/kscerato-lp.jpg",
    "makazze": "assets/players/makazze-lp.jpg",
    "HexT": "assets/players/hext-lp.jpg",
    "XANTARES": "assets/players/xantares-lp.jpg",
    "phzy": "assets/players/phzy-blast.jpg",
    "kl1m": "assets/players/kl1m-blast.jpg",
    "Luken": "assets/players/luken-blast.img",
    "kyousuke": "assets/players/kyousuke-blast.jpg",
    "Dawy": "assets/players/dawy-lp.jpg",
    "sh1ro": "assets/players/sh1ro-blast.jpg",
    "xfl0ud": "assets/players/xfl0ud-blast.jpg",
    "electroNic": "assets/players/electronic-lp.jpg",
    "reck": "assets/players/reck-lp.jpg",
    "Rainwaker": "assets/players/rainwaker-blast.jpg",
    "Matheos": "assets/players/matheos-blast.jpg",
    "jabbi": "assets/players/jabbi-blast.jpg",
    "xKacpersky": "assets/players/xkacpersky-blast.jpg",
    "HeavyGod": "assets/players/heavygod-blast.jpg",
    "Spinx": "assets/players/spinx-blast.jpg",
    "NiKo": "assets/players/niko-blast.jpg",
    "r1nkle": "assets/players/r1nkle-blast.jpg",
    "dumau": "assets/players/dumau-blast.jpg"

};

export const countryFlags = {
    "br": "assets/flags/br.svg",
    "dk": "assets/flags/dk.svg",
    "fr": "assets/flags/fr.svg",
    "ua": "assets/flags/ua.svg",
    "us": "assets/flags/us.svg",
    "eu": "assets/flags/eu.svg",
    "ru": "assets/flags/ru.svg",
    "se": "assets/flags/se.svg",
    "fi": "assets/flags/fi.svg",
    "ba": "assets/flags/ba.svg",
    "as": "assets/flags/as.svg",
    "am": "assets/flags/am.svg",
    "il": "assets/flags/il.svg",
    "ee": "assets/flags/ee.svg",
    "xk": "assets/flags/xk.svg",
    "ca": "assets/flags/ca.svg",
    "tr": "assets/flags/tr.svg",
    "ar": "assets/flags/ar.svg",
    "bg": "assets/flags/bg.svg",
    "rs": "assets/flags/rs.svg",
    "pl": "assets/flags/pl.svg",
    "default": "assets/flags/default.svg"
};

export const games = ["All", "CS2", "Valorant", "LoL", "Overwatch"];
export const matchStatuses = ["All", "Live", "Upcoming", "Finished"];

export const normalize = (value) => String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

export const formatDate = (date) => new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric"
}).format(new Date(`${date}T12:00:00`));

export const getApiBaseUrl = () => {
    const configured = window.GTATIC_API_BASE_URL || localStorage.getItem("gtatic-api-base") || "";
    return configured.replace(/\/$/, "");
};

export const withAssets = {
    team(team) {
        return {
            ...team,
            logo: team.logo || teamLogos[team.name] || DEFAULT_ASSETS.team,
            flag: countryFlags[String(team.country || "default").toLowerCase()] || DEFAULT_ASSETS.flag
        };
    },
    player(player) {
        return {
            ...player,
            image: player.image || playerImages[player.name] || DEFAULT_ASSETS.player,
            flag: countryFlags[String(player.country || "default").toLowerCase()] || DEFAULT_ASSETS.flag
        };
    },
    match(match) {
        return {
            ...match,
            teamALogo: teamLogos[match.teamA] || DEFAULT_ASSETS.team,
            teamBLogo: teamLogos[match.teamB] || DEFAULT_ASSETS.team
        };
    },
    news(item) {
        return {
            ...item,
            image: item.image || DEFAULT_ASSETS.news
        };
    }
};
