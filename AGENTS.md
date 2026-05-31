# Tsanaae Game - 项目上下文

## 项目概述
游戏资源导航网站，对标 woligedou.cc，提供游戏分类浏览、搜索、详情查看和评论功能。

### 版本技术栈
- **Framework**: Next.js 16 (App Router)
- **Core**: React 19
- **Language**: TypeScript 5
- **UI 组件**: shadcn/ui (基于 Radix UI)
- **Styling**: Tailwind CSS 4 (暗色主题，电竞风)
- **Database**: Supabase (PostgreSQL)
- **ORM/迁移**: Drizzle

## 目录结构
```
├── public/                 # 静态资源
├── src/
│   ├── app/                # 页面路由
│   │   ├── api/            # API 路由
│   │   │   ├── games/      # 游戏列表+详情+点赞+评论
│   │   │   ├── categories/ # 分类接口
│   │   │   ├── tags/       # 标签接口
│   │   │   └── search/     # 搜索接口
│   │   ├── game/[id]/      # 游戏详情页
│   │   ├── games/[slug]/   # 分类页
│   │   ├── search/         # 搜索页
│   │   └── page.tsx        # 首页
│   ├── components/         # 共享组件
│   │   ├── Header.tsx      # 顶栏导航
│   │   ├── GameCard.tsx    # 游戏卡片
│   │   ├── GameGrid.tsx    # 游戏网格
│   │   └── HotTags.tsx     # 热门标签
│   ├── lib/                # 工具库
│   │   ├── types.ts        # 类型定义
│   │   └── utils.ts        # 通用工具
│   └── storage/database/   # Supabase 客户端+Schema
│       ├── supabase-client.ts
│       └── shared/schema.ts
```

## 数据库表
- **categories**: 游戏分类 (pc/mobile/web)
- **tags**: 游戏标签
- **games**: 游戏主表
- **game_tags**: 游戏-标签关联表
- **comments**: 评论

## 包管理规范
仅允许使用 pnpm

## 开发规范
- TypeScript strict 模式
- 字段名使用 snake_case
- Supabase 操作必须检查 { data, error } 并 throw
- 组件使用 'use client' 标注客户端组件
