// scripts/directorytest.js
// SafePath Support Directory API smoke test
// Run: node scripts/directorytest.js
//
// Optional environment variables:
// API_BASE_URL=http://localhost:3000/api
// ADMIN_ACCESS_TOKEN=your_admin_access_token
// USER_ACCESS_TOKEN=your_regular_user_access_token

const BASE_URL = (
  process.env.API_BASE_URL || "http://localhost:3000/api"
).replace(/\/+$/, "");

const ADMIN_TOKEN =
  process.env.ADMIN_ACCESS_TOKEN ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYWRtaW4iLCJzaWQiOiI2YWQ2NjUzMjljMzUyNzM5MDkyZDI1NGEiLCJpYXQiOjE3OTI0MzU1MDYsImV4cCI6MTc5MjQzNjQwNiwiYXVkIjoic2FmZXBhdGgtY2xpZW50IiwiaXNzIjoic2FmZXBhdGgtYXBpIiwic3ViIjoiNmFkMjg5NmZjYjhmM2ZkYmJlMGEyYTJjIn0.bCy-Cy8SFkiEd3P1N2ObRubfonMLvFGhuChDsno8yu8";
const USER_TOKEN = process.env.USER_ACCESS_TOKEN || "nnnh";

const TEST_MARKER = `DIRECTORY_TEST_${Date.now()}`;

let createdEntryId = null;
let failures = 0;
let passed = 0;

async function request(method, path, options = {}) {
  const { token, body, expected = [], label = `${method} ${path}` } = options;

  const headers = {
    Accept: "application/json",
  };

  if (body !== undefined) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response;
  let rawBody = "";

  try {
    response = await fetch(`${BASE_URL}${path}`, {
      method,
      headers,
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });

    rawBody = await response.text();
  } catch (error) {
    failures++;
    console.log(`\n[FAIL] ${label}`);
    console.log(`Network error: ${error.message}`);
    return { ok: false, status: 0, data: null };
  }

  let data = null;

  try {
    data = rawBody ? JSON.parse(rawBody) : null;
  } catch {
    // Keep the raw response visible if the server didn't return JSON.
  }

  const statusOk = expected.includes(response.status);
  const bodyOk = data !== null || rawBody.length === 0;
  const ok = statusOk && bodyOk;

  if (ok) {
    passed++;
    console.log(`\n[PASS] ${label} — HTTP ${response.status}`);
  } else {
    failures++;
    console.log(`\n[FAIL] ${label} — HTTP ${response.status}`);
    console.log(`Expected status: ${expected.join(" or ")}`);
  }

  if (data !== null) {
    console.log(JSON.stringify(data, null, 2));
  } else if (rawBody) {
    console.log("Non-JSON response:");
    console.log(rawBody.slice(0, 1500));
  }

  return { ok, status: response.status, data };
}

async function run() {
  console.log("======================================");
  console.log(" SafePath Directory API Test");
  console.log("======================================");
  console.log(`API: ${BASE_URL}`);

  // 1. Public directory listing
  await request("GET", "/directory/", {
    expected: [200],
    label: "Public directory listing",
  });

  // 2. Public filters and pagination
  await request("GET", "/directory/?category=SAPS", {
    expected: [200],
    label: "Filter by category",
  });

  await request("GET", "/directory/?province=Free%20State", {
    expected: [200],
    label: "Filter by province",
  });

  await request("GET", "/directory/?search=clinic", {
    expected: [200],
    label: "Search directory",
  });

  await request("GET", "/directory/?page=1&limit=5", {
    expected: [200],
    label: "Directory pagination",
  });

  // 3. Invalid public entry ID
  await request("GET", "/directory/000000000000000000000000", {
    expected: [404],
    label: "Unknown public entry returns 404",
  });

  // 4. Admin route without a token
  await request("GET", "/directory/admin", {
    expected: [400, 401, 403],
    label: "Admin listing rejects unauthenticated request",
  });

  await request("POST", "/directory/", {
    body: {
      name: TEST_MARKER,
    },
    expected: [400, 401, 403],
    label: "Create rejects unauthenticated request",
  });

  // 5. Admin tests need a real admin access token
  if (!ADMIN_TOKEN) {
    console.log("\n[SKIP] Admin CRUD tests: ADMIN_ACCESS_TOKEN is not set.");
    console.log(
      "Set it to a valid access token belonging to a user with role admin.",
    );
  } else {
    // Admin directory listing
    await request("GET", "/directory/admin?status=all", {
      token: ADMIN_TOKEN,
      expected: [200],
      label: "Admin directory listing",
    });

    // Create a test entry.
    // Check DirectoryEntry.js for required fields before running.
    const createResult = await request("POST", "/directory/", {
      token: ADMIN_TOKEN,
      body: {
        name: TEST_MARKER,
        phone: "0800000000",
        address: "Fictional Test Address",
        province: "Free State",
        category: "Legal Aid",
      },
      expected: [201],
      label: "Admin creates an unverified test entry",
    });

    if (createResult.status === 201 && createResult.data?.data?._id) {
      createdEntryId = createResult.data.data._id;

      // Newly created entries should not appear in the public directory
      // while unverified, if the model enforces the documented rule.
      await request("GET", `/directory/${createdEntryId}`, {
        expected: [404],
        label: "Unverified entry is hidden from public lookup",
      });

      // Update the organization details.
      await request("PATCH", `/directory/${createdEntryId}`, {
        token: ADMIN_TOKEN,
        body: {
          phone: "0800000001",
          address: "Updated Fictional Test Address",
        },
        expected: [200],
        label: "Admin updates entry details",
      });

      // Verify the entry.
      await request("PATCH", `/directory/${createdEntryId}/verification`, {
        token: ADMIN_TOKEN,
        body: { verified: true },
        expected: [200],
        label: "Admin verifies entry",
      });

      // Public lookup should now succeed.
      await request("GET", `/directory/${createdEntryId}`, {
        expected: [200],
        label: "Verified entry is publicly accessible",
      });

      // Remove verification and check public visibility again.
      await request("PATCH", `/directory/${createdEntryId}/verification`, {
        token: ADMIN_TOKEN,
        body: { verified: false },
        expected: [200],
        label: "Admin removes verification",
      });

      await request("GET", `/directory/${createdEntryId}`, {
        expected: [404],
        label: "Unverified entry is hidden again",
      });

      // Deactivate the test entry (soft delete).
      await request("DELETE", `/directory/${createdEntryId}`, {
        token: ADMIN_TOKEN,
        expected: [200],
        label: "Admin deactivates test entry",
      });

      await request("GET", `/directory/${createdEntryId}`, {
        expected: [404],
        label: "Deactivated entry is hidden from public lookup",
      });
    } else {
      console.log(
        "\n[INFO] Create did not return data._id; skipping dependent CRUD tests.",
      );
      console.log(
        "Check the create response and DirectoryEntry.js required fields.",
      );
    }
  }

  // 6. A regular user must not be allowed to administer the directory.
  if (USER_TOKEN) {
    await request("GET", "/directory/admin", {
      token: USER_TOKEN,
      expected: [401, 400, 403],
      label: "Regular user cannot access admin listing",
    });

    await request("POST", "/directory", {
      token: USER_TOKEN,
      body: {
        name: `${TEST_MARKER}_UNAUTHORIZED`,
        phone: "0800000002",
        address: "Fictional Test Address",
        province: "Free State",
        category: "Legal Aid",
      },
      expected: [401, 400433, 403],
      label: "Regular user cannot create entries",
    });
  } else {
    console.log(
      "\n[SKIP] Regular-user authorization tests: USER_ACCESS_TOKEN is not set.",
    );
  }

  console.log("\n======================================");
  console.log(" Test Summary");
  console.log("======================================");
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failures}`);

  if (failures > 0) {
    process.exitCode = 1;
    console.log(
      "\nSome checks failed. Review the HTTP status and response above.",
    );
  } else {
    console.log("\nAll executed checks passed.");
  }

  if (createdEntryId) {
    console.log(`Test entry ${createdEntryId} was deactivated by the test.`);
  }
}

run().catch((error) => {
  console.error("Unexpected test runner error:", error);
  process.exitCode = 1;
});
