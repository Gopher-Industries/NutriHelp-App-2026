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

// `description` is only used as the notes fallback when it isn't already shown as the title.
export function getAppointmentNotes(appointment) {
  if (appointment?.notes) {
    return appointment.notes;
  }
  return appointment?.title ? appointment?.description || "" : "";
}

const pad = (value) => String(value).padStart(2, "0");

export function toDateString(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function toTimeString(date) {
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

// Accepts "HH:mm", "HH:mm:ss" and "h:mm AM/PM".
export function parseTime(value) {
  const match = /^(\d{1,2}):(\d{2})(?::\d{2})?\s*([AaPp][Mm])?$/.exec(String(value || "").trim());
  if (!match) {
    return null;
  }
  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const meridiem = match[3]?.toUpperCase();
  if (meridiem === "PM" && hours < 12) hours += 12;
  if (meridiem === "AM" && hours === 12) hours = 0;
  if (hours > 23 || minutes > 59) {
    return null;
  }
  return { hours, minutes };
}

// Returns a local Date, or null when the date is missing/invalid.
// Without a time, the appointment counts until the end of that day.
export function getAppointmentDateTime(appointment) {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(String(appointment?.date || ""));
  if (!match) {
    return null;
  }
  const time = parseTime(appointment?.time);
  return new Date(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3]),
    time ? time.hours : 23,
    time ? time.minutes : 59
  );
}

// Appointments without a readable date stay under Upcoming so they are never hidden.
export function splitAppointments(appointments, now = new Date()) {
  const upcoming = [];
  const past = [];

  appointments.forEach((appointment) => {
    const when = getAppointmentDateTime(appointment);
    if (when && when < now) {
      past.push({ appointment, when });
    } else {
      upcoming.push({ appointment, when });
    }
  });

  const time = (entry, fallback) => (entry.when ? entry.when.getTime() : fallback);
  upcoming.sort((a, b) => time(a, Infinity) - time(b, Infinity));
  past.sort((a, b) => time(b, 0) - time(a, 0));

  return {
    upcoming: upcoming.map((entry) => entry.appointment),
    past: past.map((entry) => entry.appointment),
  };
}
