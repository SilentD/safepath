import test from "node:test";
import assert from "node:assert";

const BASE_URL = "http://localhost:3000";
let cookieJar = "";
let authToken = "";
let timerId = "";

test("1. Authenticate / Login to establish session cookies", async () => {
  const response = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: "annamantjeane2009@gmail.com",
      password: "SafePathTest!2026",
    }),
  });

  // Capture cookies if set by the server
  const setCookie = response.headers.get("set-cookie");
  if (setCookie) {
    cookieJar = setCookie;
  }

  const data = await response.json();

  // If 2FA is required, you may need a separate test step for verification
  if (data.accessToken) {
    authToken = data.accessToken;
  }

  assert.strictEqual(response.ok, true, "Login failed");
});

test("2. POST /ping/start returns timer details", async () => {
  const response = await fetch(`${BASE_URL}/api/ping/start`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...(cookieJar ? { Cookie: cookieJar } : {}),
    },
    body: JSON.stringify({
      durationMinutes: 15,
      pin: "1234",
      gpsLocation: { latitude: -27.9833, longitude: 26.7333 }, // Welkom, RSA coords example
    }),
  });

  const data = await response.json();
  assert.strictEqual(
    response.ok,
    true,
    `Start timer failed: ${JSON.stringify(data)}`,
  );

  // Assert expected properties returned by server
  assert.ok(data.userId || data.userid, "Response should include userid");
  assert.ok(
    data.durationSeconds || data.durationMinutes,
    "Response should include duration",
  );
  assert.ok(data.pinHash, "Response should include pinHash");
  assert.ok(
    data.gpsLocation || data.location,
    "Response should include location",
  );

  // Save timer ID for check-in test (assuming id or _id is returned)
  timerId = data._id || data.id || data.timerId;
});

test("3. POST /ping/:timer/checkIn returns status and checkedInAt", async () => {
  assert.ok(timerId, "Timer ID must be available from previous test");

  const response = await fetch(`${BASE_URL}/api/ping/${timerId}/checkIn`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
      ...(cookieJar ? { Cookie: cookieJar } : {}),
    },
    body: JSON.stringify({
      pin: "1234",
      gpsLocation: { latitude: -27.9833, longitude: 26.7333 },
    }),
  });

  const data = await response.json();
  assert.strictEqual(
    response.ok,
    true,
    `Check-in failed: ${JSON.stringify(data)}`,
  );

  // Assert expected check-in contract
  assert.strictEqual(
    data.timerId || data._id,
    timerId,
    "Response timerId should match",
  );
  assert.ok(data.status, "Response should include status");
  assert.ok(data.checkedInAt, "Response should include checkedInAt timestamp");
});
