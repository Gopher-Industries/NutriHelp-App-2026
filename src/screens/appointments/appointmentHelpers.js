export function normalizeAppointmentsResponse(response) {
  if (Array.isArray(response)) {
    return response;
  }

  if (Array.isArray(response?.appointments)) {
    return response.appointments;
  }

  if (Array.isArray(response?.data?.appointments)) {
    return response.data.appointments;
  }

  if (Array.isArray(response?.data)) {
    return response.data;
  }

  return [];
}

export function getAppointmentId(appointment) {
  return appointment?.id ?? appointment?.appointment_id ?? appointment?.appointmentId ?? null;
}

export function formatAppointmentWhen(appointment) {
  const date = appointment?.date || "";
  const time = appointment?.time || "";
  if (date && time) {
    return `${date} · ${time}`;
  }
  return date || time || "Date not set";
}

export function getAppointmentTitle(appointment) {
  return (
    appointment?.title ||
    appointment?.description ||
    appointment?.type ||
    "Appointment"
  );
}
