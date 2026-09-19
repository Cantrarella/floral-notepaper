import { useCallback, useEffect, useState } from "react";
import { listen } from "@tauri-apps/api/event";
import {
  getTrayMenuEntries,
  hideTrayMenu,
  invokeTrayMenuItem,
  type TrayMenuEntry,
} from "../features/tray/api";

function isSelectable(entry: TrayMenuEntry) {
  return entry.kind !== "separator";
}

function CheckIcon() {
  return (
    <svg
      width="13"
      height="13"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

/**
 * 自绘的托盘菜单窗内容。
 *
 * 原生菜单（Win32 句柄）无法套样式，所以 Windows / Linux 上托盘右键改为弹出
 * 这个无边框小窗，配色沿用界面底色（`--color-paper` / `--color-paper-warm`），
 * 与花笺主题保持一致。文案与勾选状态由 Rust 侧统一给出，避免前后端各写一份。
 */
export function TrayMenu() {
  const [entries, setEntries] = useState<TrayMenuEntry[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [ready, setReady] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const list = await getTrayMenuEntries();
      setEntries(list);
      setActiveIndex(-1);
    } catch {
      // 拉不到数据时保持上一帧，窗口本身由后端控制显隐
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    void refresh().finally(() => {
      if (!cancelled) setReady(true);
    });

    const unlisten = listen("tray-menu-opened", () => {
      void refresh();
    });

    return () => {
      cancelled = true;
      void unlisten.then((fn) => fn());
    };
  }, [refresh]);

  useEffect(() => {
    const selectableIndexes = entries
      .map((entry, index) => (isSelectable(entry) ? index : -1))
      .filter((index) => index >= 0);

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        void hideTrayMenu();
        return;
      }

      if (selectableIndexes.length === 0) return;

      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        const step = event.key === "ArrowDown" ? 1 : -1;
        const current = selectableIndexes.indexOf(activeIndex);
        const next =
          current === -1
            ? step === 1
              ? selectableIndexes[0]
              : selectableIndexes[selectableIndexes.length - 1]
            : selectableIndexes[
                (current + step + selectableIndexes.length) % selectableIndexes.length
              ];
        setActiveIndex(next);
        return;
      }

      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        const entry = entries[activeIndex];
        if (entry && isSelectable(entry)) {
          void invokeTrayMenuItem(entry.id);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [entries, activeIndex]);

  if (!ready) {
    return <div className="h-screen w-screen" />;
  }

  return (
    <div className="h-screen w-screen overflow-hidden p-2">
      <div
        role="menu"
        aria-orientation="vertical"
        className="flex w-[224px] flex-col rounded-[10px] bg-paper py-[10px] shadow-[0_10px_28px_rgba(26,26,24,0.16),0_2px_6px_rgba(26,26,24,0.08)] ring-1 ring-black/5"
      >
        {entries.map((entry, index) =>
          entry.kind === "separator" ? (
            <div key={entry.id} className="my-[4px] h-px bg-paper-deep/60" />
          ) : (
            <button
              key={entry.id}
              type="button"
              role="menuitem"
              aria-checked={entry.kind === "check" ? entry.checked : undefined}
              onMouseEnter={() => setActiveIndex(index)}
              onClick={() => void invokeTrayMenuItem(entry.id)}
              className={`flex h-[34px] w-full shrink-0 cursor-default items-center px-[10px] text-left text-[13px] transition-colors duration-100 ${
                entry.kind === "danger" ? "tray-menu-danger" : "text-ink"
              } ${activeIndex === index ? "bg-paper-warm" : "bg-transparent"}`}
            >
              <span className="mr-[6px] flex w-[20px] shrink-0 items-center justify-center">
                {entry.kind === "check" && entry.checked ? <CheckIcon /> : null}
              </span>
              <span className="truncate">{entry.label}</span>
            </button>
          ),
        )}
      </div>
    </div>
  );
}
