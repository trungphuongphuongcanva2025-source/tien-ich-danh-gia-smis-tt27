/**
 * content.js
 * Script tự động hóa quét DOM và điền đánh giá trên hệ thống SMIS
 * Nền tảng số Quản trị Giáo dục Quốc gia (smis.moet.edu.vn / moet.gov.vn / csdl.moet.gov.vn)
 * Chuẩn Thông tư 27/2020/TT-BGDĐT
 * Tối ưu chuyên biệt cho:
 * - 3.4.1: Kết quả Môn học và hoạt động giáo dục (DanhGiaDinhKy.aspx)
 * - 3.4.2: Kết quả Năng lực và Phẩm chất (DanhGiaNLPC.aspx)
 * - 3.4.3: Nhập nhận xét in học bạ của GVCN (NhapNhanXetHocBa.aspx)
 * 
 * Tác giả: Thầy Phương - Trường TH&THCS Ngô Thất Sơn
 */

// =========================================================================
// 1. SELECTORS & CẤU HÌNH DOM TRÊN SMIS
// =========================================================================
const SMIS_SELECTORS = {
  tableRows: [
    'table.table tbody tr',
    'table.k-grid-table tbody tr',
    '.dx-datagrid-rowsview tbody tr',
    'table.grid tbody tr',
    'table#grid tbody tr',
    'table[id*="grid" i] tbody tr',
    'table[id*="hocba" i] tbody tr',
    'table[id*="danhgia" i] tbody tr',
    'table[id*="monhoc" i] tbody tr',
    'table[id*="nlpc" i] tbody tr',
    'table.table-bordered tbody tr',
    'table.table-striped tbody tr',
    'tbody tr'
  ],
  sttCell: [
    'td[data-field="STT" i]',
    'td.col-stt',
    'td.stt',
    'td:first-child'
  ],
  idCell: [
    'td[data-field*="Ma" i]',
    'td.col-mahs',
    'td.mahs',
    'td[class*="code" i]'
  ],
  nameCell: [
    'td[data-field*="HoTen" i]',
    'td[data-field*="Ten" i]',
    'td.col-hoten',
    'td.hoten',
    'td.fullname',
    'td[class*="name" i]'
  ],
  saveButtons: [
    'button[id*="btnSave" i]',
    'button[id*="luu" i]',
    'button[id*="capnhat" i]',
    'button.btn-primary:contains("Lưu")',
    'button.btn-success:contains("Lưu")',
    'button:contains("Lưu")',
    'button:contains("Cập nhật")',
    'a.btn:contains("Lưu")',
    'a.btn:contains("Cập nhật")',
    'input[type="submit"][value*="Lưu" i]',
    'input[type="button"][value*="Lưu" i]'
  ]
};

let abortControllerFlag = false;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Bọc sendMessage an toàn, tránh văng lỗi disconnected trên Chrome
function safeSendMessage(msg) {
  try {
    chrome.runtime.sendMessage(msg, () => {
      if (chrome.runtime.lastError) {
        // Âm thầm bỏ qua lỗi nếu popup đã đóng
      }
    });
  } catch (e) {}
}

// Tìm context (document hoặc iframe document) chứa giao diện SMIS
function getAllDocuments() {
  const docs = [document];
  try {
    const iframes = document.querySelectorAll('iframe, frame');
    for (const ifr of iframes) {
      try {
        const doc = ifr.contentDocument || ifr.contentWindow.document;
        if (doc && doc.body) docs.push(doc);
      } catch (e) {}
    }
  } catch (e) {}
  return docs;
}

function findBestDocument(pageType = 'any') {
  const docs = getAllDocuments();
  for (const doc of docs) {
    const text = (doc.body ? doc.body.innerText : '').toLowerCase();
    const href = (doc.location ? doc.location.href : window.location.href).toLowerCase();
    
    if (pageType === '341') {
      if (href.includes('danhgiadinhky') || text.includes('3.4.1') || text.includes('kết quả môn học')) return doc;
    } else if (pageType === '342') {
      if (href.includes('danhgianlpc') || href.includes('nlpc') || text.includes('3.4.2') || text.includes('năng lực và phẩm chất')) return doc;
    } else if (pageType === '343') {
      if (href.includes('hocba') || href.includes('inhocba') || text.includes('3.4.3') || text.includes('in học bạ')) return doc;
    }
  }
  return document;
}

// =========================================================================
// 2. CÁC HÀM TRUY VẤN VÀ THAO TÁC DOM
// =========================================================================

function queryFirst(selectors, parent = document) {
  if (!selectors) return null;
  const list = Array.isArray(selectors) ? selectors : [selectors];
  for (const sel of list) {
    try {
      if (sel.includes(':contains(')) {
        const match = sel.match(/^(.*?):contains\(["'](.*?)["']\)$/);
        if (match) {
          const baseTag = match[1] || '*';
          const text = match[2].toLowerCase();
          const elements = parent.querySelectorAll(baseTag);
          for (const el of elements) {
            if (el.textContent && el.textContent.toLowerCase().includes(text)) {
              return el;
            }
          }
        }
      } else {
        const el = parent.querySelector(sel);
        if (el) return el;
      }
    } catch (e) {}
  }
  return null;
}

function queryAll(selectors, parent = document) {
  if (!selectors) return [];
  const list = Array.isArray(selectors) ? selectors : [selectors];
  for (const sel of list) {
    try {
      const els = parent.querySelectorAll(sel);
      if (els && els.length > 0) {
        return Array.from(els);
      }
    } catch (e) {}
  }
  return [];
}

// Kích hoạt click chuẩn
function triggerClick(element) {
  if (!element) return;
  const viewWin = element.ownerDocument ? (element.ownerDocument.defaultView || window) : window;
  try {
    element.scrollIntoView({ behavior: 'auto', block: 'nearest' });
  } catch (e) {}

  ['mousedown', 'mouseup', 'click'].forEach(evtName => {
    element.dispatchEvent(new MouseEvent(evtName, {
      bubbles: true,
      cancelable: true,
      view: viewWin,
      button: 0
    }));
  });
}

// Điền giá trị input/textarea hỗ trợ cả React/Angular/Vue/ASP.NET binding
function setInputValue(element, value) {
  if (!element) return false;
  try {
    element.focus();
  } catch (e) {}

  const strVal = (value !== null && value !== undefined) ? String(value) : '';

  const prototype = Object.getPrototypeOf(element);
  const descriptor = Object.getOwnPropertyDescriptor(prototype, 'value');
  if (descriptor && descriptor.set) {
    descriptor.set.call(element, strVal);
  } else {
    element.value = strVal;
  }

  if (element.isContentEditable || element.getAttribute('contenteditable') === 'true') {
    element.innerText = strVal;
  }

  ['keydown', 'keypress', 'input', 'keyup', 'change', 'blur'].forEach(eventName => {
    element.dispatchEvent(new Event(eventName, { bubbles: true, cancelable: true }));
  });
  return true;
}

// Chọn giá trị dropdown (T, H, C hoặc T, Đ, C)
function setSelectValue(element, value) {
  if (!element || !value) return false;
  const targetVal = value.toString().trim().toUpperCase();

  if (element.tagName === 'SELECT') {
    let found = false;
    for (let i = 0; i < element.options.length; i++) {
      const opt = element.options[i];
      const optVal = opt.value.trim().toUpperCase();
      const optText = opt.text.trim().toUpperCase();

      if (optVal === targetVal || optText === targetVal || optText.startsWith(targetVal)) {
        element.selectedIndex = i;
        found = true;
        break;
      }
      // Hỗ trợ từ khóa tiếng Việt
      if (targetVal === 'T' && (optText.includes('TỐT') || optVal.includes('TOT'))) {
        element.selectedIndex = i; found = true; break;
      }
      if (targetVal === 'H' && (optText.includes('HOÀN THÀNH') && !optText.includes('CHƯA') && !optText.includes('TỐT'))) {
        element.selectedIndex = i; found = true; break;
      }
      if (targetVal === 'Đ' && (optText.includes('ĐẠT') && !optText.includes('CHƯA'))) {
        element.selectedIndex = i; found = true; break;
      }
      if (targetVal === 'C' && (optText.includes('CHƯA') || optText.includes('CỐ GẮNG'))) {
        element.selectedIndex = i; found = true; break;
      }
    }
    if (found) {
      element.dispatchEvent(new Event('change', { bubbles: true }));
      return true;
    }
  } else {
    return setInputValue(element, targetVal);
  }
  return false;
}

// Tự động cuộn trang hoặc container bảng để nạp thêm học sinh vào DOM (nếu có ảo hóa/lazy render)
function scrollDownAndRefresh(targetDoc) {
  try {
    const win = targetDoc.defaultView || window;
    win.scrollBy(0, 500);
  } catch (e) {}

  try {
    const scrollContainers = targetDoc.querySelectorAll('div, .k-grid-content, .dx-datagrid-rowsview, .table-responsive, [style*="overflow"]');
    for (const sc of scrollContainers) {
      if (sc.scrollHeight > sc.clientHeight + 10) {
        sc.scrollTop += 500;
        sc.dispatchEvent(new Event('scroll', { bubbles: true }));
      }
    }
  } catch (e) {}
}

// Lấy danh sách hàng học sinh từ bảng SMIS
function extractStudentRows(targetDoc) {
  let candidateRows = [];

  // 1. Thử lấy từ các selectors phổ biến của SMIS
  for (const sel of SMIS_SELECTORS.tableRows) {
    try {
      const els = targetDoc.querySelectorAll(sel);
      if (els && els.length > 0) {
        candidateRows = Array.from(els);
        break;
      }
    } catch (e) {}
  }

  // 2. Tìm tất cả các hàng chứa textarea hoặc select đánh giá trên toàn trang
  // để đảm bảo không bỏ sót bất kỳ học sinh nào (kể cả khi bảng bị phân tách hoặc cuộn)
  const allRowsWithInputs = Array.from(targetDoc.querySelectorAll('tr')).filter(r => {
    return r.querySelectorAll('textarea').length >= 1 || r.querySelectorAll('select').length >= 2;
  });

  if (allRowsWithInputs.length > candidateRows.length) {
    candidateRows = allRowsWithInputs;
  }

  // 3. Fallback: nếu vẫn rỗng, lấy tr từ bảng lớn nhất
  if (candidateRows.length === 0) {
    const tables = Array.from(targetDoc.querySelectorAll('table'));
    tables.sort((a, b) => b.querySelectorAll('tr').length - a.querySelectorAll('tr').length);
    if (tables.length > 0) {
      candidateRows = Array.from(tables[0].querySelectorAll('tbody tr')).length > 0
        ? Array.from(tables[0].querySelectorAll('tbody tr'))
        : Array.from(tables[0].querySelectorAll('tr'));
    }
  }

  const studentRows = [];
  const seenElements = new Set();

  for (let idx = 0; idx < candidateRows.length; idx++) {
    const row = candidateRows[idx];
    if (seenElements.has(row)) continue;

    // A. Loại bỏ hàng trong thead hoặc tfoot
    if (row.closest('thead') || row.closest('tfoot')) continue;

    // B. Loại bỏ hàng bị ẩn bởi display: none hoặc hidden
    if (row.style.display === 'none' || row.hidden) continue;

    // C. Loại bỏ hàng có class hoặc id là tiêu đề/công cụ gán nhanh rõ ràng
    const rowClass = (row.className || '').toLowerCase();
    const rowId = (row.id || '').toLowerCase();
    if (/(^|\s|_|-)(header|rgheader|k-grid-header|filter|rgfilter|batch-select|footer|pager)(\s|_|-|$)/i.test(rowClass)) continue;
    if (/(^|\s|_|-)(header|filter|batch|footer)(\s|_|-|$)/i.test(rowId)) continue;

    // D. Kiểm tra ô th và td
    const ths = row.querySelectorAll('th');
    const tds = row.querySelectorAll('td');
    if (ths.length > 0 && tds.length === 0) continue; // Toàn th -> Tiêu đề
    if (ths.length > tds.length) continue; // Đa số là th -> Tiêu đề
    if (tds.length < 3) continue; // Dưới 3 cột -> Hàng phân cách hoặc rỗng

    // E. Kiểm tra các ô nhập liệu của học sinh
    const textareas = row.querySelectorAll('textarea');
    const selects = row.querySelectorAll('select');
    const textInputs = row.querySelectorAll('input:not([type="hidden"]):not([type="checkbox"])');
    const hasInputs = (textareas.length > 0) || (selects.length > 0) || (textInputs.length > 0);

    // F. Loại bỏ hàng tiêu đề con hoặc hàng gán nhanh (không có textarea nào và có từ khóa tiêu đề)
    const rowText = row.textContent.toLowerCase();
    const isHeaderRow = (
      (textareas.length === 0 && textInputs.length === 0 && selects.length <= 1) && (
        rowText.includes('nội dung nhận xét') ||
        rowText.includes('mã nhận xét') ||
        rowText.includes('năng lực cốt lõi') ||
        rowText.includes('phẩm chất chủ yếu') ||
        rowText.includes('gán nhanh') ||
        rowText.includes('chọn tất cả')
      )
    );
    if (isHeaderRow) continue;

    const cells = Array.from(tds);

    // G. Tìm STT (1 đến 999) từ các ô đầu
    let stt = '';
    for (let c = 0; c < Math.min(cells.length, 3); c++) {
      const txt = cells[c].textContent.trim();
      if (/^\d{1,3}$/.test(txt)) {
        stt = txt;
        break;
      }
    }

    // H. Tìm Mã định danh / Mã học sinh
    let id = '';
    const idEl = queryFirst(SMIS_SELECTORS.idCell, row);
    if (idEl) id = idEl.textContent.trim();
    if (!id) {
      for (let c = 0; c < Math.min(cells.length, 4); c++) {
        const txt = cells[c].textContent.trim();
        if (/^\d{7,15}$/.test(txt)) {
          id = txt;
          break;
        }
      }
    }

    // I. Tìm Họ và tên học sinh
    let fullName = '';
    const nameEl = queryFirst(SMIS_SELECTORS.nameCell, row);
    if (nameEl) fullName = nameEl.textContent.trim();
    if (!fullName) {
      for (let c = 0; c < Math.min(cells.length, 5); c++) {
        const txt = cells[c].textContent.trim();
        if (!txt || /^\d+$/.test(txt) || txt.includes('/') || txt.length < 3) continue;
        if (/^(nam|nữ|tốt|đạt|hoàn thành|cần cố gắng|đ|t|c|h|stt|mã|học sinh|họ và tên)$/i.test(txt)) continue;
        const words = txt.split(/\s+/).filter(Boolean);
        if (words.length >= 2 && /[a-zA-Zà-ỹÀ-Ỹ]/.test(txt)) {
          fullName = txt;
          break;
        }
      }
    }

    // Nếu hàng này không có bất kỳ ô nhập liệu nào VÀ cũng không có STT hay Tên -> Không phải hàng học sinh
    if (!hasInputs && !fullName && !stt && !id) continue;

    // Gán STT theo thứ tự hàng hợp lệ nếu chưa đọc được số
    if (!stt) stt = String(studentRows.length + 1);

    seenElements.add(row);
    studentRows.push({
      element: row,
      cells: cells,
      stt: stt,
      name: fullName,
      id: id,
      index: studentRows.length
    });
  }

  return studentRows;
}

// Khớp một học sinh từ danh sách Excel với một hàng trong DOM
function matchStudent(excelItem, domRows, assignedSet, studentIndex) {
  const excStt = (excelItem.stt !== undefined && excelItem.stt !== null) ? String(excelItem.stt).trim() : '';
  const excSttNum = parseInt(excStt, 10);
  const excName = (excelItem.name || '').trim();
  const excId = (excelItem.id || '').trim();
  const matcher = window.Matcher || (typeof Matcher !== 'undefined' ? Matcher : null);

  // Ưu tiên 1: Khớp theo Mã học sinh / Mã định danh
  if (excId) {
    for (const d of domRows) {
      if (assignedSet.has(d.element)) continue;
      if (d.id && (d.id === excId || d.id.includes(excId) || excId.includes(d.id))) {
        assignedSet.add(d.element);
        return d;
      }
    }
  }

  // Ưu tiên 2: Khớp theo STT (số) VÀ Họ tên
  if (!isNaN(excSttNum) && excName) {
    for (const d of domRows) {
      if (assignedSet.has(d.element)) continue;
      const dSttNum = parseInt(d.stt, 10);
      if (dSttNum === excSttNum) {
        if (d.name && (matcher ? matcher.isNameMatched(d.name, excName) : d.name.toLowerCase().includes(excName.toLowerCase()) || excName.toLowerCase().includes(d.name.toLowerCase()))) {
          assignedSet.add(d.element);
          return d;
        }
      }
    }
  }

  // Ưu tiên 3: Khớp theo Họ tên
  if (excName) {
    for (const d of domRows) {
      if (assignedSet.has(d.element)) continue;
      if (d.name && (matcher ? matcher.isNameMatched(d.name, excName) : d.name.toLowerCase().includes(excName.toLowerCase()) || excName.toLowerCase().includes(d.name.toLowerCase()))) {
        assignedSet.add(d.element);
        return d;
      }
    }
  }

  // Ưu tiên 4: Khớp theo STT (số)
  if (!isNaN(excSttNum)) {
    for (const d of domRows) {
      if (assignedSet.has(d.element)) continue;
      const dSttNum = parseInt(d.stt, 10);
      if (dSttNum === excSttNum) {
        assignedSet.add(d.element);
        return d;
      }
    }
  }

  // Ưu tiên 5: Khớp theo thứ tự dòng (Index trong danh sách)
  if (studentIndex !== undefined && studentIndex !== null && studentIndex >= 0 && studentIndex < domRows.length) {
    const candidate = domRows[studentIndex];
    if (candidate && !assignedSet.has(candidate.element)) {
      assignedSet.add(candidate.element);
      return candidate;
    }
  }

  return null;
}

// =========================================================================
// 3. THI HÀNH ĐIỀN 3.4.1 (KẾT QUẢ MÔN HỌC & HĐGD)
// =========================================================================

async function executeFill341(studentsData, sheetName, onProgress) {
  abortControllerFlag = false;
  const targetDoc = findBestDocument('341');
  const domRows = extractStudentRows(targetDoc);

  if (!domRows || domRows.length === 0) {
    throw new Error('Không tìm thấy danh sách học sinh trên trang 3.4.1! Thầy/cô vui lòng mở mục 3.4.1 trên SMIS, chọn đúng Lớp, Môn học và bấm Tìm kiếm/Lấy danh sách.');
  }

  const assignedSet = new Set();
  let successCount = 0;
  const notFoundList = [];
  const total = studentsData.length;

  for (let i = 0; i < total; i++) {
    if (abortControllerFlag) break;

    const st = studentsData[i];
    let matched = matchStudent(st, domRows, assignedSet, i);

    // Nếu chưa tìm thấy hàng, tự động cuộn trang/container xuống để nạp thêm học sinh vào DOM
    if (!matched) {
      scrollDownAndRefresh(targetDoc);
      await sleep(150);
      const freshRows = extractStudentRows(targetDoc);
      for (const fr of freshRows) {
        if (!domRows.some(d => d.element === fr.element)) {
          domRows.push(fr);
        }
      }
      matched = matchStudent(st, domRows, assignedSet, i);
    }

    if (!matched) {
      scrollDownAndRefresh(targetDoc);
      await sleep(200);
      const freshRows2 = extractStudentRows(targetDoc);
      for (const fr of freshRows2) {
        if (!domRows.some(d => d.element === fr.element)) {
          domRows.push(fr);
        }
      }
      matched = matchStudent(st, domRows, assignedSet, i);
    }

    if (!matched) {
      notFoundList.push(st.name || `STT ${st.stt}`);
      if (onProgress) {
        onProgress({
          target: '341',
          current: i + 1,
          total: total,
          studentName: st.name || `STT ${st.stt}`,
          message: `⚠ Không tìm thấy hàng của: ${st.name || 'STT ' + st.stt}`
        });
      }
      continue;
    }

    try {
      matched.element.scrollIntoView({ behavior: 'auto', block: 'nearest' });
    } catch (e) {}

    // Tìm các ô nhập trong hàng: Mức đạt được (select), Điểm KTĐK (input), Nhận xét (input/textarea)
    const selects = Array.from(matched.element.querySelectorAll('select'));
    const textareas = Array.from(matched.element.querySelectorAll('textarea'));
    const textInputs = Array.from(matched.element.querySelectorAll('input[type="text"], input:not([type])'));
    const numberInputs = Array.from(matched.element.querySelectorAll('input[type="number"]'));

    let filledAny = false;

    // 1. Điền Mức đạt được (T / H / C)
    if (st.rating) {
      if (selects.length > 0) {
        setSelectValue(selects[0], st.rating);
        filledAny = true;
      } else {
        // Có thể là input text gõ chữ T/H/C
        const ratingInput = textInputs.find(inp => (inp.name || inp.id || '').toLowerCase().includes('muc') || (inp.name || inp.id || '').toLowerCase().includes('danhgia'));
        if (ratingInput) {
          setInputValue(ratingInput, st.rating);
          filledAny = true;
        }
      }
    }

    // 2. Điền Điểm KTĐK (nếu có điểm)
    if (st.score !== '' && st.score !== null && st.score !== undefined) {
      let scoreInput = numberInputs[0] || textInputs.find(inp => (inp.name || inp.id || '').toLowerCase().includes('diem'));
      if (scoreInput) {
        setInputValue(scoreInput, st.score);
        filledAny = true;
      }
    }

    // 3. Điền Mã nhận xét (nếu có mã)
    if (st.commentCode) {
      const codeInput = textInputs.find(inp => {
        const str = ((inp.name || '') + ' ' + (inp.id || '') + ' ' + (inp.placeholder || '') + ' ' + (inp.className || '')).toLowerCase();
        return str.includes('ma') || str.includes('code') || inp.offsetWidth < 90;
      });
      if (codeInput) {
        setInputValue(codeInput, st.commentCode);
        filledAny = true;
      }
    }

    // 4. Điền Nội dung nhận xét
    if (st.comment) {
      let commentEl = textareas[0] || textInputs.find(inp => {
        const str = ((inp.name || '') + ' ' + (inp.id || '') + ' ' + (inp.placeholder || '')).toLowerCase();
        return str.includes('noidung') || (str.includes('nhanxet') && !str.includes('ma')) || inp.offsetWidth > 150;
      });
      if (!commentEl && textInputs.length > 0) {
        // Ô input dài nhất trong hàng thường là ô nhận xét
        commentEl = textInputs[textInputs.length - 1];
      }
      if (commentEl) {
        setInputValue(commentEl, st.comment);
        filledAny = true;
      }
    }

    if (filledAny) successCount++;

    if (onProgress) {
      onProgress({
        target: '341',
        current: i + 1,
        total: total,
        studentName: st.name,
        message: `✔ Đã điền 3.4.1 (${st.rating || ''}) cho: ${st.name}`
      });
    }

    await sleep(80);
  }

  return {
    successCount,
    total,
    notFoundList,
    aborted: abortControllerFlag
  };
}

// =========================================================================
// 4. THI HÀNH ĐIỀN 3.4.2 (KẾT QUẢ NĂNG LỰC & PHẨM CHẤT)
// =========================================================================

async function executeFill342(studentsData, onProgress) {
  abortControllerFlag = false;
  const targetDoc = findBestDocument('342');
  const domRows = extractStudentRows(targetDoc);

  if (!domRows || domRows.length === 0) {
    throw new Error('Không tìm thấy danh sách học sinh trên trang 3.4.2! Thầy/cô vui lòng mở mục 3.4.2 trên SMIS, chọn đúng Lớp, Đợt đánh giá và bấm Tìm kiếm.');
  }

  const assignedSet = new Set();
  let successCount = 0;
  const notFoundList = [];
  const total = studentsData.length;

  for (let i = 0; i < total; i++) {
    if (abortControllerFlag) break;

    const st = studentsData[i];
    let matched = matchStudent(st, domRows, assignedSet, i);

    // Nếu chưa tìm thấy hàng, tự động cuộn trang/container xuống để nạp thêm học sinh vào DOM
    if (!matched) {
      scrollDownAndRefresh(targetDoc);
      await sleep(150);
      const freshRows = extractStudentRows(targetDoc);
      for (const fr of freshRows) {
        if (!domRows.some(d => d.element === fr.element)) {
          domRows.push(fr);
        }
      }
      matched = matchStudent(st, domRows, assignedSet, i);
    }

    if (!matched) {
      scrollDownAndRefresh(targetDoc);
      await sleep(200);
      const freshRows2 = extractStudentRows(targetDoc);
      for (const fr of freshRows2) {
        if (!domRows.some(d => d.element === fr.element)) {
          domRows.push(fr);
        }
      }
      matched = matchStudent(st, domRows, assignedSet, i);
    }

    if (!matched) {
      notFoundList.push(st.name || `STT ${st.stt}`);
      if (onProgress) {
        onProgress({
          target: '342',
          current: i + 1,
          total: total,
          studentName: st.name || `STT ${st.stt}`,
          message: `⚠ Không tìm thấy: ${st.name || 'STT ' + st.stt}`
        });
      }
      continue;
    }

    try {
      matched.element.scrollIntoView({ behavior: 'auto', block: 'nearest' });
    } catch (e) {}

    const selects = Array.from(matched.element.querySelectorAll('select'));
    const textareas = Array.from(matched.element.querySelectorAll('textarea'));
    const textInputs = Array.from(matched.element.querySelectorAll('input[type="text"], input:not([type])'));

    let filledCount = 0;

    // Danh sách 15 tiêu chí (T/Đ/C):
    const criteriaValues = [
      st.nl_tuchu, st.nl_giaotiep, st.nl_giaiquyet, // 3 NL chung
      st.nl_ngonngu, st.nl_tinhToan, st.nl_khoahoc, st.nl_congnghe, st.nl_tinhoc, st.nl_thammi, st.nl_thechat, // 7 NL đặc thù
      st.pc_yeunuoc, st.pc_nhanai, st.pc_chamchi, st.pc_trungthuc, st.pc_trachnhiem // 5 Phẩm chất
    ];

    // Điền vào các select tương ứng
    if (selects.length >= 15) {
      for (let sIdx = 0; sIdx < 15; sIdx++) {
        const val = criteriaValues[sIdx] || 'T';
        setSelectValue(selects[sIdx], val);
        filledCount++;
      }
    } else if (selects.length > 0) {
      // Nếu số select ít hơn (hoặc gộp nhóm), điền lần lượt
      selects.forEach((sel, sIdx) => {
        const val = criteriaValues[sIdx] || 'T';
        setSelectValue(sel, val);
        filledCount++;
      });
    }

    // Điền 3 ô nhận xét (NL Chung, NL Đặc Thù, Phẩm Chất)
    const commentList = [st.commentNLChung, st.commentNLDacThu, st.commentPhamChat].filter(Boolean);

    if (textareas.length >= 3) {
      if (st.commentNLChung) setInputValue(textareas[0], st.commentNLChung);
      if (st.commentNLDacThu) setInputValue(textareas[1], st.commentNLDacThu);
      if (st.commentPhamChat) setInputValue(textareas[2], st.commentPhamChat);
      filledCount++;
    } else if (textareas.length > 0) {
      textareas.forEach((ta, tIdx) => {
        if (commentList[tIdx]) setInputValue(ta, commentList[tIdx]);
      });
      filledCount++;
    } else if (textInputs.length >= 3) {
      // Một số bảng dùng input text
      const candidateInputs = textInputs.filter(inp => inp.offsetWidth > 100);
      if (candidateInputs.length >= 3) {
        if (st.commentNLChung) setInputValue(candidateInputs[0], st.commentNLChung);
        if (st.commentNLDacThu) setInputValue(candidateInputs[1], st.commentNLDacThu);
        if (st.commentPhamChat) setInputValue(candidateInputs[2], st.commentPhamChat);
        filledCount++;
      }
    }

    if (filledCount > 0) successCount++;

    if (onProgress) {
      onProgress({
        target: '342',
        current: i + 1,
        total: total,
        studentName: st.name,
        message: `✔ Đã điền Năng lực & Phẩm chất cho: ${st.name}`
      });
    }

    await sleep(100);
  }

  return {
    successCount,
    total,
    notFoundList,
    aborted: abortControllerFlag
  };
}

// =========================================================================
// 5. THI HÀNH ĐIỀN 3.4.3 (NHẬP NHẬN XÉT IN HỌC BẠ CỦA GVCN)
// =========================================================================

async function executeFill343(studentsData, onProgress) {
  abortControllerFlag = false;
  const targetDoc = findBestDocument('343');
  const domRows = extractStudentRows(targetDoc);

  if (!domRows || domRows.length === 0) {
    throw new Error('Không tìm thấy danh sách học sinh trên trang 3.4.3! Thầy/cô vui lòng mở mục 3.4.3 trên SMIS và bấm Tìm kiếm.');
  }

  const assignedSet = new Set();
  let successCount = 0;
  const notFoundList = [];
  const total = studentsData.length;

  for (let i = 0; i < total; i++) {
    if (abortControllerFlag) break;

    const st = studentsData[i];
    let matched = matchStudent(st, domRows, assignedSet, i);

    // Nếu chưa tìm thấy hàng, tự động cuộn trang/container xuống để nạp thêm học sinh vào DOM
    if (!matched) {
      scrollDownAndRefresh(targetDoc);
      await sleep(150);
      const freshRows = extractStudentRows(targetDoc);
      for (const fr of freshRows) {
        if (!domRows.some(d => d.element === fr.element)) {
          domRows.push(fr);
        }
      }
      matched = matchStudent(st, domRows, assignedSet, i);
    }

    if (!matched) {
      scrollDownAndRefresh(targetDoc);
      await sleep(200);
      const freshRows2 = extractStudentRows(targetDoc);
      for (const fr of freshRows2) {
        if (!domRows.some(d => d.element === fr.element)) {
          domRows.push(fr);
        }
      }
      matched = matchStudent(st, domRows, assignedSet, i);
    }

    if (!matched) {
      notFoundList.push(st.name || `STT ${st.stt}`);
      if (onProgress) {
        onProgress({
          target: '343',
          current: i + 1,
          total: total,
          studentName: st.name || `STT ${st.stt}`,
          message: `⚠ Không tìm thấy: ${st.name || 'STT ' + st.stt}`
        });
      }
      continue;
    }

    try {
      matched.element.scrollIntoView({ behavior: 'auto', block: 'nearest' });
    } catch (e) {}

    // Tìm ô nhận xét học bạ
    const textareas = Array.from(matched.element.querySelectorAll('textarea'));
    const textInputs = Array.from(matched.element.querySelectorAll('input[type="text"], input:not([type])'));

    let commentEl = textareas[0] || textInputs.find(inp => (inp.name || inp.id || '').toLowerCase().includes('nhanxet') || inp.offsetWidth > 150);
    if (!commentEl && textInputs.length > 0) {
      commentEl = textInputs[textInputs.length - 1];
    }

    if (commentEl && st.comment) {
      setInputValue(commentEl, st.comment);
      successCount++;
    }

    if (onProgress) {
      onProgress({
        target: '343',
        current: i + 1,
        total: total,
        studentName: st.name,
        message: `✔ Đã điền nhận xét học bạ cho: ${st.name}`
      });
    }

    await sleep(80);
  }

  return {
    successCount,
    total,
    notFoundList,
    aborted: abortControllerFlag
  };
}

// =========================================================================
// 6. LẮNG NGHE TIN NHẮN TỪ POPUP
// =========================================================================

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'PING') {
    sendResponse({ status: 'PONG', ready: true });
    return true;
  }

  if (request.action === 'DETECT_PAGE') {
    const doc = findBestDocument('any');
    const text = (doc.body ? doc.body.innerText : '').toLowerCase();
    const href = window.location.href.toLowerCase();

    let pageType = 'other';
    if (href.includes('danhgiadinhky') || text.includes('3.4.1') || text.includes('kết quả môn học')) {
      pageType = '341';
    } else if (href.includes('danhgianlpc') || href.includes('nlpc') || text.includes('3.4.2') || text.includes('năng lực và phẩm chất')) {
      pageType = '342';
    } else if (href.includes('hocba') || href.includes('inhocba') || text.includes('3.4.3') || text.includes('nhập nhận xét in học bạ')) {
      pageType = '343';
    }

    const rows = extractStudentRows(doc);
    const inputs = doc.querySelectorAll('input:not([type="hidden"]), textarea, select');
    const hasSave = !!queryFirst(SMIS_SELECTORS.saveButtons, doc);

    sendResponse({
      success: true,
      url: window.location.href,
      pageInfo: {
        type: pageType,
        studentRowsCount: rows.length,
        inputsCount: inputs.length,
        hasSaveButton: hasSave,
        iframeCount: document.querySelectorAll('iframe').length
      }
    });
    return true;
  }

  if (request.action === 'FILL_341') {
    executeFill341(request.students, request.sheetName, (progressData) => {
      safeSendMessage({ action: 'PROGRESS_UPDATE', ...progressData });
    })
      .then(result => sendResponse({ success: true, result }))
      .catch(err => sendResponse({ success: false, error: err.message }));
    return true;
  }

  if (request.action === 'FILL_342') {
    executeFill342(request.students, (progressData) => {
      safeSendMessage({ action: 'PROGRESS_UPDATE', ...progressData });
    })
      .then(result => sendResponse({ success: true, result }))
      .catch(err => sendResponse({ success: false, error: err.message }));
    return true;
  }

  if (request.action === 'FILL_343') {
    executeFill343(request.students, (progressData) => {
      safeSendMessage({ action: 'PROGRESS_UPDATE', ...progressData });
    })
      .then(result => sendResponse({ success: true, result }))
      .catch(err => sendResponse({ success: false, error: err.message }));
    return true;
  }

  if (request.action === 'ABORT_FILL') {
    abortControllerFlag = true;
    sendResponse({ success: true, message: 'Đã nhận lệnh dừng.' });
    return true;
  }

  return true;
});

console.log('[SMIS Pro TT27] Content script đã sẵn sàng phục vụ các mục 3.4.1, 3.4.2 và 3.4.3!');
