const BASE_URL = "http://localhost:3000"; // Replace with your Express backend port if different

export async function fetchHealth() {
  const response = await fetch(`${BASE_URL}/api/health`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP error! Status: ${response.status}`);
  }

  return await response.json();
}
