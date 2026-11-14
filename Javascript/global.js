/**
 * 讀取並解析 INI 檔案
 * @param {string} filePath - INI 檔案的路徑
 * @returns {Promise<Object>} - 回傳解析後的物件
 */
export async function getIni(filePath) {
	try {
		// 加入時間戳避免瀏覽器快取舊的設定
		const response = await fetch(filePath + '?t=' + Date.now());
		if (!response.ok) throw new Error(`找不到檔案: ${filePath}`);
		
		const text = await response.text();
		const config = {};
		const lines = text.split(/\r?\n/);

		lines.forEach(line => {
			line = line.trim();
			if (!line || line.startsWith(';') || line.startsWith('#')) return;
			const index = line.indexOf('=');
			if (index !== -1) {
				const key = line.substring(0, index).trim();
				const value = line.substring(index + 1).trim();
				config[key] = value;
			}
		});
		return config;
	} catch (e) {
		console.error("INI Error:", e);
		return null;
	}
}
export function initMenu(menuData) {
    const menuContent = document.getElementById('menuContent');
    if (!menuContent) return;
    const items = menuData.split('|');
    menuContent.innerHTML = ''; 
    items.forEach(item => {
        const parts = item.split(',');
        if (parts.length >= 3) {
            const [text, link, icon] = parts;
            const a = document.createElement('a');
            a.href = link;
            a.className = 'menu-item';
            a.innerHTML = `<span class="icon">${icon}</span> <span class="text">${text}</span>`;
            menuContent.appendChild(a);
        }
    });
}
window.toggleMenu = function() {
    const menu = document.getElementById('menuContainer');
    if (menu) menu.classList.toggle('show-menu');
};
/**
 * 自動偵測 Header 高度並同步到 CSS 變數
 * 解決固定導覽列遮擋錨點標題的問題
 */
export function syncHeaderHeight() {
    const header = document.querySelector('header');
    if (header) {
        const height = header.offsetHeight;
        // 將高度動態寫入根元素的 CSS 變數 --header-h
        document.documentElement.style.setProperty('--header-h', height + 'px');
    }
}

// 初始化監聽器：確保在全站生效
export function initGlobalHeader() {
    // 1. 頁面完全載入後計算一次
    window.addEventListener('load', syncHeaderHeight);
    // 2. 視窗縮放時重新計算 (處理手機/電腦版切換)
    window.addEventListener('resize', syncHeaderHeight);
    // 3. 如果 Logo 是圖片，圖片載入完畢後再算一次最精準
    document.querySelector('.logo img')?.addEventListener('load', syncHeaderHeight);
    
    // 執行第一次計算
    syncHeaderHeight();
}

/**
 * 讀取遠端版本戳（每次後台同步 JSON 時更新，僅數百 bytes）
 * 格式：{ posts: { updatedAt, count }, services: { updatedAt, count } }
 * 回傳正規化字串，抓不到回 null
 */
/**
 * 依 PostID + 發佈日期產生文章唯一 ID（前後台共用）
 */
export function getCombinedId(post) {
	const pid = (post && post["PostID"] != null) ? String(post["PostID"]) : "0";
	let d = null;
	if (post) {
		const raw = post["發佈日期"];
		d = (typeof raw === 'number') ? new Date((raw - 25569) * 86400 * 1000) : new Date(raw);
	}
	if (!d || isNaN(d.getTime())) return `${pid}_00000000000000`;
	const pad = (n) => String(n).padStart(2, '0');
	return `${pid}_${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

/**
 * 格式化發佈日期（前後台共用）
 */
export function formatDate(raw) {
	if (!raw && raw !== 0) return "無日期";
	let d = (typeof raw === 'number') ? new Date((raw - 25569) * 86400 * 1000) : new Date(raw);
	if (isNaN(d.getTime())) return raw;
	const pad = (n) => String(n).padStart(2, '0');
	return `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/**
 * 將文字中的網址轉為可點擊連結（自動跳脫 HTML）
 */
export function linkify(text) {
	if (text == null) return '';
	const escaped = String(text)
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;');
	const urlRegex = /(https?:\/\/[^\s<]+)/g;
	return escaped.replace(urlRegex, (url) => {
		const safe = url.replace(/"/g, '&quot;');
		return `<a href="${safe}" target="_blank" rel="noopener noreferrer">${url}</a>`;
	});
}

export async function getRemoteVersion() {
    try {
        const r = await fetch(`/Data/postFB.version.json?t=${Date.now()}`, { cache: 'no-store' });
        if (!r.ok) return null;
        return JSON.stringify(await r.json());
    } catch (e) { return null; }
}

export function clearFrontendCache() {
    ['cached_novel_data', 'data_ver', 'cache_notices', 'cache_notices_v2', 'cache_services'].forEach(k => { try { localStorage.removeItem(k); } catch (e) {} });
}

// ---------- 全站分析追蹤 ----------
const ANALYTICS_FALLBACK_URL = 'https://ocqycgcatxdbpffpxdva.supabase.co';
const ANALYTICS_FALLBACK_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9jcXljZ2NhdHhkYnBmZnB4ZHZhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTE0NjcxODksImV4cCI6MjEwNzA0MzE4OX0.ZmE5XI1LZdnZ3LagFDhcqaLqh-u3T8dtIFyBTHYzDOw';
let _analyticsClient = null;

async function _getAnalyticsClient() {
	if (_analyticsClient) return _analyticsClient;
	const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm');
	let url = ANALYTICS_FALLBACK_URL;
	let key = ANALYTICS_FALLBACK_ANON;
	try {
		const cfg = await getIni('/settings/global.ini');
		if (cfg?.SUPABASE_URL) url = cfg.SUPABASE_URL;
		if (cfg?.SUPABASE_ANON_KEY) key = cfg.SUPABASE_ANON_KEY;
	} catch (e) {}
	_analyticsClient = createClient(url, key);
	return _analyticsClient;
}

function _getSessionId() {
	if (typeof sessionStorage === 'undefined') return null;
	let sid = sessionStorage.getItem('analytics_session_id');
	if (!sid) {
		sid = (crypto?.randomUUID?.() || Math.random().toString(36).slice(2)) + '_' + Date.now();
		sessionStorage.setItem('analytics_session_id', sid);
	}
	return sid;
}

function _fullPageUrl() {
	return (typeof window !== 'undefined') ? (window.location.pathname + window.location.search) : '';
}

export async function trackEvent(eventName, stayTime = 0, pageUrl = _fullPageUrl()) {
	if (typeof window === 'undefined') return;
	if (window.location.pathname.startsWith('/login/')) return; // 不追蹤後台
	try {
		const sb = await _getAnalyticsClient();
		const payload = {
			event_name: eventName,
			stay_time_seconds: stayTime,
			page_url: pageUrl || (window.location.pathname + window.location.search)
		};

		// session id（同一個分頁同一個）
		payload.session_id = _getSessionId();

		// 地理座標：每個瀏覽器分頁只抓一次
		const geoCache = sessionStorage.getItem('user_geo_cache');
		if (geoCache) {
			try {
				const g = JSON.parse(geoCache);
				payload.city = g.city || null;
				payload.region = g.region || null;
				payload.country_name = g.country_name || null;
				payload.latitude = g.latitude || null;
				payload.longitude = g.longitude || null;
			} catch (e) {}
		} else {
			try {
				const r = await fetch('https://ipapi.co/json/', { cache: 'no-store' });
				const g = await r.json().catch(() => ({}));
				sessionStorage.setItem('user_geo_cache', JSON.stringify(g));
				payload.city = g.city || null;
				payload.region = g.region || null;
				payload.country_name = g.country_name || null;
				payload.latitude = g.latitude || null;
				payload.longitude = g.longitude || null;
			} catch (e) { console.warn('IP 服務讀取失敗:', e); }
		}

		const { error } = await sb.from('user_events').insert([payload]);
		if (error) console.warn('Analytics 寫入失敗:', error);
	} catch (e) {
		console.warn('Analytics 失敗:', e);
	}
}

export function initAnalytics() {
	if (typeof window === 'undefined') return;
	if (window.location.pathname.startsWith('/login/')) return;

	const fullUrl = _fullPageUrl();
	// 同一個分頁同一篇文章只計一次 Page_View
	const viewKey = 'analytics_viewed_' + btoa(unescape(encodeURIComponent(fullUrl))).slice(0, 80);
	if (!sessionStorage.getItem(viewKey)) {
		sessionStorage.setItem(viewKey, '1');
		trackEvent('Page_View', 0, fullUrl);
	}

	let startTime = Date.now();
	window.addEventListener('beforeunload', () => {
		const stayTime = Math.floor((Date.now() - startTime) / 1000);
		trackEvent('Page_Leave', stayTime, fullUrl);
	});
}

// 自動追蹤（打開任意公開頁面時都會執行）
if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login/')) {
	initAnalytics();
}
