import { test, expect } from '../fixtures';
import path from 'path';

test('Popup 应当能从当前页面提取链接', async ({ page, extensionId, context }) => {
  // 1. 通过 HTTP 导航到模拟测试页面
  const mockUrl = `http://localhost:8000/tests/mock-page.html`;
  await page.goto(mockUrl);
  await page.waitForLoadState('load');

  // 获取模拟页面的 Tab ID (通过 Playwright 的 evaluate 和 chrome API)
  // 我们需要在插件上下文中查询这个 URL 的 ID
  const background = context.serviceWorkers()[0];
  const mockTabId = await background.evaluate(async (url) => {
    const [tab] = await chrome.tabs.query({ url });
    return tab?.id;
  }, mockUrl);

  // 2. 打开插件 Popup 页面，并注入 testTabId
  const popupPage = await context.newPage();
  await popupPage.goto(`chrome-extension://${extensionId}/popup.html?testTabId=${mockTabId}`);

  // 3. 验证 Popup 是否获取到了数据
  const ed2kTab = popupPage.locator('.el-tabs__item', { hasText: 'ed2k' });
  
  try {
    await expect(ed2kTab).toBeVisible({ timeout: 5000 });
  } catch (e) {
    const refreshButton = popupPage.getByTestId('btn-refresh');
    if (await refreshButton.isVisible()) {
      await refreshButton.click();
      await expect(ed2kTab).toBeVisible({ timeout: 5000 });
    } else {
      throw e;
    }
  }
  
  const activeRows = popupPage.locator('.el-tab-pane:not([style*="display: none"]) .el-table__row');
  await expect(activeRows).toHaveCount(3);

  // 切换到 magnet 标签页
  const magnetTab = popupPage.locator('.el-tabs__item', { hasText: 'magnet' });
  await magnetTab.click();

  // 验证 magnet 链接数量
  await expect(popupPage.locator('.el-tab-pane:not([style*="display: none"]) .el-table__row')).toHaveCount(2);

  // 切换到 file 标签页
  const fileTab = popupPage.locator('.el-tabs__item', { hasText: 'file' });
  await fileTab.click();
  const filePane = popupPage.locator('.el-tab-pane:not([style*="display: none"])');
  await expect(filePane).toContainText('Download Movie');
  await expect(filePane.locator('.el-table__row')).toHaveCount(2);

  // 4. 测试 UI 交互：全选
  await popupPage.getByTestId('btn-select-all').click();
  
  // 验证按钮可见性
  await expect(popupPage.getByTestId('btn-copy')).toBeVisible();
  await expect(popupPage.getByTestId('btn-download')).toBeVisible();
});
