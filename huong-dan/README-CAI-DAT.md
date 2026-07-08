# 2 Skill YouTube ↔ Lark Base — Cài & dùng

Bộ này gồm 2 skill Node (zero-dependency, chạy được cả **máy local** lẫn **GitHub Actions**):

| Skill | Việc | Engine |
|---|---|---|
| `hmh-AIOS-sync-youtube-lark` | Kéo dữ liệu kênh + video YouTube → Lark Base (2 bảng) | `scripts/sync-youtube-lark.mjs` |
| `hmh-AIOS-dang-video-youtube` | Đăng video từ bảng Lark → YouTube | `scripts/post-video-youtube.mjs` |

Config nạp theo thứ tự: **biến môi trường (CI) → `config.local.json` (local)**. Secret không bao giờ nằm trong code.

---

## Cách 1 — Chạy trên máy mới (local)

**Yêu cầu:** Node ≥ 18. Kiểm tra: `node -v`.

1. **Clone repo:**
   ```bash
   git clone https://github.com/hoangminhhoagpt-dot/mentor-club.git
   cd mentor-club
   ```
2. **Tạo config cho từng skill** (copy file mẫu rồi điền token):
   ```bash
   # skill sync
   cp .claude/skills/hmh-AIOS-sync-youtube-lark/scripts/config.example.json \
      .claude/skills/hmh-AIOS-sync-youtube-lark/scripts/config.local.json
   # skill đăng video
   cp .claude/skills/hmh-AIOS-dang-video-youtube/scripts/config.example.json \
      .claude/skills/hmh-AIOS-dang-video-youtube/scripts/config.local.json
   ```
   Mở 2 file `config.local.json` vừa tạo, điền: YouTube API key, Lark App ID/Secret, base_id, table id...
   (skill đăng video: chạy `node scripts/get-oauth-token.mjs` 1 lần để lấy OAuth refresh token).
3. **Tạo bảng template vào Lark Base (nếu base còn trống):**
   ```bash
   node .claude/skills/hmh-AIOS-sync-youtube-lark/scripts/setup-tables.mjs --base <base_id>
   # in ra 3 table_id -> dán vào config.local.json
   ```
4. **Chạy:**
   ```bash
   node .claude/skills/hmh-AIOS-sync-youtube-lark/scripts/sync-youtube-lark.mjs --only channel
   node .claude/skills/hmh-AIOS-dang-video-youtube/scripts/post-video-youtube.mjs --dry-run
   ```

> `config.local.json` bị `.gitignore` chặn — an toàn, không lên git.

---

## Cách 2 — Chạy trên cloud (GitHub Actions, gọi qua HTTP)

Không cần bật máy. Xem **`SETUP-GITHUB.md`** (điền Secrets/Variables) và **`HTTP-Lark-templates.md`**
(mẫu gọi từ Lark Base automation / curl).

Tóm tắt: điền token vào **GitHub Secrets/Variables** → gọi `POST /repos/.../dispatches` với
`event_type` = `sync-youtube` hoặc `dang-video-youtube`.

---

## Bàn giao khách mới (nhân bản nhanh)
- **Dùng chung code**, mỗi khách 1 bộ **Secrets** riêng (hoặc 1 repo riêng).
- Giá trị khác nhau (base_id, table id, kênh) → truyền qua `client_payload`, KHÔNG sửa code.
