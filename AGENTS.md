🏆 评分系统 (Scoring System) 项目开发规则
本项目采用 Next.js (全栈框架) 作为前端展示与部分 SSR，Node.js (Express) 作为核心业务后端及 WebSocket 中枢。为确保实时比分的高性能与系统一致性，请严格遵守以下规范。
1. 每个 page.tsx 必须配置 Metadata
为了 SEO 和浏览器标签页显示，每个页面必须定义标题和描述。
尤其是在“实时大屏幕”和“公共排行榜”页面，需设置合理的关键词。
code
Ts
// app/(display)/scoreboard/page.tsx
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "实时比分大屏幕 | Scoring System",
  description: "实时展示各赛区选手的最新得分情况",
};
2. 必须支持 Light & Dark Theme
评审端：通常使用浅色模式（清晰易读）。
大屏幕端 (Scoreboard)：必须支持深色模式（高对比度，更炫酷）。
必须使用 Tailwind 的 dark: 前缀。
3. 文件命名规则：全项目使用 kebab-case
文件夹、组件名、Hook 名、API 路由全部使用小写短横线连接。
示例：score-input-form.tsx, use-realtime-scores.ts。
4. 必须实现 Skeleton 骨架屏加载
评分页面、选手列表加载时不能出现白屏或生硬的闪烁。
必须在对应的 loading.tsx 中使用 Skeleton 组件。
5. 提示系统统一：Sonner
评审提交分数成功、Admin 创建比赛成功，统一使用 Sonner 弹出提示。
禁止使用原生的 alert() 或 confirm()。
6. 响应式布局：重点适配平板 (Tablet)
评审端：必须完美适配 iPad/平板电脑（评审打分主要工具）。
大屏幕端：必须适配 1080P/4K 投影仪。
管理端：适配 Desktop。
7. 严格的 API 请求链路 (前端禁止直接连数据库)
禁止在前端页面直接使用 pg 或 ioredis。
前端只能通过 fetch 或 axios 调用后端 API。
链路： Component → use-hook → backend API → PostgreSQL/Redis。
8. 集中式 API 配置与 Hooks 封装
所有请求地址必须写在 lib/api-config.ts。
请求逻辑必须通过 SWR 或 React Query 封装在 hooks/ 文件夹下。
示例：
code
Ts
// hooks/use-athletes.ts
import { athletesApi } from "@/lib/api-config";
import { Athlete } from "@/interface/athlete";
// ...获取逻辑
9. 后端安全性：API 逻辑与数据库操作
核心数据库操作（PostgreSQL）和缓存操作（Redis）必须写在独立的 Node.js Backend 或 Next.js 的 app/api 路由中。
所有的 sql 查询必须使用参数化查询，严禁字符串拼接以防 SQL 注入。
10. 页面按角色文件夹分组 (Route Groups)
必须使用括号 () 进行物理隔离，确保代码结构与业务角色一致：
code
Code
app
├── (admin)     // 比赛管理、选手录入
├── (judge)     // 评审登录、选择比赛、打分
├── (display)   // 实时大屏幕、公共排行榜
└── (auth)      // 登录页面
11. 必须使用统一的类型定义 @/interface
后端返回的所有 JSON 数据，必须在 @/interface 下有对应的 TypeScript 定义。
示例：ScoreInput, CompetitionEvent, JudgeUser。
12. 实时比分规范 (WebSocket/Redis)
WebSocket 监听：前端仅在 (display) 和 (judge) 相关的页面初始化 Socket 连接。
Redis 策略：Node.js 后端在收到打分后，先写 PostgreSQL，后推 Redis。
断线重连：前端 Hook 必须处理 WebSocket 断线后的自动尝试连接逻辑。
13. 评审打分逻辑保护
提交分数 API 必须经过 server-guard（后端中间件）校验 JWT。
前端鉴权：使用 use-user Hook 判断当前是否为 judge 角色，否则禁止进入打分页。
14. 禁用前端直接会话管理
严禁在前端直接操作 localStorage 来判断用户权限。
所有权限和 Session 必须由后端 API 通过验证 Token 返回。
15. 评分标准隔离
提交分数时，前端必须根据 category_type (个人/双人/挑战) 传入对应的字段。
后端逻辑不计算总分（按照你的要求），直接将各维度原始分存入 scores 表并同步至 Redis。
✅ 开发检查表 (Definition of Done)

页面是否有 SEO Metadata？

是否兼容 Dark Mode？

接口返回的数据是否有 @/interface 类型定义？

所有的 API URL 是否都在 api-config.ts 中？

评审打分端是否支持响应式（平板适配）？

是否使用了 Sonner 做反馈？

是否在 (admin)/(judge)/(display) 分组内？