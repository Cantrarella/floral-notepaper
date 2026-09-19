import { convertFileSrc } from "@tauri-apps/api/core";
import { useMemo } from "react";
import { buildGradientCss, normalizeGradientStops } from "../features/settings/appearance";
import type { AppConfig } from "../features/settings/types";

interface BackgroundLayerProps {
  config: AppConfig | null;
}

export function BackgroundLayer({ config }: BackgroundLayerProps) {
  const rawPath = config?.backgroundImagePath?.trim() ?? "";
  const mode = config?.backgroundMode ?? "image";
  const isGradient = mode === "gradient";
  const isColor = mode === "color";

  const convertedUrl = useMemo(() => (rawPath ? convertFileSrc(rawPath) : ""), [rawPath]);

  const solidColor = useMemo(() => {
    if (!isColor || !config) return "";
    const raw = (config.backgroundColor ?? "").trim();
    // 只认 3/6 位 hex，防止把脏字符串塞进 style
    return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(raw) ? raw : "";
  }, [isColor, config]);

  const gradientCss = useMemo(() => {
    if (!isGradient || !config) return "";
    // 必须至少有一个合法色标，否则 CSS 会整条失效
    return normalizeGradientStops(config.gradientStops).length > 0 ? buildGradientCss(config) : "";
  }, [isGradient, config]);

  const fit = config?.backgroundFit ?? "cover";
  const blur = Math.max(0, Math.min(20, config?.backgroundBlur ?? 0));
  const scale = Math.max(0.5, Math.min(2, config?.backgroundScale ?? 1));
  const positionX = Math.max(0, Math.min(100, config?.backgroundPositionX ?? 50));
  const positionY = Math.max(0, Math.min(100, config?.backgroundPositionY ?? 50));

  // 渐变独立遮罩，默认 0——沿用图片那套默认值会把渐变冲淡成一片糊
  const gradientDim = Math.max(0, Math.min(1, config?.gradientDim ?? 0));
  const imageDim = Math.max(0, Math.min(1, config?.backgroundDim ?? 0.25));

  if (isColor) {
    if (!solidColor) return null;
    return (
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute inset-0" style={{ backgroundColor: solidColor }} />
      </div>
    );
  }

  if (isGradient) {
    if (!gradientCss) return null;
    return (
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute inset-0" style={{ backgroundImage: gradientCss }} />
        {gradientDim > 0 && (
          <div className="absolute inset-0 bg-cloud" style={{ opacity: gradientDim }} />
        )}
      </div>
    );
  }

  if (!rawPath) return null;

  const imageStyle = {
    objectPosition: `${positionX}% ${positionY}%` as const,
    filter: blur > 0 ? `blur(${blur}px)` : undefined,
    // CSS blur samples beyond image edges, causing pale fringes. No clean fix yet.
    transform: `scale(${scale})`,
    transformOrigin: `${positionX}% ${positionY}%`,
  };

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
      {fit === "repeat" ? (
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url("${convertedUrl}")`,
            backgroundSize: "auto",
            backgroundPosition: `${positionX}% ${positionY}%`,
            backgroundRepeat: "repeat",
            ...imageStyle,
          }}
        />
      ) : (
        <img
          src={convertedUrl}
          alt=""
          className="absolute inset-0 w-full h-full"
          style={{
            objectFit: fit === "contain" ? "contain" : "cover",
            ...imageStyle,
          }}
        />
      )}
      <div className="absolute inset-0 bg-cloud" style={{ opacity: imageDim }} />
    </div>
  );
}
