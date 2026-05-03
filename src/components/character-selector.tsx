import { useProfile } from "@/hooks/useProfile";
import { useCharacterStore } from "@/store/character";
import { useManifestStore } from "@/store/manifest";
import { getName } from "@/api/manifest";

interface Props {
  horizontal?: boolean;
}

export function CharacterSelector({ horizontal = false }: Props) {
  const { profile } = useProfile();
  const { activeCharacterId, setActiveCharacter } = useCharacterStore();
  const manifest = useManifestStore((s) => s.manifest);

  const chars = profile.data?.characters?.data;
  if (!chars) return null;

  const list = Object.values(chars).sort(
    (a, b) =>
      new Date(b.dateLastPlayed).getTime() -
      new Date(a.dateLastPlayed).getTime()
  );

  const wrapClass = horizontal
    ? "flex gap-2 overflow-x-auto"
    : "space-y-1";

  return (
    <div className={wrapClass}>
      {list.map((c) => {
        const className = manifest
          ? getName(manifest.DestinyClassDefinition, c.classHash)
          : "…";
        const classIcon = manifest?.DestinyClassDefinition?.[c.classHash]?.displayProperties?.icon;
        const active = c.characterId === activeCharacterId;

        if (horizontal) {
          return (
            <button
              key={c.characterId}
              onClick={() => setActiveCharacter(c.characterId)}
              className={`group relative flex items-center gap-2.5 h-9 pl-1 pr-3.5 rounded-full shrink-0 transition-all ${
                active
                  ? "bg-linear-to-r from-bungie-accent/20 to-transparent border border-bungie-accent/50 shadow-glow"
                  : "border border-bungie-border hover:border-bungie-strong hover:bg-white/2"
              }`}
            >
              <div className="relative">
                {c.emblemPath && (
                  <img
                    src={`https://www.bungie.net${c.emblemPath}`}
                    alt=""
                    className={`w-7 h-7 rounded-full bg-black/40 border transition-all ${
                      active ? "border-bungie-accent/70" : "border-white/10 group-hover:border-white/30"
                    }`}
                  />
                )}
                {classIcon && (
                  <img
                    src={`https://www.bungie.net${classIcon}`}
                    alt=""
                    className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-bungie-bg border border-bungie-border p-px"
                  />
                )}
              </div>
              <div className="flex items-baseline gap-2">
                <span
                  className={`text-xs font-semibold tracking-wide ${
                    active ? "text-white" : "text-bungie-text/80 group-hover:text-white"
                  }`}
                >
                  {className}
                </span>
                <span
                  className={`text-[11px] tabular-nums font-bold ${
                    active ? "text-bungie-accent" : "text-bungie-muted group-hover:text-bungie-accent/80"
                  }`}
                >
                  ◆{c.light}
                </span>
              </div>
            </button>
          );
        }

        return (
          <button
            key={c.characterId}
            onClick={() => setActiveCharacter(c.characterId)}
            className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-left transition-colors ${
              active
                ? "bg-bungie-accent/20 border border-bungie-accent/40"
                : "hover:bg-bungie-border border border-transparent"
            }`}
          >
            {c.emblemPath && (
              <img
                src={`https://www.bungie.net${c.emblemPath}`}
                alt=""
                className="w-8 h-8 rounded bg-black/40"
              />
            )}
            <div className="flex-1 min-w-0">
              <div className="text-xs font-medium truncate">{className}</div>
              <div className="text-[10px] text-bungie-muted">⬥ {c.light}</div>
            </div>
          </button>
        );
      })}
    </div>
  );
}