export const startOfWeek = (date) => {
  const value = new Date(date);
  const day = value.getDay();
  value.setHours(0, 0, 0, 0);
  value.setDate(value.getDate() - (day === 0 ? 6 : day - 1));
  return value;
};

export const dateKey = (date) => {
  const value = new Date(date);
  return [
    value.getFullYear(),
    String(value.getMonth() + 1).padStart(2, "0"),
    String(value.getDate()).padStart(2, "0"),
  ].join("-");
};

export const dateKeyInTimeZone = (value, timeZone) => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(value));
  const values = Object.fromEntries(
    parts
      .filter(({ type }) => ["year", "month", "day"].includes(type))
      .map(({ type, value: partValue }) => [type, partValue]),
  );
  return `${values.year}-${values.month}-${values.day}`;
};

export const todayKeyInTimeZone = (timeZone) =>
  dateKeyInTimeZone(new Date(), timeZone);

export const addDaysToDateKey = (value, days) => {
  const date = new Date(`${value}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
};

export const localDateTimeToIso = (date, time, timeZone) => {
  const [year, month, day] = date.split("-").map(Number);
  const [hours, minutes] = time.split(":").map(Number);
  const target = Date.UTC(year, month - 1, day, hours, minutes);
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(target));
  const values = Object.fromEntries(
    parts
      .filter(({ type }) =>
        ["year", "month", "day", "hour", "minute"].includes(type),
      )
      .map(({ type, value }) => [type, Number(value)]),
  );
  const zoneAsUtc = Date.UTC(
    values.year,
    values.month - 1,
    values.day,
    values.hour,
    values.minute,
  );
  return new Date(target + target - zoneAsUtc).toISOString();
};

export const formatShiftTime = (value, timeZone) =>
  new Intl.DateTimeFormat(undefined, {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
