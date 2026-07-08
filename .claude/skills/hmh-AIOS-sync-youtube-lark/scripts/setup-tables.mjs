#!/usr/bin/env node
/**
 * Khởi tạo bộ 3 bảng template YouTube vào MỘT Lark Base bất kỳ:
 *   16.1 Lấy dữ liệu kênh · 16.2 Lấy dữ liệu video · 16.3 Đăng video YouTube
 *
 * Dùng credential app từ scripts/config.local.json (larkAppId/Secret/Domain),
 * còn base đích truyền qua --base <base_id> (mặc định lấy CFG.appToken).
 *
 * Chạy: node setup-tables.mjs --base Lytbb51igaGR6Os2ByaljqpkgFc [--only 16.1,16.3]
 *
 * GOTCHA đã xử lý: cột đầu (primary) không nhận URL/Attachment/Select -> bảng 16.1
 * để "channel description"(text) đứng đầu, 16.2 để "video id"(text) đứng đầu.
 * Bảng đã tồn tại (trùng tên) sẽ được BỎ QUA (idempotent).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CFG = JSON.parse(fs.readFileSync(path.join(__dirname, "config.local.json"), "utf8"));
const DOMAIN = CFG.larkDomain || "https://open.larksuite.com";

// ---- args ----
const argv = process.argv;
const baseIdx = argv.indexOf("--base");
const BASE = baseIdx > -1 ? argv[baseIdx + 1] : CFG.appToken;
const onlyIdx = argv.indexOf("--only");
const ONLY = onlyIdx > -1 ? argv[onlyIdx + 1].split(",").map((s) => s.trim()) : null;
if (!BASE) { console.error("Thiếu base đích: truyền --base <base_id>."); process.exit(1); }

// ---- schema 3 bảng (mã kiểu Lark: 1 Text·2 Number·3 SingleSelect·4 MultiSelect·5 DateTime·15 URL·17 Attachment) ----
const DATE = { date_formatter: "yyyy/MM/dd HH:mm" };
const TABLES = [
  {
    key: "16.1", name: "16.1 Lấy dữ liệu kênh", default_view_name: "Kênh",
    fields: [
      { field_name: "channel description", type: 1 },   // primary (text)
      { field_name: "channel", type: 15 },
      { field_name: "thumbnails", type: 17 },
      { field_name: "channel videoCount", type: 2 },
      { field_name: "channel viewCount", type: 2 },
      { field_name: "channel subscriberCount", type: 2 },
      { field_name: "country", type: 3 },
      { field_name: "channel create time", type: 5, property: DATE },
    ],
  },
  {
    key: "16.2", name: "16.2 Lấy dữ liệu video", default_view_name: "Video",
    fields: [
      { field_name: "video id", type: 1 },              // primary (text, unique)
      { field_name: "video", type: 15 },
      { field_name: "video description", type: 1 },
      { field_name: "video tag", type: 4 },
      { field_name: "publish time", type: 5, property: DATE },
      { field_name: "thumbnails", type: 17 },
      { field_name: "viewCount", type: 2 },
      { field_name: "likeCount", type: 2 },
      { field_name: "favoriteCount", type: 2 },
      { field_name: "commentCount", type: 2 },
      { field_name: "channel", type: 15 },
    ],
  },
  {
    key: "16.3", name: "16.3 Đăng video YouTube", default_view_name: "Chờ đăng",
    fields: [
      { field_name: "Tiêu đề", type: 1 },               // primary (text)
      { field_name: "Video", type: 17 },
      { field_name: "Mô tả", type: 1 },
      { field_name: "Tags", type: 1 },
      { field_name: "Chế độ", type: 3, property: { options: [{ name: "private" }, { name: "unlisted" }, { name: "public" }] } },
      { field_name: "Trạng thái", type: 3, property: { options: [{ name: "Chờ đăng" }, { name: "Đang đăng" }, { name: "Đã đăng" }, { name: "Lỗi" }] } },
      { field_name: "Lịch đăng", type: 5, property: DATE },
      { field_name: "Video ID", type: 1 },
      { field_name: "Link video", type: 15 },
      { field_name: "Ngày đăng", type: 5, property: DATE },
      { field_name: "Ghi chú lỗi", type: 1 },
    ],
  },
];

async function larkToken() {
  const r = await fetch(`${DOMAIN}/open-apis/auth/v3/tenant_access_token/internal`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ app_id: CFG.larkAppId, app_secret: CFG.larkAppSecret }),
  });
  const j = await r.json();
  if (j.code !== 0) throw new Error(`Lark token lỗi: ${j.code} ${j.msg}`);
  return j.tenant_access_token;
}

async function listTables(token) {
  const out = [];
  let pageToken = null;
  do {
    const qs = new URLSearchParams({ page_size: "100" });
    if (pageToken) qs.set("page_token", pageToken);
    const r = await fetch(`${DOMAIN}/open-apis/bitable/v1/apps/${BASE}/tables?${qs}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const j = await r.json();
    if (j.code !== 0) throw new Error(`Liệt kê bảng lỗi: ${j.code} ${j.msg} — app có quyền SỬA base ${BASE}?`);
    out.push(...(j.data.items || []));
    pageToken = j.data.has_more ? j.data.page_token : null;
  } while (pageToken);
  return out;
}

async function createTable(token, t) {
  const r = await fetch(`${DOMAIN}/open-apis/bitable/v1/apps/${BASE}/tables`, {
    method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ table: { name: t.name, default_view_name: t.default_view_name, fields: t.fields } }),
  });
  const j = await r.json();
  if (j.code !== 0) throw new Error(`Tạo bảng "${t.name}" lỗi: ${j.code} ${j.msg}`);
  return j.data.table_id;
}

async function main() {
  console.log(`Base đích: ${BASE} | domain: ${DOMAIN}`);
  const token = await larkToken();
  const existing = await listTables(token);
  const byName = new Map(existing.map((x) => [x.name, x.table_id]));

  const wanted = ONLY ? TABLES.filter((t) => ONLY.includes(t.key)) : TABLES;
  const result = [];
  for (const t of wanted) {
    if (byName.has(t.name)) {
      console.log(`= BỎ QUA (đã có): ${t.name} -> ${byName.get(t.name)}`);
      result.push({ key: t.key, name: t.name, table_id: byName.get(t.name), created: false });
      continue;
    }
    const id = await createTable(token, t);
    console.log(`✔ TẠO: ${t.name} -> ${id}`);
    result.push({ key: t.key, name: t.name, table_id: id, created: true });
  }

  console.log("\n=== KẾT QUẢ (dán vào config.local.json) ===");
  for (const r of result) console.log(`${r.key}  ${r.name}\n     table_id = ${r.table_id}`);
  console.log("\nGợi ý map config: 16.1 -> tableChannel · 16.2 -> tableVideo · 16.3 -> tablePost");
}
main().catch((e) => { console.error("LỖI:", e.message); process.exit(1); });
