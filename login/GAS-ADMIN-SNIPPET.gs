/**
 * ============================================================
 * SpiritRef 管理後台 GAS 片段（P0 安全 + P1/P2 寫入動作）
 * 用法：把整段貼進你現有的 Apps Script 專案（寫入用的那支，
 * 即 updateData_URL 那支），並按下面三步設定。
 *
 * 步驟 1：專案設定 > 指令碼屬性，新增：
 *   SUPABASE_URL       = https://ocqycgcatxdbpffpxdva.supabase.co
 *   SUPABASE_ANON_KEY  = （Supabase Dashboard > API > anon public key）
 *   ADMIN_EMAILS       = 你的管理員email（多人用逗號分隔）
 * 步驟 2：修改下方 SHEETS，對應你的試算表「分頁名稱」。
 * 步驟 3：部署 > 管理部署 > 新版本，重新部署。
 * 注意：service_role 金鑰絕對不要放進來，只要 anon key。
 * ============================================================
 */

var SHEETS = {
  novel: '日誌',     // ← 改成放文章/公告的分頁名稱
  service: '服務'    // ← 改成放服務項目/FAQ/影片的分頁名稱
};
var WRITE_ACTIONS = ['create', 'update', 'delete', 'log'];

function adminJson_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

/** 驗證 Supabase access_token，回傳 user 物件或 null */
function verifySupabaseToken_(token) {
  if (!token) return null;
  try {
    var props = PropertiesService.getScriptProperties();
    var base = props.getProperty('SUPABASE_URL');
    var anon = props.getProperty('SUPABASE_ANON_KEY');
    var allow = (props.getProperty('ADMIN_EMAILS') || '').split(',');
    var res = UrlFetchApp.fetch(base + '/auth/v1/user', {
      headers: { apikey: anon, Authorization: 'Bearer ' + token },
      muteHttpExceptions: true
    });
    if (res.getResponseCode() !== 200) return null;
    var user = JSON.parse(res.getContentText());
    for (var i = 0; i < allow.length; i++) {
      if (user.email && user.email.toLowerCase() === allow[i].trim().toLowerCase()) return user;
    }
    return null;
  } catch (e) { return null; }
}

function adminSheet_(name) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName(SHEETS[name] || name);
  if (!sh) throw new Error('找不到分頁：' + name);
  return sh;
}

/** 依第一列標題找欄位，回傳 {標題名: 欄號} */
function adminHeaders_(sh) {
  var head = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0];
  var map = {};
  for (var i = 0; i < head.length; i++) map[String(head[i]).trim()] = i + 1;
  return map;
}

/** 依 PostID（或標題）找資料列，回傳列號或 0 */
function adminFindRow_(sh, head, data) {
  var last = sh.getLastRow();
  if (last < 2) return 0;
  var idCol = head['PostID'];
  var titleCol = head['標題'];
  var key = data.PostID !== undefined && data.PostID !== '' ? String(data.PostID)
    : (data.keyTitle !== undefined ? String(data.keyTitle) : null);
  if (key === null) return 0;
  var useId = (data.PostID !== undefined && data.PostID !== '' && idCol);
  var col = useId ? idCol : titleCol;
  if (!col) return 0;
  var vals = sh.getRange(2, col, last - 1, 1).getValues();
  for (var i = 0; i < vals.length; i++) {
    if (String(vals[i][0]) === key) return i + 2;
  }
  return 0;
}

/** 更新一列（只寫入 data 有帶的欄位，不動 PostID） */
function adminUpdate_(data) {
  var sh = adminSheet_(data.sheet || 'novel');
  var head = adminHeaders_(sh);
  var row = adminFindRow_(sh, head, data);
  if (!row) return { success: false, message: '找不到該筆資料' };
  var FIELDS = ['標題', '貼文內容', '內容', '發佈日期', '圖片網址', '圖片', '連結', '貼文連結', '分類'];
  for (var i = 0; i < FIELDS.length; i++) {
    var k = FIELDS[i];
    if (data[k] !== undefined && head[k]) sh.getRange(row, head[k]).setValue(data[k]);
  }
  return { success: true };
}

/** 刪除一列 */
function adminDelete_(data) {
  var sh = adminSheet_(data.sheet || 'novel');
  var head = adminHeaders_(sh);
  var row = adminFindRow_(sh, head, data);
  if (!row) return { success: false, message: '找不到該筆資料' };
  sh.deleteRow(row);
  return { success: true };
}

/** 操作紀錄（自動建 Log 分頁） */
function adminLog_(data, user) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sh = ss.getSheetByName('Log');
  if (!sh) {
    sh = ss.insertSheet('Log');
    sh.appendRow(['時間', '管理員', '事件', '明細']);
  }
  sh.appendRow([new Date(), user ? user.email : '', data.event || '', data.detail || '']);
  return { success: true };
}

/**
 * 接線範例：貼進你現有的 doPost 最前面
 *
 * function doPost(e) {
 *   var data = JSON.parse(e.postData.contents);
 *   if (WRITE_ACTIONS.indexOf(data.action) !== -1 || !data.action) {
 *     var user = verifySupabaseToken_(data.supabase_token);
 *     if (!user) return adminJson_({ success: false, message: '未授權' });
 *     if (data.action === 'update') return adminJson_(adminUpdate_(data));
 *     if (data.action === 'delete') return adminJson_(adminDelete_(data));
 *     if (data.action === 'log') return adminJson_(adminLog_(data, user));
 *   }
 *   ...你原本的邏輯（getGithubToken、create 等）...
 * }
 */
