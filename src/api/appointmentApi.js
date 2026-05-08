import baseApi from "./baseApi";

const { get, post, put, delete: remove } = baseApi;

const APPOINTMENT_ENDPOINTS = {
  list: "/appointments/v2",
  create: "/appointments/v2",
  update: "/appointments/v2/:id",
  cancel: "/appointments/v2/:id",
};

function buildPath(template, params = {}) {
  return Object.entries(params).reduce((path, [key, value]) => {
    return path.replace(`:${key}`, encodeURIComponent(String(value)));
  }, template);
}

export async function getAppointments({ page, pageSize, search } = {}) {
  return get(APPOINTMENT_ENDPOINTS.list, {
    query: { page, pageSize, search },
  });
}

export async function createAppointment(payload) {
  return post(APPOINTMENT_ENDPOINTS.create, payload);
}

export async function updateAppointment(appointmentId, payload) {
  if (!appointmentId) {
    throw new Error("updateAppointment() requires appointmentId.");
  }
  return put(buildPath(APPOINTMENT_ENDPOINTS.update, { id: appointmentId }), payload);
}

export async function cancelAppointment(appointmentId) {
  if (!appointmentId) {
    throw new Error("cancelAppointment() requires appointmentId.");
  }
  return remove(buildPath(APPOINTMENT_ENDPOINTS.cancel, { id: appointmentId }));
}

const appointmentApi = {
  getAppointments,
  createAppointment,
  updateAppointment,
  cancelAppointment,
};

export default appointmentApi;
