import { OPENING_HOURS } from "@/lib/config";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
// Week shown Monday first.
const DISPLAY_ORDER = [1, 2, 3, 4, 5, 6, 0];

function to12Hour(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  const suffix = hours >= 12 ? "pm" : "am";
  const hour = hours % 12 || 12;
  return minutes ? `${hour}:${String(minutes).padStart(2, "0")}${suffix}` : `${hour}${suffix}`;
}

export function OpeningHours({ tone = "light" }: { tone?: "light" | "dark" }) {
  const rule = tone === "dark" ? "border-paper/10" : "border-line";
  const dim = tone === "dark" ? "text-paper/50" : "text-muted";
  return (
    <dl className="w-full">
      {DISPLAY_ORDER.map((day) => {
        const hours = OPENING_HOURS[day];
        return (
          <div key={day} className={`flex justify-between border-b py-2 ${rule}`}>
            <dt className={dim}>{DAY_NAMES[day]}</dt>
            <dd className="tabular-nums">{hours ? `${to12Hour(hours.open)} – ${to12Hour(hours.close)}` : "Closed"}</dd>
          </div>
        );
      })}
    </dl>
  );
}
