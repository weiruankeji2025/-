// ==UserScript==
// @name         威软吃瓜视频助手
// @namespace    https://github.com/weiruankeji2025/-
// @version      1.5.0
// @description  cgtt.me / 91blv.com 视频下载 + 18comic.vip 漫画批量下载助手 - 自动抓取视频/图片资源，支持最高画质，AES-128 HLS 解密，漫画全章下载
// @author       威软吃瓜视频助手
// @match        *://cgtt.me/*
// @match        *://www.cgtt.me/*
// @match        *://*.cgtt.me/*
// @match        *://91blv.com/*
// @match        *://www.91blv.com/*
// @match        *://*.91blv.com/*
// @match        *://18comic.vip/*
// @match        *://www.18comic.vip/*
// @match        *://*.18comic.vip/*
// @match        *://18comic.app/*
// @match        *://www.18comic.app/*
// @match        *://*.18comic.app/*
// @grant        GM_download
// @grant        GM_xmlhttpRequest
// @grant        GM_addStyle
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_notification
// @grant        GM_setClipboard
// @grant        unsafeWindow
// @connect      *
// @run-at       document-end
// @license      MIT
// ==/UserScript==

(function () {
    'use strict';

    // ─── 常量 ────────────────────────────────────────────────────────────────
    const SCRIPT_NAME = '威软吃瓜视频助手';
    const PANEL_ID    = 'wrjg-panel';
    const BTN_ID      = 'wrjg-toggle-btn';

    // ─── 工具函数 ────────────────────────────────────────────────────────────

    function log(...args) {
        console.log(`[${SCRIPT_NAME}]`, ...args);
    }

    /** 复制文本到剪贴板，优先使用 GM_setClipboard */
    function copyText(text, successMsg) {
        try {
            GM_setClipboard(text);
            showStatus(successMsg || '已复制');
        } catch (_) {
            try {
                navigator.clipboard.writeText(text).then(() => showStatus(successMsg || '已复制'));
            } catch (_2) {
                const ta = document.createElement('textarea');
                ta.value = text;
                document.body.appendChild(ta);
                ta.select();
                document.execCommand('copy');
                ta.remove();
                showStatus(successMsg || '已复制');
            }
        }
    }

    function sanitizeFilename(name) {
        return (name || 'video').replace(/[\\/:*?"<>|]/g, '_').trim().substring(0, 100);
    }

    function formatSize(bytes) {
        if (!bytes) return '未知';
        const units = ['B', 'KB', 'MB', 'GB'];
        let i = 0;
        while (bytes >= 1024 && i < units.length - 1) { bytes /= 1024; i++; }
        return bytes.toFixed(1) + ' ' + units[i];
    }

    // ─── 样式注入 ────────────────────────────────────────────────────────────
    GM_addStyle(`
        #${BTN_ID} {
            position: fixed;
            bottom: 80px;
            right: 20px;
            z-index: 999999;
            background: linear-gradient(135deg, #ff4757, #ff6b81);
            color: #fff;
            border: none;
            border-radius: 50px;
            padding: 10px 18px;
            font-size: 14px;
            font-weight: bold;
            cursor: pointer;
            box-shadow: 0 4px 15px rgba(255,71,87,0.4);
            transition: all 0.3s ease;
            font-family: "Microsoft YaHei", Arial, sans-serif;
            user-select: none;
        }
        #${BTN_ID}:hover {
            transform: scale(1.05);
            box-shadow: 0 6px 20px rgba(255,71,87,0.6);
        }
        #${PANEL_ID} {
            position: fixed;
            bottom: 140px;
            right: 20px;
            z-index: 999998;
            width: 380px;
            max-height: 500px;
            background: #1a1a2e;
            border: 1px solid #ff4757;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 10px 40px rgba(0,0,0,0.7);
            font-family: "Microsoft YaHei", Arial, sans-serif;
            display: none;
        }
        #${PANEL_ID}.visible {
            display: flex;
            flex-direction: column;
        }
        .wrjg-header {
            background: linear-gradient(135deg, #ff4757, #c0392b);
            color: #fff;
            padding: 12px 16px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            flex-shrink: 0;
        }
        .wrjg-header-title {
            font-size: 15px;
            font-weight: bold;
            display: flex;
            align-items: center;
            gap: 6px;
        }
        .wrjg-header-icon {
            font-size: 18px;
        }
        .wrjg-scan-btn {
            background: rgba(255,255,255,0.2);
            color: #fff;
            border: 1px solid rgba(255,255,255,0.4);
            border-radius: 6px;
            padding: 4px 10px;
            font-size: 12px;
            cursor: pointer;
            transition: background 0.2s;
        }
        .wrjg-scan-btn:hover {
            background: rgba(255,255,255,0.35);
        }
        .wrjg-body {
            overflow-y: auto;
            flex: 1;
            padding: 8px;
        }
        .wrjg-body::-webkit-scrollbar { width: 5px; }
        .wrjg-body::-webkit-scrollbar-track { background: #0f0f23; }
        .wrjg-body::-webkit-scrollbar-thumb { background: #ff4757; border-radius: 3px; }
        .wrjg-empty {
            color: #888;
            text-align: center;
            padding: 30px 16px;
            font-size: 13px;
        }
        .wrjg-item {
            background: #16213e;
            border: 1px solid #2a2a4a;
            border-radius: 8px;
            margin-bottom: 8px;
            overflow: hidden;
            transition: border-color 0.2s;
        }
        .wrjg-item:hover {
            border-color: #ff4757;
        }
        .wrjg-item-header {
            display: flex;
            align-items: center;
            gap: 8px;
            padding: 10px 12px 6px;
        }
        .wrjg-thumb {
            width: 60px;
            height: 40px;
            object-fit: cover;
            border-radius: 4px;
            background: #0d0d1a;
            flex-shrink: 0;
        }
        .wrjg-thumb-placeholder {
            width: 60px;
            height: 40px;
            border-radius: 4px;
            background: #0d0d1a;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 20px;
            flex-shrink: 0;
        }
        .wrjg-info {
            flex: 1;
            min-width: 0;
        }
        .wrjg-title {
            color: #e0e0e0;
            font-size: 12px;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            margin-bottom: 3px;
        }
        .wrjg-meta {
            color: #888;
            font-size: 11px;
            display: flex;
            gap: 8px;
        }
        .wrjg-quality-badge {
            background: #ff4757;
            color: #fff;
            font-size: 10px;
            padding: 1px 5px;
            border-radius: 3px;
            font-weight: bold;
        }
        .wrjg-actions {
            display: flex;
            gap: 6px;
            padding: 0 12px 10px;
            flex-wrap: wrap;
        }
        .wrjg-btn {
            flex: 1;
            min-width: 70px;
            padding: 5px 8px;
            font-size: 11px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-weight: bold;
            transition: opacity 0.2s;
        }
        .wrjg-btn:hover { opacity: 0.85; }
        .wrjg-btn-video {
            background: linear-gradient(135deg, #ff4757, #ff6b81);
            color: #fff;
        }
        .wrjg-btn-cover {
            background: linear-gradient(135deg, #2d3436, #636e72);
            color: #fff;
        }
        .wrjg-btn-all {
            background: linear-gradient(135deg, #6c5ce7, #a29bfe);
            color: #fff;
        }
        .wrjg-btn-ffmpeg {
            background: linear-gradient(135deg, #00b894, #00cec9);
            color: #fff;
        }
        .wrjg-btn-copy {
            background: linear-gradient(135deg, #636e72, #b2bec3);
            color: #fff;
        }
        .wrjg-btn-online {
            background: linear-gradient(135deg, #e17055, #fdcb6e);
            color: #fff;
        }
        .wrjg-encrypt-badge {
            background: #fdcb6e;
            color: #2d3436;
            font-size: 10px;
            padding: 1px 5px;
            border-radius: 3px;
            font-weight: bold;
        }
        .wrjg-seg-info {
            color: #636e72;
            font-size: 10px;
        }
        .wrjg-ffmpeg-box {
            background: #0d0d1a;
            border: 1px dashed #2a2a4a;
            border-radius: 5px;
            margin: 0 12px 8px;
            padding: 6px 8px;
            font-size: 10px;
            color: #00b894;
            font-family: monospace;
            word-break: break-all;
            line-height: 1.5;
            display: none;
        }
        .wrjg-ffmpeg-box.show { display: block; }
        .wrjg-footer {
            background: #0f0f23;
            border-top: 1px solid #2a2a4a;
            padding: 6px 12px;
            font-size: 10px;
            color: #555;
            text-align: center;
            flex-shrink: 0;
        }
        .wrjg-status {
            color: #00d2d3;
            font-size: 11px;
            padding: 2px 12px 6px;
        }
        .wrjg-progress {
            height: 3px;
            background: #2a2a4a;
            border-radius: 2px;
            margin: 4px 12px;
            overflow: hidden;
            display: none;
        }
        .wrjg-progress-bar {
            height: 100%;
            background: linear-gradient(90deg, #ff4757, #ff6b81);
            border-radius: 2px;
            transition: width 0.3s;
            width: 0%;
        }
        .wrjg-btn-img-all {
            background: linear-gradient(135deg, #00b894, #55efc4);
            color: #fff;
        }
        .wrjg-section-title {
            color: #aaa;
            font-size: 11px;
            padding: 4px 12px 2px;
            border-top: 1px solid #2a2a4a;
            margin-top: 4px;
        }
    `);

    // ─── 威软 ffmpeg 在线工具地址 ────────────────────────────────────────────
    const FFMPEG_TOOL_URL = 'https://weiruankeji2025.github.io/ffmpeg/';

    // ─── 视频资源存储 ────────────────────────────────────────────────────────
    let foundResources = [];

    // ─── 18comic.vip 漫画资源存储 ────────────────────────────────────────────
    let comicResources = [];

    // ─── 质量排序权重 ────────────────────────────────────────────────────────
    const QUALITY_RANK = {
        '2160p': 100, '4k': 100,
        '1440p': 90, '2k': 90,
        '1080p': 80, 'fhd': 80,
        '720p': 70,  'hd': 70,
        '480p': 50,  'sd': 50,
        '360p': 30,
        '240p': 20,
    };

    function getQualityRank(url, label) {
        const text = ((url || '') + ' ' + (label || '')).toLowerCase();
        for (const [key, rank] of Object.entries(QUALITY_RANK)) {
            if (text.includes(key)) return rank;
        }
        return 10;
    }

    // ─── 扫描策略 ────────────────────────────────────────────────────────────

    /** 从 <video> 标签提取源 */
    function scanVideoTags() {
        const result = [];
        document.querySelectorAll('video').forEach((video, vi) => {
            const title = document.title || `视频_${vi + 1}`;
            const poster = video.poster || '';

            // src 属性
            if (video.src && video.src.trim() !== '' && !video.src.startsWith('blob:')) {
                const res = { url: video.src, title, poster, quality: '', type: 'video', encrypted: false, encryptKey: '', segments: 0, duration: 0 };
                result.push(res);
                if (video.src.toLowerCase().includes('.m3u8')) setTimeout(() => parseM3u8Info(video.src, res), 0);
            }

            // <source> 子标签
            const sources = [];
            video.querySelectorAll('source').forEach(src => {
                if (src.src && !src.src.startsWith('blob:')) {
                    sources.push({ url: src.src, label: src.getAttribute('label') || '', type: src.type || 'video/mp4' });
                }
            });

            // 多源时选最高质量
            if (sources.length > 0) {
                const best = sources.sort((a, b) =>
                    getQualityRank(b.url, b.label) - getQualityRank(a.url, a.label)
                )[0];
                const res = { url: best.url, title, poster, quality: best.label, type: 'video', encrypted: false, encryptKey: '', segments: 0, duration: 0 };
                result.push(res);
                if (best.url.toLowerCase().includes('.m3u8')) setTimeout(() => parseM3u8Info(best.url, res), 0);
            }
        });
        return result;
    }

    /** 从页面 script / JSON 提取 m3u8 / mp4 链接 */
    function scanScriptContent() {
        const result = [];
        const pageText = document.documentElement.innerHTML;

        // 匹配常见视频格式 URL
        const patterns = [
            /["'](https?:\/\/[^"']+\.m3u8[^"']*)['"]/g,
            /["'](https?:\/\/[^"']+\.mp4[^"']*)['"]/g,
            /["'](https?:\/\/[^"']+\.flv[^"']*)['"]/g,
        ];

        const seen = new Set();
        patterns.forEach(pattern => {
            let match;
            while ((match = pattern.exec(pageText)) !== null) {
                const url = match[1];
                if (!seen.has(url)) {
                    seen.add(url);
                    const isM3u8 = url.toLowerCase().includes('.m3u8');
                    const res = {
                        url,
                        title: document.title || '视频',
                        poster: getPageCover(),
                        quality: detectQualityFromUrl(url),
                        type: 'video',
                        encrypted: false,
                        encryptKey: '',
                        segments: 0,
                        duration: 0
                    };
                    result.push(res);
                    if (isM3u8) {
                        // 异步解析加密信息
                        setTimeout(() => parseM3u8Info(url, res), 0);
                    }
                }
            }
        });

        return result;
    }

    /** 从 JSON-LD / meta / og 提取封面 */
    function getPageCover() {
        const og = document.querySelector('meta[property="og:image"]');
        if (og && og.content) return og.content;
        const twitter = document.querySelector('meta[name="twitter:image"]');
        if (twitter && twitter.content) return twitter.content;
        const jsonLd = document.querySelector('script[type="application/ld+json"]');
        if (jsonLd) {
            try {
                const data = JSON.parse(jsonLd.textContent);
                if (data.thumbnailUrl) return Array.isArray(data.thumbnailUrl) ? data.thumbnailUrl[0] : data.thumbnailUrl;
                if (data.image) return Array.isArray(data.image) ? data.image[0] : data.image;
            } catch (_) {}
        }
        return '';
    }

    function detectQualityFromUrl(url) {
        for (const key of Object.keys(QUALITY_RANK)) {
            if (url.toLowerCase().includes(key)) return key.toUpperCase();
        }
        return '';
    }

    /** 监听 XHR / fetch 网络请求（动态加载的视频） */
    function hookNetworkRequests() {
        // Hook XHR
        const OrigXHR = unsafeWindow.XMLHttpRequest;
        function HookedXHR() {
            const xhr = new OrigXHR();
            const origOpen = xhr.open.bind(xhr);
            xhr.open = function (method, url, ...rest) {
                checkAndAddUrl(url);
                return origOpen(method, url, ...rest);
            };
            return xhr;
        }
        HookedXHR.prototype = OrigXHR.prototype;
        unsafeWindow.XMLHttpRequest = HookedXHR;

        // Hook fetch
        const origFetch = unsafeWindow.fetch;
        unsafeWindow.fetch = function (input, ...rest) {
            const url = typeof input === 'string' ? input : (input && input.url);
            if (url) checkAndAddUrl(url);
            return origFetch.call(unsafeWindow, input, ...rest);
        };
    }

    function checkAndAddUrl(url) {
        if (!url || typeof url !== 'string') return;
        const lower = url.toLowerCase();
        // 忽略单独的 .ts 分片请求（它们是 m3u8 分片，不是独立视频）
        if (lower.match(/\.(mp4|flv)(\?|$)/)) {
            if (!foundResources.find(r => r.url === url)) {
                foundResources.push({
                    url,
                    title: document.title || '视频',
                    poster: getPageCover(),
                    quality: detectQualityFromUrl(url),
                    type: 'video',
                    source: 'network'
                });
                refreshPanel();
                log('动态捕获资源:', url);
            }
        } else if (lower.match(/\.m3u8(\?|$)/)) {
            if (!foundResources.find(r => r.url === url)) {
                const res = {
                    url,
                    title: document.title || '视频',
                    poster: getPageCover(),
                    quality: detectQualityFromUrl(url),
                    type: 'video',
                    source: 'network',
                    encrypted: false,
                    encryptKey: '',
                    segments: 0,
                    duration: 0
                };
                foundResources.push(res);
                refreshPanel();
                log('动态捕获 M3U8:', url);
                // 异步解析 m3u8 获取加密信息
                parseM3u8Info(url, res);
            }
        }
    }

    /** 异步获取并解析 M3U8，提取 AES-128 加密信息、分片数和时长 */
    function parseM3u8Info(m3u8Url, resObj) {
        GM_xmlhttpRequest({
            method: 'GET',
            url: m3u8Url,
            timeout: 8000,
            onload: (resp) => {
                const text = resp.responseText || '';
                let encrypted = false, encryptKey = '', segments = 0, duration = 0;

                text.split('\n').forEach(line => {
                    line = line.trim();
                    if (line.startsWith('#EXT-X-KEY')) {
                        if (/METHOD=AES-128/i.test(line)) {
                            encrypted = true;
                            const m = line.match(/URI="([^"]+)"/);
                            if (m) encryptKey = m[1];
                        }
                    } else if (line.startsWith('#EXTINF:')) {
                        const d = parseFloat(line.replace('#EXTINF:', '').replace(',', ''));
                        if (!isNaN(d)) { duration += d; segments++; }
                    }
                });

                resObj.encrypted  = encrypted;
                resObj.encryptKey = encryptKey;
                resObj.segments   = segments;
                resObj.duration   = Math.round(duration);
                log(`M3U8 解析完成: 加密=${encrypted}, 分片=${segments}, 时长≈${resObj.duration}s`);
                refreshPanel();
            },
            onerror: () => log('M3U8 解析失败:', m3u8Url)
        });
    }

    /** 格式化秒数为 mm:ss */
    function formatDuration(s) {
        if (!s) return '';
        const m = Math.floor(s / 60), sec = s % 60;
        return `${m}:${sec.toString().padStart(2, '0')}`;
    }

    // ─── 18comic.vip 漫画支持 ────────────────────────────────────────────────

    const JM_IMG_SELECTORS = [
        '.scramble-page img',
        'img.lazy_img',
        'img[data-original*="/media/photos/"]',
        'img[src*="/media/photos/"]',
        '[id^="image_"] img',
        '[id^="image-container-"] img',
        '#album_photo_list img',
        '.reading-content img',
        '.comic-page img',
    ];

    function isJMSite() {
        return /18comic\.(vip|app|fun|club|biz|org)/.test(location.hostname);
    }

    function getJMPageType() {
        if (/\/photo\//.test(location.pathname)) return 'photo';
        if (/\/album\//.test(location.pathname)) return 'album';
        return 'other';
    }

    function getImgSrc(img) {
        return img.getAttribute('data-original') ||
               img.getAttribute('data-src') ||
               img.getAttribute('data-lazy') ||
               img.getAttribute('data-url') ||
               (img.src && !img.src.startsWith('data:') && !/placeholder|blank|1x1|\.gif$/i.test(img.src) ? img.src : '') ||
               '';
    }

    function scanComicImages() {
        if (!isJMSite()) return null;
        const pageType = getJMPageType();
        const title = (document.querySelector('h1, .album-title, title')?.textContent || document.title)
            .replace(/[-|].*$/, '').trim();
        const cover = getPageCover();

        if (pageType === 'photo') {
            const seen = new Set();
            const images = [];
            JM_IMG_SELECTORS.forEach(sel => {
                try {
                    document.querySelectorAll(sel).forEach(img => {
                        const src = getImgSrc(img);
                        if (src && !seen.has(src) && /\.(jpe?g|png|webp)(\?|$)/i.test(src)) {
                            seen.add(src);
                            images.push({ url: src, index: images.length });
                        }
                    });
                } catch (_) {}
            });
            if (images.length === 0) return null;
            return {
                type: 'comic-chapter',
                title,
                poster: cover || images[0].url,
                url: location.href,
                images,
                imageCount: images.length,
            };
        }

        if (pageType === 'album' && cover) {
            return {
                type: 'comic-album',
                title,
                poster: cover,
                url: location.href,
                images: [{ url: cover, index: 0 }],
                imageCount: 1,
            };
        }
        return null;
    }

    async function downloadComicChapter(resource) {
        const { images, title } = resource;
        showStatus(`开始下载，共 ${images.length} 张...`);
        const bar = document.getElementById('wrjg-progress-bar');
        const wrap = document.getElementById('wrjg-progress-wrap');
        if (wrap) wrap.style.display = 'block';

        for (let i = 0; i < images.length; i++) {
            const img = images[i];
            const num = String(i + 1).padStart(3, '0');
            const ext = (img.url.split('?')[0].match(/\.(jpe?g|png|webp)$/i) || ['', 'jpg'])[1];
            const filename = `${sanitizeFilename(title)}_${num}.${ext}`;
            if (typeof GM_download !== 'undefined') {
                GM_download({ url: img.url, name: filename,
                    onerror: () => downloadFallback(img.url, filename) });
            } else {
                downloadFallback(img.url, filename);
            }
            const pct = Math.round((i + 1) / images.length * 100);
            if (bar) bar.style.width = pct + '%';
            showStatus(`下载进度: ${i + 1} / ${images.length}`);
            if (i < images.length - 1) await new Promise(r => setTimeout(r, 350));
        }
        if (wrap) wrap.style.display = 'none';
        showStatus(`✓ 全部 ${images.length} 张已触发下载`);
    }

    // ─── 主扫描函数 ──────────────────────────────────────────────────────────
    function scanAll() {
        const from_video  = scanVideoTags();
        const from_script = scanScriptContent();

        const all = [...from_video, ...from_script];
        const seen = new Set(foundResources.map(r => r.url));
        let added = 0;

        all.forEach(item => {
            if (!seen.has(item.url)) {
                seen.add(item.url);
                foundResources.push(item);
                added++;
            }
        });

        // 18comic.vip 漫画扫描
        if (isJMSite()) {
            comicResources = [];
            const cr = scanComicImages();
            if (cr) {
                comicResources.push(cr);
                log(`漫画扫描完成: ${cr.imageCount} 张图片`);
            }
        }

        log(`扫描完成，新增 ${added} 个视频，共 ${foundResources.length} 个视频 + ${comicResources.length} 个漫画资源`);
        return added;
    }

    // ─── 去重并按质量排序 ────────────────────────────────────────────────────
    function getBestResources() {
        const byTitle = {};
        foundResources.forEach(r => {
            const key = r.title;
            if (!byTitle[key]) {
                byTitle[key] = r;
            } else {
                if (getQualityRank(r.url, r.quality) > getQualityRank(byTitle[key].url, byTitle[key].quality)) {
                    byTitle[key] = r;
                }
            }
        });
        return Object.values(byTitle);
    }

    // ─── 威软 ffmpeg 在线工具跳转 ────────────────────────────────────────────
    /**
     * 打开威软 ffmpeg 在线工具，将 M3U8 URL 通过 ?url= 参数传递，
     * 工具页面读取该参数并自动填入 URL 输入框触发下载。
     * 同时复制 URL 到剪贴板作为后备方案。
     */
    function openFfmpegTool(resource) {
        const encoded = encodeURIComponent(resource.url);
        const toolUrl = `${FFMPEG_TOOL_URL}?url=${encoded}&autostart=1`;
        copyText(resource.url, 'M3U8 链接已复制，正在跳转工具...');
        window.open(toolUrl, '_blank', 'noopener');
        showStatus('已跳转到威软 ffmpeg 工具，如未自动填入请手动粘贴链接');
    }

    // ─── 下载函数 ────────────────────────────────────────────────────────────
    function downloadFile(url, filename, onProgress) {
        const ext = (url.split('?')[0].match(/\.(m3u8|mp4|flv|ts|jpg|jpeg|png|webp)$/i) || ['', 'mp4'])[1];
        const name = sanitizeFilename(filename) + '.' + ext;

        if (typeof GM_download !== 'undefined') {
            GM_download({
                url,
                name,
                onload: () => { log('下载完成:', name); if (onProgress) onProgress(100); },
                onerror: (err) => {
                    log('GM_download 失败，尝试 fallback:', err);
                    downloadFallback(url, name);
                },
                onprogress: (prog) => {
                    if (prog.total && onProgress) {
                        onProgress(Math.round(prog.loaded / prog.total * 100));
                    }
                }
            });
        } else {
            downloadFallback(url, name);
        }
    }

    function downloadFallback(url, filename) {
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.target = '_blank';
        a.rel = 'noopener';
        document.body.appendChild(a);
        a.click();
        setTimeout(() => a.remove(), 500);
    }

    function downloadVideo(resource) {
        const filename = sanitizeFilename(resource.title) + '_video';
        showStatus(`正在下载视频：${resource.title}`);
        downloadFile(resource.url, filename);
    }

    function downloadCover(resource) {
        if (!resource.poster) {
            showStatus('未找到视频封面');
            return;
        }
        const filename = sanitizeFilename(resource.title) + '_封面';
        showStatus(`正在下载封面：${resource.title}`);
        downloadFile(resource.poster, filename);
    }

    function downloadBoth(resource) {
        downloadVideo(resource);
        if (resource.poster) {
            setTimeout(() => downloadCover(resource), 800);
        }
    }

    // ─── 通用按钮构造 ────────────────────────────────────────────────────────
    function makeBtn(cls, label, handler) {
        const btn = document.createElement('button');
        btn.className = `wrjg-btn ${cls}`;
        btn.textContent = label;
        btn.addEventListener('click', function (e) {
            e.stopPropagation();
            e.preventDefault();
            handler();
        });
        return btn;
    }

    // ─── 面板 UI ─────────────────────────────────────────────────────────────
    function createPanel() {
        if (document.getElementById(PANEL_ID)) return;

        const panel = document.createElement('div');
        panel.id = PANEL_ID;
        panel.innerHTML = `
            <div class="wrjg-header">
                <div class="wrjg-header-title">
                    <span class="wrjg-header-icon">🎬</span>
                    <span>${SCRIPT_NAME}</span>
                </div>
                <button class="wrjg-scan-btn" id="wrjg-rescan">重新扫描</button>
            </div>
            <div class="wrjg-status" id="wrjg-status">就绪</div>
            <div class="wrjg-progress" id="wrjg-progress-wrap">
                <div class="wrjg-progress-bar" id="wrjg-progress-bar"></div>
            </div>
            <div class="wrjg-body" id="wrjg-body">
                <div class="wrjg-empty">点击"重新扫描"或等待自动检测</div>
            </div>
            <div class="wrjg-footer">
                ${SCRIPT_NAME} v1.5.0 · 仅供学习交流，请尊重版权
            </div>
        `;
        document.body.appendChild(panel);

        document.getElementById('wrjg-rescan').addEventListener('click', () => {
            showStatus('正在扫描...');
            setTimeout(() => {
                scanAll();
                refreshPanel();
                if (isJMSite()) {
                    const total = comicResources.reduce((s, r) => s + r.imageCount, 0);
                    showStatus(total > 0
                        ? `发现漫画图片 ${total} 张`
                        : '未发现图片，请等待页面加载完成');
                } else {
                    showStatus(foundResources.length > 0
                        ? `共发现 ${foundResources.length} 个视频资源`
                        : '未发现视频资源，请播放视频后重试');
                }
            }, 300);
        });
    }

    function createToggleButton() {
        if (document.getElementById(BTN_ID)) return;
        const btn = document.createElement('button');
        btn.id = BTN_ID;
        btn.textContent = isJMSite() ? '📚 漫画下载' : '🎬 视频下载';
        btn.addEventListener('click', togglePanel);
        document.body.appendChild(btn);
    }

    function togglePanel() {
        const panel = document.getElementById(PANEL_ID);
        if (!panel) return;
        panel.classList.toggle('visible');
        if (panel.classList.contains('visible')) {
            if (foundResources.length === 0 && comicResources.length === 0) {
                scanAll();
                refreshPanel();
                if (isJMSite()) {
                    const total = comicResources.reduce((s, r) => s + r.imageCount, 0);
                    showStatus(total > 0 ? `发现 ${total} 张漫画图片` : '等待图片加载...');
                } else {
                    showStatus(foundResources.length > 0 ? `发现 ${foundResources.length} 个视频资源` : '等待视频加载...');
                }
            }
        }
    }

    function showStatus(msg) {
        const el = document.getElementById('wrjg-status');
        if (el) el.textContent = msg;
    }

    function refreshPanel() {
        const body = document.getElementById('wrjg-body');
        if (!body) return;

        const best = getBestResources();

        // 清空旧内容
        while (body.firstChild) body.removeChild(body.firstChild);

        if (best.length === 0 && comicResources.length === 0) {
            const empty = document.createElement('div');
            empty.className = 'wrjg-empty';
            empty.textContent = isJMSite()
                ? '暂未发现图片，请等待页面加载完成后点击"重新扫描"'
                : '暂未发现视频资源，请先播放视频，或点击"重新扫描"';
            body.appendChild(empty);
            return;
        }

        // 用 createElement 构建 DOM，直接在闭包中捕获资源对象，彻底避免 innerHTML 和索引查找问题
        best.forEach((r) => {
            const ext = (r.url.split('?')[0].match(/\.(m3u8|mp4|flv|ts)$/i) || ['', ''])[1].toUpperCase();
            const fname = sanitizeFilename(r.title);
            const ffmpegCmd = `ffmpeg -i "${r.url}" -c copy "${fname}.mp4"`;

            // ── 容器 ──
            const item = document.createElement('div');
            item.className = 'wrjg-item';

            // ── 头部（缩略图 + 信息） ──
            const header = document.createElement('div');
            header.className = 'wrjg-item-header';

            if (r.poster) {
                const img = document.createElement('img');
                img.className = 'wrjg-thumb';
                img.src = r.poster;
                img.alt = '封面';
                img.addEventListener('error', () => { img.style.display = 'none'; });
                header.appendChild(img);
            } else {
                const ph = document.createElement('div');
                ph.className = 'wrjg-thumb-placeholder';
                ph.textContent = '🎬';
                header.appendChild(ph);
            }

            const info = document.createElement('div');
            info.className = 'wrjg-info';

            const titleEl = document.createElement('div');
            titleEl.className = 'wrjg-title';
            titleEl.textContent = r.title;
            titleEl.title = r.title;
            info.appendChild(titleEl);

            const meta = document.createElement('div');
            meta.className = 'wrjg-meta';
            if (r.quality) {
                const qb = document.createElement('span');
                qb.className = 'wrjg-quality-badge';
                qb.textContent = r.quality;
                meta.appendChild(qb);
            }
            if (ext) {
                const fmtEl = document.createElement('span');
                fmtEl.textContent = ext;
                meta.appendChild(fmtEl);
            }
            if (r.encrypted) {
                const eb = document.createElement('span');
                eb.className = 'wrjg-encrypt-badge';
                eb.textContent = '🔒 AES-128';
                meta.appendChild(eb);
            }
            if (r.segments > 0) {
                const si = document.createElement('span');
                si.className = 'wrjg-seg-info';
                si.textContent = `${r.segments}片${r.duration ? ' · ' + formatDuration(r.duration) : ''}`;
                meta.appendChild(si);
            }
            info.appendChild(meta);
            header.appendChild(info);
            item.appendChild(header);

            // ── ffmpeg 命令展示框（默认隐藏） ──
            const ffmpegBox = document.createElement('div');
            ffmpegBox.className = 'wrjg-ffmpeg-box';
            ffmpegBox.textContent = ffmpegCmd;
            item.appendChild(ffmpegBox);

            // ── 操作按钮区 ──
            const actions = document.createElement('div');
            actions.className = 'wrjg-actions';

            actions.appendChild(makeBtn('wrjg-btn-video', '⬇ 下载', () => downloadVideo(r)));

            if (ext === 'M3U8') {
                actions.appendChild(makeBtn('wrjg-btn-online', '🔧 在线下载', () => {
                    openFfmpegTool(r);
                }));
                actions.appendChild(makeBtn('wrjg-btn-ffmpeg', 'ffmpeg命令', () => {
                    ffmpegBox.classList.toggle('show');
                    if (ffmpegBox.classList.contains('show')) {
                        copyText(ffmpegCmd, 'ffmpeg 命令已复制');
                    }
                }));
            }

            if (r.poster) {
                actions.appendChild(makeBtn('wrjg-btn-cover', '⬇ 封面', () => downloadCover(r)));
                actions.appendChild(makeBtn('wrjg-btn-all', '⬇ 全部', () => downloadBoth(r)));
            }

            actions.appendChild(makeBtn('wrjg-btn-copy', '复制链接', () => copyText(r.url, '链接已复制到剪贴板')));

            item.appendChild(actions);
            body.appendChild(item);
        });

        // ── 18comic.vip 漫画资源 ──
        if (comicResources.length > 0) {
            if (best.length > 0) {
                const sep = document.createElement('div');
                sep.className = 'wrjg-section-title';
                sep.textContent = '── 漫画图片 ──';
                body.appendChild(sep);
            }
            comicResources.forEach(cr => {
                const item = document.createElement('div');
                item.className = 'wrjg-item';

                const header = document.createElement('div');
                header.className = 'wrjg-item-header';

                if (cr.poster) {
                    const img = document.createElement('img');
                    img.className = 'wrjg-thumb';
                    img.src = cr.poster;
                    img.alt = '封面';
                    img.addEventListener('error', () => { img.style.display = 'none'; });
                    header.appendChild(img);
                } else {
                    const ph = document.createElement('div');
                    ph.className = 'wrjg-thumb-placeholder';
                    ph.textContent = '📚';
                    header.appendChild(ph);
                }

                const info = document.createElement('div');
                info.className = 'wrjg-info';
                const titleEl = document.createElement('div');
                titleEl.className = 'wrjg-title';
                titleEl.textContent = cr.title;
                titleEl.title = cr.title;
                info.appendChild(titleEl);

                const meta = document.createElement('div');
                meta.className = 'wrjg-meta';
                const typeEl = document.createElement('span');
                typeEl.className = 'wrjg-quality-badge';
                typeEl.style.background = '#00b894';
                typeEl.textContent = cr.type === 'comic-chapter' ? `📖 ${cr.imageCount}张` : '📚 专辑';
                meta.appendChild(typeEl);
                info.appendChild(meta);
                header.appendChild(info);
                item.appendChild(header);

                const actions = document.createElement('div');
                actions.className = 'wrjg-actions';

                if (cr.type === 'comic-chapter') {
                    actions.appendChild(makeBtn('wrjg-btn-img-all', `⬇ 全章(${cr.imageCount}张)`, () => downloadComicChapter(cr)));
                }
                if (cr.poster) {
                    actions.appendChild(makeBtn('wrjg-btn-cover', '⬇ 封面', () => downloadFile(cr.poster, sanitizeFilename(cr.title) + '_封面')));
                }
                actions.appendChild(makeBtn('wrjg-btn-copy', '复制链接', () => copyText(cr.url, '链接已复制')));

                item.appendChild(actions);
                body.appendChild(item);
            });
        }
    }

    // ─── MutationObserver 监听动态内容 ──────────────────────────────────────
    function watchDOMChanges() {
        const panel = document.getElementById(PANEL_ID);
        const observer = new MutationObserver((mutations) => {
            // 忽略面板自身内部的 DOM 变化，避免 refreshPanel 触发 → observer 触发 → 死循环
            const outsideChange = mutations.some(m =>
                !panel || (!panel.contains(m.target) && m.target !== panel)
            );
            if (!outsideChange) return;

            let changed = false;
            if (isJMSite()) {
                const cr = scanComicImages();
                if (cr && cr.imageCount > (comicResources[0]?.imageCount || 0)) {
                    comicResources = [cr];
                    changed = true;
                }
            } else {
                const newItems = scanVideoTags();
                newItems.forEach(item => {
                    if (!foundResources.find(r => r.url === item.url)) {
                        foundResources.push(item);
                        changed = true;
                    }
                });
            }
            if (changed) {
                refreshPanel();
                if (isJMSite()) {
                    const total = comicResources.reduce((s, r) => s + r.imageCount, 0);
                    showStatus(`自动发现图片，共 ${total} 张`);
                } else {
                    showStatus(`自动发现新资源，共 ${foundResources.length} 个`);
                }
            }
        });
        observer.observe(document.body, { childList: true, subtree: true });
    }

    // ─── 初始化 ──────────────────────────────────────────────────────────────
    function init() {
        log('初始化中...');

        // 尝试 hook 网络请求（需要 @grant none 或 unsafeWindow）
        try { hookNetworkRequests(); } catch (e) { log('网络请求 hook 不可用:', e.message); }

        createPanel();
        createToggleButton();
        watchDOMChanges();

        // 延迟首次扫描，等待页面元素加载
        setTimeout(() => {
            scanAll();
            if (isJMSite()) {
                const total = comicResources.reduce((s, r) => s + r.imageCount, 0);
                if (total > 0) {
                    refreshPanel();
                    showStatus(`已发现 ${total} 张漫画图片`);
                }
            } else if (foundResources.length > 0) {
                refreshPanel();
                showStatus(`已发现 ${foundResources.length} 个视频资源`);
            }
        }, 2000);

        log('初始化完成');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
