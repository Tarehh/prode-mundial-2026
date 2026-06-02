const crypto = require("node:crypto");
const fs = require("node:fs");
const path = require("node:path");
const http = require("node:http");

loadLocalConfig();

const PORT = Number(process.env.PORT || 4174);
const ADMIN_CODE = process.env.ADMIN_CODE || "admin2026";
const DATA_FILE = process.env.DATA_FILE || path.join(__dirname, "data", "store.json");
const PUBLIC_DIR = __dirname;
const API_FOOTBALL_KEY = cleanConfigValue(process.env.API_FOOTBALL_KEY || "");
const API_FOOTBALL_LEAGUE_ID = cleanConfigValue(process.env.API_FOOTBALL_LEAGUE_ID || "1");
const API_FOOTBALL_SEASON = cleanConfigValue(process.env.API_FOOTBALL_SEASON || "2026");
const API_FOOTBALL_BASE_URL = normalizeBaseUrl(
  cleanConfigValue(process.env.API_FOOTBALL_BASE_URL || "https://v3.football.api-sports.io"),
);

const GROUPS = {
  A: ["Mexico", "Sudafrica", "Corea del Sur", "Chequia"],
  B: ["Canada", "Suiza", "Qatar", "Bosnia y Herzegovina"],
  C: ["Brasil", "Marruecos", "Haiti", "Escocia"],
  D: ["Estados Unidos", "Paraguay", "Australia", "Turquia"],
  E: ["Alemania", "Curazao", "Costa de Marfil", "Ecuador"],
  F: ["Paises Bajos", "Japon", "Tunez", "Suecia"],
  G: ["Belgica", "Egipto", "Iran", "Nueva Zelanda"],
  H: ["Espana", "Cabo Verde", "Arabia Saudita", "Uruguay"],
  I: ["Francia", "Senegal", "Noruega", "Irak"],
  J: ["Argentina", "Argelia", "Austria", "Jordania"],
  K: ["Portugal", "Uzbekistan", "Colombia", "RD Congo"],
  L: ["Inglaterra", "Croacia", "Ghana", "Panama"],
};

const SCHEDULE = [
  ["1", "A", "Mexico", "Sudafrica", "11 Jun", "13:00", "Estadio Azteca, Mexico City"],
  ["2", "A", "Corea del Sur", "Chequia", "11 Jun", "20:00", "Estadio Akron, Guadalajara"],
  ["3", "B", "Canada", "Bosnia y Herzegovina", "12 Jun", "15:00", "BMO Field, Toronto"],
  ["4", "D", "Estados Unidos", "Paraguay", "12 Jun", "18:00", "SoFi Stadium, Los Angeles"],
  ["5", "C", "Haiti", "Escocia", "13 Jun", "21:00", "Gillette Stadium, Boston"],
  ["6", "D", "Australia", "Turquia", "13 Jun", "21:00", "BC Place, Vancouver"],
  ["7", "C", "Brasil", "Marruecos", "13 Jun", "18:00", "MetLife Stadium, New York / New Jersey"],
  ["8", "B", "Qatar", "Suiza", "13 Jun", "12:00", "Levi's Stadium, San Francisco Bay Area"],
  ["9", "E", "Costa de Marfil", "Ecuador", "14 Jun", "19:00", "Lincoln Financial Field, Philadelphia"],
  ["10", "E", "Alemania", "Curazao", "14 Jun", "12:00", "NRG Stadium, Houston"],
  ["11", "F", "Paises Bajos", "Japon", "14 Jun", "15:00", "AT&T Stadium, Dallas"],
  ["12", "F", "Suecia", "Tunez", "14 Jun", "20:00", "Estadio BBVA, Monterrey"],
  ["13", "H", "Arabia Saudita", "Uruguay", "15 Jun", "18:00", "Hard Rock Stadium, Miami"],
  ["14", "H", "Espana", "Cabo Verde", "15 Jun", "12:00", "Mercedes-Benz Stadium, Atlanta"],
  ["15", "G", "Iran", "Nueva Zelanda", "15 Jun", "18:00", "SoFi Stadium, Los Angeles"],
  ["16", "G", "Belgica", "Egipto", "15 Jun", "12:00", "Lumen Field, Seattle"],
  ["17", "I", "Francia", "Senegal", "16 Jun", "15:00", "MetLife Stadium, New York / New Jersey"],
  ["18", "I", "Irak", "Noruega", "16 Jun", "18:00", "Gillette Stadium, Boston"],
  ["19", "J", "Argentina", "Argelia", "16 Jun", "20:00", "Arrowhead Stadium, Kansas City"],
  ["20", "J", "Austria", "Jordania", "16 Jun", "21:00", "Levi's Stadium, San Francisco Bay Area"],
  ["21", "L", "Ghana", "Panama", "17 Jun", "19:00", "BMO Field, Toronto"],
  ["22", "L", "Inglaterra", "Croacia", "17 Jun", "15:00", "AT&T Stadium, Dallas"],
  ["23", "K", "Portugal", "RD Congo", "17 Jun", "12:00", "NRG Stadium, Houston"],
  ["24", "K", "Uzbekistan", "Colombia", "17 Jun", "20:00", "Estadio Azteca, Mexico City"],
  ["25", "A", "Chequia", "Sudafrica", "18 Jun", "12:00", "Mercedes-Benz Stadium, Atlanta"],
  ["26", "B", "Suiza", "Bosnia y Herzegovina", "18 Jun", "12:00", "SoFi Stadium, Los Angeles"],
  ["27", "B", "Canada", "Qatar", "18 Jun", "15:00", "BC Place, Vancouver"],
  ["28", "A", "Mexico", "Corea del Sur", "18 Jun", "19:00", "Estadio Akron, Guadalajara"],
  ["29", "C", "Brasil", "Haiti", "19 Jun", "21:00", "Lincoln Financial Field, Philadelphia"],
  ["30", "C", "Escocia", "Marruecos", "19 Jun", "18:00", "Gillette Stadium, Boston"],
  ["31", "D", "Turquia", "Paraguay", "19 Jun", "20:00", "Levi's Stadium, San Francisco Bay Area"],
  ["32", "D", "Estados Unidos", "Australia", "19 Jun", "12:00", "Lumen Field, Seattle"],
  ["33", "E", "Alemania", "Costa de Marfil", "20 Jun", "16:00", "BMO Field, Toronto"],
  ["34", "E", "Ecuador", "Curazao", "20 Jun", "19:00", "Arrowhead Stadium, Kansas City"],
  ["35", "F", "Paises Bajos", "Suecia", "20 Jun", "12:00", "NRG Stadium, Houston"],
  ["36", "F", "Tunez", "Japon", "20 Jun", "22:00", "Estadio BBVA, Monterrey"],
  ["37", "H", "Uruguay", "Cabo Verde", "21 Jun", "18:00", "Hard Rock Stadium, Miami"],
  ["38", "H", "Espana", "Arabia Saudita", "21 Jun", "12:00", "Mercedes-Benz Stadium, Atlanta"],
  ["39", "G", "Belgica", "Iran", "21 Jun", "12:00", "SoFi Stadium, Los Angeles"],
  ["40", "G", "Nueva Zelanda", "Egipto", "21 Jun", "18:00", "BC Place, Vancouver"],
  ["41", "I", "Noruega", "Senegal", "22 Jun", "20:00", "MetLife Stadium, New York / New Jersey"],
  ["42", "I", "Francia", "Irak", "22 Jun", "17:00", "Lincoln Financial Field, Philadelphia"],
  ["43", "J", "Argentina", "Austria", "22 Jun", "12:00", "AT&T Stadium, Dallas"],
  ["44", "J", "Jordania", "Argelia", "22 Jun", "20:00", "Levi's Stadium, San Francisco Bay Area"],
  ["45", "L", "Inglaterra", "Ghana", "23 Jun", "16:00", "Gillette Stadium, Boston"],
  ["46", "L", "Panama", "Croacia", "23 Jun", "19:00", "BMO Field, Toronto"],
  ["47", "K", "Portugal", "Uzbekistan", "23 Jun", "12:00", "NRG Stadium, Houston"],
  ["48", "K", "Colombia", "RD Congo", "23 Jun", "20:00", "Estadio Akron, Guadalajara"],
  ["49", "C", "Escocia", "Brasil", "24 Jun", "18:00", "Hard Rock Stadium, Miami"],
  ["50", "C", "Marruecos", "Haiti", "24 Jun", "18:00", "Mercedes-Benz Stadium, Atlanta"],
  ["51", "B", "Suiza", "Canada", "24 Jun", "12:00", "BC Place, Vancouver"],
  ["52", "B", "Bosnia y Herzegovina", "Qatar", "24 Jun", "12:00", "Lumen Field, Seattle"],
  ["53", "A", "Chequia", "Mexico", "24 Jun", "19:00", "Estadio Azteca, Mexico City"],
  ["54", "A", "Sudafrica", "Corea del Sur", "24 Jun", "19:00", "Estadio BBVA, Monterrey"],
  ["55", "E", "Curazao", "Costa de Marfil", "25 Jun", "16:00", "Lincoln Financial Field, Philadelphia"],
  ["56", "E", "Ecuador", "Alemania", "25 Jun", "16:00", "MetLife Stadium, New York / New Jersey"],
  ["57", "F", "Japon", "Suecia", "25 Jun", "18:00", "AT&T Stadium, Dallas"],
  ["58", "F", "Tunez", "Paises Bajos", "25 Jun", "18:00", "Arrowhead Stadium, Kansas City"],
  ["59", "D", "Turquia", "Estados Unidos", "25 Jun", "19:00", "SoFi Stadium, Los Angeles"],
  ["60", "D", "Paraguay", "Australia", "25 Jun", "19:00", "Levi's Stadium, San Francisco Bay Area"],
  ["61", "I", "Noruega", "Francia", "26 Jun", "15:00", "Gillette Stadium, Boston"],
  ["62", "I", "Senegal", "Irak", "26 Jun", "15:00", "BMO Field, Toronto"],
  ["63", "G", "Egipto", "Iran", "26 Jun", "20:00", "Lumen Field, Seattle"],
  ["64", "G", "Nueva Zelanda", "Belgica", "26 Jun", "20:00", "BC Place, Vancouver"],
  ["65", "H", "Cabo Verde", "Arabia Saudita", "26 Jun", "19:00", "NRG Stadium, Houston"],
  ["66", "H", "Uruguay", "Espana", "26 Jun", "18:00", "Estadio Akron, Guadalajara"],
  ["67", "L", "Panama", "Inglaterra", "27 Jun", "17:00", "MetLife Stadium, New York / New Jersey"],
  ["68", "L", "Croacia", "Ghana", "27 Jun", "17:00", "Lincoln Financial Field, Philadelphia"],
  ["69", "J", "Argelia", "Austria", "27 Jun", "21:00", "Arrowhead Stadium, Kansas City"],
  ["70", "J", "Jordania", "Argentina", "27 Jun", "21:00", "AT&T Stadium, Dallas"],
  ["71", "K", "Colombia", "Portugal", "27 Jun", "19:30", "Hard Rock Stadium, Miami"],
  ["72", "K", "RD Congo", "Uzbekistan", "27 Jun", "19:30", "Mercedes-Benz Stadium, Atlanta"],
];

const sessions = new Map();
let db = loadDb();

const TEAM_ALIASES = {
  "alemania": ["alemania", "germany"],
  "argelia": ["argelia", "algeria"],
  "argentina": ["argentina"],
  "arabia saudita": ["arabia saudita", "saudi arabia"],
  "australia": ["australia"],
  "austria": ["austria"],
  "belgica": ["belgica", "belgium"],
  "bosnia y herzegovina": ["bosnia y herzegovina", "bosnia and herzegovina", "bosnia-herzegovina"],
  "brasil": ["brasil", "brazil"],
  "cabo verde": ["cabo verde", "cape verde"],
  "canada": ["canada"],
  "chequia": ["chequia", "czechia", "czech republic"],
  "colombia": ["colombia"],
  "corea del sur": ["corea del sur", "south korea", "korea republic"],
  "costa de marfil": ["costa de marfil", "ivory coast", "cote d ivoire", "cote d'ivoire"],
  "croacia": ["croacia", "croatia"],
  "curazao": ["curazao", "curacao"],
  "ecuador": ["ecuador"],
  "egipto": ["egipto", "egypt"],
  "espana": ["espana", "spain"],
  "escocia": ["escocia", "scotland"],
  "estados unidos": ["estados unidos", "united states", "usa", "usmnt"],
  "francia": ["francia", "france"],
  "ghana": ["ghana"],
  "haiti": ["haiti"],
  "inglaterra": ["inglaterra", "england"],
  "irak": ["irak", "iraq"],
  "iran": ["iran"],
  "japon": ["japon", "japan"],
  "jordania": ["jordania", "jordan"],
  "marruecos": ["marruecos", "morocco"],
  "mexico": ["mexico"],
  "noruega": ["noruega", "norway"],
  "nueva zelanda": ["nueva zelanda", "new zealand"],
  "paises bajos": ["paises bajos", "netherlands", "holland"],
  "panama": ["panama"],
  "paraguay": ["paraguay"],
  "portugal": ["portugal"],
  "qatar": ["qatar"],
  "rd congo": ["rd congo", "dr congo", "congo dr", "democratic republic of congo"],
  "senegal": ["senegal"],
  "sudafrica": ["sudafrica", "south africa"],
  "suecia": ["suecia", "sweden"],
  "suiza": ["suiza", "switzerland"],
  "tunez": ["tunez", "tunisia"],
  "turquia": ["turquia", "turkey", "turkiye"],
  "uruguay": ["uruguay"],
  "uzbekistan": ["uzbekistan"],
};

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);
    if (url.pathname.startsWith("/api/")) {
      await handleApi(req, res, url);
      return;
    }
    serveStatic(res, url.pathname);
  } catch (error) {
    sendJson(res, error.status || 500, { error: error.message || "Error inesperado" });
  }
});

server.listen(PORT, () => {
  console.log(`Prode Mundial 2026 escuchando en http://127.0.0.1:${PORT}`);
});

async function handleApi(req, res, url) {
  const body = await readBody(req);
  const session = getSession(req);

  if (req.method === "GET" && url.pathname === "/api/state") {
    sendJson(res, 200, buildClientState(session));
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/login") {
    const player = db.players.find((item) => item.id === body.playerId);
    if (!player || !verifyPin(body.pin, player.pinHash)) {
      throw httpError(401, "Jugador o PIN incorrecto");
    }
    const token = createSession({ role: "player", playerId: player.id });
    sendJson(res, 200, { token, role: "player", player: publicPlayer(player) });
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/admin/login") {
    if (body.code !== ADMIN_CODE) throw httpError(401, "Codigo de admin incorrecto");
    const token = createSession({ role: "admin" });
    sendJson(res, 200, { token, role: "admin" });
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/logout") {
    const token = getBearerToken(req);
    if (token) sessions.delete(token);
    sendJson(res, 200, { ok: true });
    return;
  }

  if (req.method === "POST" && url.pathname.startsWith("/api/predictions/")) {
    requirePlayer(session);
    if (url.pathname === "/api/predictions/commit") {
      commitPlayerPredictions(session.playerId, body.matchIds);
      saveDb();
      sendJson(res, 200, buildClientState(session));
      return;
    }

    const matchId = decodeURIComponent(url.pathname.split("/").pop());
    upsertPrediction(session.playerId, matchId, body);
    saveDb();
    sendJson(res, 200, buildClientState(session));
    return;
  }

  if (url.pathname.startsWith("/api/admin/")) {
    requireAdmin(session);

    if (req.method === "POST" && url.pathname === "/api/admin/players") {
      const pin = String(body.pin || generatePin());
      const name = String(body.name || "").trim();
      if (!name) throw httpError(400, "El nombre es obligatorio");
      const player = { id: crypto.randomUUID(), name, pinHash: hashPin(pin), createdAt: now() };
      db.players.push(player);
      audit("player.create", { playerId: player.id, name });
      saveDb();
      sendJson(res, 200, { ...buildClientState(session), createdPlayer: { ...publicPlayer(player), pin } });
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/admin/unlock-next") {
      db.matches
        .filter((match) => !match.unlocked)
        .slice(0, 12)
        .forEach((match) => {
          match.unlocked = true;
        });
      audit("matches.unlockNext", {});
      saveDb();
      sendJson(res, 200, buildClientState(session));
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/admin/sync-fixtures") {
      const syncReport = await syncFixturesFromProvider();
      saveDb();
      sendJson(res, 200, { ...buildClientState(session), syncReport });
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/admin/matches/knockout") {
      const home = String(body.home || "").trim();
      const away = String(body.away || "").trim();
      if (!home || !away) throw httpError(400, "Los equipos son obligatorios");
      db.matches.push({
        id: `ko-${crypto.randomUUID()}`,
        stage: body.stage || "R16",
        group: null,
        home,
        away,
        dateLabel: String(body.dateLabel || "").trim(),
        timeLabel: String(body.timeLabel || "").trim(),
        venue: String(body.venue || "").trim(),
        unlocked: true,
        final: false,
        homeGoals: null,
        awayGoals: null,
        winner: "",
        resultLocked: false,
      });
      audit("match.createKnockout", { home, away });
      saveDb();
      sendJson(res, 200, buildClientState(session));
      return;
    }

    if (req.method === "PATCH" && url.pathname.startsWith("/api/admin/matches/")) {
      const matchId = decodeURIComponent(url.pathname.split("/").pop());
      updateMatch(matchId, body);
      saveDb();
      sendJson(res, 200, buildClientState(session));
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/admin/export") {
      sendJson(res, 200, db);
      return;
    }
  }

  throw httpError(404, "Endpoint no encontrado");
}

function buildClientState(session) {
  return {
    players: db.players.map(publicPlayer),
    matches: db.matches,
    predictions:
      session?.role === "player"
        ? Object.fromEntries(
            db.predictions
              .filter((prediction) => prediction.playerId === session.playerId)
              .map((prediction) => [prediction.matchId, publicPrediction(prediction)]),
          )
        : {},
    session: session
      ? {
          role: session.role,
          playerId: session.playerId || null,
          playerName: db.players.find((player) => player.id === session.playerId)?.name || null,
        }
      : null,
    summary: buildSummary(),
    leaderboard: calculateLeaderboard(),
  };
}

function createInitialDb() {
  const matches = SCHEDULE.map(toMatch);

  return {
    players: [
      {
        id: "demo",
        name: "Demo",
        pinHash: hashPin("123456"),
        createdAt: now(),
      },
    ],
    matches,
    predictions: [],
    auditLog: [],
  };
}

function loadDb() {
  if (!fs.existsSync(DATA_FILE)) {
    const initial = createInitialDb();
    fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify(initial, null, 2));
    return initial;
  }
  const loaded = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  loaded.auditLog ||= [];
  loaded.predictions ||= [];
  loaded.matches.forEach((match) => {
    match.resultLocked ||= Boolean(match.final);
  });
  if (enrichSchedule(loaded.matches)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify(loaded, null, 2));
  }
  return loaded;
}

function toMatch([matchNumber, group, home, away, dateLabel, timeLabel, venue], index) {
  return {
    id: `M${matchNumber}`,
    matchNumber: Number(matchNumber),
    stage: "GR",
    group,
    home,
    away,
    dateLabel,
    timeLabel,
    venue,
    unlocked: index < 24,
    final: false,
    homeGoals: null,
    awayGoals: null,
    winner: "",
    resultLocked: false,
  };
}

function enrichSchedule(matches) {
  let changed = false;
  const byId = new Map(SCHEDULE.map((entry) => [`M${entry[0]}`, entry]));
  const byTeams = new Map(
    SCHEDULE.map((entry) => [`${normalizeTeam(entry[2])}|${normalizeTeam(entry[3])}`, entry]),
  );
  matches.forEach((match) => {
    const entry =
      byId.get(match.id) || byTeams.get(`${normalizeTeam(match.home)}|${normalizeTeam(match.away)}`);
    if (!entry) return;
    changed = setIfMissing(match, "matchNumber", Number(entry[0])) || changed;
    changed = setIfMissing(match, "dateLabel", entry[4]) || changed;
    changed = setIfMissing(match, "timeLabel", entry[5]) || changed;
    changed = setIfMissing(match, "venue", entry[6]) || changed;
  });
  return changed;
}

function setIfMissing(target, key, value) {
  if (target[key]) return false;
  target[key] = value;
  return true;
}

function normalizeTeam(team) {
  return String(team)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function saveDb() {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
  fs.writeFileSync(DATA_FILE, JSON.stringify(db, null, 2));
}

function upsertPrediction(playerId, matchId, body) {
  const match = db.matches.find((item) => item.id === matchId);
  if (!match) throw httpError(404, "Partido no encontrado");
  if (!match.unlocked || match.final) throw httpError(409, "El partido no esta abierto");

  let prediction = db.predictions.find((item) => item.playerId === playerId && item.matchId === matchId);
  if (prediction?.locked) throw httpError(409, "Pronostico confirmado y bloqueado");
  if (!prediction) {
    prediction = { playerId, matchId, homeGoals: null, awayGoals: null, locked: false, createdAt: now() };
    db.predictions.push(prediction);
  }

  prediction.homeGoals = normalizeGoals(body.homeGoals);
  prediction.awayGoals = normalizeGoals(body.awayGoals);
  prediction.updatedAt = now();
}

function commitPlayerPredictions(playerId, matchIds) {
  const targetIds = Array.isArray(matchIds)
    ? new Set(matchIds)
    : new Set(db.matches.filter((match) => match.unlocked && !match.final).map((match) => match.id));
  db.predictions
    .filter((prediction) => prediction.playerId === playerId && targetIds.has(prediction.matchId))
    .filter((prediction) => prediction.homeGoals !== null && prediction.awayGoals !== null)
    .forEach((prediction) => {
      prediction.locked = true;
      prediction.lockedAt = now();
    });
  audit("predictions.commit", { playerId, count: targetIds.size });
}

function updateMatch(matchId, body) {
  const match = db.matches.find((item) => item.id === matchId);
  if (!match) throw httpError(404, "Partido no encontrado");
  if (match.resultLocked) throw httpError(409, "Resultado final bloqueado");

  if ("unlocked" in body) match.unlocked = Boolean(body.unlocked);
  if ("homeGoals" in body) match.homeGoals = normalizeGoals(body.homeGoals);
  if ("awayGoals" in body) match.awayGoals = normalizeGoals(body.awayGoals);
  if ("winner" in body) match.winner = String(body.winner || "");
  if ("final" in body) {
    if (body.final) {
      if (match.homeGoals === null || match.awayGoals === null) {
        throw httpError(400, "Carga el resultado antes de finalizar");
      }
      match.final = true;
      match.unlocked = true;
      match.resultLocked = true;
      audit("match.finalize", { matchId });
    } else {
      match.final = false;
    }
  }
}

async function syncFixturesFromProvider() {
  if (!API_FOOTBALL_KEY) {
    throw httpError(400, "Configura API_FOOTBALL_KEY para sincronizar fixtures");
  }

  const url = new URL("/fixtures", API_FOOTBALL_BASE_URL);
  url.searchParams.set("league", API_FOOTBALL_LEAGUE_ID);
  url.searchParams.set("season", API_FOOTBALL_SEASON);

  const response = await fetch(url, {
    headers: {
      "x-apisports-key": API_FOOTBALL_KEY,
    },
  });
  const payload = await response.json().catch(() => ({}));
  const providerError = formatProviderError(payload);
  if (!response.ok || providerError) {
    throw httpError(
      response.status === 403 || providerError ? 403 : 502,
      providerError || `API-Football respondio ${response.status}`,
    );
  }

  const fixtures = Array.isArray(payload.response) ? payload.response : [];
  let updated = 0;
  let finalized = 0;
  let unmatched = 0;

  fixtures.forEach((fixture) => {
    const match = findMatchForFixture(fixture);
    if (!match) {
      unmatched += 1;
      return;
    }
    const before = JSON.stringify(match);
    applyFixtureSync(match, fixture);
    if (JSON.stringify(match) !== before) updated += 1;
    if (match.final && match.resultLocked) finalized += 1;
  });

  audit("fixtures.sync", {
    provider: "api-football",
    updated,
    finalized,
    unmatched,
    totalFromProvider: fixtures.length,
  });

  return {
    provider: "api-football",
    updated,
    finalized,
    unmatched,
    totalFromProvider: fixtures.length,
    syncedAt: now(),
  };
}

function formatProviderError(payload) {
  if (!payload?.errors) return "";
  if (typeof payload.errors === "string") return payload.errors;
  if (Array.isArray(payload.errors)) return payload.errors.join(". ");
  const messages = Object.entries(payload.errors)
    .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(", ") : value}`)
    .filter(Boolean);
  return messages.join(". ");
}

function findMatchForFixture(fixture) {
  const fixtureId = String(fixture.fixture?.id || "");
  if (fixtureId) {
    const byExternalId = db.matches.find((match) => String(match.externalFixtureId || "") === fixtureId);
    if (byExternalId) return byExternalId;
  }

  const home = fixture.teams?.home?.name || "";
  const away = fixture.teams?.away?.name || "";
  return db.matches.find((match) => teamsMatch(match.home, home) && teamsMatch(match.away, away));
}

function applyFixtureSync(match, fixture) {
  const startsAtUtc = fixture.fixture?.date || "";
  const venueName = [fixture.fixture?.venue?.name, fixture.fixture?.venue?.city].filter(Boolean).join(", ");
  const status = fixture.fixture?.status?.short || "";
  const homeGoals = normalizeProviderGoal(fixture.goals?.home);
  const awayGoals = normalizeProviderGoal(fixture.goals?.away);

  match.externalProvider = "api-football";
  match.externalFixtureId = String(fixture.fixture?.id || match.externalFixtureId || "");
  if (startsAtUtc) {
    match.startsAtUtc = startsAtUtc;
    const localParts = formatFixtureDate(startsAtUtc);
    match.dateLabel = localParts.dateLabel;
    match.timeLabel = localParts.timeLabel;
  }
  if (venueName) match.venue = venueName;
  if (status) match.status = status;

  if (isProviderFinal(status) && homeGoals !== null && awayGoals !== null) {
    if (!match.resultLocked) {
      match.homeGoals = homeGoals;
      match.awayGoals = awayGoals;
      match.final = true;
      match.unlocked = true;
      match.resultLocked = true;
      match.winner = resolveWinnerFromFixture(match, fixture);
    }
  }
}

function teamsMatch(localTeam, providerTeam) {
  const localCanonical = canonicalTeam(localTeam);
  const providerCanonical = canonicalTeam(providerTeam);
  return localCanonical === providerCanonical;
}

function canonicalTeam(team) {
  const normalized = normalizeTeam(team);
  const found = Object.entries(TEAM_ALIASES).find(([, aliases]) =>
    aliases.map(normalizeTeam).includes(normalized),
  );
  return found ? found[0] : normalized;
}

function normalizeProviderGoal(goal) {
  if (goal === null || goal === undefined) return null;
  const number = Number(goal);
  return Number.isInteger(number) ? number : null;
}

function isProviderFinal(status) {
  return ["FT", "AET", "PEN"].includes(status);
}

function resolveWinnerFromFixture(match, fixture) {
  if (match.stage === "GR") return "";
  const winnerId = fixture.teams?.home?.winner ? "home" : fixture.teams?.away?.winner ? "away" : "";
  if (winnerId) return winnerId;
  if (match.homeGoals > match.awayGoals) return "home";
  if (match.awayGoals > match.homeGoals) return "away";
  return match.winner || "";
}

function formatFixtureDate(startsAtUtc) {
  const date = new Date(startsAtUtc);
  const dateLabel = new Intl.DateTimeFormat("es-AR", {
    day: "numeric",
    month: "short",
    timeZone: "America/Buenos_Aires",
  })
    .format(date)
    .replace(".", "");
  const timeLabel = new Intl.DateTimeFormat("es-AR", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "America/Buenos_Aires",
  }).format(date);
  return { dateLabel, timeLabel };
}

function calculateLeaderboard() {
  return db.players
    .map((player) => {
      const scores = db.matches
        .filter((match) => match.final)
        .map((match) => {
          const prediction = db.predictions.find(
            (item) => item.playerId === player.id && item.matchId === match.id,
          );
          return scorePrediction(prediction, match);
        });
      return {
        id: player.id,
        name: player.name,
        points: scores.reduce((total, score) => total + score.points, 0),
        hits: scores.filter((score) => score.points > 0).length,
        played: scores.length,
      };
    })
    .sort((a, b) => b.points - a.points || b.hits - a.hits || a.name.localeCompare(b.name));
}

function scorePrediction(prediction, match) {
  if (
    !prediction ||
    prediction.homeGoals === null ||
    prediction.awayGoals === null ||
    match.homeGoals === null ||
    match.awayGoals === null
  ) {
    return { points: 0 };
  }

  const predictedDiff = prediction.homeGoals - prediction.awayGoals;
  const actualDiff = match.homeGoals - match.awayGoals;
  const predictedSign = Math.sign(predictedDiff);
  const actualSign = Math.sign(actualDiff);
  let points = 0;

  if (prediction.homeGoals === match.homeGoals && prediction.awayGoals === match.awayGoals) {
    points = 5;
  } else if (predictedSign === 0 && actualSign === 0) {
    points = 4;
  } else if (predictedSign === actualSign && predictedDiff === actualDiff) {
    points = 4;
  } else if (predictedSign === actualSign && actualSign !== 0) {
    points = 3;
  }

  if (match.stage !== "GR" && match.winner) {
    const predictedWinner = predictedSign > 0 ? "home" : predictedSign < 0 ? "away" : "";
    points += predictedWinner === match.winner ? 1 : -1;
  }

  return { points };
}

function buildSummary() {
  const leaderboard = calculateLeaderboard();
  return {
    totalPlayers: db.players.length,
    openMatches: db.matches.filter((match) => match.unlocked && !match.final).length,
    finishedMatches: db.matches.filter((match) => match.final).length,
    leaderPoints: leaderboard[0]?.points || 0,
  };
}

function publicPlayer(player) {
  return { id: player.id, name: player.name };
}

function publicPrediction(prediction) {
  return {
    homeGoals: prediction.homeGoals,
    awayGoals: prediction.awayGoals,
    locked: prediction.locked,
    lockedAt: prediction.lockedAt || null,
  };
}

function hashPin(pin) {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto.pbkdf2Sync(String(pin), salt, 120000, 32, "sha256").toString("hex");
  return `${salt}:${hash}`;
}

function verifyPin(pin, pinHash) {
  const [salt, storedHash] = String(pinHash || "").split(":");
  if (!salt || !storedHash) return false;
  const hash = crypto.pbkdf2Sync(String(pin), salt, 120000, 32, "sha256").toString("hex");
  return crypto.timingSafeEqual(Buffer.from(hash, "hex"), Buffer.from(storedHash, "hex"));
}

function createSession(payload) {
  const token = crypto.randomBytes(32).toString("hex");
  sessions.set(token, { ...payload, createdAt: Date.now() });
  return token;
}

function getSession(req) {
  const token = getBearerToken(req);
  return token ? sessions.get(token) || null : null;
}

function getBearerToken(req) {
  const header = req.headers.authorization || "";
  return header.startsWith("Bearer ") ? header.slice(7) : "";
}

function requirePlayer(session) {
  if (session?.role !== "player") throw httpError(401, "Necesitas iniciar sesion como jugador");
}

function requireAdmin(session) {
  if (session?.role !== "admin") throw httpError(401, "Necesitas iniciar sesion como admin");
}

function normalizeGoals(value) {
  if (value === "" || value === null || value === undefined) return null;
  const number = Number(value);
  if (!Number.isInteger(number) || number < 0 || number > 20) {
    throw httpError(400, "Los goles deben ser enteros entre 0 y 20");
  }
  return number;
}

function generatePin() {
  return String(crypto.randomInt(100000, 1000000));
}

function audit(action, data) {
  db.auditLog.push({ action, data, at: now() });
}

function now() {
  return new Date().toISOString();
}

async function readBody(req) {
  if (!["POST", "PATCH", "PUT"].includes(req.method)) return {};
  let raw = "";
  for await (const chunk of req) raw += chunk;
  return raw ? JSON.parse(raw) : {};
}

function serveStatic(res, pathname) {
  const safePath = pathname === "/" ? "/index.html" : pathname;
  const filePath = path.normalize(path.join(PUBLIC_DIR, safePath));
  const relativePath = path.relative(PUBLIC_DIR, filePath);
  const firstSegment = relativePath.split(path.sep)[0];
  const ext = path.extname(filePath);
  const allowedExtensions = new Set([".html", ".css", ".js", ".webmanifest", ".svg"]);
  if (
    !filePath.startsWith(PUBLIC_DIR) ||
    filePath === __filename ||
    firstSegment.startsWith(".") ||
    firstSegment === "data" ||
    !allowedExtensions.has(ext)
  ) {
    sendText(res, 404, "No encontrado");
    return;
  }
  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    sendText(res, 404, "No encontrado");
    return;
  }
  const contentTypes = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "application/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".webmanifest": "application/manifest+json; charset=utf-8",
    ".svg": "image/svg+xml; charset=utf-8",
  };
  res.writeHead(200, { "Content-Type": contentTypes[ext] || "application/octet-stream" });
  fs.createReadStream(filePath).pipe(res);
}

function sendJson(res, status, payload) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(payload));
}

function sendText(res, status, text) {
  res.writeHead(status, { "Content-Type": "text/plain; charset=utf-8" });
  res.end(text);
}

function httpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function loadLocalConfig() {
  const envPath = path.join(__dirname, ".env");
  const jsonPath = path.join(__dirname, "config.local.json");

  if (fs.existsSync(envPath)) {
    fs.readFileSync(envPath, "utf8")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#"))
      .forEach((line) => {
        const separatorIndex = line.indexOf("=");
        if (separatorIndex === -1) return;
        const key = line.slice(0, separatorIndex).trim();
        const value = cleanConfigValue(line.slice(separatorIndex + 1));
        if (key && process.env[key] === undefined) process.env[key] = value;
      });
  }

  if (fs.existsSync(jsonPath)) {
    const configText = fs.readFileSync(jsonPath, "utf8").replace(/^\uFEFF/, "").trim();
    const config = JSON.parse(configText);
    Object.entries(config).forEach(([key, value]) => {
      if (process.env[key] === undefined && value !== undefined && value !== null) {
        process.env[key] = cleanConfigValue(value);
      }
    });
  }
}

function cleanConfigValue(value) {
  return String(value)
    .replace(/^\uFEFF/, "")
    .trim()
    .replace(/^["']|["']$/g, "")
    .trim();
}

function normalizeBaseUrl(value) {
  if (!value) return "https://v3.football.api-sports.io";
  return value.startsWith("http://") || value.startsWith("https://") ? value : `https://${value}`;
}
