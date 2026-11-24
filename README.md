# TIỆN ÍCH CHROME EXTENSION: "SMIS PRO – NHẬP NHẬN XÉT HÀNG LOẠT"
### Chuẩn Thông tư 27/2020/TT-BGDĐT & Chương trình GDPT 2018
**Tác giả:** Thầy Phương - Trường TH&THCS Ngô Thất Sơn  
**Hệ thống hỗ trợ:** Nền tảng số Quản trị Giáo dục Quốc gia SMIS (`smis.moet.edu.vn`, `csdl.moet.gov.vn`, `moet.gov.vn`)

---

## 🎯 1. GIỚI THIỆU & 3 MỤC TIÊU CỐT LÕI

Tiện ích mở rộng **SMIS Pro** (Manifest V3) được thiết kế chuyên biệt và tối ưu 100% cho 3 phân hệ đánh giá định kỳ quan trọng nhất trên hệ thống SMIS Tiểu học:

1. **Mục 3.4.1: Kết quả Môn học và hoạt động giáo dục** (`DanhGiaDinhKy.aspx`)
   - Tương thích tuyệt đối với file Excel xuất từ SMIS: `filemau_danhgia_dinhkyc1_tt27_2020_...xlsx`
   - Tự động nhận diện đầy đủ **8 môn học** qua các sheet: *Tiếng Việt, Toán, Tự nhiên và Xã hội, Nghệ thuật (Âm nhạc), Nghệ thuật (Mĩ thuật), Hoạt động trải nghiệm, Giáo dục thể chất, Đạo đức*.
   - Cho phép chọn môn học, gán nhanh mức T / H / C, tự động sinh nhận xét phân hóa môn học theo YCCĐ.
   - **2 chế độ thực hiện:** Xuất file Excel đã điền (để bấm nút `Nhập Excel` trên SMIS) HOẶC Điền tự động trực tiếp trên giao diện web SMIS.

2. **Mục 3.4.2: Kết quả Năng lực và Phẩm chất** (`DanhGiaNLPC.aspx`)
   - Tương thích tuyệt đối với file Excel xuất từ SMIS: `danhgia_nlpc_data_...xlsx`
   - Tự động xử lý bảng 2 tầng header, điền đủ **15 tiêu chí đánh giá** (3 Năng lực chung + 7 Năng lực đặc thù + 5 Phẩm chất chủ yếu) theo các mức Tốt (T) / Đạt (Đ) / Cần cố gắng (C).
   - Tự động sinh **3 nội dung nhận xét chuyên sâu**: Nhận xét Năng lực chung, Nhận xét Năng lực đặc thù, Nhận xét Phẩm chất chủ yếu.
   - **2 chế độ thực hiện:** Xuất file Excel chuẩn cấu trúc để Import vào SMIS HOẶC Tự động điền trực tiếp trên trang SMIS.

3. **Mục 3.4.3: Nhập nhận xét in học bạ của GVCN** (`NhapNhanXetHocBa.aspx`)
   - Tự động kế thừa danh sách học sinh từ mục 3.4.1 hoặc 3.4.2 (không cần tải lại file).
   - Tự động sinh nhận xét học bạ tổng quát, giàu tính khích lệ, chuẩn phong cách sư phạm TT27.
   - Xuất file Excel hoặc điền trực tiếp trên bảng in học bạ của SMIS.

---

## 🏗 2. CẤU TRÚC THƯ MỤC TIỆN ÍCH

```text
E:\TIỆN ÍCH ĐÁNH GIÁ TRÊN SMIS (TT27)\
├── manifest.json              # Khai báo tiện ích Manifest V3, host permissions
├── popup.html                 # Giao diện điều khiển 4 tab chuyên biệt (3.4.1, 3.4.2, 3.4.3, HD)
├── popup.css                  # Bộ giao diện phong cách sư phạm hiện đại, trực quan
├── popup.js                   # Logic điều khiển, đọc Excel đa sheet, xoay vòng câu
├── content.js                 # Script chạy ngầm quét DOM SMIS, tự điền 3 mục và lưu
├── background.js              # Service Worker quản lý badge
├── libs/
│   └── xlsx.full.min.js       # Thư viện SheetJS đọc file Excel cực nhanh
├── utils/
│   ├── comments-bank.js       # Ngân hàng 412+ câu nhận xét 5 khối lớp
│   ├── excel.js               # Bộ giải mã Excel SMIS (fixSheetRange, đa sheet, 15 tiêu chí NL&PC)
│   └── matcher.js             # Thuật toán so khớp học sinh (STT, Mã HS, Họ tên)
├── templates/                 # File mẫu tham khảo
├── icons/                     # Bộ biểu tượng 16x16, 48x48, 128x128
└── README.md                  # Cẩm nang hướng dẫn chi tiết
```

---

## 🚀 3. HƯỚNG DẪN CÀI ĐẶT / CẬP NHẬT TIỆN ÍCH (30 GIÂY)

1. Mở trình duyệt **Google Chrome** hoặc **Cốc Cốc** / **Microsoft Edge**.
2. Gõ vào thanh địa chỉ: `chrome://extensions/` và nhấn **Enter**.
3. Bật công tắc **"Chế độ dành cho nhà phát triển" (Developer mode)** ở góc trên bên phải màn hình.
4. Bấm vào nút **"Tải tiện ích đã giải nén" (Load unpacked)** ở góc trên bên trái.
   *(Nếu đã cài tiện ích trước đó, chỉ cần bấm biểu tượng **Vòng xoay Cập nhật / Tải lại** 🔄 trên thẻ SMIS Pro).*
5. Chọn thư mục: `E:\TIỆN ÍCH ĐÁNH GIÁ TRÊN SMIS (TT27)`.
6. Tiện ích **SMIS Pro – Đánh giá Tiểu học (3.4.1 - 3.4.2 - 3.4.3)** đã sẵn sàng hoạt động! Hãy ghim (Pin) biểu tượng tiện ích lên thanh trình duyệt.

---

## 📋 4. HƯỚNG DẪN SỬ DỤNG CHO 3 MỤC ĐÁNH GIÁ

### 🌟 MỤC 3.4.1: ĐÁNH GIÁ MÔN HỌC & HĐGD
1. Trên SMIS: Vào `3. Hồ sơ học sinh → 3.4. Đánh giá học tập → 3.4.1. Kết quả Môn học và hoạt động giáo dục`. Chọn Lớp và bấm **Xuất Excel** (file dạng `filemau_danhgia_dinhkyc1_tt27_2020_...xlsx`).
2. Mở tiện ích **SMIS Pro** → Chọn tab **3.4.1 Môn học & HĐGD**:
   - Kéo thả hoặc chọn file Excel vừa tải về (tiện ích tự đọc tất cả 8 môn học).
   - Chọn Môn học muốn đánh giá ở menu thả xuống.
   - Bấm nút **⭐ Tất cả Tốt (T)** hoặc **✔ Tất cả H.Thành (H)** để gán nhanh mức cả lớp.
   - Bấm **⚡ TỰ ĐỘNG SINH NHẬN XÉT THEO MÔN** (thuật toán tự động sinh câu nhận xét chuyên biệt cho từng em).
3. **Thực hiện một trong 2 cách:**
   - **Cách A (Khuyên dùng - Nhanh nhất):** Bấm nút xanh **"📥 XUẤT EXCEL ĐÃ ĐIỀN ĐỦ"** → Quay lại trang SMIS bấm nút **Nhập Excel** rồi chọn file vừa tải về. Toàn bộ điểm, mức đánh giá và nhận xét của cả lớp sẽ được nạp vào SMIS ngay tức khắc!
   - **Cách B (Điền trực tiếp):** Nhấn nút tím **"🚀 BẮT ĐẦU ĐIỀN TRỰC TIẾP TRÊN TRANG"** → Tiện ích tự điền từng ô trên bảng SMIS.

---

### 🌟 MỤC 3.4.2: ĐÁNH GIÁ NĂNG LỰC & PHẨM CHẤT
1. Trên SMIS: Vào `3. Hồ sơ học sinh → 3.4. Đánh giá học tập → 3.4.2. Kết quả Năng lực và Phẩm chất`. Bấm **Xuất Excel** (file dạng `danhgia_nlpc_data_...xlsx`).
2. Mở tiện ích **SMIS Pro** → Chọn tab **3.4.2 Năng lực & Phẩm chất**:
   - Chọn file `danhgia_nlpc_data_...xlsx` vừa xuất.
   - Bấm **⭐ Đặt tất cả Tốt (T)** hoặc **✔ Đặt tất cả Đạt (Đ)** (tiện ích tự gán cả 15 tiêu chí Năng lực và Phẩm chất cho tất cả học sinh).
   - Bấm **⚡ TỰ ĐỘNG SINH 3 NỘI DUNG NHẬN XÉT (TT27)**: Tiện ích tự động tạo 3 câu nhận xét riêng biệt cho từng em (1 câu Năng lực chung, 1 câu Năng lực đặc thù, 1 câu Phẩm chất chủ yếu).
3. **Thực hiện một trong 2 cách:**
   - **Cách A (Khuyên dùng):** Bấm **"📥 XUẤT EXCEL ĐÃ ĐIỀN (15 TIÊU CHÍ + 3 NHẬN XÉT)"** → Lên trang SMIS bấm **Nhập Excel** để nạp cả lớp vào hệ thống trong 1 thao tác.
   - **Cách B:** Bấm **"🚀 BẮT ĐẦU ĐIỀN NĂNG LỰC & PHẨM CHẤT"** để tiện ích tự điền từng hàng trên trang SMIS.

---

### 🌟 MỤC 3.4.3: NHẬP NHẬN XÉT IN HỌC BẠ CỦA GVCN
1. Trên SMIS: Mở mục `3.4.3. Nhập nhận xét in học bạ của GVCN`.
2. Mở tiện ích **SMIS Pro** → Chọn tab **3.4.3 Nhận xét học bạ**:
   - Bấm nút **🔄 Dùng danh sách đã có** (để kế thừa ngay danh sách học sinh từ mục 3.4.1/3.4.2 mà không cần tải lại file Excel) hoặc tải file xuất từ mục 3.4.3.
   - Bấm nút **⚡ TỰ ĐỘNG SINH NHẬN XÉT HỌC BẠ TỔNG QUÁT**.
   - Bấm **📥 Xuất file Excel** hoặc **🚀 Bắt đầu điền nhận xét học bạ**.

### 💡 LƯU Ý QUAN TRỌNG VỀ CỘT "MÃ NHẬN XÉT":
- Nhìn vào sheet **HuongDan** trong file mẫu của SMIS: Cột **"Mã nhận xét" KHÔNG có dấu 'x' ở cột Bắt buộc** (chỉ có Mã học sinh, Họ tên, Ngày sinh, Thời điểm đánh giá là bắt buộc).
- Khi Thầy/Cô đã nhập đầy đủ câu chữ vào ô **"Nội dung nhận xét"**, cột **"Mã nhận xét" ĐỂ TRỐNG LÀ HOÀN TOÀN HỢP LỆ VÀ ĐÚNG CHUẨN THIẾT KẾ CỦA SMIS**.
- Thầy/Cô chỉ cần bấm nút **"Ghi"** ở góc trên bên phải màn hình (hoặc bấm **Nhập ĐGĐK từ Excel**), SMIS sẽ lưu thành công toàn bộ điểm và nhận xét vào học bạ.
- Tiện ích hiện đã bổ sung tùy chọn tại mục 3.4.1:
  + `⚪ Để trống (Chuẩn SMIS - Khuyên dùng vì đã có Nội dung văn xuôi hoàn chỉnh)`
  + `🔢 Tự gán mã theo Mức (T01, T02... / H01, H02...)` nếu trường Thầy có yêu cầu mã.

---

## 🛠 5. CẨM NANG XỬ LÝ SỰ CỐ NHANH

- **Trình duyệt báo không tải được file Excel:**
  - Tiện ích đã được nâng cấp thuật toán `fixSheetRange`, khắc phục 100% lỗi file xuất từ SMIS bị giới hạn phạm vi bảng (`A1:I1` hoặc `A1:Z2`). Thầy/cô chỉ cần tải lại tiện ích để cập nhật bản mới nhất.
- **Báo "Chưa mở SMIS" hoặc "Cần F5 lại trang":**
  - Mở đúng tab SMIS trên trình duyệt (`smis.moet.edu.vn`), nhấn phím **F5** để làm mới trang web, sau đó bấm mở lại tiện ích.
- **Bảng trên SMIS chưa hiện học sinh khi điền trực tiếp:**
  - Nhớ chọn Khối, Lớp, Học kỳ trên thanh công cụ SMIS và bấm nút **Tìm kiếm** hoặc **Lấy danh sách** để bảng học sinh xuất hiện trước khi nhấn Bắt đầu điền.
