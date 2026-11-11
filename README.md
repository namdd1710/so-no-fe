# so-no-fe — Sổ Nợ (frontend)

Giao diện app ghi sổ nợ: **Next.js 15 (App Router) + Material UI 7**, mobile-first.
Backend tương ứng: [`so-no-be`](../so-no-be).

---

## 1. Chạy local

```bash
npm install
printf 'API_BASE_URL=http://127.0.0.1:3001\n' > .env.local
npm run dev        # http://localhost:3000
```

Cần chạy `so-no-be` trước (xem README của BE). Mở http://localhost:3000 → tự chuyển tới `/admin/login`.

Muốn dev UI trỏ vào backend **đã deploy** thay vì BE local:

```bash
printf 'API_BASE_URL=https://so-no-be.vercel.app\n' > .env.local
```

Lúc đó mọi dữ liệu tạo từ máy bạn đi thẳng vào Atlas production — nhớ dọn sau khi thử.

## 2. Các trang

| Route | Nội dung |
|---|---|
| `/admin/login` | đăng nhập admin bằng mật khẩu + **Quên mật khẩu?** (đổi bằng khoá khôi phục) |
| `/admin` | danh sách con nợ, tổng chưa thu, copy link, lưu trữ |
| `/admin/debtors/[id]` | sổ của một con nợ: thêm/sửa/xoá khoản, lọc tháng, chốt & huỷ chốt |
| `/s/[code]` | trang công khai **chỉ đọc** cho con nợ (không cần đăng nhập) |
| `/api/*` | proxy mỏng sang backend (`app/api/[...path]/route.ts`) |

## 3. Vì sao có proxy `/api/*`?

Backend và frontend là hai repo, hai domain. Trình duyệt **không** gọi thẳng backend:

```
Browser → FE /api/*  →  BE /api/*
            ↑ cookie sn_session nằm ở origin của FE
```

Nhờ vậy cookie `HttpOnly` thuộc đúng origin, không cần CORS, và mọi kiểm tra quyền vẫn do BE quyết định.

## 4. Quên mật khẩu

Nút **Quên mật khẩu?** dưới form đăng nhập mở dialog yêu cầu:

1. **Khoá khôi phục** — giá trị biến `ADMIN_RECOVERY_KEY` bên backend;
2. **Mật khẩu mới** (≥ 8 ký tự, nhập 2 lần).

Gửi `POST /api/auth/password` qua proxy. Đúng key thì backend lưu hash mật khẩu mới vào Mongo và mật khẩu
có hiệu lực ngay, không cần redeploy. Sai key thì báo lỗi, không tiết lộ gì thêm.

## 5. Bảo vệ `/admin`

Ba lớp:

1. `middleware.ts` — không có cookie `sn_session` thì redirect `/admin/login`.
2. `app/(admin)/admin/layout.tsx` — gọi backend kiểm tra session thật (chữ ký HMAC), sai thì redirect.
3. Backend — mọi request ghi đều kiểm tra session + `Origin`.

`/admin/login` nằm ở route group `(auth)` nên không bị layout bảo vệ.

## 6. Mobile-first

- Entry list: `Table` ở `sm+`, chuyển thành `Stack` ở màn nhỏ — không tràn ngang ở 360px.
- Drawer: `temporary` (có nút menu) dưới `md`, `permanent` từ `md` trở lên.
- Nút hành động chính full-width trên điện thoại, `Fab` thêm con nợ ở góc dưới.
- Ô số tiền: `inputMode="numeric"`, đang gõ hiện số trần, blur thì hiện `1.250.000`.
- Ô ngày: `TextField type="date"` (không dùng `@mui/x-date-pickers`, không kéo `dayjs`).

## 7. Theme

`createTheme` với `cssVariables: { colorSchemeSelector: 'data-mui-color-scheme' }` +
`colorSchemes: { light, dark }`. Mặc định theo hệ thống (`defaultMode="system"`),
có nút đổi sáng/tối trên AppBar. `InitColorSchemeScript` đặt trong `<html>` để không bị FOUC.

## 8. Deploy Vercel

Repo đã có `vercel.json`: pin region **`sin1`** (gần Atlas Singapore) và framework Next.js.

**Thứ tự deploy: BE trước, FE sau, rồi cập nhật lại BE.**

1. Import repo → Vercel tự nhận Next.js, giữ Root Directory (`.`) và Build Command mặc định.
2. Environment Variables (Production):
   `API_BASE_URL=https://so-no-be.vercel.app` — **không** có dấu `/` ở cuối, không phải `localhost`.
   (Đổi domain BE thì sửa đúng biến này rồi redeploy FE.)
3. Deploy, mở `https://<fe-domain>/admin/login`. Nếu trang báo "Không kết nối được máy chủ dữ liệu"
   thì `API_BASE_URL` sai hoặc BE chưa deploy xong.
4. Quay lại project BE: đặt `ALLOWED_ORIGINS` = domain FE
   (hoặc `https://*.vercel.app` để mọi domain con của Vercel đều qua, kể cả preview) → **Redeploy BE**.
   Nếu bỏ bước này, mọi thao tác ghi (đăng nhập, thêm khoản…) sẽ trả `403 BAD_ORIGIN`.
5. Vercel **Deployment Protection** phải tắt với Production, nếu không con nợ mở `/s/{code}` sẽ bị chặn.
6. Đổi mật khẩu admin lần đầu bằng nút **Quên mật khẩu?** với `ADMIN_RECOVERY_KEY` đã đặt bên BE.

**Dùng domain riêng (tuỳ chọn):** gắn domain cho FE rồi cập nhật `ALLOWED_ORIGINS` bên BE
và `API_BASE_URL` bên FE theo domain mới, sau đó redeploy cả hai.

Node: `engines.node >= 20` (Vercel chọn 22.x).

## 9. Cấu trúc

```
app/(admin)/admin/**     # khu quản trị (layout bảo vệ + AdminShell)
app/(auth)/admin/login   # đăng nhập (không bị layout bảo vệ)
app/s/[code]             # trang công khai, RSC, no-store, noindex
app/api/[...path]        # proxy sang backend
components/admin/**      # AppBar/Drawer, danh sách con nợ, chi tiết sổ, dialog quên mật khẩu
components/ledger/**     # dialog thêm khoản, dialog chốt, ô tiền, hiển thị tiền
components/public/**     # lịch sử thanh toán (Accordion), lọc tháng
lib/api.ts               # gọi BE từ server (kèm cookie)
lib/client-api.ts        # gọi /api từ trình duyệt
```
