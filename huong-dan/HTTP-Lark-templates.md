# Gọi 2 skill qua HTTP (từ Lark Base automation / curl / Postman)

Cơ chế: gửi `repository_dispatch` tới GitHub → Actions chạy skill trên cloud.

## Chung
- **Endpoint:** `POST https://api.github.com/repos/hoangminhhoagpt-dot/mentor-club/dispatches`
- **Headers:**
  - `Authorization: Bearer <GITHUB_PAT>`  (PAT **classic**, scope `repo`)
  - `Accept: application/vnd.github+json`
  - `Content-Type: application/json`
- **Thành công = HTTP 204** (không có body). Xem kết quả ở tab **Actions**.

## A. Sync YouTube → Lark  (event `sync-youtube`)
Body tối thiểu (dùng Variables đã set):
```json
{ "event_type": "sync-youtube", "client_payload": { "channel": "@hoangminhhoaoffical" } }
```
Body đầy đủ (ghi đè base/bảng — cho khách khác nhau):
```json
{ "event_type": "sync-youtube",
  "client_payload": {
    "channel": "@handle",
    "base_id": "Lytbb51igaGR6Os2ByaljqpkgFc",
    "table_channel": "tblT7U3WaHh23REl",
    "table_video": "tbl5ZVBGWfTLJ4iK"
  } }
```

## B. Đăng video Lark → YouTube  (event `dang-video-youtube`)
Đăng đúng 1 dòng (nút bấm Lark gửi record_id):
```json
{ "event_type": "dang-video-youtube", "client_payload": { "record_id": "recXXXXXXXX" } }
```
Quét tất cả dòng "Chờ đăng" (bỏ record_id):
```json
{ "event_type": "dang-video-youtube", "client_payload": {} }
```

## Cấu hình trong Lark Base Automation
Action **"Gửi yêu cầu HTTP" / Send HTTP request**:
1. Method: **POST**
2. URL: `https://api.github.com/repos/hoangminhhoagpt-dot/mentor-club/dispatches`
3. Headers: 3 dòng như trên (dán PAT vào `Authorization`).
4. Body (JSON): copy 1 mẫu ở trên. Để lấy `record_id` của dòng hiện tại, dùng biến bản ghi của Lark chèn vào chỗ `recXXXX`.

## curl test nhanh (PowerShell)
```powershell
$H = @{ Authorization = "Bearer <PAT>"; Accept = "application/vnd.github+json" }
$B = '{"event_type":"sync-youtube","client_payload":{"channel":"@hoangminhhoaoffical"}}'
Invoke-WebRequest -Method POST -Uri "https://api.github.com/repos/hoangminhhoagpt-dot/mentor-club/dispatches" -Headers $H -ContentType "application/json" -Body $B
# StatusCode 204 = OK
```

## Lấy GitHub PAT
GitHub → Settings → Developer settings → **Personal access tokens (classic)** → Generate → tick scope **`repo`** → copy. Không share công khai.
