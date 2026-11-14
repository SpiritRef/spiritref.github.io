// 共用：靜態頁產生器（文章 + 彙典）
// 與 /ghoststory/article/ 動態頁面輸出結構/樣式一致，但資料已內嵌。
// 注意：此檔被後台（存檔時自動增量產生靜態頁）與全量重產使用，修改時請確保兩邊一致。

export const SITE_BASE = 'https://spiritref.github.io';

export function serviceDir(id) {
	const s = String(id || '');
	if (s.startsWith('Ability_')) return 'services/ability';
	if (s.startsWith('Vision_')) return 'services/vision';
	return 'services/compendium';
}

export function serviceDetailPath(id) {
	return `${serviceDir(id)}/${encodeURIComponent(String(id))}.html`;
}

// ---- helpers（與 global.js 行為一致，需保持同步）----
export function escapeHtml(s) {
	return String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function linkify(text) {
	if (text == null) return '';
	const escaped = escapeHtml(String(text));
	const urlRegex = /(https?:\/\/[^\s<]+)/g;
	return escaped.replace(urlRegex, (url) => {
		const safe = url.replace(/"/g, '&quot;');
		return `<a href="${safe}" target="_blank" rel="noopener noreferrer">${url}</a>`;
	});
}

export function getCombinedId(post) {
	const pid = (post && post['PostID'] != null) ? String(post['PostID']) : '0';
	const raw = post && post['發佈日期'];
	const d = (typeof raw === 'number') ? new Date((raw - 25569) * 86400 * 1000) : new Date(raw);
	if (!d || isNaN(d.getTime())) return `${pid}_00000000000000`;
	const pad = (n) => String(n).padStart(2, '0');
	return `${pid}_${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

export function formatDate(raw) {
	const d = (typeof raw === 'number') ? new Date((raw - 25569) * 86400 * 1000) : new Date(raw);
	if (!d || isNaN(d.getTime())) return raw ?? '無日期';
	const pad = (n) => String(n).padStart(2, '0');
	return `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function isPublished(post) {
	const raw = post && post['發佈日期'];
	const d = (typeof raw === 'number') ? new Date((raw - 25569) * 86400 * 1000)
		: new Date(String(raw).replace(/\//g, '-').replace(' ', 'T'));
	if (isNaN(d.getTime())) return true;
	return d.getTime() <= Date.now();
}

function plainText(raw) {
	return String(raw == null ? '' : raw).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}
function descOf(raw) {
	const plain = plainText(raw);
	return (plain.length > 150 ? plain.slice(0, 150) + '…' : plain);
}

function absoluteImg(src) {
	const s = String(src || '').trim();
	if (!s) return null;
	if (/^https?:\/\//i.test(s)) return s;
	return `${SITE_BASE}/ghoststory/${s.replace(/^\.\//, '').replace(/^\//, '')}`;
}

const ARTICLE_STYLE = `:root {
    --bg-main: #f0f2f5; --bg-card: #ffffff; --text-title: #1c1e21; --text-body: #333333;
    --text-date: #65676b; --border-color: #eeeeee; --base-size: 1.1rem;
}
body.dark-mode { --bg-main: #18191a; --bg-card: #1e1e1e; --text-title: #f5f5f5; --text-body: #e0e0e0; --text-date: #a0a0a0; --border-color: #333333; }
body { background: var(--bg-main); color: var(--text-body); transition: background 0.3s, color 0.3s; margin: 0; padding: 0; overflow-x: hidden; }
.article-container { background: var(--bg-card); border-radius: 12px; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15); width: 95%; max-width: 800px; margin: 20px auto 120px auto; padding: 20px; box-sizing: border-box; transition: background 0.3s, box-shadow 0.3s; }
h1#art-title { font-size: 1.5rem; line-height: 1.4; color: var(--text-title); margin: 15px 0; }
.post-date { color: var(--text-date); font-size: 0.85rem; margin-top: 15px; line-height: 1.4; }
.full-content { font-size: var(--base-size); color: var(--text-body); line-height: 1.8; white-space: pre-wrap; word-wrap: break-word; margin-top: 20px; }
.top-controls { display: flex; align-items: center; gap: 10px; margin: 0; flex-wrap: wrap; }
.btn-ui { padding: 6px 12px; border: 1px solid var(--border-color); background: var(--bg-main); color: var(--text-body); border-radius: 6px; cursor: pointer; font-size: 0.9rem; transition: all 0.2s; }
.full-img { width: 100%; max-width: 100%; height: auto; display: block; margin: 20px auto; border-radius: 8px; }
@media (max-width: 600px) { .article-container { width: 100%; margin-top: 0; border-radius: 0; padding: 15px; } h1#art-title { font-size: 1.3rem; } }`;

const ARTICLE_BODY_REGION = () => `<div class="expandable-menu-container" id="menuContainer">
    <div class="menu-content" id="menuContent"></div>
    <button class="floating-service-btn" id="serviceBtn" onclick="toggleMenu()">
        <span id="serviceIcon">
        <svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
            <line x1="3" y1="12" x2="21" y2="12"></line>
            <line x1="3" y1="6" x2="21" y2="6"></line>
            <line x1="3" y1="18" x2="21" y2="18"></line>
        </svg>
    </span>
        <span id="serviceText">選單</span>
    </button>
</div>

<div class="container article-container">
	<div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px;">
        <a href="/ghoststory/" class="back-home">&#x2190;&#xFE0E; 紀實首頁</a>
        <div class="top-controls">
            <button class="back-home" onclick="changeFS(0.1)">A+</button>
            <button class="back-home" onclick="changeFS(-0.1)">A-</button>
            <button id="darkBtn" class="back-home" onclick="toggleDark()">🌙 深色</button>
        </div>
    </div>`;

const ARTICLE_INTERACT = `<script type="module">
    import { getIni } from '/Javascript/global.js?v=20261031';
    window.toggleMenu = function() {
        const menu = document.getElementById('menuContainer');
        if (menu) menu.classList.toggle('show-menu');
    };
    function renderMenu(menuData) {
        const menuContent = document.getElementById('menuContent');
        if (!menuContent) return;
        menuContent.innerHTML = '';
        menuData.split('|').forEach(item => {
            const parts = item.split(',');
            if (parts.length >= 3) {
                const [text, link, icon] = parts;
                const a = document.createElement('a');
                a.href = link;
                a.className = 'menu-item';
                a.innerHTML = '<span class="icon">' + icon + '</span> <span class="text">' + text + '</span>';
                menuContent.appendChild(a);
            }
        });
    }
    window.toggleDark = () => {
        const isDark = document.body.classList.toggle('dark-mode');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
        updateBtnText(isDark);
    };
    function updateBtnText(isDark) {
        const btn = document.getElementById('darkBtn');
        if (btn) btn.innerText = isDark ? '☀️ 淺色' : '🌙 深色';
    }
    let currentFS = parseFloat(localStorage.getItem('fontSize')) || 1.1;
    window.changeFS = (delta) => {
        currentFS = Math.min(Math.max(currentFS + delta, 0.8), 2.0);
        document.documentElement.style.setProperty('--base-size', currentFS + 'rem');
        localStorage.setItem('fontSize', currentFS);
    };
    function applySettings() {
        if (localStorage.getItem('theme') === 'dark') {
            document.body.classList.add('dark-mode');
            updateBtnText(true);
        }
        document.documentElement.style.setProperty('--base-size', currentFS + 'rem');
    }
    window.addEventListener('DOMContentLoaded', () => {
        applySettings();
        const from = new URLSearchParams(window.location.search).get('from');
        const back = document.querySelector('.article-container .back-home');
        if (from === 'notices' && back) { back.href = '/services/notices/'; back.innerHTML = '← 返回公告記錄'; }
        else if (from === 'compendium' && back) { back.href = '/services/compendium/'; back.innerHTML = '← 超自然現象彙典'; }
        getIni('/settings/global.ini').then(config => {
            if (config && config.MENU_DATA) renderMenu(config.MENU_DATA);
        }).catch(() => {});
    });
</script>`;

const ARTICLE_FOOTER = `<footer>\n    <p>&copy; 2026 鬼磕頭日誌 | 靈界紀實. All Rights Reserved.</p>\n</footer>`;

function articleHead({ title, desc, pageUrl, ogType, imgUrl }) {
	const t = escapeHtml(title);
	const d = escapeHtml(desc);
	const img = escapeHtml(imgUrl);
	return `<!DOCTYPE html>
<html lang="zh-TW">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>${t} | 鬼磕頭日誌</title>
	<meta name="description" content="${d}">
    <link rel="icon" href="https://spiritref.github.io/GhostKowtow.ico" type="image/x-icon">
    <link rel="shortcut icon" href="https://spiritref.github.io/GhostKowtow.ico" type="image/x-icon">
    <link rel="apple-touch-icon" href="https://spiritref.github.io/GhostKowtow.jpg">
    <meta property="og:title" content="${t} | 鬼磕頭日誌">
    <meta property="og:description" content="${d}">
    <meta property="og:image" content="${img}">
    <meta property="og:url" content="${pageUrl}">
    <meta property="og:type" content="${ogType}">
	<meta property="og:site_name" content="鬼磕頭日誌 | 靈界紀實">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${t} | 鬼磕頭日誌">
    <meta name="twitter:description" content="${d}">
    <meta name="twitter:image" content="${img}">
    <link rel="canonical" href="${pageUrl}">

	<link rel="stylesheet" href="/CSS/global.css?v=20261011">
    <link rel="stylesheet" href="/ghoststory/CSS/postFB.css?v=20261011">`;
}

function articleBodyOpen(title, dateStr) {
	const t = escapeHtml(title);
	const d = escapeHtml(dateStr);
	return `
    <div id="art-date" class="post-date">${d}</div>
    <h1 id="art-title">${t}</h1>
    <hr style="border: 0; border-top: 1px solid #eee;">`;
}

export function buildArticleHtml(post) {
	if (!post || !post['PostID']) return null;
	if (!isPublished(post)) return null;

	const id = getCombinedId(post);
	const title = String(post['標題'] || '鬼磕頭日誌');
	const desc = descOf(post['貼文內容']) || '穿梭陰陽，紀錄最真實的靈界對話。';
	const pageUrl = `${SITE_BASE}/ghoststory/article/${encodeURIComponent(id)}.html`;
	const imgData = String(post['圖片網址'] || post['圖片'] || '');
	const imgs = imgData.split(/\r?\n|\|/).map(s => s.trim()).filter(Boolean);
	const firstImg = absoluteImg(imgs[0]) || `${SITE_BASE}/GhostKowtow.jpg`;
	const imgTags = imgs.map(src => `<img src="${escapeHtml(absoluteImg(src))}" class="full-img" alt="${escapeHtml(title)}" loading="lazy">`).join('');

	return `${articleHead({ title, desc, pageUrl, ogType: 'article', imgUrl: firstImg })}
    <style>
${ARTICLE_STYLE}
    </style>
</head>
<body>
${ARTICLE_BODY_REGION()}
${articleBodyOpen(title, formatDate(post['發佈日期']))}
    <div id="art-images">${imgTags}</div>
    <div id="art-body" class="full-content">${linkify(post['貼文內容'] || '')}</div>
</div>

${ARTICLE_FOOTER}
${ARTICLE_INTERACT}
</body>
</html>
`;
}

// ---- 彙典靜態頁 ----
export function buildCompendiumHtml(item) {
	if (!item) return null;
	if (!isPublished(item)) return null;
	const id = String(item['ID'] ?? item['標題'] ?? '').trim();
	if (!id) return null;

	const title = String(item['標題'] || '超自然現象彙典');
	const raw = String(item['貼文內容'] || item['內容'] || '');
	const desc = descOf(raw) || '超自然現象彙典彙整各種真實靈界紀實案例。';
	const pageUrl = `${SITE_BASE}/${serviceDetailPath(id)}`;
	const imgUrl = `${SITE_BASE}/GhostKowtow.jpg`;
	const body = linkify(raw || '暫無內容');

	const posturl = item['連結'] || item['貼文連結'] || '';
	let urlArray = [];
	if (Array.isArray(posturl)) urlArray = posturl;
	else if (typeof posturl === 'string' && posturl.trim() !== '') urlArray = posturl.split(/[\s,\n]+/).filter(u => u.trim() !== '');

	let linksHtml = '';
	if (urlArray.length > 0) {
		const isImages = urlArray.every(u => /\.(jpg|jpeg|png|webp|gif|svg)(\?.*)?$/i.test(u) || u.startsWith('pic/') || u.startsWith('ghoststory/pic/'));
		if (isImages) {
			linksHtml = '<div class="compendium-links"><span>相關圖片：</span>' + urlArray.map(u => {
				const src = String(u).trim();
				const path = /^(https?:)?\/\//.test(src) ? src : (src.startsWith('pic/') ? '/ghoststory/' + src : (src.startsWith('ghoststory/pic/') ? '/' + src : src));
				return `<img src="${escapeHtml(path)}" style="max-width:100%; border-radius:8px; margin:6px 0; display:block;" loading="lazy" onerror="this.style.display='none'">`;
			}).join('') + '</div>';
		} else {
			linksHtml = '<div class="compendium-links"><span>相關文章：</span>' + urlArray.map(u => {
				const url = String(u).trim();
				const m = url.match(/\/ghoststory\/article\/\?id=([^&\s]+)/i);
				const href = m
					? '/ghoststory/article/' + m[1] + '.html?from=compendium'
					: (/ghoststory\/article\//.test(url) ? url + (url.includes('?') ? '&' : '?') + 'from=compendium' : url);
				return `<a href="${escapeHtml(href)}" target="_blank" rel="noopener noreferrer">篇章蟲洞</a>`;
			}).join('') + '</div>';
		}
	}

	const back = id.startsWith('Ability_')
		? { href: '/services/#services', text: '專業服務' }
		: id.startsWith('Vision_')
			? { href: '/services/#visual-records', text: '視覺紀錄' }
			: { href: '/services/compendium/', text: '超自然現象彙典' };

	return `<!DOCTYPE html>
<html lang="zh-Hant">
<head>
    <meta charset="UTF-8">
    <title>${escapeHtml(title + ' | 鬼磕頭')}</title>
    <meta name="description" content="${escapeHtml(desc)}">
    <link rel="icon" href="https://spiritref.github.io/GhostKowtow.ico" type="image/x-icon">
    <link rel="shortcut icon" href="https://spiritref.github.io/GhostKowtow.ico" type="image/x-icon">
    <link rel="apple-touch-icon" href="https://spiritref.github.io/GhostKowtow.jpg">
    <meta property="og:title" content="${escapeHtml(title + ' | 超自然現象彙典')}">
    <meta property="og:description" content="${escapeHtml(desc)}">
    <meta property="og:image" content="${escapeHtml(imgUrl)}">
    <meta property="og:url" content="${pageUrl}">
    <meta property="og:type" content="article">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${escapeHtml(title + ' | 超自然現象彙典')}">
    <meta name="twitter:description" content="${escapeHtml(desc)}">
    <meta name="twitter:image" content="${escapeHtml(imgUrl)}">
    <link rel="canonical" href="${pageUrl}">
    <link rel="stylesheet" href="https://spiritref.github.io/CSS/global.css">
    <link rel="stylesheet" href="../CSS/Services.css?v=20261011">
    <link rel="stylesheet" href="../CSS/cloud.css?v=20261011">
    <style>
        body { font-family: "PingFang TC", "Microsoft JhengHei", sans-serif; background: #f8f9fa; padding: 20px; color: #333; line-height: 1.8; }
        .list-container { max-width: 850px; margin: auto; background: rgba(216, 213, 208, 0.55); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); padding: 20px; border-radius: 12px; box-shadow: 0 8px 24px rgba(0,0,0,0.04); border: 1px solid #eaeaea; color: #333333; }
        h1 { text-align: center; color: #1a1a1a; font-size: 2.2em; font-weight: 900; margin: 0 0 10px; letter-spacing: 2px; border-bottom: 2px solid #f0f0f0; padding-bottom: 15px; }
        .detail-title { text-align: center; color: #1a1a1a; font-size: 1.6em; font-weight: 900; margin: 0 0 10px; line-height: 1.4; border-bottom: 2px solid #f0f0f0; padding-bottom: 12px; }
        .compendium-a { color: #5c4332; padding-left: 20px; font-weight: 600; white-space: pre-line; line-height: 1.6; }
        .notice-item { padding: 12px; margin-bottom: 8px; background: linear-gradient(135deg, rgba(247,235,215,0.68) 0%, rgba(230,211,175,0.68) 100%); backdrop-filter: blur(8px); -webkit-backdrop-filter: blur(8px); border: 1px solid #dcbfa2; border-left: 5px solid #8b7355; border-radius: 8px; color: #3e2723; box-shadow: 0 4px 10px rgba(0,0,0,0.05); transition: box-shadow 0.3s, transform 0.3s; height: auto; min-height: 0; }
        .compendium-links { margin-top: 4px; padding-top: 4px; border-top: 1px dashed #2a2a2d; font-size: 0.9rem; color: #88888d; display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
        .compendium-links a { display: inline-flex; align-items: center; justify-content: center; text-decoration: none; background: rgba(28, 30, 33, 0.95); border: 1px solid #ffc107; color: #ffc107; height: 32px; padding: 0px 14px; font-size: 0.9rem; border-radius: 8px; margin-top: 8px; transition: all 0.3s ease; box-shadow: 0 4px 12px rgba(0,0,0,0.2); box-sizing: border-box; cursor: pointer; font-family: inherit; line-height: 1; }
        .compendium-links a:hover { background: #000000; color: #ffc107; transform: scale(1.05); }
        @media (max-width: 720px) {
            body { padding: 10px; }
            .list-container { max-width: 100%; width: 100%; padding: 14px; margin: 0 auto; box-sizing: border-box; border-radius: 10px; }
            .detail-title { font-size: 1.25em; line-height: 1.3; letter-spacing: 1px; padding-bottom: 10px; }
            h1 { font-size: 1.45em; letter-spacing: 1px; padding-bottom: 10px; }
            .compendium-a { padding-left: 0; font-size: 0.95rem; }
            .notice-item { padding: 10px; }
            .compendium-links { gap: 6px; font-size: 0.85rem; }
            .compendium-links a { font-size: 0.82rem; padding: 0 12px; height: 30px; }
            .back-home { height: 32px; font-size: 0.85rem; }
        }
    </style>
</head>
<body class="cloud-bg">
<div id="cloud-container"></div>
<div class="expandable-menu-container" id="menuContainer">
    <div class="menu-content" id="menuContent"></div>
    <button class="floating-service-btn" id="serviceBtn" onclick="toggleMenu()">
        <span id="serviceIcon">
            <svg width="25" height="25" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
                <line x1="3" y1="12" x2="21" y2="12"></line>
                <line x1="3" y1="6" x2="21" y2="6"></line>
                <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
        </span>
        <span id="serviceText">選單</span>
    </button>
</div>
<div class="list-container">
    <a href="${escapeHtml(back.href)}" class="back-home" style="margin-bottom:12px;">&#x2190;&#xFE0E; ${escapeHtml(back.text)}</a>
    <h1 class="detail-title" style="margin-top:12px;">${escapeHtml(title)}</h1>
    <div class="notice-item">
        <div class="compendium-a"><div class="compendium-answer-text"><div>${body}</div>${linksHtml}</div></div>
    </div>
</div>
<footer>
    <p>&copy; 2026 鬼磕頭. All Rights Reserved.</p>
</footer>
<script type="module">
    import { getIni, initMenu } from '/Javascript/global.js?v=20261104';
    window.toggleMenu = function() {
        const menu = document.getElementById('menuContainer');
        if (menu) menu.classList.toggle('show-menu');
    };
    window.addEventListener('DOMContentLoaded', () => {
        getIni('/settings/global.ini').then(config => {
            if (config && config.MENU_DATA && typeof initMenu === 'function') initMenu(config.MENU_DATA);
        }).catch(() => {});
    });
</script>
<script src="../Javascript/cloud.js?v=20261012"></script>
</body>
</html>
`;
}
