import { useEffect, useState } from "react";
import { isValidHexColor, normalizeHex } from "../features/settings/appearance";

interface ColorRowProps {
  label: string;
  value: string;
  /** 点「↺」时回落到该值 */
  fallback: string;
  onChange: (value: string) => void;
}

/**
 * 一行颜色设置：说明文字 + 原生色板 + hex 输入框 + 重置。
 * hex 输入用本地 draft：打字过程中不合法就只改 draft，合法了才向上提交，
 * 这样既能边输边预览，又不会因为 "输入到一半" 而把配置写成脏值。
 */
export function ColorRow({ label, value, fallback, onChange }: ColorRowProps) {
  const [draft, setDraft] = useState(value);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  const handleTextChange = (next: string) => {
    setDraft(next);
    if (isValidHexColor(next)) {
      onChange(normalizeHex(next, fallback));
    }
  };

  return (
    <div className="flex items-center gap-2 h-9 rounded-lg px-2.5 bg-paper-warm/45 border border-paper-deep/25">
      <span className="min-w-0 flex-1 truncate text-[11px] text-ink-faint">{label}</span>
      <input
        type="color"
        value={isValidHexColor(value) ? normalizeHex(value, fallback) : fallback}
        onChange={(event) => onChange(normalizeHex(event.target.value, fallback))}
        className="h-6 w-6 shrink-0 cursor-pointer rounded border border-paper-deep/40 bg-transparent p-0 [&::-webkit-color-swatch-wrapper]:p-0.5 [&::-webkit-color-swatch]:rounded [&::-webkit-color-swatch]:border-none"
        aria-label={label}
      />
      <input
        type="text"
        value={draft}
        spellCheck={false}
        onChange={(event) => handleTextChange(event.target.value)}
        onBlur={() => setDraft(value)}
        className="h-6 w-[76px] shrink-0 rounded border border-paper-deep/35 bg-cloud/70 px-1.5 text-[11px] font-mono text-ink-soft outline-none focus:border-bamboo/50"
      />
      <button
        type="button"
        onClick={() => onChange(fallback)}
        title="恢复默认"
        className="flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded border border-paper-deep/35 text-[11px] text-ink-ghost transition-colors hover:border-bamboo/40 hover:text-bamboo"
      >
        ↺
      </button>
    </div>
  );
}
