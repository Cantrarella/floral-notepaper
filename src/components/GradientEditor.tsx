import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  DEFAULT_GRADIENT_STOPS,
  buildGradientCss,
  isValidHexColor,
  normalizeHex,
} from "../features/settings/appearance";
import type { AppConfig, GradientStop, GradientType } from "../features/settings/types";
import { RangeRow } from "./SettingsRows";
import { SlidingButtonGroup } from "./SlidingButtonGroup";

interface GradientEditorProps {
  config: AppConfig;
  onChange: (config: AppConfig) => void;
}

const MAX_STOPS = 6;

interface StopRowProps {
  stop: GradientStop;
  removable: boolean;
  onChange: (stop: GradientStop) => void;
  onRemove: () => void;
}

function StopRow({ stop, removable, onChange, onRemove }: StopRowProps) {
  const [draft, setDraft] = useState(stop.color);

  useEffect(() => {
    setDraft(stop.color);
  }, [stop.color]);

  const handleText = (next: string) => {
    setDraft(next);
    if (isValidHexColor(next)) {
      onChange({ ...stop, color: normalizeHex(next, stop.color) });
    }
  };

  return (
    <div className="flex items-center gap-1.5">
      <input
        type="color"
        value={isValidHexColor(stop.color) ? normalizeHex(stop.color, "#ffffff") : "#ffffff"}
        onChange={(event) =>
          onChange({ ...stop, color: normalizeHex(event.target.value, stop.color) })
        }
        className="h-6 w-6 shrink-0 cursor-pointer rounded border border-paper-deep/40 bg-transparent p-0 [&::-webkit-color-swatch-wrapper]:p-0.5 [&::-webkit-color-swatch]:rounded [&::-webkit-color-swatch]:border-none"
      />
      <input
        type="text"
        value={draft}
        spellCheck={false}
        onChange={(event) => handleText(event.target.value)}
        onBlur={() => setDraft(stop.color)}
        className="h-6 min-w-0 flex-1 rounded border border-paper-deep/35 bg-cloud/70 px-1.5 text-[11px] font-mono text-ink-soft outline-none focus:border-bamboo/50"
      />
      <input
        type="number"
        min={0}
        max={100}
        value={Math.round(stop.position)}
        onChange={(event) => {
          const next = Number(event.target.value);
          onChange({
            ...stop,
            position: Number.isFinite(next) ? Math.max(0, Math.min(100, next)) : stop.position,
          });
        }}
        className="h-6 w-[52px] shrink-0 rounded border border-paper-deep/35 bg-cloud/70 px-1 text-right text-[11px] font-mono text-ink-soft outline-none focus:border-bamboo/50"
      />
      <button
        type="button"
        onClick={onRemove}
        disabled={!removable}
        title="删除该色标"
        className="flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded border border-paper-deep/35 text-[13px] leading-none text-ink-ghost transition-colors hover:border-red-400/50 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:border-paper-deep/35 disabled:hover:text-ink-ghost"
      >
        ×
      </button>
    </div>
  );
}

export function GradientEditor({ config, onChange }: GradientEditorProps) {
  const { t } = useTranslation();
  const patch = (updates: Partial<AppConfig>) => onChange({ ...config, ...updates });

  // 编辑时保持用户排布的顺序，不在这里排序——否则改位置输入框会跳行
  const stops =
    config.gradientStops && config.gradientStops.length > 0
      ? config.gradientStops
      : DEFAULT_GRADIENT_STOPS;

  const gradientType: GradientType = config.gradientType ?? "linear";
  const gradientTypes = [
    {
      value: "linear" as GradientType,
      label: t("settings.gradient.linear", { defaultValue: "线性" }),
    },
    {
      value: "radial" as GradientType,
      label: t("settings.gradient.radial", { defaultValue: "径向" }),
    },
  ];

  const updateStop = (index: number, next: GradientStop) => {
    patch({ gradientStops: stops.map((stop, i) => (i === index ? next : stop)) });
  };

  const removeStop = (index: number) => {
    if (stops.length <= 2) return;
    patch({ gradientStops: stops.filter((_, i) => i !== index) });
  };

  const addStop = () => {
    if (stops.length >= MAX_STOPS) return;
    const sorted = [...stops].sort((a, b) => a.position - b.position);
    const last = sorted[sorted.length - 1];
    const previous = sorted.length >= 2 ? sorted[sorted.length - 2] : last;
    patch({
      gradientStops: [
        ...stops,
        {
          color: last.color,
          position: Math.round((previous.position + last.position) / 2),
        },
      ],
    });
  };

  return (
    <>
      <SlidingButtonGroup
        options={gradientTypes}
        value={gradientType}
        onChange={(value: GradientType) => patch({ gradientType: value })}
      />

      <div
        className="h-10 rounded-lg border border-paper-deep/30"
        style={{ backgroundImage: buildGradientCss(config) }}
      />

      {gradientType === "linear" && (
        <RangeRow
          label={t("settings.gradient.angle", { defaultValue: "角度" })}
          value={Math.round(config.gradientAngle ?? 90)}
          min={0}
          max={360}
          step={1}
          format={(value) => `${value}°`}
          onChange={(value) => patch({ gradientAngle: value })}
        />
      )}

      <div className="space-y-1.5">
        {stops.map((stop, index) => (
          <StopRow
            // 位置参与 key，避免拖动位置后输入框内容串行
            key={`${index}-${stop.position}`}
            stop={stop}
            removable={stops.length > 2}
            onChange={(next) => updateStop(index, next)}
            onRemove={() => removeStop(index)}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={addStop}
        disabled={stops.length >= MAX_STOPS}
        className="h-7 w-full cursor-pointer rounded-lg border border-dashed border-paper-deep/50 text-[11px] text-ink-faint transition-colors hover:border-bamboo/45 hover:text-bamboo disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-paper-deep/50 disabled:hover:text-ink-faint"
      >
        {t("settings.gradient.addStop", { defaultValue: "+ 添加色标" })}
      </button>

      <RangeRow
        label={t("settings.gradient.dim", { defaultValue: "遮罩" })}
        value={config.gradientDim ?? 0}
        min={0}
        max={1}
        step={0.01}
        format={(value) => `${Math.round(value * 100)}%`}
        onChange={(value) => patch({ gradientDim: value })}
      />
    </>
  );
}
