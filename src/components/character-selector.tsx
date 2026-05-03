import { useProfile } from "@/hooks/useProfile"
import { useCharacterStore } from "@/store/character"
import { useManifestStore } from "@/store/manifest"
import { getName } from "@/api/manifest"

interface Props {
  horizontal?: boolean
}

export function CharacterSelector({ horizontal = false }: Props) {
  const { profile } = useProfile()
  const { activeCharacterId, setActiveCharacter } = useCharacterStore()
  const manifest = useManifestStore((s) => s.manifest)

  const chars = profile.data?.characters?.data
  if (!chars) return null

  const list = Object.values(chars).sort(
    (a, b) =>
      new Date(b.dateLastPlayed).getTime() -
      new Date(a.dateLastPlayed).getTime()
  )

  const wrapClass = horizontal ? "flex gap-2 overflow-x-auto" : "space-y-1"

  return (
    <div className={wrapClass}>
      {list.map((c) => {
        const className = manifest
          ? getName(manifest.DestinyClassDefinition, c.classHash)
          : "…"
        const classIcon =
          manifest?.DestinyClassDefinition?.[c.classHash]?.displayProperties
            ?.icon
        const active = c.characterId === activeCharacterId

        if (horizontal) {
          return (
            <button
              key={c.characterId}
              onClick={() => setActiveCharacter(c.characterId)}
              className={`group relative flex h-9 shrink-0 items-center gap-2.5 rounded-full pr-3.5 pl-1 transition-all ${
                active
                  ? "from-bungie-accent/20 border-bungie-accent/50 shadow-glow border bg-linear-to-r to-transparent"
                  : "border-bungie-border hover:border-bungie-strong border hover:bg-white/2"
              }`}
            >
              <div className="relative">
                {c.emblemPath && (
                  <img
                    src={`https://www.bungie.net${c.emblemPath}`}
                    alt=""
                    className={`h-7 w-7 rounded-full border bg-black/40 transition-all ${
                      active
                        ? "border-bungie-accent/70"
                        : "border-white/10 group-hover:border-white/30"
                    }`}
                  />
                )}
                {classIcon && (
                  <img
                    src={`https://www.bungie.net${classIcon}`}
                    alt=""
                    className="bg-bungie-bg border-bungie-border absolute -right-0.5 -bottom-0.5 h-3.5 w-3.5 rounded-full border p-px"
                  />
                )}
              </div>
              <div className="flex items-baseline gap-2">
                <span
                  className={`text-xs font-semibold tracking-wide ${
                    active
                      ? "text-white"
                      : "text-bungie-text/80 group-hover:text-white"
                  }`}
                >
                  {className}
                </span>
                <span
                  className={`text-[11px] font-bold tabular-nums ${
                    active
                      ? "text-bungie-accent"
                      : "text-bungie-muted group-hover:text-bungie-accent/80"
                  }`}
                >
                  ◆{c.light}
                </span>
              </div>
            </button>
          )
        }

        return (
          <button
            key={c.characterId}
            onClick={() => setActiveCharacter(c.characterId)}
            className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors ${
              active
                ? "bg-bungie-accent/20 border-bungie-accent/40 border"
                : "hover:bg-bungie-border border border-transparent"
            }`}
          >
            {c.emblemPath && (
              <img
                src={`https://www.bungie.net${c.emblemPath}`}
                alt=""
                className="h-8 w-8 rounded bg-black/40"
              />
            )}
            <div className="min-w-0 flex-1">
              <div className="truncate text-xs font-medium">{className}</div>
              <div className="text-bungie-muted text-[10px]">⬥ {c.light}</div>
            </div>
          </button>
        )
      })}
    </div>
  )
}
