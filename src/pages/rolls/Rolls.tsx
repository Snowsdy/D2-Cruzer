import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useItemDef } from "@/hooks/useItemDef";
import {
  GOD_ROLLS,
  ELEMENT_COLORS,
  type GodRoll,
  type PerkRef,
  type RollRow,
} from "@/constants/godRolls";

type Tab = "all" | "pve" | "pvp";

// ---------------------------------------------------------------------------
// Card
// ---------------------------------------------------------------------------

function PerkChip({ perk, color }: { perk: PerkRef; color: string }) {
  const def = useItemDef(perk.hash);
  const icon = def.data?.displayProperties?.icon;
  const resolvedName = def.data?.displayProperties?.name;
  const displayName = resolvedName ?? perk.name;
  return (
    <span
      className="inline-flex items-center gap-1 pl-0.5 pr-1.5 h-6 rounded-sm text-[10.5px] font-bold text-white"
      style={{
        background: `${color}1f`,
        border: `1px solid ${color}55`,
      }}
    >
      {icon ? (
        <img
          src={`https://www.bungie.net${icon}`}
          alt=""
          className="w-5 h-5"
          style={{
            background: "rgba(0,0,0,0.6)",
            border: `1px solid ${color}80`,
          }}
        />
      ) : (
        <span
          className="w-5 h-5 flex items-center justify-center text-[10px] text-white/40"
          style={{
            background: "rgba(0,0,0,0.4)",
            border: `1px solid ${color}35`,
          }}
        >
          ◇
        </span>
      )}
      <span className="truncate max-w-40">{displayName}</span>
    </span>
  );
}

function RollColumn({ row, color }: { row: RollRow; color: string }) {
  return (
    <div
      className="rounded-md p-2"
      style={{
        background: "rgba(0,0,0,0.35)",
        border: `1px solid ${color}22`,
      }}
    >
      <div className="text-[9px] uppercase tracking-[0.22em] text-white/40 font-extrabold font-mono mb-1.5">
        {row.column}
      </div>
      <div className="flex flex-wrap gap-1">
        {row.perks.map((p, i) => (
          <PerkChip key={i} perk={p} color={color} />
        ))}
      </div>
    </div>
  );
}

function RollCard({ roll, filter }: { roll: GodRoll; filter: Tab }) {
  const def = useItemDef(roll.hash);
  const d = def.data;
  const icon = d?.displayProperties?.icon;
  const watermark = d?.iconWatermark;
  const name = d?.displayProperties?.name ?? roll.nameHint;
  const typeName = d?.itemTypeDisplayName ?? roll.type;
  const elementColor = ELEMENT_COLORS[roll.element] ?? "#f3075e";
  const tier = d?.inventory?.tierType ?? 5;
  const isExotic = tier === 6;

  const showPve = filter !== "pvp" && roll.pve && roll.pve.length > 0;
  const showPvp = filter !== "pve" && roll.pvp && roll.pvp.length > 0;

  return (
    <div
      className="group relative rounded-xl overflow-hidden flex flex-col transition-all hover:-translate-y-0.5"
      style={{
        background:
          "linear-gradient(180deg, rgba(14,10,22,0.95), rgba(7,7,13,0.98))",
        border: `1px solid ${isExotic ? "rgba(206,165,46,0.4)" : "rgba(255,255,255,0.06)"}`,
        boxShadow: `0 6px 20px rgba(0,0,0,0.4)`,
      }}
    >
      {/* Element accent stripe */}
      <div
        className="absolute left-0 top-0 bottom-0 w-0.5"
        style={{
          background: `linear-gradient(180deg, ${elementColor}, transparent)`,
          boxShadow: `0 0 10px ${elementColor}`,
        }}
      />

      {/* Header */}
      <div className="flex items-center gap-3 p-4">
        <div
          className="relative w-14 h-14 shrink-0 overflow-hidden"
          style={{
            border: `1px solid ${isExotic ? "rgba(206,165,46,0.7)" : "rgba(255,255,255,0.14)"}`,
          }}
        >
          {icon && (
            <img
              src={`https://www.bungie.net${icon}`}
              alt=""
              className="w-full h-full object-cover"
            />
          )}
          {watermark && (
            <img
              src={`https://www.bungie.net${watermark}`}
              alt=""
              className="absolute inset-0 w-full h-full pointer-events-none"
            />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div
            className={`text-[16px] font-extrabold truncate ${
              isExotic ? "text-amber-300" : "text-white"
            }`}
          >
            {name}
          </div>
          <div className="text-[10px] uppercase tracking-[0.16em] font-bold mt-1 flex items-center gap-1.5">
            <span style={{ color: elementColor }}>{roll.element}</span>
            <span className="text-white/25">·</span>
            <span className="text-white/55">{typeName}</span>
          </div>
        </div>
      </div>

      {roll.notes && (
        <div className="mx-4 mb-3 text-[11px] italic text-amber-200/75 px-2 py-1.5 rounded-md bg-amber-400/5 border border-amber-400/20">
          {roll.notes}
        </div>
      )}

      <div className="px-4 pb-4 space-y-3">
        {showPve && roll.pve && (
          <div>
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.25em] font-extrabold font-mono text-emerald-300/85 mb-1.5">
              <span>PvE</span>
              <div className="flex-1 h-px bg-emerald-300/15" />
            </div>
            <div className="space-y-1.5">
              {roll.pve.map((r, i) => (
                <RollColumn key={i} row={r} color="#34d399" />
              ))}
            </div>
          </div>
        )}
        {showPvp && roll.pvp && (
          <div>
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.25em] font-extrabold font-mono text-red-300/85 mb-1.5">
              <span>PvP</span>
              <div className="flex-1 h-px bg-red-300/15" />
            </div>
            <div className="space-y-1.5">
              {roll.pvp.map((r, i) => (
                <RollColumn key={i} row={r} color="#f87171" />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export function Rolls() {
  const { t } = useTranslation();
  const [filter, setFilter] = useState<Tab>("all");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    let list = GOD_ROLLS;
    if (filter === "pve") list = list.filter((r) => r.pve && r.pve.length);
    if (filter === "pvp") list = list.filter((r) => r.pvp && r.pvp.length);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (r) =>
          r.nameHint.toLowerCase().includes(q) ||
          r.type.toLowerCase().includes(q) ||
          r.element.toLowerCase().includes(q)
      );
    }
    return list;
  }, [filter, query]);

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-2xl font-extrabold">{t("nav.rolls")}</h2>
        <p className="text-sm text-bungie-muted mt-1">
          God rolls communautaires — références pour reconnaître un drop digne
          du coffre.
        </p>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex gap-1 p-1 bg-black/30 border border-bungie-border rounded-full">
          {[
            { key: "all", label: `Tout (${GOD_ROLLS.length})` },
            { key: "pve", label: "PvE" },
            { key: "pvp", label: "PvP" },
          ].map((it) => (
            <button
              key={it.key}
              onClick={() => setFilter(it.key as Tab)}
              className={`px-4 h-8 rounded-full text-xs font-bold transition-all ${
                filter === it.key
                  ? "bg-bungie-accent text-black shadow-glow"
                  : "text-bungie-text/70 hover:text-white"
              }`}
            >
              {it.label}
            </button>
          ))}
        </div>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher une arme, un type, un élément…"
          className="h-8 px-3 rounded-full bg-black/30 border border-bungie-border text-white text-sm focus:outline-none focus:border-bungie-accent flex-1 min-w-60"
        />
        <div className="text-[11px] text-bungie-muted">
          {filtered.length} arme{filtered.length > 1 ? "s" : ""}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="panel p-8 text-center text-bungie-muted">
          Aucun résultat pour « {query} ».
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((r) => (
            <RollCard key={r.hash} roll={r} filter={filter} />
          ))}
        </div>
      )}

      <p className="text-[10px] text-bungie-muted/70 italic">
        Données curatées depuis la méta communautaire (Light.gg / D2Gunsmith).
        Les noms de perks sont indicatifs — ton drop peut varier.
      </p>
    </div>
  );
}