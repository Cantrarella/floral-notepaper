import chroma from "chroma-js";
import type { AppConfig, GradientStop } from "./types";

/**
 * 自定义外观（主题色 / 文字色 / 背景渐变）
 *
 * 花笺的配色是 Tailwind v4 在 App.css 的 @theme 里写死的 CSS 变量。
 * 这里通过往 <html> 打 inline style 覆盖同名变量——inline 优先级高于任何选择器，
 * 因此既能压过 @theme 的 :root，也能压过 :root[data-theme="dark"] 的深色声明。
 * 副作用：切换主题时必须重新 apply 一次，否则深色主题会继续沿用浅色的自定义值。
 */

/** 内置默认主题色，与 App.css 的 --color-bamboo 系列保持一致 */
export const DEFAULT_ACCENT: Record<"light" | "dark", string> = {
  light: "#2d5a3d",
  dark: "#4faa70",
};

/** 内置默认文字色：正文 / 淡色 */
export const DEFAULT_TEXT: Record<"light" | "dark", { primary: string; faint: string }> = {
  light: { primary: "#1a1a18", faint: "#8a8a80" },
  dark: { primary: "#e5e1da", faint: "#928f87" },
};

/** 内置纸色，用于推导 ghost 档与计算对比度 */
export const DEFAULT_PAPER: Record<"light" | "dark", string> = {
  light: "#f6f3ec",
  dark: "#222120",
};

const ACCENT_VARS = [
  "--color-bamboo",
  "--color-bamboo-light",
  "--color-bamboo-mist",
  "--color-bamboo-glow",
] as const;

const TEXT_VARS = [
  "--color-ink",
  "--color-ink-soft",
  "--color-ink-faint",
  "--color-ink-ghost",
] as const;

const HEX6 = /^#?([0-9a-fA-F]{6})$/;
const HEX3 = /^#?([0-9a-fA-F]{3})$/;

/** 宽松解析 hex（支持 3 位 / 6 位 / 带不带 #），失败时回落到 fallback */
export function normalizeHex(value: string | undefined | null, fallback: string): string {
  const trimmed = (value ?? "").trim();
  const full = trimmed.match(HEX6);
  if (full) return `#${full[1].toLowerCase()}`;

  const short = trimmed.match(HEX3);
  if (short) {
    const expanded = short[1]
      .split("")
      .map((character) => character + character)
      .join("");
    return `#${expanded.toLowerCase()}`;
  }

  return fallback;
}

export function isValidHexColor(value: string | undefined | null): boolean {
  const trimmed = (value ?? "").trim();
  return HEX6.test(trimmed) || HEX3.test(trimmed);
}

/**
 * 由单一主色派生竹青四档。
 * 浅色主题往白里调、深色主题往黑里调，让 mist/glow 始终是"底色"而不是撞色。
 */
export function deriveAccentPalette(
  base: string,
  theme: "light" | "dark",
): { base: string; light: string; mist: string; glow: string } {
  const color = chroma(base);
  const toward = theme === "light" ? "#ffffff" : "#000000";

  return {
    base: color.hex(),
    light: theme === "light" ? color.brighten(0.6).hex() : color.brighten(0.35).hex(),
    mist: chroma.mix(base, toward, theme === "light" ? 0.9 : 0.85).hex(),
    glow: chroma.mix(base, toward, theme === "light" ? 0.8 : 0.72).hex(),
  };
}

/**
 * 由「正文色 + 淡色」两档插值出四档墨色。
 * soft 夹在中间；ghost 是图标主力色，往纸色方向退一点但仍保留可见度。
 */
export function deriveTextPalette(
  primary: string,
  faint: string,
  paper: string,
): { ink: string; soft: string; faint: string; ghost: string } {
  return {
    ink: chroma(primary).hex(),
    soft: chroma.mix(primary, faint, 0.4).hex(),
    faint: chroma(faint).hex(),
    ghost: chroma.mix(faint, paper, 0.25).hex(),
  };
}

/** WCAG 相对对比度，(亮+0.05)/(暗+0.05)，1 到 21 */
export function contrastRatio(foreground: string, background: string): number {
  const first = chroma(foreground).luminance();
  const second = chroma(background).luminance();
  const lighter = Math.max(first, second);
  const darker = Math.min(first, second);
  return (lighter + 0.05) / (darker + 0.05);
}

/** 对比度低于该值就算"看不清"——WCAG AA 对正文的要求是 4.5 */
export const CONTRAST_GOOD = 4.5;

export interface AppearanceVars {
  accent: { base: string; light: string; mist: string; glow: string };
  text: { ink: string; soft: string; faint: string; ghost: string };
}

/** 算出某主题下最终要写入的 CSS 变量值（不落盘、不碰 DOM，方便给 UI 做预览） */
export function resolveAppearanceVars(
  config: AppConfig,
  theme: "light" | "dark",
): { accent: AppearanceVars["accent"] | null; text: AppearanceVars["text"] | null } {
  const paper = DEFAULT_PAPER[theme];

  const accent = config.customAccentEnabled
    ? deriveAccentPalette(
        normalizeHex(
          theme === "dark" ? config.accentColorDark : config.accentColorLight,
          DEFAULT_ACCENT[theme],
        ),
        theme,
      )
    : null;

  const text = config.customTextColorEnabled
    ? deriveTextPalette(
        normalizeHex(
          theme === "dark" ? config.textColorDark : config.textColorLight,
          DEFAULT_TEXT[theme].primary,
        ),
        normalizeHex(
          theme === "dark" ? config.textFaintDark : config.textFaintLight,
          DEFAULT_TEXT[theme].faint,
        ),
        paper,
      )
    : null;

  return { accent, text };
}

function flattenVars(vars: ReturnType<typeof resolveAppearanceVars>): Record<string, string> {
  const flat: Record<string, string> = {};
  if (vars.accent) {
    flat["--color-bamboo"] = vars.accent.base;
    flat["--color-bamboo-light"] = vars.accent.light;
    flat["--color-bamboo-mist"] = vars.accent.mist;
    flat["--color-bamboo-glow"] = vars.accent.glow;
  }
  if (vars.text) {
    flat["--color-ink"] = vars.text.ink;
    flat["--color-ink-soft"] = vars.text.soft;
    flat["--color-ink-faint"] = vars.text.faint;
    flat["--color-ink-ghost"] = vars.text.ghost;
  }
  return flat;
}

/** 把两套主题的计算结果缓存到 localStorage，供 index.html 首屏防闪使用 */
function cacheAppearance(config: AppConfig): void {
  try {
    const payload = {
      light: flattenVars(resolveAppearanceVars(config, "light")),
      dark: flattenVars(resolveAppearanceVars(config, "dark")),
    };
    localStorage.setItem("appearance-vars", JSON.stringify(payload));
  } catch {
    // localStorage 满了或被禁用时静默跳过，不影响主流程
  }
}

/**
 * 把配置应用到当前文档。所有窗口（主窗口 / 小窗 / 磁贴）都跑 App.tsx，
 * 因此在这里统一生效；切换主题后需要重新调用。
 *
 * theme 缺省时直接读 <html data-theme>——applyTheme 已经写过该属性，
 * 这样调用方不必自己再解析一次 system 偏好。
 */
export function applyAppearance(config: AppConfig, theme?: "light" | "dark"): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  const resolved = theme ?? (root.getAttribute("data-theme") === "dark" ? "dark" : "light");
  const vars = flattenVars(resolveAppearanceVars(config, resolved));

  for (const name of [...ACCENT_VARS, ...TEXT_VARS]) {
    const value = vars[name];
    if (value) {
      root.style.setProperty(name, value);
    } else {
      // 未启用自定义 → 移除 inline 覆盖，回落到 App.css 的内置配色
      root.style.removeProperty(name);
    }
  }

  cacheAppearance(config);
}

/** 主题切换时清掉旧的 inline 覆盖，避免残留上一套主题的颜色 */
export function clearAppearance(): void {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  for (const name of [...ACCENT_VARS, ...TEXT_VARS]) {
    root.style.removeProperty(name);
  }
}

// ===== 背景渐变 =====

export const DEFAULT_GRADIENT_STOPS: GradientStop[] = [
  { color: "#e6f7ff", position: 0 },
  { color: "#89c2ff", position: 100 },
];

/** 规范化色标数组：过滤非法项、按位置排序、至少保证两个端点 */
export function normalizeGradientStops(stops: GradientStop[] | undefined): GradientStop[] {
  const cleaned = (stops ?? [])
    .filter((stop) => stop && isValidHexColor(stop.color))
    .map((stop) => ({
      color: normalizeHex(stop.color, "#ffffff"),
      position: Math.max(0, Math.min(100, Number.isFinite(stop.position) ? stop.position : 0)),
    }))
    .sort((a, b) => a.position - b.position);

  if (cleaned.length === 0) return [...DEFAULT_GRADIENT_STOPS];
  if (cleaned.length === 1) {
    return [cleaned[0], { ...cleaned[0], position: cleaned[0].position >= 100 ? 0 : 100 }];
  }
  return cleaned;
}

/** 生成 CSS 渐变字符串；径向时忽略角度 */
export function buildGradientCss(config: AppConfig): string {
  const stops = normalizeGradientStops(config.gradientStops)
    .map((stop) => `${stop.color} ${stop.position}%`)
    .join(", ");

  if ((config.gradientType ?? "linear") === "radial") {
    return `radial-gradient(circle at 50% 50%, ${stops})`;
  }

  return `linear-gradient(${Math.round(config.gradientAngle ?? 90)}deg, ${stops})`;
}

/** 取渐变中点的颜色，给"磁贴/卡片跟随背景"之类的场景用 */
export function gradientMidpoint(config: AppConfig): string {
  const stops = normalizeGradientStops(config.gradientStops);
  const middle = stops[Math.floor((stops.length - 1) / 2)];
  return middle.color;
}
