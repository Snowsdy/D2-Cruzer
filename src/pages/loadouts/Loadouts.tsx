import { useTranslation } from "react-i18next";

export function Loadouts() {
  const { t } = useTranslation();
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">{t("nav.loadouts")}</h2>
      <div className="panel p-6 text-bungie-muted">TODO — création/édition/application de loadouts</div>
    </div>
  );
}