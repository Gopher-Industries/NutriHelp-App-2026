import { get, post, put } from "./baseApi";

function normalizeProfileResponse(response) {
  const payload = response?.data || response;
  return payload?.profile || payload || null;
}

function splitFullName(value = "") {
  const parts = String(value || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length === 0) {
    return { first_name: "", last_name: "" };
  }

  if (parts.length === 1) {
    return { first_name: parts[0], last_name: "" };
  }

  return {
    first_name: parts[0],
    last_name: parts.slice(1).join(" "),
  };
}

export async function getProfile() {
  const response = await get("/api/userprofile");
  return normalizeProfileResponse(response);
}

export async function updateProfile({ fullName, email, contactNumber, address }) {
  const { first_name, last_name } = splitFullName(fullName);

  return put("/api/userprofile", {
    first_name,
    last_name,
    email,
    contact_number: contactNumber,
    address,
  });
}

export async function updatePassword({ currentPassword, newPassword, confirmPassword }) {
  return put("/api/userpassword/update", {
    password: currentPassword,
    new_password: newPassword,
    confirm_password: confirmPassword,
  });
}

export async function verifyCurrentPassword(currentPassword) {
  return post("/api/userpassword/verify", {
    password: currentPassword,
  });
}

const profileApi = {
  getProfile,
  updateProfile,
  updatePassword,
  verifyCurrentPassword,
};

export default profileApi;
