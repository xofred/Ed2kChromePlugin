# Ed2kChromePlugin

这是一款方便开发者和用户从网页中快速提取、筛选并批量复制 `ed2k` 和 `magnet` 磁力链接的 Chrome 浏览器插件。

[English](README.md) | 中文

## 主要功能
- **自动抓取**：自动识别页面中的 ed2k 链接和磁力链接。
- **智能解析**：通过 Cheerio 和正则优化，尽可能提取文件名称和大小。
- **批量操作**：支持按范围选择、全选、反选。
- **关键词搜索**：支持在结果列表中进行实时文件名搜索。
- **一键复制**：支持批量复制链接到剪贴板。

## 技术栈
- **核心框架**：Vue 3 (Composition API)
- **UI 组件库**：Element Plus
- **构建工具**：Vite
- **解析库**：Cheerio, Lodash
- **语言**：TypeScript

## 开发与构建

### 开发模式
```bash
npm run dev
```
入口文件为 `index.html`。

### 构建插件
```bash
npm run build
```
构建产物位于 `dist` 目录。在 Chrome 扩展管理页面（`chrome://extensions/`）开启“开发者模式”，点击“加载已解压的扩展程序”，选择 `dist` 目录即可加载。

## 测试

为了保证插件逻辑的健壮性，项目集成了完整的测试套件：

### 单元测试 (Unit Testing)
主要测试核心的正则解析逻辑和数据模型。
```bash
npm test
```
使用 **Vitest** 运行。

### 功能测试 (E2E Testing)
模拟真实浏览器环境，测试插件 UI 与内容脚本的端到端交互。
```bash
# 首先需要构建插件
npm run build
# 运行功能测试
npm run test:e2e
```
使用 **Playwright** 运行。它会自动启动 Chromium，加载插件，并在 Mock 网页上验证抓取逻辑。

## 目录结构说明
- `src/composables`：封装核心业务逻辑（链接提取、交互状态）。
- `src/components`：UI 拆分后的功能组件。
- `src/types.ts`：全局类型定义及核心正则。
- `tests/`：存放功能测试脚本及 Mock 数据。

## Google 网上应用店
[查看详情](https://chrome.google.com/webstore/detail/kmeeplonmihpchdbfccgmjhcnpecbppk)
