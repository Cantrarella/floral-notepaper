export type ViewMode = "edit" | "split" | "preview";

export type ThemeOption = "light" | "dark" | "system";

export type TileColorMode = "system" | "custom";
export type BackgroundFit = "cover" | "contain" | "repeat";
export type BackgroundMode = "image" | "gradient" | "color";
export type GradientType = "linear" | "radial";

export interface GradientStop {
  /** 6 位 hex 色号，如 #89c2ff */
  color: string;
  /** 在渐变中的位置，0-100 */
  position: number;
}

export interface AppConfig {
  locale: string;
  dataDir: string;
  globalShortcut: string;
  closeToTray: boolean;
  autostart: boolean;
  defaultViewMode: string;
  noteAutoSave: boolean;
  noteSurfaceAutoSave: boolean;
  tileColor: string;
  tileColorMode: TileColorMode;
  theme: ThemeOption;
  fontSize: number;
  surfaceFontSize: number;
  tabIndentSize: number;
  externalFileAutoSave: boolean;
  rememberSurfaceSize: boolean;
  tileCtrlClose: boolean;
  tileDoubleClickToEdit: boolean;
  tileSaveReturnsToPin: boolean;
  tileRenderMarkdown: boolean;
  renderHtmlMarkdown: boolean;
  splitScrollSync: boolean;
  surfaceWidth?: number;
  surfaceHeight?: number;
  toggleVisibilityShortcut: string;
  openAtCursor: boolean;
  backgroundImagePath?: string;
  backgroundFit?: BackgroundFit;
  backgroundDim?: number;
  backgroundBlur?: number;
  backgroundScale?: number;
  backgroundPositionX?: number;
  backgroundPositionY?: number;
  /** 背景类型：图片 / 纯渐变 / 纯色。缺省按 image 处理，兼容旧配置 */
  backgroundMode?: BackgroundMode;
  /** 纯色背景色号，6 位 hex */
  backgroundColor?: string;
  gradientType?: GradientType;
  /** CSS 线性渐变角度：0=向上，90=向右，180=向下 */
  gradientAngle?: number;
  gradientStops?: GradientStop[];
  /** 渐变背景的遮罩强度，默认 0（不冲淡渐变） */
  gradientDim?: number;
  /** 是否启用自定义主题色（关闭时回落到内置竹青色） */
  customAccentEnabled?: boolean;
  accentColorLight?: string;
  accentColorDark?: string;
  /** 是否启用自定义文字色（关闭时回落到内置墨色） */
  customTextColorEnabled?: boolean;
  /** 正文色 */
  textColorLight?: string;
  textColorDark?: string;
  /** 淡色文字/图标色 */
  textFaintLight?: string;
  textFaintDark?: string;
}
