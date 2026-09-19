export function formatWeekRange(startsAt: string, endsAt: string) {
  const start = new Date(startsAt);
  const endExclusive = new Date(endsAt);
  const end = new Date(endExclusive.getTime() - 1);

  const formatter = new Intl.DateTimeFormat("en", {
    timeZone: "UTC",
    month: "short",
    day: "numeric",
  });

  return `${formatter.format(start)} — ${formatter.format(end)}`.toUpperCase();
}
