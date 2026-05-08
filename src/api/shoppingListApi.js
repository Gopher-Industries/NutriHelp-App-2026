import baseApi from "./baseApi";

const fallbackItems = [
  { id: '1', title: 'Greek yogurt', completed: false },
  { id: '2', title: 'Spinach', completed: true },
  { id: '3', title: 'Brown rice', completed: false },
];

export async function getShoppingItems() {
  try {
    const response = await baseApi.get("/shopping-list");
    return response?.data || response?.items || response || [];
  } catch {
    return fallbackItems;
  }
}

export async function addShoppingItem(title) {
  try {
    const response = await baseApi.post("/shopping-list", { title });
    return response?.data || response?.item || response;
  } catch {
    return { id: Date.now().toString(), title, completed: false };
  }
}

export async function updateShoppingItem(id, payload) {
  try {
    const response = await baseApi.request("PATCH", `/shopping-list/${id}`, { body: payload });
    return response?.data || response?.item || response;
  } catch {
    return { id, ...payload };
  }
}

export async function deleteShoppingItem(id) {
  try {
    return await baseApi.delete(`/shopping-list/${id}`);
  } catch {
    return true;
  }
}
