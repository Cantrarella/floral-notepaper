import { useEffect, useRef } from "react";
import "./App.css";
import { ContextMenuProvider } from "./components/ContextMenu";
import { MainWindow } from "./components/MainWindow";
import { NotePad } from "./components/NotePad";
import { TileShowcase } from "./components/TileShowcase";
import { ToastContainer } from "./components/Toast";
import { tabToIndentListener } from "indent-textarea";
import { getConfig } from "./features/settings/api";
import { applyAppearance } from "./features/settings/appearance";
import { applyTheme, watchSystemTheme } from "./features/settings/theme";
import type { AppConfig, ThemeOption } from "./features/settings/types";
import { getInitialRoute } from "./features/windows/windowRoutes";
import { syncLanguage } from "./locales";
import { listen } from "@tauri-apps/api/event";

function App() {
  const route = getInitialRoute();
  const activeView = route.view;
  // 主题切换（含"跟随系统")时要用最新配置重刷配色，这里留一份引用
  const appearanceConfig = useRef<AppConfig | null>(null);

  const syncAppearance = (config: AppConfig) => {
    appearanceConfig.current = config;
    applyAppearance(config);
  };

  useEffect(() => {
    let cleanup = () => {};
    getConfig()
      .then((config) => {
        const theme = (config.theme || "system") as ThemeOption;
        applyTheme(theme);
        cleanup = watchSystemTheme(theme);
        syncAppearance(config);
        document.documentElement.style.setProperty(
          "--tab-indent-size",
          String(config.tabIndentSize ?? 2),
        );
        void syncLanguage(config.locale);
      })
      .catch(() => {});
    return () => cleanup();
  }, []);

  useEffect(() => {
    let themeCleanup = () => {};
    const unlisten = listen<AppConfig>("config-changed", (event) => {
      const theme = (event.payload.theme || "system") as ThemeOption;
      applyTheme(theme);
      themeCleanup();
      themeCleanup = watchSystemTheme(theme);
      syncAppearance(event.payload);
      document.documentElement.style.setProperty(
        "--tab-indent-size",
        String(event.payload.tabIndentSize ?? 2),
      );
      void syncLanguage(event.payload.locale);
    });
    return () => {
      themeCleanup();
      void unlisten.then((fn) => fn());
    };
  }, []);

  // data-theme 变化（手动切主题 / 系统明暗变化）后重新套用自定义配色，
  // 否则深色主题会继续沿用上一套主题的 inline 覆盖值
  useEffect(() => {
    const observer = new MutationObserver(() => {
      const config = appearanceConfig.current;
      if (config) applyAppearance(config);
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const handleTab = (event: KeyboardEvent) => {
      const target = event.target;
      if (!(target instanceof HTMLTextAreaElement)) return;
      if (target.dataset.tabIndent !== "true") return;
      tabToIndentListener(event);
    };
    window.addEventListener("keydown", handleTab, true);
    return () => window.removeEventListener("keydown", handleTab, true);
  }, []);

  useEffect(() => {
    const isWindows =
      navigator.userAgent.includes("Windows") || navigator.platform.toLowerCase().startsWith("win");
    if (!isWindows) return;

    const preventSystemMenu = (e: KeyboardEvent) => {
      if (e.altKey && e.code === "Space") {
        e.preventDefault();
      }
    };
    document.addEventListener("keydown", preventSystemMenu, true);
    return () => document.removeEventListener("keydown", preventSystemMenu, true);
  }, []);

  return (
    <ContextMenuProvider>
      <div className="app-window-shell h-screen font-body text-ink overflow-hidden">
        {activeView === "main" ? (
          <MainWindow />
        ) : activeView === "notepad" ? (
          <NotePad initialNoteId={route.noteId} />
        ) : (
          <TileShowcase noteId={route.noteId} />
        )}
        <ToastContainer />
      </div>
    </ContextMenuProvider>
  );
}

export default App;
