# 花笺定制版 · Custom Build

> 本仓库是 [Achilng/floral-notepaper](https://github.com/Achilng/floral-notepaper) 的 fork，在原版 **v1.2.0** 基础上做外观自定义改造。
> 原作者版权与 MIT 许可证完整保留（见 `LICENSE`，Copyright (c) 2026 Achilng）。

## 为什么会有这个版本

原版把配色写死在代码里，设置面板没有入口。这个版本把主题色、文字颜色、界面底色、背景全部开放成可视化设置项，并支持渐变与纯色背景。

## 新增功能

| 功能               | 说明                                                                                                                         |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| **自定义主题色**   | 选一个主色，浅 / 雾 / 晕三档自动派生；浅色与深色主题各存一套，切主题自动换                                                   |
| **自定义文字颜色** | 只调「正文色」和「淡色」两档，次级与图标两档自动插值；面板实时显示四档对比度，低于 4.5 标黄、低于 3 标红，附「一键增强淡色」 |
| **自定义界面底色** | 面板 / 暖底 / 深底三档，按所选色相自动锁亮度派生；可「按主题色重算」跟随主题色                                               |
| **背景三模式**     | 图片（原功能）、渐变（最多 6 色标，可增删拖位置、调角度、切线性 / 径向）、纯色                                               |

对比度按 WCAG 标准计算，且以**实际生效的底色**为基准（原版逻辑用的是内置纸色，自定义底色后会失真，已修正）。

## 改动文件

**新增**

- `src/features/settings/appearance.ts` — 配色派生、CSS 变量应用、渐变构建、对比度计算
- `src/components/AppearanceSection.tsx`、`GradientEditor.tsx`、`ColorRow.tsx`、`SettingsRows.tsx`
- `.github/workflows/build-custom-windows.yml` — Windows 云编译

**修改**

- `src/features/settings/types.ts` — 配置项类型
- `src/components/BackgroundLayer.tsx`、`SettingsPanel.tsx`、`src/App.tsx`、`index.html`
- `src-tauri/src/services/notes.rs`、`src-tauri/src/desktop.rs` — Rust 侧 `AppConfig` 同步字段
- `src-tauri/src/updater/check.rs` — 自动更新默认源指向本仓库
- `src/locales/{zh-CN,zh-HK,en-US}/translation.json` — 三语言文案

## 自动更新

原版 `DEFAULT_GITHUB_REPO` 指向原作者仓库，定制版若开启自动更新会被官方版本覆盖、丢失定制功能。
此版本已将该默认值改为 `Cantrarella/floral-notepaper`（可用环境变量 `FLORAL_NOTEPAPER_UPDATE_GITHUB_REPO` 覆盖）。

## 自己编译

推到 `main` 分支会自动触发 GitHub Actions 编译 Windows 安装包（约 4 分钟，runner 自带 MSVC + WebView2，本机无需工具链）。产物在 Actions 对应 run 里下载，保留 30 天。

## 同步上游

本仓库只叠加改动，不改动上游历史。上游更新后可选择性合并，冲突会在本地停下等待人工裁决，不会丢失改动。

## 许可证

沿用上游 **MIT**。依据 MIT 条款：保留原版权声明与许可证全文即可，衍生作品无需开源、无需沿用相同许可证。本文件仅为说明改动内容，不构成对许可证的变更。
