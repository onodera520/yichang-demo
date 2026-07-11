# 异常中枢

异常中枢是一个跨境电商运营异常处理系统 Demo，用于集中处理订单异常、库存风险、任务协同和数据复盘。项目以高保真 B 端运营后台为目标，所有业务内容均来自本地 mock 数据，不依赖真实后端接口。

## 技术栈

- React 18
- Vite
- Tailwind CSS
- React Router
- lucide-react
- Recharts

## 页面模块

- 异常工作台：展示核心异常指标、优先级列表、AI 建议、异常趋势、待办事项和系统消息。
- 订单异常：支持订单异常筛选、分页、批量操作、风险标签、平台图标和订单详情抽屉。
- 库存决策：展示 SKU 库存风险、补货建议、库存趋势和 SKU 详情。
- 任务协同：支持任务筛选、分页、选择、转交、升级、完成和右侧任务详情面板。
- 数据复盘：展示异常趋势、AI 建议处理效果、处理效率分析和反复问题识别。
- 系统设置：展示平台连接、店铺同步、SLA 规则、AI 设置和通知设置。

## 核心交互

- 平台、店铺、国家、风险等级、负责人等多条件筛选。
- 订单、库存、任务列表本地分页。
- 订单和库存详情抽屉，任务右侧详情面板。
- 生成任务、确认、驳回、保存设置等 Toast 轻提示。
- 剩余 SLA 实时倒计时，超时后显示红色超时态。
- 使用 Recharts 渲染趋势、效率和复盘图表。
- 使用 `src/data/mockData.js` 和本地状态模拟完整业务流转。

## 本地运行方式

安装依赖：

```bash
npm install
```

启动开发环境：

```bash
npm run dev
```

构建生产包：

```bash
npm run build
```

本地预览生产包：

```bash
npm run preview
```

## 部署方式

推荐使用 Vercel Git 集成部署：

1. 将项目推送到 GitHub 仓库。
2. 在 Vercel 中导入该仓库。
3. Framework Preset 选择 `Vite`。
4. Build Command 使用 `npm run build`。
5. Output Directory 使用 `dist`。
6. 部署完成后，`vercel.json` 会将所有路径回退到 `/`，保证 `/dashboard`、`/orders`、`/tasks` 等 React Router 页面刷新正常。

也可以使用 Vercel CLI 部署：

```bash
npm install -g vercel
vercel
vercel --prod
```
