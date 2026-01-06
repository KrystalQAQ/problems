# 刷题网站（Vue + Supabase）

题目来源：`problems.txt`（已生成可导入 Supabase 的 SQL：`supabase/seed_problems.sql`）。

## 功能
- 题库浏览：按题型筛选、关键词搜索、分页
- 题目详情：单选/多选判题、显示参考答案、收藏
- 登录/注册：Supabase Auth（邮箱 + 密码）
- 我的：统计提交次数、正确/错误、收藏数

## Supabase 初始化
1. 新建 Supabase Project
2. 进入 SQL Editor，依次执行：
   - `supabase/schema.sql`
   - `supabase/seed_problems.sql`
3. 进入 Auth -> Providers，开启 Email（按需配置邮箱验证/重置密码）

## 本地运行
1. 创建 `.env`（参考 `.env.example`）：
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
2. 安装依赖：`pnpm install`
3. 启动开发：`pnpm dev`

## 重新生成题库导入 SQL
如需从 `problems.txt` 重新生成：`pnpm gen:problems-sql`（输出到 `supabase/seed_problems.sql`）。

## 设计 TODO
见：`TODOLIST.md`

