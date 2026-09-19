import { invoke } from "@tauri-apps/api/core";

/** 菜单项种类，与 Rust 侧 `TrayMenuEntry::kind` 一一对应 */
export type TrayMenuEntryKind = "item" | "check" | "separator" | "danger";

export interface TrayMenuEntry {
  id: string;
  label: string;
  kind: TrayMenuEntryKind;
  checked: boolean;
}

/** 拉取当前的托盘菜单项（含本地化文案与勾选状态） */
export function getTrayMenuEntries(): Promise<TrayMenuEntry[]> {
  return invoke<TrayMenuEntry[]>("tray_menu_entries");
}

/** 触发一个菜单项，由 Rust 侧复用原生菜单的动作分发 */
export function invokeTrayMenuItem(id: string): Promise<void> {
  return invoke<void>("tray_menu_invoke", { id });
}

/** 收起自绘菜单窗 */
export function hideTrayMenu(): Promise<void> {
  return invoke<void>("tray_menu_hide");
}
