import baseApi from "./baseApi";

const fallbackProfile = {
  name: 'Anne Savini',
  email: 'anne@example.com',
  avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
  stats: {
    streak: 12,
    recipesSaved: 28,
    scans: 143,
  },
};

export async function getProfile() {
  try {
    const response = await baseApi.get("/profile");
    return response?.data || response?.profile || response;
  } catch {
    return fallbackProfile;
  }
}

export async function updateProfile(payload) {
  try {
    const response = await baseApi.request("PATCH", "/profile", { body: payload });
    return response?.data || response?.profile || response;
  } catch {
    return { ...fallbackProfile, ...payload };
  }
}

export async function uploadAvatar(uri) {
  try {
    const data = new FormData();
    data.append('avatar', {
      uri,
      name: 'avatar.jpg',
      type: 'image/jpeg',
    });

    const response = await baseApi.post("/profile/avatar", data);
    return response?.data || response;
  } catch {
    return { avatarUrl: uri };
  }
}
