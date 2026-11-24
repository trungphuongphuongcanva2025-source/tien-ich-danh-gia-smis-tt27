/**
 * background.js
 * Service Worker cho SMIS Pro Chrome Extension (Manifest V3)
 * Hỗ trợ giáo viên nhập nhận xét Thông tư 27 trên SMIS (smis.moet.gov.vn / csdl.moet.gov.vn)
 */

chrome.runtime.onInstalled.addListener((details) => {
  console.log('[SMIS Pro] Tiện ích đã được cài đặt/cập nhật:', details.reason);

  // Khởi tạo mẫu nhận xét mặc định nếu chưa có trong storage
  chrome.storage.local.get(['smis_templates'], (result) => {
    if (!result.smis_templates) {
      const defaultTemplates = {
        periodic: [
          { id: 'p1', title: 'Hoàn thành Tốt (Toán/TV)', text: 'Nắm vững kiến thức, kĩ năng môn học. Tiếp thu bài nhanh, làm bài cẩn thận, chữ viết sạch đẹp.' },
          { id: 'p2', title: 'Hoàn thành (Cần rèn luyện)', text: 'Hoàn thành các nội dung bài học. Cần chú ý rèn thêm kĩ năng tính toán và trình bày cẩn thận hơn.' },
          { id: 'p3', title: 'Chưa hoàn thành', text: 'Chưa nắm vững một số kiến thức trọng tâm. Cần tích cực ôn tập và nhờ thầy cô hỗ trợ thêm.' }
        ],
        subject: [
          { id: 's1', title: 'Môn học - Tốt', text: 'Hoàn thành tốt nội dung các môn học và hoạt động giáo dục trong tháng; tích cực phát biểu xây dựng bài.' },
          { id: 's2', title: 'Môn học - Đạt', text: 'Hoàn thành bài tập trên lớp; cần tập trung chú ý hơn khi nghe giảng để nắm bài sâu hơn.' }
        ],
        competence: [
          { id: 'c1', title: 'Năng lực - Tự chủ, tự học', text: 'Có khả năng tự giác hoàn thành nhiệm vụ học tập; chủ động phối hợp cùng bạn trong hoạt động nhóm.' },
          { id: 'c2', title: 'Năng lực - Giao tiếp, hợp tác', text: 'Mạnh dạn, tự tin khi phát biểu; tích cực chia sẻ ý kiến với các bạn trong tổ.' }
        ],
        quality: [
          { id: 'q1', title: 'Phẩm chất - Chăm chỉ, nhân ái', text: 'Chăm chỉ học tập, trung thực, lễ phép với thầy cô và luôn sẵn sàng giúp đỡ bạn bè.' },
          { id: 'q2', title: 'Phẩm chất - Trách nhiệm', text: 'Có tinh thần trách nhiệm cao, hoàn thành tốt các nhiệm vụ được giao, giữ gìn vệ sinh chung.' }
        ]
      };

      chrome.storage.local.set({ smis_templates: defaultTemplates }, () => {
        console.log('[SMIS Pro] Đã nạp bộ mẫu nhận xét mặc định Thông tư 27.');
      });
    }
  });
});

// Lắng nghe tin nhắn cập nhật trạng thái badge
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'UPDATE_BADGE') {
    try {
      const badgeDetails = { text: request.text || '' };
      if (sender.tab && typeof sender.tab.id === 'number') {
        badgeDetails.tabId = sender.tab.id;
      }
      chrome.action.setBadgeText(badgeDetails);
      if (request.text) {
        chrome.action.setBadgeBackgroundColor({ color: request.color || '#0d9488' });
      }
    } catch (e) {
      console.warn('[SMIS Pro] Không thể cập nhật badge:', e);
    }
    sendResponse({ status: 'ok' });
    return true;
  }
  return true;
});
