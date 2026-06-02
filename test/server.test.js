const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

process.env.ADMIN_CODE = "admin-test";
process.env.DATA_FILE = path.join(os.tmpdir(), `prode-mundial-test-${process.pid}.json`);

const {
  buildClientState,
  calculateLeaderboard,
  commitPlayerPredictions,
  createInitialDb,
  enrichSchedule,
  hashPin,
  normalizeGoals,
  scorePrediction,
  server,
  updateMatch,
  upsertPrediction,
  verifyPin,
} = require("../server");

test.after(async () => {
  await new Promise((resolve) => (server.listening ? server.close(resolve) : resolve()));
  fs.rmSync(process.env.DATA_FILE, { force: true });
});

test("initial data includes all group-stage matches with schedule metadata", () => {
  const db = createInitialDb();

  assert.equal(db.players.length, 1);
  assert.equal(db.matches.length, 72);
  assert.equal(db.matches.filter((match) => match.unlocked).length, 24);
  assert.deepEqual(
    db.matches.slice(0, 3).map((match) => [match.id, match.dateLabel, match.timeLabel]),
    [
      ["M1", "11 Jun", "13:00"],
      ["M2", "11 Jun", "20:00"],
      ["M3", "12 Jun", "15:00"],
    ],
  );
});

test("enrichSchedule migrates old matches missing dates and venue", () => {
  const matches = [{ id: "M1", home: "Mexico", away: "Sudafrica", stage: "GR", group: "A" }];

  assert.equal(enrichSchedule(matches), true);
  assert.equal(matches[0].matchNumber, 1);
  assert.equal(matches[0].dateLabel, "11 Jun");
  assert.equal(matches[0].timeLabel, "13:00");
  assert.equal(matches[0].venue, "Estadio Azteca, Mexico City");
  assert.equal(enrichSchedule(matches), false);
});

test("scorePrediction follows official point rules", () => {
  const match = { stage: "GR", homeGoals: 2, awayGoals: 1 };

  assert.equal(scorePrediction({ homeGoals: 2, awayGoals: 1 }, match).points, 5);
  assert.equal(scorePrediction({ homeGoals: 1, awayGoals: 1 }, { ...match, homeGoals: 2, awayGoals: 2 }).points, 4);
  assert.equal(scorePrediction({ homeGoals: 2, awayGoals: 0 }, { ...match, homeGoals: 3, awayGoals: 1 }).points, 4);
  assert.equal(scorePrediction({ homeGoals: 2, awayGoals: 0 }, { ...match, homeGoals: 4, awayGoals: 1 }).points, 3);
  assert.equal(scorePrediction({ homeGoals: 0, awayGoals: 1 }, match).points, 0);
});

test("scorePrediction applies knockout winner bonus and penalty", () => {
  const knockout = { stage: "R16", homeGoals: 1, awayGoals: 0, winner: "home" };

  assert.equal(scorePrediction({ homeGoals: 1, awayGoals: 0 }, knockout).points, 6);
  assert.equal(scorePrediction({ homeGoals: 0, awayGoals: 1 }, knockout).points, -1);
  assert.equal(scorePrediction({ homeGoals: 1, awayGoals: 1 }, { ...knockout, awayGoals: 1 }).points, 4);
});

test("predictions can be saved, committed and then become immutable", () => {
  const db = createInitialDb();
  const matchId = db.matches[0].id;

  upsertPrediction("demo", matchId, { homeGoals: 2, awayGoals: 1 }, db);
  assert.equal(db.predictions.length, 1);
  assert.equal(db.predictions[0].locked, false);

  assert.equal(commitPlayerPredictions("demo", [matchId], db), 1);
  assert.equal(db.predictions[0].locked, true);
  assert.equal(db.auditLog.at(-1).data.count, 1);

  assert.throws(
    () => upsertPrediction("demo", matchId, { homeGoals: 3, awayGoals: 1 }, db),
    /Pronostico confirmado/,
  );
});

test("closed or final matches reject prediction edits", () => {
  const db = createInitialDb();
  const lockedMatch = db.matches.find((match) => !match.unlocked);
  const finalMatch = db.matches[0];
  finalMatch.final = true;

  assert.throws(
    () => upsertPrediction("demo", lockedMatch.id, { homeGoals: 1, awayGoals: 0 }, db),
    /no esta abierto/,
  );
  assert.throws(
    () => upsertPrediction("demo", finalMatch.id, { homeGoals: 1, awayGoals: 0 }, db),
    /no esta abierto/,
  );
});

test("final results lock after commit and feed the leaderboard", () => {
  const db = createInitialDb();
  const matchId = db.matches[0].id;

  upsertPrediction("demo", matchId, { homeGoals: 2, awayGoals: 1 }, db);
  updateMatch(matchId, { homeGoals: 2, awayGoals: 1, final: true }, db);

  assert.equal(db.matches[0].final, true);
  assert.equal(db.matches[0].resultLocked, true);
  assert.throws(() => updateMatch(matchId, { homeGoals: 3 }, db), /bloqueado/);
  assert.equal(calculateLeaderboard(db)[0].points, 5);
});

test("knockout results require a consistent final winner", () => {
  const db = createInitialDb();
  db.matches.push({
    id: "ko-test",
    stage: "R16",
    group: null,
    home: "Argentina",
    away: "Brasil",
    unlocked: true,
    final: false,
    homeGoals: null,
    awayGoals: null,
    winner: "",
    resultLocked: false,
  });

  updateMatch("ko-test", { homeGoals: 2, awayGoals: 1, final: true }, db);
  assert.equal(db.matches.at(-1).winner, "home");

  db.matches.push({ ...db.matches.at(-1), id: "ko-draw", final: false, resultLocked: false, winner: "" });
  assert.throws(() => updateMatch("ko-draw", { homeGoals: 1, awayGoals: 1, final: true }, db), /ganador final/);

  db.matches.push({ ...db.matches.at(-1), id: "ko-bad-winner", final: false, resultLocked: false, winner: "away" });
  assert.throws(() => updateMatch("ko-bad-winner", { homeGoals: 2, awayGoals: 0, final: true }, db), /no coincide/);
});

test("client state hides prediction hashes and returns only current player predictions", () => {
  const db = createInitialDb();
  db.players.push({ id: "other", name: "Other", pinHash: hashPin("222222"), createdAt: "now" });
  upsertPrediction("demo", db.matches[0].id, { homeGoals: 1, awayGoals: 0 }, db);
  upsertPrediction("other", db.matches[1].id, { homeGoals: 0, awayGoals: 1 }, db);

  const state = buildClientState({ role: "player", playerId: "demo" }, db);

  assert.equal(state.players[0].pinHash, undefined);
  assert.deepEqual(Object.keys(state.predictions), [db.matches[0].id]);
});

test("PIN helpers accept valid pins and fail safely on malformed hashes", () => {
  const pinHash = hashPin("123456");

  assert.equal(verifyPin("123456", pinHash), true);
  assert.equal(verifyPin("000000", pinHash), false);
  assert.equal(verifyPin("123456", "broken"), false);
  assert.equal(verifyPin("123456", "abc:def"), false);
});

test("goal normalization accepts empty values and rejects invalid scores", () => {
  assert.equal(normalizeGoals(""), null);
  assert.equal(normalizeGoals("0"), 0);
  assert.equal(normalizeGoals(20), 20);
  assert.throws(() => normalizeGoals(-1), /goles/);
  assert.throws(() => normalizeGoals(21), /goles/);
  assert.throws(() => normalizeGoals(1.5), /goles/);
});

test("HTTP layer returns JSON errors and does not expose local data files", async () => {
  await startServer();
  const baseUrl = `http://127.0.0.1:${server.address().port}`;

  const stateResponse = await fetch(`${baseUrl}/api/state`);
  assert.equal(stateResponse.status, 200);
  assert.equal((await stateResponse.json()).matches.length, 72);

  const badJson = await fetch(`${baseUrl}/api/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: "{",
  });
  assert.equal(badJson.status, 400);

  const dataFile = await fetch(`${baseUrl}/data/store.json`);
  assert.equal(dataFile.status, 404);

  const adminLogin = await fetch(`${baseUrl}/api/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ code: "admin-test" }),
  });
  const { token } = await adminLogin.json();
  assert.equal(adminLogin.status, 200);

  const removedSyncEndpoint = await fetch(`${baseUrl}/api/admin/sync-fixtures`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: "{}",
  });
  assert.equal(removedSyncEndpoint.status, 404);
});

async function startServer() {
  if (server.listening) return;
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
}
