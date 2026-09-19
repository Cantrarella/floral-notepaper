import { describe, expect, test } from "vitest";
import { resolveTileFollowPalette } from "./appearance";
import type { AppConfig } from "./types";

function makeConfig(overrides: Partial<AppConfig> = {}): AppConfig {
  return {
    locale: "zh-CN",
    dataDir: "C:/data",
    globalShortcut: "Ctrl+Space",
    closeToTray: true,
    autostart: false,
    defaultViewMode: "edit",
    noteAutoSave: true,
    noteSurfaceAutoSave: true,
    tileColor: "#f6f3ec",
    tileColorMode: "system",
    theme: "light",
    fontSize: 14,
    surfaceFontSize: 14,
    tabIndentSize: 2,
    externalFileAutoSave: true,
    rememberSurfaceSize: true,
    tileCtrlClose: true,
    tileDoubleClickToEdit: false,
    tileSaveReturnsToPin: false,
    tileRenderMarkdown: false,
    renderHtmlMarkdown: false,
    splitScrollSync: true,
    toggleVisibilityShortcut: "",
    openAtCursor: false,
    customAccentEnabled: true,
    accentColorLight: "#2f5d8a",
    accentColorDark: "#759dce",
    customTextColorEnabled: false,
    textColorLight: "#1a1a18",
    textColorDark: "#e5e1da",
    textFaintLight: "#8a8a80",
    textFaintDark: "#928f87",
    customSurfaceEnabled: false,
    surfaceColorLight: "#f6f3ec",
    surfaceColorDark: "#222120",
    surfaceWarmLight: "#f0ebe0",
    surfaceWarmDark: "#2c2a27",
    surfaceDeepLight: "#e8e1d3",
    surfaceDeepDark: "#3c3935",
    ...overrides,
  };
}

describe("tile follow palette", () => {
  test("does not follow when the user picked a custom tile color", () => {
    const config = makeConfig({ tileColorMode: "custom", customSurfaceEnabled: true });
    expect(resolveTileFollowPalette(config, "light")).toBeNull();
  });

  test("does not follow while custom surface colors are disabled", () => {
    expect(resolveTileFollowPalette(makeConfig(), "light")).toBeNull();
    expect(
      resolveTileFollowPalette(makeConfig({ customTextColorEnabled: true }), "light"),
    ).toBeNull();
  });

  test("follows the custom surface color of the active theme", () => {
    const config = makeConfig({
      customSurfaceEnabled: true,
      surfaceColorLight: "#FFFFFF",
      surfaceColorDark: "#222120",
    });
    expect(resolveTileFollowPalette(config, "light")?.background).toBe("#ffffff");
    expect(resolveTileFollowPalette(config, "dark")?.background).toBe("#222120");
  });

  test("exposes ink only when custom text colors are enabled", () => {
    const withoutText = makeConfig({ customSurfaceEnabled: true });
    expect(resolveTileFollowPalette(withoutText, "light")?.ink).toBeNull();

    const withText = makeConfig({
      customSurfaceEnabled: true,
      customTextColorEnabled: true,
      textColorLight: "#1a1a18",
      textFaintLight: "#6c6c64",
      surfaceColorLight: "#ffffff",
    });
    const ink = resolveTileFollowPalette(withText, "light")?.ink;
    expect(ink?.content).toBe("#1a1a18");
    expect(ink?.title).toBe("#6c6c64");
    // ghost 由淡色往纸色退，必须比淡色更浅
    expect(ink?.empty).not.toBe(ink?.title);
  });
});
