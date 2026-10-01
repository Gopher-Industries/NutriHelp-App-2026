const {
  getAppointmentDateTime,
  getAppointmentId,
  getAppointmentNotes,
  normalizeAppointmentsResponse,
  parseTime,
  splitAppointments,
} = require("./appointmentHelpers");

describe("normalizeAppointmentsResponse", () => {
  const list = [{ id: 1 }];

  it.each([
    ["a plain array", list],
    ["{ appointments }", { appointments: list }],
    ["{ data: { appointments } }", { data: { appointments: list } }],
    ["{ data: [] }", { data: list }],
  ])("reads %s", (_label, response) => {
    expect(normalizeAppointmentsResponse(response)).toEqual(list);
  });

  it("returns an empty list for unknown shapes", () => {
    expect(normalizeAppointmentsResponse(null)).toEqual([]);
    expect(normalizeAppointmentsResponse({ data: { items: list } })).toEqual([]);
  });
});

describe("getAppointmentId", () => {
  it("falls back from id to appointment_id to appointmentId", () => {
    expect(getAppointmentId({ id: 1, appointment_id: 2 })).toBe(1);
    expect(getAppointmentId({ appointment_id: 2, appointmentId: 3 })).toBe(2);
    expect(getAppointmentId({ appointmentId: 3 })).toBe(3);
  });

  it("keeps an id of 0 and returns null when missing", () => {
    expect(getAppointmentId({ id: 0 })).toBe(0);
    expect(getAppointmentId({})).toBeNull();
    expect(getAppointmentId(undefined)).toBeNull();
  });
});

describe("parseTime", () => {
  it("reads 24h and 12h formats", () => {
    expect(parseTime("14:30")).toEqual({ hours: 14, minutes: 30 });
    expect(parseTime("09:05:00")).toEqual({ hours: 9, minutes: 5 });
    expect(parseTime("2:30 PM")).toEqual({ hours: 14, minutes: 30 });
    expect(parseTime("12:00 am")).toEqual({ hours: 0, minutes: 0 });
  });

  it("rejects invalid times", () => {
    expect(parseTime("25:00")).toBeNull();
    expect(parseTime("soon")).toBeNull();
    expect(parseTime("")).toBeNull();
  });
});

describe("getAppointmentDateTime", () => {
  it("combines date and time in local time", () => {
    expect(getAppointmentDateTime({ date: "2026-10-01", time: "14:30" })).toEqual(
      new Date(2026, 9, 1, 14, 30)
    );
  });

  it("uses the end of the day when there is no time", () => {
    expect(getAppointmentDateTime({ date: "2026-10-01" })).toEqual(
      new Date(2026, 9, 1, 23, 59)
    );
  });

  it("returns null without a valid date", () => {
    expect(getAppointmentDateTime({ date: "tomorrow" })).toBeNull();
  });
});

describe("splitAppointments", () => {
  const now = new Date(2026, 8, 28, 12, 0);

  it("splits upcoming and past, sorted nearest first", () => {
    const later = { id: "later", date: "2026-10-05", time: "09:00" };
    const soon = { id: "soon", date: "2026-09-28", time: "15:00" };
    const earlierToday = { id: "earlierToday", date: "2026-09-28", time: "08:00" };
    const lastWeek = { id: "lastWeek", date: "2026-09-21", time: "10:00" };

    const { upcoming, past } = splitAppointments([lastWeek, later, earlierToday, soon], now);

    expect(upcoming.map((a) => a.id)).toEqual(["soon", "later"]);
    expect(past.map((a) => a.id)).toEqual(["earlierToday", "lastWeek"]);
  });

  it("keeps appointments without a readable date under upcoming", () => {
    const { upcoming, past } = splitAppointments([{ id: "noDate" }], now);
    expect(upcoming).toHaveLength(1);
    expect(past).toHaveLength(0);
  });
});

describe("getAppointmentNotes", () => {
  it("does not repeat the description when it is used as the title", () => {
    expect(getAppointmentNotes({ description: "GP checkup" })).toBe("");
  });

  it("uses notes, then description when a title exists", () => {
    expect(getAppointmentNotes({ notes: "Bring results", description: "x" })).toBe("Bring results");
    expect(getAppointmentNotes({ title: "GP", description: "Annual check" })).toBe("Annual check");
  });
});
