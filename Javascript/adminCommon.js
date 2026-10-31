// 共用 GitHub 工具函式（admin.js / inputData.js 共用）
export const GITHUB_USER = 'SpiritRef';
export const JSON_REPO = 'spiritref.github.io';

export function ghHeaders(pat) {
	return {
		Authorization: `token ${pat}`,
		Accept: 'application/vnd.github.v3+json',
		'Content-Type': 'application/json'
	};
}

export function toB64(s) {
	const b = new TextEncoder().encode(s);
	let o = '';
	for (let i = 0; i < b.length; i += 0x8000) o += String.fromCharCode.apply(null, b.subarray(i, i + 0x8000));
	return btoa(o);
}

export function fromB64(b64) {
	const bin = atob(b64.replace(/\s/g, ''));
	const bytes = new Uint8Array(bin.length);
	for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
	return new TextDecoder().decode(bytes);
}

export async function fetchJson(url) {
	const sep = url.includes('?') ? '&' : '?';
	const r = await fetch(`${url}${sep}t=${Date.now()}`, { cache: 'no-store' });
	if (!r.ok) throw new Error(`HTTP ${r.status}`);
	return r.json();
}

export async function netInfo() {
	try {
		const cached = sessionStorage.getItem('net_info');
		if (cached) return JSON.parse(cached);
		const ctl = new AbortController();
		const timer = setTimeout(() => ctl.abort(), 4000);
		const r = await fetch('https://ipapi.co/json/', { signal: ctl.signal });
		clearTimeout(timer);
		if (!r.ok) throw new Error('net ' + r.status);
		const j = await r.json();
		const info = {
			ip: j.ip || 'unknown',
			loc: [j.city, j.region, j.country_name].filter(Boolean).join('·') || 'unknown'
		};
		sessionStorage.setItem('net_info', JSON.stringify(info));
		return info;
	} catch (e) {
		return { ip: 'unknown', loc: 'unknown' };
	}
}