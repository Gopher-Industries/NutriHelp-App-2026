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
  cancelAppointment,
  createAppointment,
  getAppointments,
  updateAppointment,
} = require("./appointmentApi");

describe("appointmentApi", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("gets paginated appointments from /appointments/v2", async () => {
    mockBaseApi.get.mockResolvedValueOnce({ appointments: [] });

    await getAppointments({ page: 2, pageSize: 20, search: "gp" });

    expect(mockBaseApi.get).toHaveBeenCalledWith("/appointments/v2", {
      query: { page: 2, pageSize: 20, search: "gp" },
    });
  });

  it("creates appointment on /appointments/v2", async () => {
    const payload = { title: "General Checkup" };
    mockBaseApi.post.mockResolvedValueOnce({ success: true });

    await createAppointment(payload);

    expect(mockBaseApi.post).toHaveBeenCalledWith("/appointments/v2", payload);
  });

  it("updates appointment by id", async () => {
    const payload = { title: "Updated title" };
    mockBaseApi.put.mockResolvedValueOnce({ success: true });

    await updateAppointment(11, payload);

    expect(mockBaseApi.put).toHaveBeenCalledWith("/appointments/v2/11", payload);
  });

  it("cancels appointment by id", async () => {
    mockBaseApi.delete.mockResolvedValueOnce({ success: true });

    await cancelAppointment(11);

    expect(mockBaseApi.delete).toHaveBeenCalledWith("/appointments/v2/11");
  });
});
