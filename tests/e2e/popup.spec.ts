import { test, expect } from '../fixtures';
import path from 'path';

test('Popup 应当能从当前页面提取链接', async ({ page, extensionId, context }) => {
  // 捕获模拟页面的控制台日志
  page.on('console', msg => console.log('页面日志:', msg.text()));

  // 1. 通过 HTTP 导航到模拟测试页面
  await page.goto(`http://localhost:8000/tests/mock-page.html`);
  await page.waitForLoadState('load');

  // 2. 打开插件 Popup 页面
  const popupPage = await context.newPage();
  
  // 捕获 Popup 的控制台日志
  popupPage.on('console', msg => console.log('POPUP 日志:', msg.text()));

  await popupPage.goto(`chrome-extension://${extensionId}/popup.html`);

  // 3. 验证 Popup 是否获取到了数据
  const ed2kTab = popupPage.locator('.el-tabs__item', { hasText: 'ed2k' });
  
  try {
    // 等待 ed2k 标签页出现，如果没出现则尝试点击手动刷新按钮
    await expect(ed2kTab).toBeVisible({ timeout: 5000 });
  } catch (e) {
    console.log('初次加载未发现数据，尝试点击刷新按钮...');
    const refreshButton = popupPage.locator('.btn-refresh');
    if (await refreshButton.isVisible()) {
      await refreshButton.click();
      await expect(ed2kTab).toBeVisible({ timeout: 5000 });
    } else {
      console.log('刷新按钮也未找到。页面内容:', await popupPage.innerHTML('body'));
      throw e;
    }
  }
  
  // 检查 ed2k 标签页下的行数
  // 我们只计算当前显示的（非隐藏的）表格行
  const activeRows = popupPage.locator('.el-tab-pane:not([style*="display: none"]) .el-table__row');
  
  const count = await activeRows.count();
  console.log(`发现 ${count} 条活跃的 ed2k 链接行:`);
  for (let i = 0; i < count; i++) {
    const fileName = await activeRows.nth(i).locator('td').nth(2).innerText();
    console.log(`- ${fileName}`);
  }
  // 根据 mock-page.html，应当有 3 条 ed2k 链接
  await expect(activeRows).toHaveCount(3);

  // 切换到 magnet 标签页
  const magnetTab = popupPage.locator('.el-tabs__item', { hasText: 'magnet' });
  await magnetTab.click();

  // 验证 magnet 链接数量 (应当有 2 条)
  await expect(popupPage.locator('.el-tab-pane:not([style*="display: none"]) .el-table__row')).toHaveCount(2);

  // 4. 测试 UI 交互：全选
  await popupPage.click('.btn-select-all');
  
  // 验证选中状态（选中数据后应当显示 'copy' 按钮）
  const copyButton = popupPage.locator('.btn-copy');
  await expect(copyButton).toBeVisible();
});
