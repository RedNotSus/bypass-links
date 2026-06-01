import axios from "axios";

export async function getCurrentUser() {
  const response = await axios.get("/api/session");
  return response.data.user;
}

export async function logout() {
  await axios.post("/auth/logout");
}

export async function bypassLink({ url, autoRedirect }) {
  const response = await axios.post("/api/bypass", { url, autoRedirect });
  return response.data.result;
}
