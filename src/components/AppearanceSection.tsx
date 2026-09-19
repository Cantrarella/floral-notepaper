import chroma from "chroma-js";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  CONTRAST_GOOD,
  DEFAULT_ACCENT,
  DEFAULT_PAPER,
  DEFAULT_TEXT,
  contrastRatio,
  deriveTextPalette,
  normalizeHex,
} from "../features/settings/appearance";
import type { AppConfig } from "../features/settings/types";
import { ColorRow } from "./ColorRow";
import { ToggleRow } from "./SettingsRows";

interface AppearanceSectionProps {
  config: AppConfig;
  onChange: (config: AppConfig) => void;
}

/** 常用主色预设，点一下同时写入浅色/深色两套 */
const ACCENT_PRESETS: Array<{ name: string; value: string }> = [
  { name: "竹青", value: "#2d5a3d" },
  { name: "黛蓝", value: "#2f5d8a" },
  { name: "藕紫", value: "#6b4f8a" },
  { name: "绛红", value: "#8a3b3b" },
  { name: "赭石", value: "#8a6a2f" },
  { name: "青碧", value: "#2f7a6b" },
];

function useResolvedTheme(): "light" | "dark" {
  const read = (): "light" | "dark" =>
    typeof document !== "undefined" &&
    document.documentElement.getAttribute("data-theme") === "dark"
      ? "dark"
      : "light";

  const [theme, setTheme] = useState<"light" | "dark">(read);

  useEffect(() => {
    const observer = new MutationObserver(() => setTheme(read()));
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    return () => observer.disconnect();
  }, []);

  return theme;
}

function contrastClass(ratio: number): string {
  if (ratio >= CONTRAST_GOOD) return "text-bamboo";
  if (ratio >= 3) return "text-amber-500";
  return "text-red-400";
}

export function AppearanceSection({ config, onChange }: AppearanceSectionProps) {
  const { t } = useTranslation();
  const theme = useResolvedTheme();
  const patch = (updates: Partial<AppConfig>) => onChange({ ...config, ...updates });

  const accentEnabled = config.customAccentEnabled ?? false;
  const textEnabled = config.customTextColorEnabled ?? false;

  // 用于给"当前正在编辑哪套主题"的字段加前缀
  const themeName = t(theme === "dark" ? "settings.theme.dark" : "settings.theme.light", {
    defaultValue: theme === "dark" ? "深色" : "浅色",
  });

  const accentValue = normalizeHex(
    theme === "dark" ? config.accentColorDark : config.accentColorLight,
    DEFAULT_ACCENT[theme],
  );
  const textPrimary = normalizeHex(
    theme === "dark" ? config.textColorDark : config.textColorLight,
    DEFAULT_TEXT[theme].primary,
  );
  const textFaint = normalizeHex(
    theme === "dark" ? config.textFaintDark : config.textFaintLight,
    DEFAULT_TEXT[theme].faint,
  );

  // 当前主题下四档墨色对纸色的实际对比度，用来判断"看不看得清"
  const contrasts = useMemo(() => {
    const paper = DEFAULT_PAPER[theme];
    const palette = deriveTextPalette(textPrimary, textFaint, paper);
    return {
      ink: contrastRatio(palette.ink, paper),
      soft: contrastRatio(palette.soft, paper),
      faint: contrastRatio(palette.faint, paper),
      ghost: contrastRatio(palette.ghost, paper),
    };
  }, [theme, textPrimary, textFaint]);

  /** 把淡色往正文色方向推，直到对比度达标——图标看不清时的一键解药 */
  const boostFaintContrast = () => {
    const paper = DEFAULT_PAPER[theme];
    let candidate = textFaint;
    for (let step = 0; step < 24 && contrastRatio(candidate, paper) < CONTRAST_GOOD; step += 1) {
      candidate = chroma.mix(candidate, textPrimary, 0.12).hex();
    }
    patch(theme === "dark" ? { textFaintDark: candidate } : { textFaintLight: candidate });
  };

  const setAccentFor = (value: string) => {
    patch(theme === "dark" ? { accentColorDark: value } : { accentColorLight: value });
  };

  const setTextFor = (target: "primary" | "faint", value: string) => {
    if (theme === "dark") {
      patch(target === "primary" ? { textColorDark: value } : { textFaintDark: value });
    } else {
      patch(target === "primary" ? { textColorLight: value } : { textFaintLight: value });
    }
  };

  return (
    <>
      <section className="space-y-2">
        <label className="block text-[11px] font-body text-ink-faint">
          {t("settings.accent.label", { defaultValue: "主题色" })}
        </label>
        <ToggleRow
          label={t("settings.accent.custom", { defaultValue: "自定义主题色" })}
          checked={accentEnabled}
          onChange={(checked) => patch({ customAccentEnabled: checked })}
        />
        {accentEnabled && (
          <>
            <ColorRow
              label={t("settings.accent.current", {
                theme: themeName,
                defaultValue: "{{theme}}主题用色",
              })}
              value={accentValue}
              fallback={DEFAULT_ACCENT[theme]}
              onChange={setAccentFor}
            />
            <div className="flex flex-wrap gap-1.5 px-0.5">
              {ACCENT_PRESETS.map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  title={preset.name}
                  onClick={() =>
                    patch({
                      accentColorLight: preset.value,
                      accentColorDark: chroma(preset.value).brighten(1.4).hex(),
                    })
                  }
                  style={{ backgroundColor: preset.value }}
                  className="h-6 w-6 cursor-pointer rounded-full border border-paper-deep/40 transition-transform hover:scale-110"
                />
              ))}
            </div>
          </>
        )}
      </section>

      <section className="space-y-2">
        <label className="block text-[11px] font-body text-ink-faint">
          {t("settings.textColor.label", { defaultValue: "文字颜色" })}
        </label>
        <ToggleRow
          label={t("settings.textColor.custom", { defaultValue: "自定义文字颜色" })}
          checked={textEnabled}
          onChange={(checked) => patch({ customTextColorEnabled: checked })}
        />
        {textEnabled && (
          <>
            <ColorRow
              label={t("settings.textColor.primary", {
                theme: themeName,
                defaultValue: "{{theme}}主题 · 正文色",
              })}
              value={textPrimary}
              fallback={DEFAULT_TEXT[theme].primary}
              onChange={(value) => setTextFor("primary", value)}
            />
            <ColorRow
              label={t("settings.textColor.faint", {
                theme: themeName,
                defaultValue: "{{theme}}主题 · 淡色（图标/次要）",
              })}
              value={textFaint}
              fallback={DEFAULT_TEXT[theme].faint}
              onChange={(value) => setTextFor("faint", value)}
            />
            <div className="space-y-1.5 rounded-lg border border-paper-deep/25 bg-paper-warm/45 px-2.5 py-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] text-ink-faint">
                  {t("settings.textColor.contrast", { defaultValue: "对底色的对比度" })}
                </span>
                <button
                  type="button"
                  onClick={boostFaintContrast}
                  className="h-6 cursor-pointer rounded border border-paper-deep/45 px-2 text-[10px] text-ink-faint transition-colors hover:border-bamboo/40 hover:text-bamboo"
                >
                  {t("settings.textColor.boost", { defaultValue: "一键增强淡色" })}
                </button>
              </div>
              <div className="flex flex-wrap gap-x-3 gap-y-1 text-[10px] font-mono tabular-nums">
                <span className={contrastClass(contrasts.ink)}>
                  {t("settings.textColor.ink", { defaultValue: "正文" })} {contrasts.ink.toFixed(1)}
                </span>
                <span className={contrastClass(contrasts.soft)}>
                  {t("settings.textColor.soft", { defaultValue: "次级" })}{" "}
                  {contrasts.soft.toFixed(1)}
                </span>
                <span className={contrastClass(contrasts.faint)}>
                  {t("settings.textColor.faintLabel", { defaultValue: "淡色" })}{" "}
                  {contrasts.faint.toFixed(1)}
                </span>
                <span className={contrastClass(contrasts.ghost)}>
                  {t("settings.textColor.ghost", { defaultValue: "图标" })}{" "}
                  {contrasts.ghost.toFixed(1)}
                </span>
              </div>
              <p className="text-[10px] leading-relaxed text-ink-ghost">
                {t("settings.textColor.hint", {
                  defaultValue: `达到 ${CONTRAST_GOOD}:1 才算清晰，图标档低于 3:1 基本等于隐形`,
                })}
              </p>
            </div>
          </>
        )}
      </section>
    </>
  );
}
