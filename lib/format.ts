export function formatDate(sqlDate: string | null | undefined): string {
  if (!sqlDate) return "";
  const d = new Date(sqlDate.includes("T") ? sqlDate : sqlDate.replace(" ", "T") + "Z");
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

export function toIsoDate(sqlDate: string | null | undefined): string | undefined {
  if (!sqlDate) return undefined;
  const d = new Date(sqlDate.includes("T") ? sqlDate : sqlDate.replace(" ", "T") + "Z");
  if (isNaN(d.getTime())) return undefined;
  return d.toISOString();
}
