/**
 * utils/matcher.js
 * Thư viện chuẩn hóa tiếng Việt và so khớp tên, mã học sinh, STT linh hoạt
 */

const Matcher = {
  removeVietnameseDiacritics(str) {
    if (!str || typeof str !== 'string') return '';
    return str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd')
      .replace(/Đ/g, 'D')
      .toLowerCase()
      .trim();
  },

  cleanString(str) {
    if (!str || typeof str !== 'string') return '';
    return str.replace(/\s+/g, ' ').trim();
  },

  splitName(fullName) {
    const clean = this.cleanString(fullName).toLowerCase();
    const parts = clean.split(' ');
    if (parts.length <= 1) {
      return { lastName: '', firstName: clean };
    }
    const firstName = parts.pop();
    const lastName = parts.join(' ');
    return { lastName, firstName };
  },

  isNameMatched(sourceName, targetName) {
    if (!sourceName || !targetName) return false;

    const sClean = this.cleanString(sourceName).toLowerCase();
    const tClean = this.cleanString(targetName).toLowerCase();

    // 1. Khớp chính xác có dấu
    if (sClean === tClean) return true;

    // 2. Khớp không dấu
    const sNoMark = this.removeVietnameseDiacritics(sClean);
    const tNoMark = this.removeVietnameseDiacritics(tClean);
    if (sNoMark === tNoMark) return true;

    // 3. Khớp khi một chuỗi chứa chuỗi kia
    if (sClean.includes(tClean) || tClean.includes(sClean)) return true;
    if (sNoMark.includes(tNoMark) || tNoMark.includes(sNoMark)) return true;

    // 4. Khớp theo phần họ và tên
    const sParts = this.splitName(sClean);
    const tParts = this.splitName(tClean);

    // Cùng tên gọi
    if (sParts.firstName && tParts.firstName) {
      const sFirstNo = this.removeVietnameseDiacritics(sParts.firstName);
      const tFirstNo = this.removeVietnameseDiacritics(tParts.firstName);
      if (sFirstNo === tFirstNo) {
        // Kiểm tra họ lót tương đồng
        const sLastNo = this.removeVietnameseDiacritics(sParts.lastName);
        const tLastNo = this.removeVietnameseDiacritics(tParts.lastName);
        if (sLastNo.includes(tLastNo) || tLastNo.includes(sLastNo)) {
          return true;
        }
      }
    }

    return false;
  },

  isIdMatched(sourceId, targetId) {
    if (!sourceId || !targetId) return false;
    const s = this.cleanString(sourceId).toUpperCase();
    const t = this.cleanString(targetId).toUpperCase();
    return s === t || s.includes(t) || t.includes(s);
  },

  /**
   * So khớp tổng hợp giữa phần tử web (domData) và học sinh Excel (excelStudent)
   */
  match(domData, excelStudent, options = {}) {
    if (!domData || !excelStudent) return false;

    // Nếu dòng này trên web đã được gán cho học sinh khác rồi thì bỏ qua
    if (domData.isAssigned) return false;

    const domStt = String(domData.stt || '').trim();
    const excStt = String(excelStudent.stt || '').trim();
    const isSameStt = domStt && excStt && domStt === excStt;

    // CHẾ ĐỘ 1: Nếu người dùng chọn ưu tiên khớp theo STT
    if (options.matchBySTT && isSameStt) {
      return true;
    }

    // CHẾ ĐỘ 2: Khớp theo Mã học sinh (chính xác tuyệt đối)
    if (domData.id && excelStudent.id) {
      if (this.isIdMatched(domData.id, excelStudent.id)) {
        return true;
      }
    }

    // CHẾ ĐỘ 3: Trùng STT và tên tương đối khớp
    if (isSameStt) {
      if (this.isNameMatched(domData.name, excelStudent.name)) {
        return true;
      }
      // Nếu tên bị cụt nhưng cùng họ đệm
      const sNoMark = this.removeVietnameseDiacritics(domData.name);
      const tNoMark = this.removeVietnameseDiacritics(excelStudent.name);
      if (sNoMark.includes(tNoMark) || tNoMark.includes(sNoMark)) {
        return true;
      }
    }

    // CHẾ ĐỘ 4: Khớp theo Họ và tên
    if (domData.name && excelStudent.name) {
      if (this.isNameMatched(domData.name, excelStudent.name)) {
        return true;
      }
    }

    return false;
  }
};

if (typeof module !== 'undefined' && module.exports) module.exports = Matcher;
else if (typeof window !== 'undefined') window.Matcher = Matcher;
