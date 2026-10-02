import { cx } from "@/lib/cva.config";
import { resolveLogoSrc } from "@/lib/assetPaths";
import { UiLoadingSpinner } from "../ui/ui-loading-spinner";

export default function LoadingScreen() {
  return (
    <div className={cx("h-screen", "flex items-center justify-center gap-4")}>
      <div className="flex items-center gap-2 py-2 pr-4 border-r border-r-gray-200">
        <img src={resolveLogoSrc("/ui/assets/logos/rulitellm_cab.png")} alt="Логотип ruLiteLLM" className="h-7 w-auto shrink-0" />
        <span className="text-lg font-semibold">ruLiteLLM</span>
      </div>

      <div className="flex items-center justify-center gap-2">
        <UiLoadingSpinner className="size-4" />
        <span className="text-muted-foreground text-sm">Загрузка…</span>
      </div>
    </div>
  );
}
