import { useQuery } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { bungieGet } from "@/api/bungie"

interface LoadoutNameDef {
  name: string
  hash: number
}
interface LoadoutColorDef {
  colorImagePath: string
  hash: number
}
interface LoadoutIconDef {
  iconImagePath: string
  hash: number
}

export function useLoadoutName(hash: number | undefined) {
  const { i18n } = useTranslation()
  const locale = i18n.resolvedLanguage ?? "en"
  return useQuery<LoadoutNameDef | null>({
    queryKey: ["loadoutName", hash, locale],
    queryFn: () =>
      bungieGet<LoadoutNameDef>(
        `/Destiny2/Manifest/DestinyLoadoutNameDefinition/${hash}/?lc=${encodeURIComponent(locale)}`,
        { auth: false }
      ),
    enabled: !!hash,
    staleTime: Infinity,
    gcTime: Infinity,
  })
}

export function useLoadoutColor(hash: number | undefined) {
  return useQuery<LoadoutColorDef | null>({
    queryKey: ["loadoutColor", hash],
    queryFn: () =>
      bungieGet<LoadoutColorDef>(
        `/Destiny2/Manifest/DestinyLoadoutColorDefinition/${hash}/`,
        { auth: false }
      ),
    enabled: !!hash,
    staleTime: Infinity,
    gcTime: Infinity,
  })
}

export function useLoadoutIcon(hash: number | undefined) {
  return useQuery<LoadoutIconDef | null>({
    queryKey: ["loadoutIcon", hash],
    queryFn: () =>
      bungieGet<LoadoutIconDef>(
        `/Destiny2/Manifest/DestinyLoadoutIconDefinition/${hash}/`,
        { auth: false }
      ),
    enabled: !!hash,
    staleTime: Infinity,
    gcTime: Infinity,
  })
}
