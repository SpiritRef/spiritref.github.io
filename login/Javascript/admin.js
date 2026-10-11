import { getIni } from '/Javascript/global.js';

const GITHUB_USER = 'SpiritRef';
const GHOST_REPO = 'ghoststory';
const JSON_REPO = 'spiritref.github.io';
const JSON_PATH = 'Data/postFB.json';

let session = null;
let cfg = {};
let dbUrl = '';
let authUrl = '';
let novelApi = '';
let serviceApi = '';
let githubToken = '';
let allPosts = [];
let allSvc = [];
let editing = null; // {kind:'post'|'svc', key, data}

const $ = (id) => document.getElementById(id);
const sleep = (ms) => new Promise(r => setTimeout(r, ms));
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;');

function setStatus(msg, color = '#4a2e1b') {
	const el = $('status');
	el.innerText = msg;
	el.style.color = color;
}

function getPwd() {
	const v = $('adminPwd').value.trim();
	if (v) sessionStorage.setItem('admin_pwd', v);
	return v || sessionStorage.getItem('admin_pwd') || '';
}

function logOp(event, detail) {
	try {
		const arr = JSON.parse(localStorage.getItem('admin_oplog') || '[]');
		arr.unshift(`${new Date().toLocaleString()} [${session?.user?.email || '?'}] ${event} ${detail || ''}`);
		localStorage.setItem('admin_oplog', JSON.stringify(arr.slice(0, 200)));
		renderOplog();
	} catch (e) {}
	//  best-effort 送到 GAS 留存
	try {
		fetch(dbUrl, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain' },
			body: JSON.stringify({ action: 'log', token: getPwd(), supabase_token: session.access_token, event, detail: detail || '' }) });
	} catch (e) {}
}

function renderOplog() {
	try {
		const arr = JSON.parse(localStorage.getItem('admin_oplog') || '[]');
		$('oplog').innerText = arr.length ? arr.join('\n') : '（空）';
	} catch (e) {}
}

function decodeApi(v) {
	if (!v) return '';
	try { return v.startsWith('http') ? v : atob(v); } catch (e) { return ''; }
}

async function ensureGithubToken() {
	if (githubToken) return githubToken;
	const pwd = getPwd();
	if (!pwd) throw new Error('請先輸入管理密碼');
	const res = await fetch(atob(authUrl), { method: 'POST', body: JSON.stringify({ action: 'getGithubToken', user: pwd }) });
	const j = await res.json();
	if (!j.success) throw new Error('身分驗證失敗：' + (j.message || ''));
	githubToken = j.githubToken;
	return githubToken;
}

// fire-and-forget（GAS POST 用 no-cors，靠事後讀取驗證）
async function gasWrite(payload) {
	const pwd = getPwd();
	if (!pwd) throw new Error('請先輸入管理密碼');
	await fetch(dbUrl, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain' },
		body: JSON.stringify({ token: pwd, supabase_token: session.access_token, ...payload }) });
	return true;
}

async function fetchJson(url) {
	const sep = url.includes('?') ? '&' : '?';
	const r = await fetch(`${url}${sep}t=${Date.now()}`, { cache: 'no-store' });
	if (!r.ok) throw new Error(`HTTP ${r.status}`);
	return r.json();
}

async function pollVerify(url, checkFn, tries = 6) {
	for (let i = 0; i < tries; i++) {
		await sleep(3000);
		try { const d = await fetchJson(url); if (checkFn(d)) return true; } catch (e) {}
	}
	return false;
}

// ---------- 文章 ----------
async function loadPosts() {
	$('postRows').innerHTML = '<tr><td colspan="4">載入中...</td></tr>';
	try {
		allPosts = await fetchJson(novelApi);
	} catch (e) {
		const cached = localStorage.getItem('cached_novel_data');
		allPosts = cached ? JSON.parse(cached) : [];
		setStatus('⚠️ API 讀取失敗，顯示本機快取', 'orange');
	}
	renderPosts();
}

function renderPosts() {
	const term = ($('postSearch').value || '').toLowerCase();
	const list = allPosts.filter(p => !term || String(p['標題'] || '').toLowerCase().includes(term) || String(p['貼文內容'] || '').toLowerCase().includes(term));
	$('postCount').innerText = `共 ${list.length} 筆`;
	$('postRows').innerHTML = list.map((p) => {
		const pid = p['PostID'] ?? '';
		const idx = allPosts.indexOf(p);
		return `<tr><td>${esc(pid)}</td><td style="white-space:nowrap;">${esc(p['發佈日期'] || '')}</td>
			<td class="title">${esc(p['標題'] || '(無標題)')}</td>
			<td style="white-space:nowrap;">
				<button class="rowbtn" data-act="preview" data-i="${idx}">預覽</button>
				<button class="rowbtn" data-act="edit" data-i="${idx}">編輯</button>
				<button class="rowbtn" data-act="del" data-i="${idx}">刪除</button>
			</td></tr>`;
	}).join('') || '<tr><td colspan="4">無資料</td></tr>';
}

// ---------- 服務內容 ----------
async function loadSvc() {
	$('svcRows').innerHTML = '<tr><td colspan="3">載入中...</td></tr>';
	const cat = $('svcCat').value;
	try {
		if (cat === '公告') {
			const d = await fetchJson(`${novelApi}${novelApi.includes('?') ? '&' : '?'}type=notice`);
			allSvc = d.filter(i => String(i['標題'] || '').includes('公告'));
		} else {
			const d = await fetchJson(`${serviceApi}${serviceApi.includes('?') ? '&' : '?'}type=service`);
			allSvc = d.filter(i => String(i['分類'] || '') === cat);
		}
	} catch (e) {
		allSvc = [];
		setStatus('⚠️ 服務 API 讀取失敗', 'orange');
	}
	$('svcCount').innerText = `共 ${allSvc.length} 筆`;
	$('svcRows').innerHTML = allSvc.map((it, idx) => `<tr><td>${esc(it['PostID'] ?? idx + 1)}</td>
		<td class="title">${esc(it['標題'] || '')}</td>
		<td style="white-space:nowrap;">
			<button class="rowbtn" data-sact="preview" data-i="${idx}">預覽</button>
			<button class="rowbtn" data-sact="edit" data-i="${idx}">編輯</button>
			<button class="rowbtn" data-sact="del" data-i="${idx}">刪除</button>
		</td></tr>`).join('') || '<tr><td colspan="3">無資料</td></tr>';
}

// ---------- 編輯 Modal ----------
function fieldDefs(kind) {
	if (kind === 'post') return [
		['標題', 'text'], ['發佈日期', 'text'], ['貼文內容', 'textarea'], ['圖片網址', 'text']
	];
	return [['標題', 'text'], ['貼文內容', 'textarea'], ['連結', 'text']];
}

function openEditor(kind, idx) {
	const src = kind === 'post' ? allPosts[idx] : allSvc[idx];
	editing = { kind, idx, key: kind === 'post' ? src['PostID'] : (src['PostID'] ?? src['標題']) };
	$('modalTitle').innerText = (kind === 'post' ? '編輯文章' : '編輯內容') + `（${editing.key}）`;
	$('modalFields').innerHTML = fieldDefs(kind).map(([k, t]) => {
		const v = src[k] ?? src['內容'] ?? '';
		return `<label>${k}</label>` + (t === 'textarea'
			? `<textarea data-k="${k}">${esc(v)}</textarea>`
			: `<input data-k="${k}" value="${esc(String(v)).replace(/"/g, '&quot;')}">`);
	}).join('');
	$('previewBox').style.display = 'none';
	$('modal').classList.add('open');
}

function collectFields() {
	const out = {};
	$('modalFields').querySelectorAll('[data-k]').forEach(el => { out[el.dataset.k] = el.value; });
	return out;
}

function showPreview() {
	const f = collectFields();
	const imgs = String(f['圖片網址'] || '').split(/\r?\n|\|/).filter(s => s.trim())
		.map(s => `<img src="${esc(s.trim())}" style="max-width:100%;margin-top:8px;" onerror="this.style.display='none'">`).join('');
	$('previewBox').innerHTML = `<h3 style="margin:0 0 8px;">${esc(f['標題'] || '')}</h3><div>${esc(f['貼文內容'] || '')}</div>${imgs}`;
	$('previewBox').style.display = 'block';
}

async function saveEdit() {
	if (!editing) return;
	const f = collectFields();
	setStatus('⏳ 儲存中...', 'blue');
	try {
		if (editing.kind === 'post') {
			await gasWrite({ action: 'update', sheet: 'novel', PostID: editing.key, ...f });
			logOp('編輯文章', `${editing.key} ${f['標題'] || ''}`);
			setStatus('⏳ 已送出，驗證同步中（最長約20秒）...', 'blue');
			const ok = await pollVerify(novelApi, d => {
				const p = d.find(x => String(x['PostID']) === String(editing.key));
				return p && String(p['標題'] || '') === String(f['標題'] || '');
			});
			setStatus(ok ? '✅ 已儲存並驗證' : '⚠️ 已送出但驗證逾時，請重整確認（GAS 可能較慢）', ok ? 'green' : 'orange');
			await loadPosts();
		} else {
			const cat = $('svcCat').value;
			const sheet = cat === '公告' ? 'novel' : 'service';
			const payload = { action: 'update', sheet, ...f };
			if (editing.key !== undefined && allSvc[editing.idx]['PostID'] !== undefined) payload.PostID = editing.key;
			else payload.keyTitle = allSvc[editing.idx]['標題'];
			await gasWrite(payload);
			logOp('編輯服務內容', `${cat} ${f['標題'] || ''}`);
			setStatus('✅ 已送出（服務內容請到前台確認，約1~3分鐘）', 'green');
			await loadSvc();
		}
		$('modal').classList.remove('open');
		editing = null;
	} catch (e) {
		setStatus('❌ 儲存失敗：' + e.message, 'red');
	}
}

async function delItem(kind, idx, btn) {
	if (btn.dataset.armed) {
		setStatus('⏳ 刪除中...', 'blue');
		try {
			if (kind === 'post') {
				const pid = allPosts[idx]['PostID'];
				await gasWrite({ action: 'delete', sheet: 'novel', PostID: pid });
				logOp('刪除文章', `${pid}`);
				const ok = await pollVerify(novelApi, d => !d.some(x => String(x['PostID']) === String(pid)));
				setStatus(ok ? '✅ 已刪除並驗證' : '⚠️ 已送出但驗證逾時，請重整確認', ok ? 'green' : 'orange');
				await loadPosts();
			} else {
				const cat = $('svcCat').value;
				const it = allSvc[idx];
				const payload = { action: 'delete', sheet: cat === '公告' ? 'novel' : 'service' };
				if (it['PostID'] !== undefined) payload.PostID = it['PostID'];
				else payload.keyTitle = it['標題'];
				await gasWrite(payload);
				logOp('刪除服務內容', `${cat} ${it['標題'] || ''}`);
				setStatus('✅ 已送出刪除（前台約1~3分鐘生效）', 'green');
				await loadSvc();
			}
		} catch (e) { setStatus('❌ 刪除失敗：' + e.message, 'red'); }
		return;
	}
	btn.dataset.armed = '1';
	btn.classList.add('confirm');
	btn.innerText = '確認刪除？';
	setTimeout(() => { btn.dataset.armed = ''; btn.classList.remove('confirm'); btn.innerText = '刪除'; }, 5000);
}

// ---------- 圖片 ----------
async function loadImages() {
	$('imgGrid').innerText = '載入中...';
	try {
		const h = githubToken ? { Authorization: `token ${githubToken}` } : {};
		const r = await fetch(`https://api.github.com/repos/${GITHUB_USER}/${GHOST_REPO}/contents/pic`, { headers: h });
		if (!r.ok) throw new Error(`HTTP ${r.status}`);
		const files = (await r.json()).filter(f => f.type === 'file');
		$('imgGrid').innerHTML = files.map(f => `<div class="imgcell">
			<img src="${f.download_url}" loading="lazy" onerror="this.style.display='none'">
			<div>${esc(f.name)}</div>
			<div>${(f.size / 1024).toFixed(0)} KB</div>
			<button class="rowbtn" data-copy="pic/${esc(f.name)}">複製路徑</button>
			<button class="rowbtn" data-del="${esc(f.path)}" data-sha="${f.sha}">刪除</button>
		</div>`).join('') || '（空）';
	} catch (e) {
		$('imgGrid').innerText = '讀取失敗：' + e.message;
	}
}

// ---------- 系統狀態 ----------
async function healthCheck() {
	const rows = [];
	const t0 = Date.now();
	try {
		const d = await fetchJson(novelApi);
		rows.push(['日誌 API', `<span class="health-ok">正常</span>`, `${Array.isArray(d) ? d.length : '?'} 筆，${Date.now() - t0}ms`]);
	} catch (e) { rows.push(['日誌 API', `<span class="health-bad">異常</span>`, esc(e.message)]); }
	const t1 = Date.now();
	try {
		const d = await fetchJson(`${serviceApi}${serviceApi.includes('?') ? '&' : '?'}type=service`);
		rows.push(['服務 API', `<span class="health-ok">正常</span>`, `${Array.isArray(d) ? d.length : '?'} 筆，${Date.now() - t1}ms`]);
	} catch (e) { rows.push(['服務 API', `<span class="health-bad">異常</span>`, esc(e.message)]); }
	try {
		const r = await fetch('https://api.github.com/rate_limit');
		const j = await r.json();
		rows.push(['GitHub API', `<span class="health-ok">正常</span>`, `剩餘 ${j.resources.core.remaining}/${j.resources.core.limit}`]);
	} catch (e) { rows.push(['GitHub API', `<span class="health-bad">異常</span>`, esc(e.message)]); }
	$('healthRows').innerHTML = rows.map(r => `<tr><td>${r[0]}</td><td>${r[1]}</td><td>${r[2]}</td></tr>`).join('');
}

function toB64(s) {
	const b = new TextEncoder().encode(s);
	let o = '';
	for (let i = 0; i < b.length; i += 0x8000) o += String.fromCharCode.apply(null, b.subarray(i, i + 0x8000));
	return btoa(o);
}

async function syncPostsJson() {
	setStatus('⏳ 同步文章 JSON...', 'blue');
	try {
		const token = await ensureGithubToken();
		const all = await fetchJson(novelApi);
		if (!Array.isArray(all)) throw new Error('API 回傳非陣列');
		const api = `https://api.github.com/repos/${GITHUB_USER}/${JSON_REPO}/contents/${JSON_PATH}`;
		const h = { Authorization: `token ${token}`, Accept: 'application/vnd.github.v3+json', 'Content-Type': 'application/json' };
		let sha = null;
		const g = await fetch(api, { headers: h });
		if (g.ok) sha = (await g.json()).sha;
		const body = { message: `Sync ${JSON_PATH}: ${all.length} posts (admin)`, content: toB64(JSON.stringify(all, null, 1)) };
		if (sha) body.sha = sha;
		const p = await fetch(api, { method: 'PUT', headers: h, body: JSON.stringify(body) });
		if (!p.ok) throw new Error(`GitHub HTTP ${(await p.text()).slice(0, 80)}`);
		logOp('同步JSON', `${all.length} 筆`);
		setStatus(`✅ JSON 已同步，共 ${all.length} 筆`, 'green');
	} catch (e) { setStatus('❌ 同步失敗：' + e.message, 'red'); }
}

// ---------- 初始化 ----------
export async function initAdmin(sess) {
	session = sess;
	const saved = sessionStorage.getItem('admin_pwd');
	if (saved) $('adminPwd').value = saved;

	try {
		cfg = await getIni('/settings/global.ini');
		dbUrl = decodeApi(cfg.updateData_URL);
		authUrl = cfg.updateGithub_URL;
		novelApi = decodeApi(cfg.NOVEL_API_URL);
		serviceApi = decodeApi(cfg.SERVICE_API_URL);
	} catch (e) { setStatus('⚠️ INI 載入失敗：' + e.message, 'orange'); }
	renderOplog();

	document.querySelectorAll('.tabs button').forEach(b => b.onclick = () => {
		document.querySelectorAll('.tabs button').forEach(x => x.classList.remove('active'));
		b.classList.add('active');
		document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
		$('tab-' + b.dataset.tab).classList.add('active');
	});

	$('postSearch').oninput = renderPosts;
	$('postReload').onclick = loadPosts;
	$('postBackup').onclick = () => {
		const blob = new Blob([JSON.stringify(allPosts, null, 1)], { type: 'application/json' });
		const a = document.createElement('a');
		a.href = URL.createObjectURL(blob);
		a.download = 'postFB_backup.json';
		a.click();
		logOp('備份JSON', `${allPosts.length} 筆`);
	};
	$('postRows').onclick = (e) => {
		const b = e.target.closest('button'); if (!b) return;
		const i = Number(b.dataset.i);
		if (b.dataset.act === 'edit') openEditor('post', i);
		else if (b.dataset.act === 'preview') { openEditor('post', i); showPreview(); }
		else if (b.dataset.act === 'del') delItem('post', i, b);
	};
	$('svcCat').onchange = loadSvc;
	$('svcReload').onclick = loadSvc;
	$('svcRows').onclick = (e) => {
		const b = e.target.closest('button'); if (!b) return;
		const i = Number(b.dataset.i);
		if (b.dataset.sact === 'edit') openEditor('svc', i);
		else if (b.dataset.sact === 'preview') { openEditor('svc', i); showPreview(); }
		else if (b.dataset.sact === 'del') delItem('svc', i, b);
	};
	$('modalPreview').onclick = showPreview;
	$('modalSave').onclick = saveEdit;
	$('modalClose').onclick = () => { $('modal').classList.remove('open'); editing = null; };
	$('modal').onclick = (e) => { if (e.target.id === 'modal') { $('modal').classList.remove('open'); editing = null; } };

	$('imgReload').onclick = loadImages;
	$('imgGrid').onclick = async (e) => {
		const b = e.target.closest('button'); if (!b) return;
		if (b.dataset.copy) {
			await navigator.clipboard.writeText(b.dataset.copy).catch(() => {});
			setStatus(`✅ 已複製：${b.dataset.copy}`, 'green');
			return;
		}
		if (b.dataset.del) {
			if (!b.dataset.armed) {
				b.dataset.armed = '1'; b.classList.add('confirm'); b.innerText = '確認刪除？';
				setTimeout(() => { b.dataset.armed = ''; b.classList.remove('confirm'); b.innerText = '刪除'; }, 5000);
				return;
			}
			try {
				const token = await ensureGithubToken();
				const r = await fetch(`https://api.github.com/repos/${GITHUB_USER}/${GHOST_REPO}/contents/${b.dataset.del}`, {
					method: 'DELETE', headers: { Authorization: `token ${token}`, Accept: 'application/vnd.github.v3+json', 'Content-Type': 'application/json' },
					body: JSON.stringify({ message: `Delete ${b.dataset.del} (admin)`, sha: b.dataset.sha })
				});
				if (!r.ok) throw new Error(`HTTP ${r.status}`);
				logOp('刪除圖片', b.dataset.del);
				setStatus('✅ 圖片已刪除', 'green');
				loadImages();
			} catch (err) { setStatus('❌ 刪除失敗：' + err.message, 'red'); }
		}
	};

	$('healthBtn').onclick = healthCheck;
	$('syncPostsBtn').onclick = syncPostsJson;
	$('clearCacheBtn').onclick = () => {
		['cached_novel_data', 'cache_notices', 'cache_services'].forEach(k => localStorage.removeItem(k));
		setStatus('✅ 本機快取已清除（前台下次開啟會重抓）', 'green');
		logOp('清除快取', '');
	};

	await loadPosts();
	await loadSvc();
}
