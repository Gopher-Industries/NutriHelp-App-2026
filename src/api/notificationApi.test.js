const mockBaseApi = {
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
};

jest.mock("./baseApi", () => ({
  __esModule: true,
  default: mockBaseApi,
}));

const {
  deregisterDeviceToken,
  getPreferences,
  registerDeviceToken,
  updatePreferences,
} = require("./notificationApi");

describe("notificationApi", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("gets notification preferences", async () => {
    mockBaseApi.get.mockResolvedValueOnce({ notification_preferences: {} });

    await getPreferences();

    expect(mockBaseApi.get).toHaveBeenCalledWith(
      "/user/preferences/extended/notifications"
    );
  });

  it("updates notification preferences", async () => {
    mockBaseApi.put.mockResolvedValueOnce({ ok: true });
    const payload = { mealReminders: true };

    await updatePreferences(payload);

    expect(mockBaseApi.put).toHaveBeenCalledWith(
      "/user/preferences/extended/notifications",
      { notification_preferences: payload }
    );
  });

  it("registers a device token idempotently", async () => {
    mockBaseApi.get.mockResolvedValueOnce({
      notification_preferences: { mealReminders: true, deviceTokens: ["token-1"] },
    });
    mockBaseApi.put.mockResolvedValueOnce({ ok: true });

    await registerDeviceToken("token-2");

    expect(mockBaseApi.put).toHaveBeenCalledWith(
      "/user/preferences/extended/notifications",
      {
        notification_preferences: {
          mealReminders: true,
          deviceTokens: ["token-1", "token-2"],
        },
      }
    );
  });

  it("deregisters a device token", async () => {
    mockBaseApi.get.mockResolvedValueOnce({
      notification_preferences: { deviceTokens: ["token-1", "token-2"] },
    });
    mockBaseApi.put.mockResolvedValueOnce({ ok: true });

    await deregisterDeviceToken("token-1");

    expect(mockBaseApi.put).toHaveBeenCalledWith(
      "/user/preferences/extended/notifications",
      {
        notification_preferences: {
          deviceTokens: ["token-2"],
        },
      }
    );
  });
});
