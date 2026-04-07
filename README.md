# 威软吃瓜视频助手

> cgtt.me（吃瓜网）/ 91blv.com 视频自动下载油猴脚本，支持 AES-128 加密 HLS 流识别与在线解密下载

---

## 功能特性

- **自动抓取视频** — 扫描 `<video>` 标签、页面脚本内容、Hook XHR/fetch 网络请求，全面捕获 MP4 / M3U8 / FLV 资源
- **最高质量优先** — 多清晰度源自动排序，优先选取最高画质（4K > 1080P > 720P …）
- **AES-128 加密识别** — 自动解析 M3U8 文件，识别 `EXT-X-KEY` 加密信息，展示分片数量与视频时长
- **🔧 在线解密下载** — 点击跳转[威软 ffmpeg 在线工具](https://github.com/weiruankeji2025/ffmpeg)，M3U8 链接自动传入，一键在浏览器内完成解密合并下载，无需本地安装 ffmpeg
- **ffmpeg 命令生成** — 一键复制 ffmpeg 命令，适合本地处理长视频
- **复制链接** — 快速复制视频 URL，支持 IDM / N_m3u8DL 等下载工具
- **视频封面下载** — 自动从 OG / Twitter Card / JSON-LD 元数据提取封面，一键下载
- **动态资源监听** — MutationObserver + 网络 Hook 实时监听，播放后自动识别新资源
- **无感融合** — 右下角固定悬浮按钮，不干扰正常浏览

---

## 安装方法

### 前提

安装任意油猴扩展：

| 扩展 | 浏览器 |
|------|--------|
| [Tampermonkey](https://www.tampermonkey.net/) | Chrome / Edge / Firefox / Safari |
| [Violentmonkey](https://violentmonkey.github.io/) | Chrome / Firefox |

### 步骤

1. 打开油猴扩展 → 新建脚本
2. 将 `cgtt-video-downloader.user.js` 的全部内容粘贴进去
3. 保存（Ctrl+S）
4. 访问 cgtt.me 或 91blv.com，即可看到右下角 **🎬 视频下载** 按钮

---

## 使用说明

1. 进入支持的视频网站任意视频页面
2. 点击右下角 **🎬 视频下载** 浮动按钮，打开下载面板
3. 脚本自动扫描并显示视频资源（含格式、清晰度、加密状态、分片数、时长）
4. 对每条资源可选择：

| 按钮 | 说明 |
|------|------|
| **⬇ 下载** | 直接下载视频文件（MP4/FLV）|
| **🔧 在线下载** | 跳转威软 ffmpeg 工具，自动传入 M3U8 链接，浏览器内解密合并（仅 M3U8）|
| **ffmpeg命令** | 展开并复制 ffmpeg 解密下载命令（仅 M3U8）|
| **⬇ 封面** | 下载视频封面图 |
| **⬇ 全部** | 同时下载视频与封面 |
| **复制链接** | 复制视频 URL 到剪贴板 |

5. 若视频为动态加载，点击面板内 **重新扫描** 按钮

---

## AES-128 加密视频下载流程

本站视频均采用 AES-128 加密 HLS 分片流，推荐使用以下两种方式下载：

### 方式一：在线工具（推荐，无需安装）

```
播放视频 → 面板出现 M3U8 资源 → 点击"🔧 在线下载"
→ 自动跳转威软 ffmpeg 工具并传入链接
→ 工具自动填入 URL → 点击获取 → 浏览器内解密合并 → 下载 .ts 文件
```

> 工具地址：[https://github.com/weiruankeji2025/ffmpeg](https://github.com/weiruankeji2025/ffmpeg)

### 方式二：本地 ffmpeg

点击 **ffmpeg命令** 按钮复制命令，在终端执行：

```bash
ffmpeg -i "https://xxx.m3u8?auth_key=..." -c copy "视频标题.mp4"
```

> **注意**：M3U8 中的 `auth_key` 有时效限制，需在链接有效期内执行

---

## 兼容站点

| 站点 | 域名 |
|------|------|
| 吃瓜网 | `cgtt.me` / `www.cgtt.me` / `*.cgtt.me` |
| 91blv | `91blv.com` / `www.91blv.com` / `*.91blv.com` |

---

## 注意事项

- 本脚本仅供学习与技术研究，请遵守相关法律法规，尊重版权
- M3U8 分片视频下载后格式为 `.ts`，可用 VLC 播放或用 ffmpeg 转换为 `.mp4`
- 部分视频因防盗链或跨域限制，可能需要在视频开始播放后再操作
- 使用"在线下载"功能需确保 [威软 ffmpeg 工具](https://github.com/weiruankeji2025/ffmpeg) 已配置 `?url=` 参数支持

---

## 文件说明

| 文件 | 说明 |
|------|------|
| `cgtt-video-downloader.user.js` | 油猴脚本主文件 |
| `README.md` | 本说明文件 |

---

## 版本历史

| 版本 | 说明 |
|------|------|
| v1.0.0 | 初始版本，支持 cgtt.me |
| v1.1.0 | 新增 91blv.com 支持 |
| v1.2.0 | AES-128 加密 HLS 识别，分片数/时长展示，复制链接/ffmpeg命令按钮 |
| v1.2.1 | 新增 `@grant unsafeWindow`/`GM_setClipboard`，改进剪贴板兼容性 |
| v1.3.0 | 彻底重写面板渲染（createElement），修复按钮无响应问题，修复 MutationObserver 干扰 |
| v1.4.0 | 新增"🔧 在线下载"按钮，检测到 M3U8 后自动跳转威软 ffmpeg 工具并传递链接 |

---

## 署名

**威软吃瓜视频助手** · 由 [weiruankeji2025](https://github.com/weiruankeji2025) 开发维护
