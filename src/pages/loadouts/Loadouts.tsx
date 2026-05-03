import { useTranslation } from "react-i18next"

export function Loadouts() {
  const { t } = useTranslation()
  return (
    <div>
      <h2 className="mb-4 text-2xl font-bold">{t("nav.loadouts")}</h2>
      <div className="panel text-bungie-muted p-6">
        TODO — création/édition/application de loadouts
      </div>
    </div>
  )
}
