import { useEffect, useState } from "react";

const formatCurrentDate = (date) =>
  new Intl.DateTimeFormat(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);

export function useCurrentDateLabel() {
  const [date, setDate] = useState(() => new Date());

  useEffect(() => {
    let timer;
    const scheduleNextDay = () => {
      const now = new Date();
      const nextDay = new Date(now);
      nextDay.setHours(24, 0, 0, 0);
      timer = window.setTimeout(() => {
        setDate(new Date());
        scheduleNextDay();
      }, nextDay.getTime() - now.getTime());
    };

    scheduleNextDay();
    return () => window.clearTimeout(timer);
  }, []);

  return formatCurrentDate(date);
}
