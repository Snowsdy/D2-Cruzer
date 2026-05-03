/**
 * Time unit constants.
 *
 * Before this file, `3600`, `86400`, and `3_600_000` were scattered across
 * ~15 feature views, each re-deriving hours/days from raw seconds or
 * milliseconds. Importing named constants makes the intent obvious at the
 * call site and eliminates off-by-unit bugs.
 */

export const MS_PER_SECOND = 1000;
export const SEC_PER_MIN = 60;
export const SEC_PER_HOUR = 3600;
export const SEC_PER_DAY = 86400;
export const MS_PER_MIN = 60_000;
export const MS_PER_HOUR = 3_600_000;
export const MS_PER_DAY = 86_400_000;

/** Bungie's global reset hour (17:00 UTC) — daily & weekly anchor. */
export const BUNGIE_RESET_HOUR_UTC = 17;
/** Xûr arrives Friday 18:00 UTC, leaves at Tuesday reset. */
export const XUR_ARRIVAL_HOUR_UTC = 18;