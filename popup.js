/**
 * popup.js
 * Điều khiển giao diện Extension SMIS Pro – Tự động hóa đánh giá học sinh Thông tư 27
 * Chuyên sâu 3 mục trọng tâm: 3.4.1, 3.4.2, 3.4.3
 * Tác giả: Thầy Phương - Trường TH&THCS Ngô Thất Sơn
 */

document.addEventListener('DOMContentLoaded', async () => {
  // =========================================================================
  // 1. KHỞI TẠO BIẾN TRẠNG THÁI
  // =========================================================================
  let currentActiveTab = null;

  // Dữ liệu mục 3.4.1
  let data341 = {
    workbook: null,
    subjectSheets: [],
    currentSheetName: '',
    students: [],
    fileName: ''
  };

  // Dữ liệu mục 3.4.2
  let data342 = {
    workbook: null,
    students: [],
    fileName: ''
  };

  // Dữ liệu mục 3.4.3
  let data343 = {
    workbook: null,
    students: [],
    fileName: ''
  };

  // Status & Header
  const connectionStatusEl = document.getElementById('connectionStatus');
  const tabButtons = document.querySelectorAll('.tab-btn');
  const tabPanes = document.querySelectorAll('.tab-pane');

  // DOM Elements Tab 1 (3.4.1)
  const dropZone341 = document.getElementById('dropZone341');
  const fileInput341 = document.getElementById('fileInput341');
  const fileInfo341 = document.getElementById('fileInfo341');
  const fileName341 = document.getElementById('fileName341');
  const btnRemoveFile341 = document.getElementById('btnRemoveFile341');
  const controlsCard341 = document.getElementById('controlsCard341');
  const selSheet341 = document.getElementById('selSheet341');
  const selGrade341 = document.getElementById('selGrade341');
  const selTerm341 = document.getElementById('selTerm341');
  const selCodeMode341 = document.getElementById('selCodeMode341');
  const btnSetAll341T = document.getElementById('btnSetAll341T');
  const btnSetAll341H = document.getElementById('btnSetAll341H');
  const btnAutoGenerate341 = document.getElementById('btnAutoGenerate341');
  const previewCard341 = document.getElementById('previewCard341');
  const previewCount341 = document.getElementById('previewCount341');
  const previewTable341 = document.getElementById('previewTable341').querySelector('tbody');
  const actionSection341 = document.getElementById('actionSection341');
  const btnStart341 = document.getElementById('btnStart341');
  const btnExportExcel341 = document.getElementById('btnExportExcel341');
  const btnStop341 = document.getElementById('btnStop341');
  const progressBox341 = document.getElementById('progressBox341');
  const progressBar341 = document.getElementById('progressBar341');
  const progressPercent341 = document.getElementById('progressPercent341');
  const progressText341 = document.getElementById('progressText341');
  const progressLog341 = document.getElementById('progressLog341');

  // DOM Elements Tab 2 (3.4.2)
  const dropZone342 = document.getElementById('dropZone342');
  const fileInput342 = document.getElementById('fileInput342');
  const fileInfo342 = document.getElementById('fileInfo342');
  const fileName342 = document.getElementById('fileName342');
  const btnRemoveFile342 = document.getElementById('btnRemoveFile342');
  const controlsCard342 = document.getElementById('controlsCard342');
  const selGrade342 = document.getElementById('selGrade342');
  const selDefaultRate342 = document.getElementById('selDefaultRate342');
  const btnSetAll342T = document.getElementById('btnSetAll342T');
  const btnSetAll342D = document.getElementById('btnSetAll342D');
  const btnAutoGenerate342 = document.getElementById('btnAutoGenerate342');
  const previewCard342 = document.getElementById('previewCard342');
  const previewCount342 = document.getElementById('previewCount342');
  const previewTable342 = document.getElementById('previewTable342').querySelector('tbody');
  const actionSection342 = document.getElementById('actionSection342');
  const btnStart342 = document.getElementById('btnStart342');
  const btnExportExcel342 = document.getElementById('btnExportExcel342');
  const btnStop342 = document.getElementById('btnStop342');
  const progressBox342 = document.getElementById('progressBox342');
  const progressBar342 = document.getElementById('progressBar342');
  const progressPercent342 = document.getElementById('progressPercent342');
  const progressText342 = document.getElementById('progressText342');
  const progressLog342 = document.getElementById('progressLog342');

  // DOM Elements Tab 3 (3.4.3)
  const dropZone343 = document.getElementById('dropZone343');
  const fileInput343 = document.getElementById('fileInput343');
  const fileInfo343 = document.getElementById('fileInfo343');
  const fileName343 = document.getElementById('fileName343');
  const btnRemoveFile343 = document.getElementById('btnRemoveFile343');
  const btnUseLoadedList343 = document.getElementById('btnUseLoadedList343');
  const controlsCard343 = document.getElementById('controlsCard343');
  const selGrade343 = document.getElementById('selGrade343');
  const selDefaultRate343 = document.getElementById('selDefaultRate343');
  const btnSetAll343T = document.getElementById('btnSetAll343T');
  const btnSetAll343H = document.getElementById('btnSetAll343H');
  const btnAutoGenerate343 = document.getElementById('btnAutoGenerate343');
  const previewCard343 = document.getElementById('previewCard343');
  const previewCount343 = document.getElementById('previewCount343');
  const previewTable343 = document.getElementById('previewTable343').querySelector('tbody');
  const actionSection343 = document.getElementById('actionSection343');
  const btnStart343 = document.getElementById('btnStart343');
  const btnExportExcel343 = document.getElementById('btnExportExcel343');
  const btnStop343 = document.getElementById('btnStop343');
  const progressBox343 = document.getElementById('progressBox343');
  const progressBar343 = document.getElementById('progressBar343');
  const progressPercent343 = document.getElementById('progressPercent343');
  const progressText343 = document.getElementById('progressText343');
  const progressLog343 = document.getElementById('progressLog343');

  // DOM Elements Tab 4 (Trợ giúp)
  const btnCheckPage = document.getElementById('btnCheckPage');
  const checkPageResult = document.getElementById('checkPageResult');

  // =========================================================================
  // 2. CHUYỂN ĐỔI TAB GIAO DIỆN
  // =========================================================================
  tabButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const targetTabId = btn.getAttribute('data-tab');
      tabButtons.forEach(b => b.classList.remove('active'));
      tabPanes.forEach(p => p.classList.remove('active'));

      btn.classList.add('active');
      const targetPane = document.getElementById(targetTabId);
      if (targetPane) targetPane.classList.add('active');
    });
  });

  // Tự động tiêm content script vào trang SMIS nếu chưa sẵn sàng
  async function ensureContentScriptReady(tabId) {
    try {
      const isReady = await new Promise(resolve => {
        chrome.tabs.sendMessage(tabId, { action: 'DETECT_PAGE' }, resp => {
          if (chrome.runtime.lastError || !resp || !resp.success) resolve(false);
          else resolve(true);
        });
      });

      if (!isReady && chrome.scripting) {
        await chrome.scripting.executeScript({
          target: { tabId: tabId, allFrames: true },
          files: ['utils/matcher.js', 'content.js']
        });
        await new Promise(r => setTimeout(r, 400));
      }
      return true;
    } catch (err) {
      console.warn('Lỗi kiểm tra tiêm script:', err);
      return false;
    }
  }

  // Kiểm tra kết nối SMIS
  async function checkSmisConnection() {
    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tabs || tabs.length === 0) {
        setConnectionStatus('disconnected', 'Không tìm thấy tab');
        return;
      }

      currentActiveTab = tabs[0];
      const url = currentActiveTab.url || '';

      const isSmis = url.includes('moet.gov.vn') || url.includes('moet.edu.vn') || url.includes('csdl.edu.vn') || url.includes('smis');

      if (isSmis) {
        chrome.tabs.sendMessage(currentActiveTab.id, { action: 'DETECT_PAGE' }, (response) => {
          if (chrome.runtime.lastError || !response) {
            setConnectionStatus('checking', 'SMIS (Cần F5 lại trang)');
          } else {
            const page = response.pageInfo;
            if (page.type === '341') {
              setConnectionStatus('connected', 'Đang mở 3.4.1 (Môn học)');
            } else if (page.type === '342') {
              setConnectionStatus('connected', 'Đang mở 3.4.2 (NL & PC)');
            } else if (page.type === '343') {
              setConnectionStatus('connected', 'Đang mở 3.4.3 (Học bạ)');
            } else {
              setConnectionStatus('connected', 'Đã kết nối SMIS');
            }
          }
        });
      } else {
        setConnectionStatus('disconnected', 'Chưa mở SMIS');
      }
    } catch (e) {
      setConnectionStatus('disconnected', 'Chưa kết nối');
    }
  }

  function setConnectionStatus(type, text) {
    connectionStatusEl.className = `status-badge ${type}`;
    connectionStatusEl.querySelector('.status-text').textContent = text;
  }

  await checkSmisConnection();

  // =========================================================================
  // 3. TAB 1: XỬ LÝ MỤC 3.4.1 (KẾT QUẢ MÔN HỌC & HĐGD)
  // =========================================================================
  setupDropZone(dropZone341, fileInput341, handleFile341);

  btnRemoveFile341.addEventListener('click', (e) => {
    e.stopPropagation();
    resetFile341();
  });

  async function handleFile341(file) {
    try {
      showFileInfo(file.name, fileInfo341, fileName341);
      data341.fileName = file.name;

      // Tự động nhận diện Khối lớp từ tên file (ví dụ: '2a' -> Khối 2)
      const gradeMatch = file.name.match(/[_-](\d)[a-zA-Z]/i) || file.name.match(/khoi(\d)/i) || file.name.match(/lop(\d)/i);
      if (gradeMatch && gradeMatch[1]) {
        selGrade341.value = gradeMatch[1];
      }

      const buffer = await ExcelHelper.readFileAsync(file);
      const res = ExcelHelper.parseSMIS341(buffer);

      data341.workbook = res.workbook;
      data341.subjectSheets = res.subjectSheets;
      data341.currentSheetName = res.currentSheetName;
      data341.students = res.students;

      // Nạp danh sách sheet vào dropdown
      selSheet341.innerHTML = '';
      data341.subjectSheets.forEach(sName => {
        const opt = document.createElement('option');
        opt.value = sName;
        opt.textContent = sName;
        if (sName === data341.currentSheetName) opt.selected = true;
        selSheet341.appendChild(opt);
      });

      controlsCard341.classList.remove('hidden');
      previewCard341.classList.remove('hidden');
      actionSection341.classList.remove('hidden');

      renderPreview341();
    } catch (err) {
      alert('Lỗi nạp file 3.4.1: ' + err.message);
      resetFile341();
    }
  }

  // Khi giáo viên đổi môn học (sheet khác trong file 3.4.1)
  selSheet341.addEventListener('change', () => {
    if (!data341.workbook) return;
    const targetSheet = selSheet341.value;
    try {
      const sheet = ExcelHelper.fixSheetRange(data341.workbook.Sheets[targetSheet]);
      const rawRows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

      // Lấy danh sách học sinh từ sheet mới
      const newStudents = [];
      for (let r = 1; r < rawRows.length; r++) {
        const row = rawRows[r];
        if (!row || !row[2]) continue;
        newStudents.push({
          stt: String(row[0] || newStudents.length + 1).trim(),
          id: String(row[1] || '').trim(),
          name: String(row[2] || '').trim(),
          dob: String(row[3] || '').trim(),
          rating: String(row[4] || 'T').trim().toUpperCase(),
          score: String(row[5] || '').trim(),
          comment: String(row[7] || '').trim(),
          term: String(row[8] || selTerm341.value).trim(),
          rowIndex: r + 1,
          sheetName: targetSheet
        });
      }

      data341.currentSheetName = targetSheet;
      data341.students = newStudents;
      renderPreview341();
    } catch (e) {
      alert('Không thể chuyển môn: ' + e.message);
    }
  });

  function resetFile341() {
    fileInput341.value = '';
    fileInfo341.classList.add('hidden');
    controlsCard341.classList.add('hidden');
    previewCard341.classList.add('hidden');
    actionSection341.classList.add('hidden');
    data341 = { workbook: null, subjectSheets: [], currentSheetName: '', students: [], fileName: '' };
    previewTable341.innerHTML = '';
  }

  function renderPreview341() {
    previewCount341.textContent = data341.students.length;
    previewTable341.innerHTML = '';

    data341.students.forEach((st, idx) => {
      const tr = document.createElement('tr');
      const r = (st.rating || 'T').toUpperCase();

      tr.innerHTML = `
        <td style="text-align: center; font-weight: 700;">${st.stt}</td>
        <td style="font-weight: 600; color: #0f766e;">${escapeHtml(st.name)}</td>
        <td style="text-align: center;">
          <select class="form-control sel-student-rate" data-idx="${idx}" style="padding: 2px 4px; font-weight: 700; font-size: 11px;">
            <option value="T" ${r === 'T' ? 'selected' : ''}>T</option>
            <option value="H" ${(r === 'H' || r === 'Đ') ? 'selected' : ''}>H (Đ)</option>
            <option value="C" ${r === 'C' ? 'selected' : ''}>C</option>
          </select>
        </td>
        <td style="text-align: center;">
          <input type="text" class="form-control inp-student-score" value="${escapeHtml(st.score || '')}" data-idx="${idx}" style="padding: 2px 4px; text-align: center; font-weight: 600; font-size: 11px;">
        </td>
        <td style="text-align: center;">
          <input type="text" class="form-control inp-student-code" value="${escapeHtml(st.commentCode || '')}" data-idx="${idx}" placeholder="Mã" style="padding: 2px 4px; text-align: center; font-size: 11px; max-width: 50px;">
        </td>
        <td>
          <input type="text" class="form-control inp-student-comment" value="${escapeHtml(st.comment || '')}" data-idx="${idx}" placeholder="Nhận xét môn học...">
        </td>
      `;

      tr.querySelector('.sel-student-rate').addEventListener('change', (e) => {
        data341.students[idx].rating = e.target.value;
      });

      tr.querySelector('.inp-student-score').addEventListener('input', (e) => {
        data341.students[idx].score = e.target.value;
      });

      tr.querySelector('.inp-student-code').addEventListener('input', (e) => {
        data341.students[idx].commentCode = e.target.value;
      });

      tr.querySelector('.inp-student-comment').addEventListener('input', (e) => {
        data341.students[idx].comment = e.target.value;
      });

      previewTable341.appendChild(tr);
    });
  }

  btnSetAll341T.addEventListener('click', () => {
    data341.students.forEach(s => s.rating = 'T');
    renderPreview341();
  });

  btnSetAll341H.addEventListener('click', () => {
    data341.students.forEach(s => s.rating = 'H');
    renderPreview341();
  });

  // Tự động sinh nhận xét môn học 3.4.1 (YCCĐ Thông tư 27)
  btnAutoGenerate341.addEventListener('click', () => {
    if (data341.students.length === 0) return;

    const grade = selGrade341.value || "2";
    const sheetNameLower = (data341.currentSheetName || '').toLowerCase();
    const codeMode = selCodeMode341 ? selCodeMode341.value : 'none';

    // Map tên sheet sang loại môn trong comments-bank
    let subjectKey = 'chung';
    if (sheetNameLower.includes('việt') || sheetNameLower.includes('tieng viet')) subjectKey = 'tieng_viet';
    else if (sheetNameLower.includes('toán') || sheetNameLower.includes('toan')) subjectKey = 'toan';

    let bankGrade = null;
    if (window.COMMENTS_BANK_BY_GRADE && window.COMMENTS_BANK_BY_GRADE[grade]) {
      bankGrade = window.COMMENTS_BANK_BY_GRADE[grade].periodic;
    }

    let countT = 0, countH = 0, countC = 0;

    data341.students.forEach((st, idx) => {
      const r = (st.rating || 'T').toUpperCase();
      let pool = (bankGrade && bankGrade[subjectKey] && bankGrade[subjectKey][r]) ? bankGrade[subjectKey][r] : [];

      if (!pool || pool.length === 0) {
        pool = [
          r === 'T' ? "Nắm vững kiến thức kĩ năng môn học, tiếp thu bài nhanh, làm bài cẩn thận." :
          r === 'H' ? "Hoàn thành nội dung bài học; cần rèn luyện thêm tính cẩn thận khi làm bài." :
          "Tiếp thu bài còn chậm; cần tích cực ôn tập và nhờ thầy cô hỗ trợ thêm."
        ];
      }

      if (r === 'T') { st.comment = pool[countT % pool.length]; countT++; }
      else if (r === 'H' || r === 'Đ') { st.comment = pool[countH % pool.length]; countH++; }
      else { st.comment = pool[countC % pool.length]; countC++; }

      // Gán Mã nhận xét theo chế độ người dùng chọn
      if (codeMode === 'rate_num') {
        const prefix = (r === 'T' ? 'T' : (r === 'H' || r === 'Đ' ? 'H' : 'C'));
        const num = (r === 'T' ? countT : (r === 'H' || r === 'Đ' ? countH : countC));
        st.commentCode = prefix + String(num).padStart(2, '0');
      } else if (codeMode === 'num') {
        st.commentCode = String(idx + 1).padStart(2, '0');
      } else {
        st.commentCode = '';
      }
    });

    renderPreview341();
  });

  // XUẤT FILE EXCEL ĐÃ ĐIỀN 3.4.1 (ĐỂ IMPORT VÀO SMIS)
  btnExportExcel341.addEventListener('click', () => {
    if (!data341.workbook || data341.students.length === 0) {
      alert('Chưa có dữ liệu để xuất file.');
      return;
    }
    try {
      const outArray = ExcelHelper.exportFilled341(data341.workbook, data341.currentSheetName, data341.students);
      const blob = new Blob([outArray], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `DANHGIA_341_${data341.currentSheetName.replace(/\s+/g, '_')}_DA_DIEN.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      alert('Lỗi xuất file: ' + e.message);
    }
  });

  // ĐIỀN TRỰC TIẾP TRÊN TRANG 3.4.1 (SMIS)
  btnStart341.addEventListener('click', async () => {
    if (data341.students.length === 0) return;

    btnStart341.classList.add('hidden');
    btnStop341.classList.remove('hidden');
    progressBox341.classList.remove('hidden');
    progressBar341.style.width = '0%';
    progressPercent341.textContent = '0%';
    progressText341.textContent = 'Đang kết nối trang SMIS 3.4.1...';
    progressLog341.textContent = '';

    try {
      await ensureContentScriptReady(currentActiveTab.id);

      chrome.tabs.sendMessage(currentActiveTab.id, {
        action: 'FILL_341',
        students: data341.students,
        sheetName: data341.currentSheetName
      }, (resp) => {
        if (chrome.runtime.lastError) {
          logProgress(progressLog341, '❌ Lỗi kết nối: ' + chrome.runtime.lastError.message + '. Thầy/cô vui lòng F5 lại trang SMIS.');
          resetButtons(btnStart341, btnStop341);
          return;
        }
        if (resp && resp.success) {
          progressBar341.style.width = '100%';
          progressPercent341.textContent = '100%';
          progressText341.textContent = `Hoàn tất! Đã điền ${resp.result.successCount}/${resp.result.total} học sinh.`;
          logProgress(progressLog341, `✔ Thành công! Đã điền kết quả ${data341.currentSheetName} cho ${resp.result.successCount} em.`);
        } else {
          logProgress(progressLog341, '❌ Lỗi: ' + (resp ? resp.error : 'Không có phản hồi'));
        }
        resetButtons(btnStart341, btnStop341);
      });
    } catch (err) {
      logProgress(progressLog341, '❌ Lỗi thực thi: ' + err.message);
      resetButtons(btnStart341, btnStop341);
    }
  });

  btnStop341.addEventListener('click', () => {
    chrome.tabs.sendMessage(currentActiveTab.id, { action: 'ABORT_FILL' });
    resetButtons(btnStart341, btnStop341);
  });

  // =========================================================================
  // 4. TAB 2: XỬ LÝ MỤC 3.4.2 (KẾT QUẢ NĂNG LỰC & PHẨM CHẤT)
  // =========================================================================
  setupDropZone(dropZone342, fileInput342, handleFile342);

  btnRemoveFile342.addEventListener('click', (e) => {
    e.stopPropagation();
    resetFile342();
  });

  async function handleFile342(file) {
    try {
      showFileInfo(file.name, fileInfo342, fileName342);
      data342.fileName = file.name;

      // Nhận diện khối lớp
      const gradeMatch = file.name.match(/[_-](\d)[a-zA-Z]/i) || file.name.match(/khoi(\d)/i) || file.name.match(/lop(\d)/i);
      if (gradeMatch && gradeMatch[1]) {
        selGrade342.value = gradeMatch[1];
      }

      const buffer = await ExcelHelper.readFileAsync(file);
      const res = ExcelHelper.parseSMIS342(buffer);

      data342.workbook = res.workbook;
      data342.students = res.students;

      controlsCard342.classList.remove('hidden');
      previewCard342.classList.remove('hidden');
      actionSection342.classList.remove('hidden');

      renderPreview342();
    } catch (err) {
      alert('Lỗi nạp file 3.4.2: ' + err.message);
      resetFile342();
    }
  }

  function resetFile342() {
    fileInput342.value = '';
    fileInfo342.classList.add('hidden');
    controlsCard342.classList.add('hidden');
    previewCard342.classList.add('hidden');
    actionSection342.classList.add('hidden');
    data342 = { workbook: null, students: [], fileName: '' };
    previewTable342.innerHTML = '';
  }

  function renderPreview342() {
    previewCount342.textContent = data342.students.length;
    previewTable342.innerHTML = '';

    data342.students.forEach((st, idx) => {
      const tr = document.createElement('tr');
      const r = (st.rating || 'T').toUpperCase();

      tr.innerHTML = `
        <td style="text-align: center; font-weight: 700;">${st.stt}</td>
        <td style="font-weight: 600; color: #0f766e;">${escapeHtml(st.name)}</td>
        <td style="text-align: center;">
          <select class="form-control sel-student-rate-342" data-idx="${idx}" style="padding: 2px 4px; font-weight: 700; font-size: 11px;">
            <option value="T" ${r === 'T' ? 'selected' : ''}>T</option>
            <option value="Đ" ${(r === 'Đ' || r === 'H') ? 'selected' : ''}>Đ</option>
            <option value="C" ${r === 'C' ? 'selected' : ''}>C</option>
          </select>
        </td>
        <td>
          <input type="text" class="form-control inp-student-nlc" value="${escapeHtml(st.commentNLChung || '')}" data-idx="${idx}" placeholder="Nhận xét NL chung...">
        </td>
        <td>
          <input type="text" class="form-control inp-student-nldt" value="${escapeHtml(st.commentNLDacThu || '')}" data-idx="${idx}" placeholder="Nhận xét NL đặc thù...">
        </td>
        <td>
          <input type="text" class="form-control inp-student-pc" value="${escapeHtml(st.commentPhamChat || '')}" data-idx="${idx}" placeholder="Nhận xét phẩm chất...">
        </td>
      `;

      tr.querySelector('.sel-student-rate-342').addEventListener('change', (e) => {
        data342.students[idx].rating = e.target.value;
      });

      tr.querySelector('.inp-student-nlc').addEventListener('input', (e) => {
        data342.students[idx].commentNLChung = e.target.value;
      });
      tr.querySelector('.inp-student-nldt').addEventListener('input', (e) => {
        data342.students[idx].commentNLDacThu = e.target.value;
      });
      tr.querySelector('.inp-student-pc').addEventListener('input', (e) => {
        data342.students[idx].commentPhamChat = e.target.value;
      });

      previewTable342.appendChild(tr);
    });
  }

  const CRITERIA_KEYS = [
    'nl_tuchu', 'nl_giaotiep', 'nl_giaiquyet',
    'nl_ngonngu', 'nl_tinhToan', 'nl_khoahoc', 'nl_congnghe', 'nl_tinhoc', 'nl_thammi', 'nl_thechat',
    'pc_yeunuoc', 'pc_nhanai', 'pc_chamchi', 'pc_trungthuc', 'pc_trachnhiem'
  ];

  btnSetAll342T.addEventListener('click', () => {
    data342.students.forEach(s => {
      s.rating = 'T';
      CRITERIA_KEYS.forEach(k => s[k] = 'T');
    });
    renderPreview342();
  });

  btnSetAll342D.addEventListener('click', () => {
    data342.students.forEach(s => {
      s.rating = 'Đ';
      CRITERIA_KEYS.forEach(k => s[k] = 'Đ');
    });
    renderPreview342();
  });

  // Tự động sinh 3 nội dung nhận xét (NL Chung, NL Đặc thù, Phẩm chất) chuẩn TT27
  btnAutoGenerate342.addEventListener('click', () => {
    if (data342.students.length === 0) return;

    const grade = selGrade342.value || "2";
    let bankGrade = null;
    if (window.COMMENTS_BANK_BY_GRADE && window.COMMENTS_BANK_BY_GRADE[grade]) {
      bankGrade = window.COMMENTS_BANK_BY_GRADE[grade].monthly;
    }

    let countNlcT = 0, countNlcH = 0, countNlcC = 0;
    let countNldtT = 0, countNldtH = 0, countNldtC = 0;
    let countPcT = 0, countPcH = 0, countPcC = 0;

    data342.students.forEach(st => {
      const r = (st.rating || 'T').toUpperCase();

      // 1. Nhận xét Năng lực chung (tự chủ, giao tiếp, giải quyết vấn đề)
      let compPool = (bankGrade && bankGrade.competence && bankGrade.competence[r === 'Đ' ? 'H' : r]) ? bankGrade.competence[r === 'Đ' ? 'H' : r] : [];
      if (compPool.length > 0) {
        if (r === 'T') { st.commentNLChung = compPool[countNlcT % compPool.length]; countNlcT++; }
        else if (r === 'Đ' || r === 'H') { st.commentNLChung = compPool[countNlcH % compPool.length]; countNlcH++; }
        else { st.commentNLChung = compPool[countNlcC % compPool.length]; countNlcC++; }
      }

      // 2. Nhận xét Năng lực đặc thù (ngôn ngữ, tính toán, thẩm mĩ, thể chất)
      let subPool = (bankGrade && bankGrade.subject && bankGrade.subject[r === 'Đ' ? 'H' : r]) ? bankGrade.subject[r === 'Đ' ? 'H' : r] : [];
      if (subPool.length > 0) {
        if (r === 'T') { st.commentNLDacThu = subPool[countNldtT % subPool.length]; countNldtT++; }
        else if (r === 'Đ' || r === 'H') { st.commentNLDacThu = subPool[countNldtH % subPool.length]; countNldtH++; }
        else { st.commentNLDacThu = subPool[countNldtC % subPool.length]; countNldtC++; }
      }

      // 3. Nhận xét Phẩm chất (chăm chỉ, trung thực, trách nhiệm, nhân ái)
      let qualPool = (bankGrade && bankGrade.quality && bankGrade.quality[r === 'Đ' ? 'H' : r]) ? bankGrade.quality[r === 'Đ' ? 'H' : r] : [];
      if (qualPool.length > 0) {
        if (r === 'T') { st.commentPhamChat = qualPool[countPcT % qualPool.length]; countPcT++; }
        else if (r === 'Đ' || r === 'H') { st.commentPhamChat = qualPool[countPcH % qualPool.length]; countPcH++; }
        else { st.commentPhamChat = qualPool[countPcC % qualPool.length]; countPcC++; }
      }
    });

    renderPreview342();
  });

  // XUẤT FILE EXCEL ĐÃ ĐIỀN ĐỦ MỤC 3.4.2 (ĐỂ IMPORT VÀO SMIS)
  btnExportExcel342.addEventListener('click', () => {
    if (!data342.workbook || data342.students.length === 0) {
      alert('Chưa có dữ liệu để xuất file.');
      return;
    }
    try {
      const outArray = ExcelHelper.exportFilled342(data342.workbook, data342.students, selDefaultRate342.value);
      const blob = new Blob([outArray], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `DANHGIA_NLPC_342_DA_DIEN.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      alert('Lỗi xuất file: ' + e.message);
    }
  });

  // ĐIỀN TRỰC TIẾP TRÊN TRANG 3.4.2 (SMIS)
  btnStart342.addEventListener('click', async () => {
    if (data342.students.length === 0) return;

    btnStart342.classList.add('hidden');
    btnStop342.classList.remove('hidden');
    progressBox342.classList.remove('hidden');
    progressBar342.style.width = '0%';
    progressPercent342.textContent = '0%';
    progressText342.textContent = 'Đang kết nối trang SMIS 3.4.2...';
    progressLog342.textContent = '';

    try {
      await ensureContentScriptReady(currentActiveTab.id);

      chrome.tabs.sendMessage(currentActiveTab.id, {
        action: 'FILL_342',
        students: data342.students
      }, (resp) => {
        if (chrome.runtime.lastError) {
          logProgress(progressLog342, '❌ Lỗi kết nối: ' + chrome.runtime.lastError.message + '. Thầy/cô vui lòng F5 lại trang SMIS.');
          resetButtons(btnStart342, btnStop342);
          return;
        }
        if (resp && resp.success) {
          progressBar342.style.width = '100%';
          progressPercent342.textContent = '100%';
          progressText342.textContent = `Hoàn tất! Đã điền ${resp.result.successCount}/${resp.result.total} học sinh.`;
          logProgress(progressLog342, `✔ Thành công! Đã điền Năng lực và Phẩm chất cho ${resp.result.successCount} em.`);
        } else {
          logProgress(progressLog342, '❌ Lỗi: ' + (resp ? resp.error : 'Không có phản hồi'));
        }
        resetButtons(btnStart342, btnStop342);
      });
    } catch (err) {
      logProgress(progressLog342, '❌ Lỗi thực thi: ' + err.message);
      resetButtons(btnStart342, btnStop342);
    }
  });

  btnStop342.addEventListener('click', () => {
    chrome.tabs.sendMessage(currentActiveTab.id, { action: 'ABORT_FILL' });
    resetButtons(btnStart342, btnStop342);
  });

  // =========================================================================
  // 5. TAB 3: XỬ LÝ MỤC 3.4.3 (NHẬP NHẬN XÉT IN HỌC BẠ CỦA GVCN)
  // =========================================================================
  setupDropZone(dropZone343, fileInput343, handleFile343);

  btnRemoveFile343.addEventListener('click', (e) => {
    e.stopPropagation();
    resetFile343();
  });

  btnUseLoadedList343.addEventListener('click', () => {
    let sourceList = data341.students.length > 0 ? data341.students : data342.students;
    if (sourceList.length === 0) {
      alert('Chưa có danh sách học sinh nào ở mục 3.4.1 hoặc 3.4.2. Thầy/cô vui lòng tải file Excel vào trước.');
      return;
    }

    data343.students = sourceList.map((s, idx) => ({
      stt: s.stt || String(idx + 1),
      id: s.id,
      name: s.name,
      rating: s.rating || 'T',
      comment: '',
      rowIndex: idx + 2
    }));

    showFileInfo('Đã kế thừa danh sách từ mục ' + (data341.students.length > 0 ? '3.4.1' : '3.4.2'), fileInfo343, fileName343);
    controlsCard343.classList.remove('hidden');
    previewCard343.classList.remove('hidden');
    actionSection343.classList.remove('hidden');
    renderPreview343();
  });

  async function handleFile343(file) {
    try {
      showFileInfo(file.name, fileInfo343, fileName343);
      data343.fileName = file.name;

      const buffer = await ExcelHelper.readFileAsync(file);
      const res = ExcelHelper.parseSMIS343(buffer);

      data343.workbook = res.workbook;
      data343.students = res.students;

      controlsCard343.classList.remove('hidden');
      previewCard343.classList.remove('hidden');
      actionSection343.classList.remove('hidden');

      renderPreview343();
    } catch (err) {
      alert('Lỗi nạp file 3.4.3: ' + err.message);
      resetFile343();
    }
  }

  function resetFile343() {
    fileInput343.value = '';
    fileInfo343.classList.add('hidden');
    controlsCard343.classList.add('hidden');
    previewCard343.classList.add('hidden');
    actionSection343.classList.add('hidden');
    data343 = { workbook: null, students: [], fileName: '' };
    previewTable343.innerHTML = '';
  }

  // Kho nhận xét in học bạ phong phú theo từng mức đạt được (T, H/Đ, C) chuẩn Thông tư 27
  function getHocBaCommentPool(grade, rating) {
    const r = (rating === 'Đ' || rating === 'H') ? 'H' : (rating === 'C' ? 'C' : 'T');
    let pool = [];
    if (window.COMMENTS_BANK_BY_GRADE && window.COMMENTS_BANK_BY_GRADE[grade] && window.COMMENTS_BANK_BY_GRADE[grade].periodic && window.COMMENTS_BANK_BY_GRADE[grade].periodic.chung) {
      pool = window.COMMENTS_BANK_BY_GRADE[grade].periodic.chung[r] || [];
    }

    const extraHocBa = {
      T: [
        "Hoàn thành xuất sắc các nội dung học tập và rèn luyện; có tinh thần tự giác cao, tích cực tham gia các phong trào của lớp.",
        "Nắm vững kiến thức, kĩ năng các môn học; chăm chỉ, gương mẫu, luôn nhiệt tình giúp đỡ bạn bè cùng tiến bộ.",
        "Có năng lực học tập tốt, tư duy nhanh nhẹn, chủ động sáng tạo trong học tập; kính thầy yêu bạn.",
        "Học tập chăm chỉ, hoàn thành xuất sắc nhiệm vụ; tích cực phát biểu xây dựng bài, nề nếp kỷ luật tốt.",
        "Tiếp thu bài nhanh, làm bài cẩn thận chính xác; có ý thức tự học và kĩ năng hợp tác nhóm rất tốt.",
        "Hoàn thành tốt và vượt mức các mục tiêu học tập; tự giác, chủ động, chữ viết sạch đẹp và trình bày khoa học.",
        "Có tinh thần trách nhiệm cao, năng nổ trong các hoạt động; tư duy linh hoạt và tiếp thu bài rất nhanh.",
        "Gương mẫu, chăm ngoan, hoàn thành xuất sắc các môn học; luôn chủ động tìm tòi kiến thức mới."
      ],
      H: [
        "Hoàn thành tốt các mục tiêu học tập; chú ý nghe giảng, có ý thức tự giác rèn luyện nề nếp tốt.",
        "Nắm được kiến thức cơ bản các môn học; chăm chỉ, lễ phép, cần tự tin hơn khi trình bày trước lớp.",
        "Có ý thức học tập và rèn luyện tốt; hoàn thành các bài tập, cần rèn thêm tính cẩn thận khi tính toán.",
        "Tự giác học tập, nắm vững kiến thức; có tiến bộ trong học tập và rèn luyện, cần tiếp tục phát huy.",
        "Ngoan ngoãn, lễ phép, hoàn thành nhiệm vụ học tập; cần chú ý tốc độ làm bài để đạt kết quả cao hơn.",
        "Có cố gắng trong học tập; biết phối hợp cùng bạn bè, cần rèn thêm chữ viết ngay ngắn, cẩn thận hơn.",
        "Nắm được kiến thức trọng tâm; chú ý nghe giảng, cần mạnh dạn giơ tay phát biểu ý kiến xây dựng bài.",
        "Tiếp thu bài đạt yêu cầu; nề nếp học tập tốt, cần rèn luyện thêm kĩ năng đọc hiểu và tính toán nhanh."
      ],
      C: [
        "Có nhiều cố gắng trong học tập; cần tập trung hơn trong giờ học và tích cực luyện đọc, làm bài tập.",
        "Chăm ngoan, biết vâng lời; cần chú ý lắng nghe cô giáo hướng dẫn và rèn thêm kĩ năng làm toán, chính tả.",
        "Có tiến bộ so với đầu năm; cần chăm chỉ rèn luyện thêm ở nhà và nhờ thầy cô, bạn bè hỗ trợ thêm.",
        "Biết vâng lời thầy cô; cần tích cực ôn tập kiến thức cơ bản và tự tin hơn trong các hoạt động của lớp.",
        "Có ý thức học tập; cần được hỗ trợ, rèn luyện thêm kỹ năng đọc hiểu và tính toán để đạt kết quả tốt hơn.",
        "Cần nỗ lực hơn trong giờ học; chú ý hoàn thành bài tập đầy đủ và mạnh dạn trao đổi khi chưa hiểu bài."
      ]
    };

    const combined = [...pool, ...(extraHocBa[r] || [])];
    return Array.from(new Set(combined));
  }

  // Đặt nhanh mức cho toàn bộ học sinh mục 3.4.3
  btnSetAll343T.addEventListener('click', () => {
    if (data343.students.length === 0) return;
    data343.students.forEach(s => { s.rating = 'T'; });
    renderPreview343();
  });

  btnSetAll343H.addEventListener('click', () => {
    if (data343.students.length === 0) return;
    data343.students.forEach(s => { s.rating = 'H'; });
    renderPreview343();
  });

  selDefaultRate343.addEventListener('change', () => {
    if (data343.students.length === 0) return;
    const r = selDefaultRate343.value;
    data343.students.forEach(s => { s.rating = r; });
    renderPreview343();
  });

  function renderPreview343() {
    previewCount343.textContent = data343.students.length;
    previewTable343.innerHTML = '';

    data343.students.forEach((st, idx) => {
      const tr = document.createElement('tr');
      const r = (st.rating || 'T').toUpperCase();
      tr.innerHTML = `
        <td style="text-align: center; font-weight: 700;">${st.stt}</td>
        <td style="font-weight: 600; color: #0f766e;">${escapeHtml(st.name)}</td>
        <td style="text-align: center;">
          <select class="form-control sel-student-rate-343" data-idx="${idx}" style="padding: 2px 4px; font-weight: 700; font-size: 11px;">
            <option value="T" ${r === 'T' ? 'selected' : ''}>T</option>
            <option value="H" ${(r === 'H' || r === 'Đ') ? 'selected' : ''}>H (Đ)</option>
            <option value="C" ${r === 'C' ? 'selected' : ''}>C</option>
          </select>
        </td>
        <td>
          <input type="text" class="form-control inp-student-hb" value="${escapeHtml(st.comment || '')}" data-idx="${idx}" placeholder="Nhận xét in học bạ của GVCN...">
        </td>
      `;

      tr.querySelector('.sel-student-rate-343').addEventListener('change', (e) => {
        const newRate = e.target.value;
        data343.students[idx].rating = newRate;
        const grade = selGrade343.value || "2";
        const pool = getHocBaCommentPool(grade, newRate);
        if (pool && pool.length > 0) {
          const newComment = pool[idx % pool.length];
          data343.students[idx].comment = newComment;
          tr.querySelector('.inp-student-hb').value = newComment;
        }
      });

      tr.querySelector('.inp-student-hb').addEventListener('input', (e) => {
        data343.students[idx].comment = e.target.value;
      });

      previewTable343.appendChild(tr);
    });
  }

  // Tự động sinh nhận xét in học bạ tổng hợp của GVCN theo đúng mức đạt được từng em
  btnAutoGenerate343.addEventListener('click', () => {
    if (data343.students.length === 0) return;

    const grade = selGrade343.value || "2";
    const poolT = getHocBaCommentPool(grade, 'T');
    const poolH = getHocBaCommentPool(grade, 'H');
    const poolC = getHocBaCommentPool(grade, 'C');

    let countT = 0, countH = 0, countC = 0;

    data343.students.forEach((st, idx) => {
      const r = (st.rating || 'T').toUpperCase();
      const rateKey = (r === 'Đ' || r === 'H') ? 'H' : (r === 'C' ? 'C' : 'T');

      if (rateKey === 'T') {
        st.comment = poolT[(countT + idx) % poolT.length];
        countT++;
      } else if (rateKey === 'H') {
        st.comment = poolH[(countH + idx) % poolH.length];
        countH++;
      } else {
        st.comment = poolC[(countC + idx) % poolC.length];
        countC++;
      }
    });

    renderPreview343();
  });

  // XUẤT EXCEL 3.4.3
  btnExportExcel343.addEventListener('click', () => {
    if (data343.students.length === 0) {
      alert('Chưa có dữ liệu để xuất.');
      return;
    }
    try {
      const wb = data343.workbook || XLSX.utils.book_new();
      if (!data343.workbook) {
        const rows = [
          ['STT', 'Mã học sinh', 'Họ và tên', 'Nhận xét in học bạ của GVCN']
        ];
        data343.students.forEach(s => {
          rows.push([s.stt, s.id, s.name, s.comment]);
        });
        const ws = XLSX.utils.aoa_to_sheet(rows);
        XLSX.utils.book_append_sheet(wb, ws, "NhanXetHocBa");
      } else {
        ExcelHelper.exportFilled343(wb, data343.students);
      }
      const outArray = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([outArray], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `DANHGIA_HOCBA_343_DA_DIEN.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      alert('Lỗi xuất file: ' + e.message);
    }
  });

  // ĐIỀN TRỰC TIẾP TRÊN TRANG 3.4.3 (SMIS)
  btnStart343.addEventListener('click', async () => {
    if (data343.students.length === 0) return;

    btnStart343.classList.add('hidden');
    btnStop343.classList.remove('hidden');
    progressBox343.classList.remove('hidden');
    progressBar343.style.width = '0%';
    progressPercent343.textContent = '0%';
    progressText343.textContent = 'Đang kết nối trang SMIS 3.4.3...';
    progressLog343.textContent = '';

    try {
      await ensureContentScriptReady(currentActiveTab.id);

      chrome.tabs.sendMessage(currentActiveTab.id, {
        action: 'FILL_343',
        students: data343.students
      }, (resp) => {
        if (chrome.runtime.lastError) {
          logProgress(progressLog343, '❌ Lỗi kết nối: ' + chrome.runtime.lastError.message + '. Thầy/cô vui lòng F5 lại trang SMIS.');
          resetButtons(btnStart343, btnStop343);
          return;
        }
        if (resp && resp.success) {
          progressBar343.style.width = '100%';
          progressPercent343.textContent = '100%';
          progressText343.textContent = `Hoàn tất! Đã điền ${resp.result.successCount}/${resp.result.total} học sinh.`;
          logProgress(progressLog343, `✔ Thành công! Đã điền nhận xét in học bạ cho ${resp.result.successCount} em.`);
        } else {
          logProgress(progressLog343, '❌ Lỗi: ' + (resp ? resp.error : 'Không có phản hồi'));
        }
        resetButtons(btnStart343, btnStop343);
      });
    } catch (err) {
      logProgress(progressLog343, '❌ Lỗi thực thi: ' + err.message);
      resetButtons(btnStart343, btnStop343);
    }
  });

  btnStop343.addEventListener('click', () => {
    chrome.tabs.sendMessage(currentActiveTab.id, { action: 'ABORT_FILL' });
    resetButtons(btnStart343, btnStop343);
  });

  // =========================================================================
  // 6. TIẾN ĐỘ THỜI GIAN THỰC TỪ CONTENT SCRIPT
  // =========================================================================
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'PROGRESS_UPDATE') {
      const { target, current, total, studentName, message } = request;
      const pct = Math.round((current / total) * 100);

      if (target === '341') {
        progressBar341.style.width = `${pct}%`;
        progressPercent341.textContent = `${pct}%`;
        progressText341.textContent = `Đang điền ${current}/${total}: ${studentName || ''}`;
        if (message) logProgress(progressLog341, message);
      } else if (target === '342') {
        progressBar342.style.width = `${pct}%`;
        progressPercent342.textContent = `${pct}%`;
        progressText342.textContent = `Đang điền ${current}/${total}: ${studentName || ''}`;
        if (message) logProgress(progressLog342, message);
      } else if (target === '343') {
        progressBar343.style.width = `${pct}%`;
        progressPercent343.textContent = `${pct}%`;
        progressText343.textContent = `Đang điền ${current}/${total}: ${studentName || ''}`;
        if (message) logProgress(progressLog343, message);
      }
    }
    sendResponse({ received: true });
    return true;
  });

  // =========================================================================
  // 7. TAB 4: TRỢ GIÚP & QUÉT TRANG SMIS
  // =========================================================================
  btnCheckPage.addEventListener('click', async () => {
    checkPageResult.classList.remove('hidden');
    checkPageResult.innerHTML = 'Đang quét giao diện trang SMIS...';

    try {
      await ensureContentScriptReady(currentActiveTab.id);

      chrome.tabs.sendMessage(currentActiveTab.id, { action: 'DETECT_PAGE' }, (resp) => {
        if (chrome.runtime.lastError || !resp) {
          checkPageResult.innerHTML = '<span style="color: red;">❌ Không kết nối được content script. Hãy bấm F5 tải lại trang SMIS rồi thử lại!</span>';
          return;
        }

        const info = resp.pageInfo;
        let typeName = 'Trang chung SMIS';
        if (info.type === '341') typeName = '3.4.1. Kết quả Môn học và hoạt động giáo dục';
        else if (info.type === '342') typeName = '3.4.2. Kết quả Năng lực và Phẩm chất';
        else if (info.type === '343') typeName = '3.4.3. Nhập nhận xét in học bạ của GVCN';

        checkPageResult.innerHTML = `
          <strong>Kết quả phân tích giao diện SMIS:</strong><br>
          • <strong>Trang đích:</strong> <span style="color: #0f766e; font-weight: 700;">${typeName}</span><br>
          • <strong>Số hàng học sinh tìm thấy:</strong> ${info.studentRowsCount || 0} hàng<br>
          • <strong>Số ô nhập liệu nhận diện:</strong> ${info.inputsCount || 0} ô<br>
          • <strong>Nút Lưu / Cập nhật:</strong> ${info.hasSaveButton ? '✔ Đã sẵn sàng' : 'Chưa thấy'}<br>
          • <strong>URL:</strong> <span style="font-size: 10px; word-break: break-all;">${resp.url || ''}</span>
        `;
      });
    } catch (e) {
      checkPageResult.innerHTML = '<span style="color: red;">Lỗi quét trang: ' + e.message + '</span>';
    }
  });

  // =========================================================================
  // 8. TIỆN ÍCH DÙNG CHUNG
  // =========================================================================
  function setupDropZone(dropZone, fileInput, onFile) {
    dropZone.addEventListener('click', () => fileInput.click());
    dropZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dropZone.classList.add('dragover');
    });
    dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
    dropZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dropZone.classList.remove('dragover');
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        onFile(e.dataTransfer.files[0]);
      }
    });
    fileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files.length > 0) {
        onFile(e.target.files[0]);
      }
    });
  }

  function showFileInfo(name, infoEl, nameEl) {
    nameEl.textContent = name;
    infoEl.classList.remove('hidden');
  }

  function logProgress(logEl, text) {
    const time = new Date().toLocaleTimeString();
    logEl.textContent += `[${time}] ${text}\n`;
    logEl.scrollTop = logEl.scrollHeight;
  }

  function resetButtons(startBtn, stopBtn) {
    startBtn.classList.remove('hidden');
    stopBtn.classList.add('hidden');
  }

  function escapeHtml(text) {
    if (!text) return '';
    return text.toString()
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
});
