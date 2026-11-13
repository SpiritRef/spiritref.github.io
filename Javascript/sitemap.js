// 共用：產生 sitemap.xml 內容（與 Tool/generate-sitemap.ps1 邏輯一致）
export function buildSitemapXml(posts, services) {
	const base = 'https://spiritref.github.io';
	const today = new Date().toISOString().slice(0, 10);
	const entries = [];
	const staticPages = [
		{ loc: `${base}/services/`, lastmod: today },
		{ loc: `${base}/services/compendium/`, lastmod: today },
		{ loc: `${base}/services/notices/`, lastmod: today },
		{ loc: `${base}/services/consult.html`, lastmod: today },
		{ loc: `${base}/ghoststory/`, lastmod: today },
		{ loc: `${base}/`, lastmod: today }
	];
	for (const s of staticPages) entries.push(s);

	// 從 post/service 物件推估發佈日期：先讀「發佈日期」，再掃描其他屬性（字串日期或 Excel 序號）
	const parseDate = (obj) => {
		const tryField = (v) => {
			if (v == null) return null;
			if (typeof v === 'number') {
				if (v > 40000 && v < 60000) return new Date((v - 25569) * 86400 * 1000);
				return null;
			}
			const s = String(v);
			if (/^\d{4}[/-]\d{2}[/-]\d{2}/.test(s)) {
				const d = new Date(s);
				return isNaN(d.getTime()) ? null : d;
			}
			return null;
		};
		const direct = tryField(obj && obj['發佈日期']);
		if (direct) return direct;
		for (const k of Object.keys(obj || {})) {
			const d = tryField(obj[k]);
			if (d) return d;
		}
		return null;
	};

	// 文章頁（未發佈＝未來日期的先不收）
	if (Array.isArray(posts)) {
		for (const post of posts) {
			const pid = post && post['PostID'] != null ? String(post['PostID']) : '0';
			const d = parseDate(post);
			if (d && d.getTime() > Date.now()) continue;
			const pad = (n) => String(n).padStart(2, '0');
			let ts = '00000000000000';
			let lastmod = today;
			if (d && !isNaN(d.getTime())) {
				ts = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
				lastmod = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
			}
			const combined = `${pid}_${ts}`;
			entries.push({ loc: `${base}/ghoststory/article/?id=${combined}`, lastmod });
		}
	}

	// Compendium 個別頁面（以 Services.json 的發佈日期作為 lastmod）
	if (Array.isArray(services)) {
		for (const svc of services) {
			const cat = svc ? (svc['分類'] != null ? String(svc['分類']) : (function(){const ks=Object.keys(svc);return ks.length? (svc[ks[0]] || '') : '';}())) : '';
			if (String(cat).indexOf('彙') === -1) continue;
			const title = svc && svc['標題'] != null ? String(svc['標題']) : ((function(){const ks=Object.keys(svc);return ks.length>1 ? (svc[ks[1]] || '') : '';}()) || '');
			if (!title) continue;
			const compendiumId = (svc && svc['ID'] != null) ? svc['ID'] : title;
			const d = parseDate(svc);
			const pad = (n) => String(n).padStart(2, '0');
			const lastmod = d ? `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` : undefined;
			entries.push({ loc: `${base}/services/compendium/detail.html?id=${encodeURIComponent(compendiumId)}`, lastmod });
		}
	}

	let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
	for (const e of entries) {
		xml += '  <url>\n';
		xml += `    <loc>${e.loc}</loc>\n`;
		if (e.lastmod) xml += `    <lastmod>${e.lastmod}</lastmod>\n`;
		xml += '  </url>\n';
	}
	xml += '</urlset>\n';
	return xml;
}
