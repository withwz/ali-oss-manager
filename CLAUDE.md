# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

这是一个基于 Node.js + TypeScript 的阿里云 OSS (Object Storage Service) 内容管理 Web 工具，提供文件浏览、上传、下载、删除、预览和搜索等功能。

## 开发命令

```bash
# 开发模式（热重载）
npm run dev

# 构建项目
npm run build

# 运行生产构建
npm start
```

## 配置

项目使用环境变量进行配置。首次开发前需要创建 `.env` 文件：

```bash
cp .env.example .env
```

必需的环境变量：
- `OSS_REGION` - OSS 区域（如：oss-cn-hangzhou）
- `OSS_ACCESS_KEY_ID` - 阿里云 Access Key ID
- `OSS_ACCESS_KEY_SECRET` - 阿里云 Access Key Secret
- `OSS_BUCKET` - Bucket 名称
- `PORT` - 服务器端口（默认 3000）

## 架构设计

项目采用经典的 MVC 分层架构：

```
src/
├── server.ts           # Express 服务入口，启动服务器
├── config/             # 配置管理
├── routes/             # API 路由定义
├── controllers/        # HTTP 请求处理器
├── services/           # 业务逻辑层（OSS 操作封装）
├── middlewares/        # Express 中间件（错误处理）
├── types/              # TypeScript 类型定义
└── web/                # 前端静态资源（原生 HTML/CSS/JS）
```

**架构层次**：
1. **Routes** (`api.routes.ts`) - 定义 REST API 端点
2. **Controllers** (`oss.controller.ts`) - 处理 HTTP 请求/响应
3. **Services** (`oss.service.ts`) - 封装 ali-oss SDK 操作
4. **Frontend** (`web/`) - 单页应用，通过 AJAX 调用 API

## 关键技术点

- **ES Modules**: 项目使用 `"type": "module"`，所有 import/export 使用 ES 模块语法
- **TypeScript 配置**: `NodeNext` 模块解析，输出到 `dist/` 目录
- **OSS SDK**: 使用 ali-oss v6，封装 ListObjectsV2 API 用于分页
- **文件上传**: 使用 multer 中间件处理 multipart/form-data
- **分页**: OSS 列表使用 continuation-token 实现分页

## API 端点

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/objects` | 获取文件列表（支持 prefix、marker、max-keys 查询参数）|
| POST | `/api/upload` | 上传文件 |
| DELETE | `/api/objects/:key` | 删除指定文件 |
| GET | `/api/signed-url` | 获取临时访问签名 URL |
| GET | `/api/objects/:key/meta` | 获取文件元数据 |

## 前端架构

前端采用原生 JavaScript 实现，无框架依赖：

- `web/index.html` - 主 HTML 模板
- `web/css/style.css` - 样式表
- `web/js/app.js` - 主应用逻辑

主要功能模块：
- 文件列表渲染与分页
- 拖拽上传与进度跟踪
- 面包屑导航
- 文件搜索
- 图片预览

## 开发注意事项

1. 修改 TypeScript 文件后需重新构建（开发模式 `tsx watch` 会自动重载）
2. 前端静态文件通过 Express 托管在根路径
3. OSS 配置通过 `src/config/oss.config.ts` 加载和验证
4. 所有 OSS 操作都通过 Service 层封装，Controller 不直接调用 ali-oss SDK
