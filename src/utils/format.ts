/**
 * Shared display-formatting helpers.
 *
 * Before this module, variations of these functions lived in 6+ feature
 * files with subtly different output (some returned `1h 05m`, others
 * `1h 5m`, others `1h`). Keeping one set fixes UI inconsistencies and
 * prevents drift when the format changes.
 *
 * Styles:
 *   - `fmtCountdownDHM`: short, for timers. "2j 3h 15m" / "3h 15m" / "15m"
 *   - `fmtCountdownDH` : same but drops minutes past a day. Used by vendor
 *                        cards where ultra-precision isn't needed.
 *   - `fmtDurationHMS` : duration with seconds ("1h 05m" / "3m 12s" / "12s")
 *   - `fmtHoursMinutes`: total hours + padded minutes ("245h 07m")
 *   - `fmtDays`        : fractional days, or fall back to hours under 1d
 *   - `fmtNumber`      : thousands-grouped locale-aware number
 *   - `fmtPercent`     : 2-decimal percentage
 */
import { SEC_PER_HOUR, SEC_PER_DAY, MS_PER_SECOND } from "../constants/time";

function toSeconds(ms: number): number {
  return Math.max(0, Math.floor(ms / MS_PER_SECOND));
}

/**
 * Time-until-target formatted as `{d}j {h}h {m}m` (or shorter when d/h=0).
 * Used for weekly/daily reset timers, Xûr departure, checklist deadlines.
 */
export function fmtCountdownDHM(target: Date, now: Date = new Date()): string {
  const s = toSeconds(target.getTime() - now.getTime());
  const d = Math.floor(s / SEC_PER_DAY);
  const h = Math.floor((s % SEC_PER_DAY) / SEC_PER_HOUR);
  const m = Math.floor((s % SEC_PER_HOUR) / 60);
  if (d > 0) return `${d}j ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

/**
 * Same as `fmtCountdownDHM` but collapses to `{d}j {h}h` past a day — used
 * in vendor refresh cards where minute precision is noise.
 */
export function fmtCountdownDH(target: Date, now: Date = new Date()): string {
  const s = toSeconds(target.getTime() - now.getTime());
  const d = Math.floor(s / SEC_PER_DAY);
  const h = Math.floor((s % SEC_PER_DAY) / SEC_PER_HOUR);
  const m = Math.floor((s % SEC_PER_HOUR) / 60);
  if (d > 0) return `${d}j ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

/**
 * Duration formatted as `{h}h {m}m` (seconds only when < 1h). Used for
 * activity durations (fastest raid, checkpoint times…).
 */
export function fmtDurationHMS(ms: number): string {
  if (!ms) return "—";
  const s = toSeconds(ms);
  const h = Math.floor(s / SEC_PER_HOUR);
  const m = Math.floor((s % SEC_PER_HOUR) / 60);
  const sec = s % 60;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m ${sec}s`;
}

/**
 * Total hours + zero-padded minutes, e.g. `245h 07m`. Used for total
 * playtime displays where the hours count is the headline number.
 */
export function fmtHoursMinutes(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds));
  const h = Math.floor(total / SEC_PER_HOUR);
  const m = Math.floor((total % SEC_PER_HOUR) / 60);
  return `${h.toLocaleString()}h ${m.toString().padStart(2, "0")}m`;
}

/** Fractional days under 1 → hours. Used by the Playtime view. */
export function fmtDays(seconds: number): string {
  const d = seconds / SEC_PER_DAY;
  return d >= 1 ? `${d.toFixed(1)} jours` : `${Math.round(d * 24)}h`;
}

/** Thousands-grouped locale number, up to 2 decimals. */
export function fmtNumber(n: number): string {
  return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

/** Two-decimal percentage, e.g. `56.72%`. */
export function fmtPercent(n: number): string {
  return `${(n * 100).toFixed(2)}%`;
}