/**
 * utils/excel.js
 * Thư viện chuyên dụng đọc và xử lý file Excel xuất từ hệ thống SMIS
 * Hỗ trợ khắc phục lỗi truncated !ref của SMIS và phục vụ 3 mục: 3.4.1, 3.4.2, 3.4.3
 * Tác giả: Thầy Phương - Trường TH&THCS Ngô Thất Sơn
 */

const ExcelHelper = {
  readFileAsync(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.onerror = (err) => reject(err);
      reader.readAsArrayBuffer(file);
    });
  },

  /**
   * Khắc phục lỗi kinh điển của hệ thống SMIS:
   * Header XML trong file xuất của SMIS bị lỗi dimension (ví dụ ref="A1:I1" hoặc "A1:Z2")
   * khiến thư viện chỉ đọc được 1-2 dòng đầu. Hàm này tự động tính toán lại phạm vi thực tế của bảng.
   */
  fixSheetRange(sheet) {
    if (!sheet) return sheet;
    let minRow = Infinity, maxRow = -Infinity;
    let minCol = Infinity, maxCol = -Infinity;

    for (const key of Object.keys(sheet)) {
      if (key.startsWith('!')) continue;
      const match = key.match(/^([A-Z]+)(\d+)$/);
      if (match) {
        const colStr = match[1];
        const row = parseInt(match[2], 10);
        let col = 0;
        for (let i = 0; i < colStr.length; i++) {
          col = col * 26 + (colStr.charCodeAt(i) - 64);
        }
        if (row < minRow) minRow = row;
        if (row > maxRow) maxRow = row;
        if (col < minCol) minCol = col;
        if (col > maxCol) maxCol = col;
      }
    }

    if (minRow !== Infinity && maxRow !== -Infinity) {
      function colToLetter(c) {
        let s = '';
        while (c > 0) {
          let m = (c - 1) % 26;
          s = String.fromCharCode(65 + m) + s;
          c = Math.floor((c - m) / 26);
        }
        return s;
      }
      sheet['!ref'] = colToLetter(minCol) + minRow + ':' + colToLetter(maxCol) + maxRow;
    }
    return sheet;
  },

  /**
   * XỬ LÝ MỤC 3.4.1: KẾT QUẢ MÔN HỌC VÀ HOẠT ĐỘNG GIÁO DỤC
   * (Ví dụ: filemau_danhgia_dinhkyc1_tt27_2020_2a_GK1.xlsx)
   */
  parseSMIS341(buffer, targetSheetName = null) {
    if (typeof XLSX === 'undefined') throw new Error('Thư viện XLSX chưa sẵn sàng.');
    const workbook = XLSX.read(buffer, { type: 'array' });

    // Lọc danh sách các sheet môn học (loại bỏ sheet HuongDan nếu có)
    const subjectSheets = workbook.SheetNames.filter(name => {
      const lower = name.toLowerCase();
      return !lower.includes('huongdan') && !lower.includes('hướng dẫn');
    });

    if (subjectSheets.length === 0) {
      throw new Error('Không tìm thấy sheet môn học nào trong file 3.4.1!');
    }

    const currentSheetName = (targetSheetName && subjectSheets.includes(targetSheetName))
      ? targetSheetName
      : subjectSheets[0];

    const sheet = this.fixSheetRange(workbook.Sheets[currentSheetName]);
    const rawRows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

    if (rawRows.length < 2) {
      throw new Error(`Sheet "${currentSheetName}" không có dữ liệu học sinh!`);
    }

    // Xác định dòng tiêu đề (thường là dòng 1: STT, Mã định danh/Mã học sinh, Họ và tên, Ngày sinh, Mức đạt được, Điểm KTĐK, Nội dung nhận xét)
    let headerRowIdx = 0;
    for (let r = 0; r < Math.min(rawRows.length, 5); r++) {
      const rowStr = (rawRows[r] || []).join(' ').toLowerCase();
      if (rowStr.includes('họ và tên') || rowStr.includes('học sinh') || rowStr.includes('mã')) {
        headerRowIdx = r;
        break;
      }
    }

    const headers = rawRows[headerRowIdx] || [];
    let colStt = 0, colId = 1, colName = 2, colDob = 3, colRating = 4, colScore = 5, colCommentCode = 6, colComment = 7, colTerm = 8;

    headers.forEach((h, idx) => {
      const txt = String(h).toLowerCase().trim();
      if (txt === 'stt' || txt.includes('thứ tự')) colStt = idx;
      else if ((txt.includes('mã định danh') || txt.includes('mã học sinh') || txt.includes('mã hs') || txt === 'mã') && !txt.includes('nhận xét')) colId = idx;
      else if (txt.includes('họ và tên') || txt.includes('họ tên')) colName = idx;
      else if (txt.includes('ngày sinh')) colDob = idx;
      else if (txt.includes('mức')) colRating = idx;
      else if ((txt.includes('điểm ktđk') || txt.includes('điểm kt') || txt.includes('điểm số') || txt === 'điểm') && !txt.includes('thời điểm')) colScore = idx;
      else if (txt.includes('mã nhận xét') || txt === 'mã nx') colCommentCode = idx;
      else if (txt.includes('nội dung nhận xét') || txt.includes('nội dung')) colComment = idx;
      else if (txt.includes('thời điểm') || txt.includes('đợt')) colTerm = idx;
    });

    const students = [];
    for (let r = headerRowIdx + 1; r < rawRows.length; r++) {
      const row = rawRows[r];
      if (!row || !row[colName]) continue;

      const rawRating = String(row[colRating] || '').trim().toUpperCase();
      let rating = 'T';
      if (rawRating === 'H' || rawRating === 'Đ' || rawRating.includes('HOÀN THÀNH') || rawRating.includes('ĐẠT')) {
        rating = 'H';
      } else if (rawRating === 'C' || rawRating.includes('CHƯA')) {
        rating = 'C';
      } else if (rawRating === 'T' || rawRating.includes('TỐT')) {
        rating = 'T';
      }

      students.push({
        stt: String(row[colStt] || students.length + 1).trim(),
        id: String(row[colId] || '').trim(),
        name: String(row[colName] || '').trim(),
        dob: String(row[colDob] || '').trim(),
        rating: rating,
        score: String(row[colScore] || '').trim(),
        commentCode: String(row[colCommentCode] || '').trim(),
        comment: String(row[colComment] || '').trim(),
        term: String(row[colTerm] || 'GK1').trim(),
        rowIndex: r + 1,
        sheetName: currentSheetName
      });
    }

    return {
      workbook,
      subjectSheets,
      currentSheetName,
      students
    };
  },

  /**
   * XỬ LÝ MỤC 3.4.2: KẾT QUẢ NĂNG LỰC VÀ PHẨM CHẤT
   * (Ví dụ: danhgia_nlpc_data_2a_GK1.xlsx)
   */
  parseSMIS342(buffer) {
    if (typeof XLSX === 'undefined') throw new Error('Thư viện XLSX chưa sẵn sàng.');
    const workbook = XLSX.read(buffer, { type: 'array' });

    const sheetName = workbook.SheetNames[0];
    const sheet = this.fixSheetRange(workbook.Sheets[sheetName]);
    const rawRows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

    if (rawRows.length < 3) {
      throw new Error('File 3.4.2 không có dữ liệu học sinh hợp lệ!');
    }

    // Cấu trúc chuẩn của SMIS 3.4.2:
    // Hàng 1 (Index 0): STT | Mã | Họ và tên | Ngày sinh | Năng lực chung (3 cột) | Năng lực đặc thù (7 cột) | Phẩm chất (5 cột) | NX NL chung | NX NL đặc thù | NX Phẩm chất | Thời điểm
    // Dữ liệu học sinh bắt đầu từ dòng 3 (Index 2)
    const students = [];
    for (let r = 2; r < rawRows.length; r++) {
      const row = rawRows[r];
      const name = String(row[2] || '').trim();
      if (!name) continue;

      students.push({
        stt: String(row[0] || students.length + 1).trim(),
        id: String(row[1] || '').trim(),
        name: name,
        dob: String(row[3] || '').trim(),
        rating: 'T', // Mức tổng quan (T: Tốt, Đ: Đạt, C: Cần cố gắng)
        // Năng lực chung:
        nl_tuchu: row[4] || 'T',
        nl_giaotiep: row[5] || 'T',
        nl_giaiquyet: row[6] || 'T',
        // Năng lực đặc thù:
        nl_ngonngu: row[7] || 'T',
        nl_tinhToan: row[8] || 'T',
        nl_khoahoc: row[9] || 'T',
        nl_congnghe: row[10] || 'T',
        nl_tinhoc: row[11] || 'T',
        nl_thammi: row[12] || 'T',
        nl_thechat: row[13] || 'T',
        // Phẩm chất:
        pc_yeunuoc: row[14] || 'T',
        pc_nhanai: row[15] || 'T',
        pc_chamchi: row[16] || 'T',
        pc_trungthuc: row[17] || 'T',
        pc_trachnhiem: row[18] || 'T',
        commentNLChung: String(row[20] || '').trim(),
        commentNLDacThu: String(row[22] || '').trim(),
        commentPhamChat: String(row[24] || '').trim(),
        term: String(row[25] || 'GK1').trim(),
        rowIndex: r + 1
      });
    }

    return {
      workbook,
      sheetName,
      students
    };
  },

  /**
   * XỬ LÝ MỤC 3.4.3: NHẬP NHẬN XÉT IN HỌC BẠ CỦA GVCN
   */
  parseSMIS343(buffer) {
    if (typeof XLSX === 'undefined') throw new Error('Thư viện XLSX chưa sẵn sàng.');
    const workbook = XLSX.read(buffer, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const sheet = this.fixSheetRange(workbook.Sheets[sheetName]);
    const rawRows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

    let headerRowIdx = 0;
    for (let r = 0; r < Math.min(rawRows.length, 5); r++) {
      const rowStr = (rawRows[r] || []).join(' ').toLowerCase();
      if (rowStr.includes('họ và tên') || rowStr.includes('học sinh') || rowStr.includes('stt')) {
        headerRowIdx = r;
        break;
      }
    }

    const headers = rawRows[headerRowIdx] || [];
    let colStt = 0, colId = 1, colName = 2, colRating = -1, colComment = 3;

    headers.forEach((h, idx) => {
      const txt = String(h).toLowerCase();
      if (txt === 'stt') colStt = idx;
      else if (txt.includes('mã')) colId = idx;
      else if (txt.includes('họ và tên') || txt.includes('họ tên')) colName = idx;
      else if (txt.includes('mức') || txt.includes('xếp loại') || txt.includes('kết quả') || txt === 'đánh giá') colRating = idx;
      else if (txt.includes('nhận xét') || txt.includes('học bạ')) colComment = idx;
    });

    const students = [];
    for (let r = headerRowIdx + 1; r < rawRows.length; r++) {
      const row = rawRows[r];
      const name = String(row[colName] || '').trim();
      if (!name) continue;

      let rate = 'T';
      if (colRating !== -1 && row[colRating]) {
        const raw = String(row[colRating]).trim().toUpperCase();
        if (raw === 'H' || raw === 'Đ' || raw.includes('HOÀN THÀNH') || raw.includes('ĐẠT')) rate = 'H';
        else if (raw === 'C' || raw.includes('CHƯA') || raw.includes('CỐ GẮNG')) rate = 'C';
        else rate = 'T';
      }

      students.push({
        stt: String(row[colStt] || students.length + 1).trim(),
        id: String(row[colId] || '').trim(),
        name: name,
        rating: rate,
        comment: String(row[colComment] || '').trim(),
        rowIndex: r + 1
      });
    }

    return {
      workbook,
      sheetName,
      students
    };
  },

  /**
   * XUẤT FILE EXCEL ĐÃ ĐIỀN ĐỦ MỤC 3.4.1 (ĐỂ IMPORT VÀO SMIS)
   */
  exportFilled341(workbook, currentSheetName, students) {
    const sheet = this.fixSheetRange(workbook.Sheets[currentSheetName]);
    
    // Ghi Mức đạt được vào cột E (Col 5), Mã nhận xét vào cột G (Col 7) và Nhận xét vào cột H (Col 8)
    students.forEach(st => {
      const r = st.rowIndex;
      const rateVal = (st.rating === 'H' || st.rating === 'Đ') ? 'H' : (st.rating === 'C' ? 'C' : 'T');
      sheet[`E${r}`] = { t: 's', v: rateVal };
      if (st.score) {
        sheet[`F${r}`] = { t: 's', v: String(st.score) };
      }
      sheet[`G${r}`] = { t: 's', v: st.commentCode || '' };
      sheet[`H${r}`] = { t: 's', v: st.comment || '' };
    });

    return XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  },

  /**
   * XUẤT FILE EXCEL ĐÃ ĐIỀN ĐỦ MỤC 3.4.2 (ĐỂ IMPORT VÀO SMIS)
   */
  exportFilled342(workbook, students, defaultRate = 'T') {
    const sheetName = workbook.SheetNames[0];
    const sheet = this.fixSheetRange(workbook.Sheets[sheetName]);

    // Các cột đánh giá (E đến S: 15 cột từ col 5 đến col 19)
    // Cột E-G: Tự chủ, Giao tiếp, Giải quyết VĐ
    // Cột H-N: Ngôn ngữ, Tính toán, Khoa học, Công nghệ, Tin học, Thẩm mĩ, Thể chất
    // Cột O-S: Yêu nước, Nhân ái, Chăm chỉ, Trung thực, Trách nhiệm
    // Cột U: Nhận xét NL chung
    // Cột W: Nhận xét NL đặc thù
    // Cột Y: Nhận xét Phẩm chất
    const ratingCols = ['E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S'];

    students.forEach(st => {
      const r = st.rowIndex;
      const rateVal = (st.rating === 'Đ' || st.rating === 'H') ? 'Đ' : (st.rating === 'C' ? 'C' : 'T');
      const indVal = [
        st.nl_tuchu, st.nl_giaotiep, st.nl_giaiquyet,
        st.nl_ngonngu, st.nl_tinhToan, st.nl_khoahoc, st.nl_congnghe, st.nl_tinhoc, st.nl_thammi, st.nl_thechat,
        st.pc_yeunuoc, st.pc_nhanai, st.pc_chamchi, st.pc_trungthuc, st.pc_trachnhiem
      ];

      // Điền 15 tiêu chí Năng lực & Phẩm chất
      ratingCols.forEach((col, idx) => {
        const val = indVal[idx] || rateVal;
        sheet[`${col}${r}`] = { t: 's', v: val };
      });

      // Điền 3 nội dung nhận xét
      sheet[`U${r}`] = { t: 's', v: st.commentNLChung || '' };
      sheet[`W${r}`] = { t: 's', v: st.commentNLDacThu || '' };
      sheet[`Y${r}`] = { t: 's', v: st.commentPhamChat || '' };
    });

    return XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  },

  /**
   * XUẤT FILE EXCEL ĐÃ ĐIỀN ĐỦ MỤC 3.4.3 (HỌC BẠ)
   */
  exportFilled343(workbook, students) {
    const sheetName = workbook.SheetNames[0];
    const sheet = this.fixSheetRange(workbook.Sheets[sheetName]);

    students.forEach(st => {
      const r = st.rowIndex;
      sheet[`D${r}`] = { t: 's', v: st.comment || '' };
    });

    return XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
  }
};

if (typeof module !== 'undefined' && module.exports) module.exports = ExcelHelper;
else if (typeof window !== 'undefined') window.ExcelHelper = ExcelHelper;
