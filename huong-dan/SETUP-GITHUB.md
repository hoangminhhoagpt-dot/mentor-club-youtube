# Cấu hình GitHub Actions cho 2 skill YouTube

Repo: **https://github.com/hoangminhhoagpt-dot/mentor-club**

## 1. Secrets (bí mật) — Settings → Secrets and variables → Actions → tab **Secrets**
| Secret | Dùng cho | Lấy ở đâu |
|---|---|---|
| `YOUTUBE_API_KEY` | sync-youtube | Google Cloud → YouTube Data API v3 key |
| `LARK_APP_SECRET` | cả 2 | Lark app → App Secret |
| `LARK_NOTIFY_WEBHOOK` | sync-youtube (tùy chọn) | Webhook Custom Bot nhóm Lark |
| `YT_OAUTH_CLIENT_SECRET` | dang-video | OAuth Desktop client (Google Cloud) |
| `YT_OAUTH_REFRESH_TOKEN` | dang-video | chạy `get-oauth-token.mjs` lấy 1 lần |

## 2. Variables (không bí mật) — cùng trang, tab **Variables**
| Variable | Giá trị gợi ý |
|---|---|
| `LARK_APP_ID` | `cli_aa8cccd0b262deed` |
| `LARK_DOMAIN` | `https://open.larksuite.com` |
| `LARK_BASE_ID` | base_id đích (vd `Lytbb51igaGR6Os2ByaljqpkgFc`) |
| `TABLE_CHANNEL` | tbl bảng kênh (16.1) |
| `TABLE_VIDEO` | tbl bảng video (16.2) |
| `TABLE_POST` | tbl bảng đăng video (16.3) |
| `YT_OAUTH_CLIENT_ID` | `xxxxx.apps.googleusercontent.com` |
| `YT_CATEGORY_ID` | `22` |
| `YT_PRIVACY` | `private` |
| `YT_CHANNEL` | kênh mặc định, vd `@hoangminhhoaoffical` |

> Giá trị KHÁC NHAU giữa các khách (base_id, table id, channel) có thể **truyền thẳng qua `client_payload`** khi gọi HTTP — không cần sửa Variables. Xem `HTTP-Lark-templates.md`.

## 3. Đưa file lên repo
Copy toàn bộ thư mục staging này (trừ 3 file `.md` hướng dẫn nếu không muốn) vào bản clone của repo rồi:

```bash
git add .github/workflows/sync-youtube.yml .github/workflows/dang-video-youtube.yml \
        .claude/skills/hmh-AIOS-sync-youtube-lark .claude/skills/hmh-AIOS-dang-video-youtube \
        .gitignore
git commit -m "them 2 skill YouTube: sync + dang video (GitHub Actions HTTP)"
git push origin main
```
⚠️ **Tuyệt đối không** `git add` file `config.local.json` (đã chặn bằng `.gitignore`).

## 4. Nghiệm thu
- Bấm **Run workflow** thủ công ở tab Actions (workflow_dispatch) trước.
- Hoặc gọi HTTP `dispatches` → phải trả **HTTP 204**, xem log ở tab Actions.
