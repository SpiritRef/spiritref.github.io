// 共用：產生 sitemap.xml 內容（與 Tool/generate-sitemap.ps1 邏輯一致）
export function buildSitemapXml(posts, services) {
	const base = 'https://spiritref.github.io';
	const today = new Date().toISOString().slice(0, 10);
	const entries = [];
	const staticPages = [
		{ loc: `${base}/services/`, changefreq: 'weekly', priority: '1.0' },
		{ loc: `${base}/services/faq/`, changefreq: 'weekly', priority: '0.8' },
		{ loc: `${base}/services/notices/`, changefreq: 'daily', priority: '0.8' },
		{ loc: `${base}/services/consult.html`, changefreq: 'monthly', priority: '0.5' },
		{ loc: `${base}/ghoststory/`, changefreq: 'daily', priority: '0.9' },
		{ loc: `${base}/`, changefreq: 'weekly', priority: '0.8' }
	];
	for (const s of staticPages) entries.push({ ...s, lastmod: today });
	// 文章頁
	if (Array.isArray(posts)) {
		for (const post of posts) {
			const pid = post && post['PostID'] != null ? String(post['PostID']) : '0';
			const raw = post ? (function(){const ks=Object.keys(post);for(const k of ks){if(typeof post[k]==='string' && /^\d{4}\/\d{2}\/\d{2}/.test(post[k])) return post[k];}return null;})() : null;
			let ts = '0000';
			let lastmod = today;
			if (raw) {
				const d = (typeof raw === 'number')
					? new Date((raw - 25569) * 86400 * 1000)
					: new Date(raw);
				if (!isNaN(d.getTime())) {
					const pad = (n) => String(n).padStart(2, '0');
					ts = `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
					lastmod = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
				}
			}
			const combined = `${pid}_${ts}`;
			entries.push({ loc: `${base}/ghoststory/article/?id=${combined}`, lastmod, changefreq: 'monthly', priority: '0.6' });
		}
	}
	// FAQ 個別頁面
	if (Array.isArray(services)) {
		for (const svc of services) {
			const cat = svc ? (function(){const ks=Object.keys(svc);return ks.length? (svc[ks[0]] || '') : '';}()) : '';
			if (String(cat).indexOf('\u5f59') === -1) continue;
			const title = (function(){const ks=Object.keys(svc);return ks.length>1 ? (svc[ks[1]] || '') : '';}()) || '';
			if (!title) continue;
			const faqId = svc['ID'] || title;
			entries.push({ loc: `${base}/services/faq/detail.html?id=${encodeURIComponent(faqId)}`, lastmod: today, changefreq: 'monthly', priority: '0.7' });
		}
	}
	let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
	for (const e of entries) {
		xml += '  <url>\n';
		xml += `    <loc>${e.loc}</loc>\n`;
		xml += `    <lastmod>${e.lastmod}</lastmod>\n`;
		xml += `    <changefreq>${e.changefreq}</changefreq>\n`;
		xml += `    <priority>${e.priority}</priority>\n`;
		xml += '  </url>\n';
	}
	xml += '</urlset>\n';
	return xml;
}