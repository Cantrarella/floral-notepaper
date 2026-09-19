# 花笺定制版 · Custom Build

> 本仓库是 [Achilng/floral-notepaper](https://github.com/Achilng/floral-notepaper) 的 fork，在原版 **v1.2.0** 基础上做外观自定义改造。
> 原作者版权与 MIT 许可证完整保留（见 `LICENSE`，Copyright (c) 2026 Achilng）。

## 为什么会有这个版本

原版把配色写死在代码里，设置面板没有入口。这个版本把主题色、文字颜色、界面底色、背景全部开放成可视化设置项，并支持渐变与纯色背景。

## 新增功能

| 功能                 | 说明                                                                                                                         |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| **自定义主题色**     | 选一个主色，浅 / 雾 / 晕三档自动派生；浅色与深色主题各存一套，切主题自动换                                                   |
| **自定义文字颜色**   | 只调「正文色」和「淡色」两档，次级与图标两档自动插值；面板实时显示四档对比度，低于 4.5 标黄、低于 3 标红，附「一键增强淡色」 |
| **自定义界面底色**   | 面板 / 暖底 / 深底三档，按所选色相自动锁亮度派生；可「按主题色重算」跟随主题色                                               |
| **背景三模式**       | 图片（原功能）、渐变（最多 6 色标，可增删拖位置、调角度、切线性 / 径向）、纯色                                               |
| **磁贴跟随界面配色** | 便签钉成桌面磁贴后，底色自动跟随界面底色、文字用自定义墨色，不再突兀变色；磁贴颜色手动选「自定义」时不跟随                   |
| **自绘托盘菜单**     | 托盘右键菜单由系统原生样式改为与界面同款的无边框弹窗：白底、悬停纸灰、退出项暗红字、固定 13px 字号，随明暗主题自适应         |

对比度按 WCAG 标准计算，且以**实际生效的底色**为基准（原版逻辑用的是内置纸色，自定义底色后会失真，已修正）。

## 出厂默认配色

本 fork 预置了一套配色，**安装即用**（三项自定义开关默认开启，无需手动设置）：

| 项目                | 浅色主题                                       | 深色主题  |
| ------------------- | ---------------------------------------------- | --------- |
| 主题色              | `#2f5d8a`                                      | `#759dce` |
| 正文色              | `#1a1a18`                                      | `#e5e1da` |
| 淡色（次级 / 图标） | `#6c6c64`                                      | `#928f87` |
| 界面底色 面板       | `#ffffff`                                      | `#222120` |
| 界面底色 暖底       | `#e8e8e8`                                      | `#2c2a27` |
| 界面底色 深底       | `#dcd8d0`                                      | `#3c3935` |
| 背景                | 无（保持干净，可在设置里选图片 / 渐变 / 纯色） | 同左      |

这些值定义在 `src-tauri/src/services/notes.rs` 的 `default_*` 系列函数中。在设置里**关掉**对应开关会回退到上游内置配色（竹青 `#2d5a3d` 系）。

## 改动文件

**新增**

- `src/features/settings/appearance.ts` — 配色派生、CSS 变量应用、渐变构建、对比度计算、磁贴跟随配色（`resolveTileFollowPalette`）
- `src/components/AppearanceSection.tsx`、`GradientEditor.tsx`、`ColorRow.tsx`、`SettingsRows.tsx`
- `src/features/tray/api.ts`、`src/components/TrayMenu.tsx` — 自绘托盘菜单（渲染 + 键盘导航）
- `.github/workflows/build-custom-windows.yml` — Windows 云编译

**修改**

- `src/features/settings/types.ts` — 配置项类型
- `src/features/settings/theme.ts` — 读取当前生效主题（`currentTheme`）
- `src/components/BackgroundLayer.tsx`、`SettingsPanel.tsx`、`Tile.tsx`、`NotePad.tsx`、`src/App.tsx`、`src/App.css`、`index.html`
- `src/features/windows/windowRoutes.ts` — 新增 `tray-menu` 窗口路由
- `src-tauri/src/services/notes.rs`、`src-tauri/src/desktop.rs` — Rust 侧 `AppConfig` 同步字段；托盘菜单窗口的创建、贴屏定位与失焦收起
- `src-tauri/src/updater/check.rs` — 自动更新默认源指向本仓库
- `src-tauri/src/services/notes.rs` — 出厂默认配色（见上表）
- `src/locales/{zh-CN,zh-HK,en-US}/translation.json` — 三语言文案

## 自动更新

原版 `DEFAULT_GITHUB_REPO` 指向原作者仓库，定制版若开启自动更新会被官方版本覆盖、丢失定制功能。
此版本已将该默认值改为 `Cantrarella/floral-notepaper`（可用环境变量 `FLORAL_NOTEPAPER_UPDATE_GITHUB_REPO` 覆盖）。

## 自己编译

推到 `main` 分支会自动触发 GitHub Actions 编译 Windows 安装包（约 4 分钟，runner 自带 MSVC + WebView2，本机无需工具链）。产物在 Actions 对应 run 里下载，保留 30 天。

## 同步上游

本仓库只叠加改动，不改动上游历史。已配好 `upstream` 远端指向 `Achilng/floral-notepaper`，上游出新版后按下面步骤合并。

**先看不动手**（体检，不会改任何文件）：

```bash
git fetch upstream main
git merge-tree $(git merge-base FETCH_HEAD main) main FETCH_HEAD   # 预演合并，看会不会冲突
git log --oneline main..FETCH_HEAD                                 # 上游有哪些新提交
```

**确认要合了**：

```bash
git fetch upstream main
git merge FETCH_HEAD            # 冲突会停下来，文件里留 <<<<<<< 标记，人工裁决后再 git add + git commit
npm install && npm test && npm run build   # 本地验证
git push origin main            # 触发云编译
```

**要放弃**：`git merge --abort` 回到合并前，改动不会丢。

**注意**：本 fork 改的正好是上游的热点文件（`desktop.rs`、`SettingsPanel.tsx`、`notes.rs`、`zh-CN/translation.json`、`App.tsx`），合并大概率有冲突，属正常现象，不是搞坏了。冲突裁决时**保留上游的功能改动 + 保留本 fork 的配色 / 菜单相关代码**即可；`src-tauri/src/services/notes.rs` 的 `AppConfig` 强类型 struct 要特别留意，上游加字段时本 fork 的字段也得跟着补，否则前端新配置会被 serde 静默丢弃。

## 许可证

沿用上游 **MIT**。依据 MIT 条款：保留原版权声明与许可证全文即可，衍生作品无需开源、无需沿用相同许可证。本文件仅为说明改动内容，不构成对许可证的变更。
