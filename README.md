# 阿里云 OSS 内容管理查看器

一个基于 Node.js + TypeScript 开发的阿里云 OSS 内容管理 Web 工具。

## 功能特性

- 📁 **文件浏览** - 浏览 OSS Bucket 中的文件和文件夹
- 📤 **文件上传** - 支持拖拽上传，显示上传进度
- 📥 **文件下载** - 一键下载文件
- 🗑️ **文件删除** - 支持单个文件删除
- 👁️ **文件预览** - 支持图片等文件在线预览
- 🔍 **搜索功能** - 快速搜索文件
- 📂 **目录导航** - 面包屑导航，快速切换目录

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制 `.env.example` 为 `.env`，填入你的阿里云 OSS 配置：

```bash
cp .env.example .env
```

编辑 `.env` 文件：

```env
OSS_REGION=oss-cn-hangzhou
OSS_ACCESS_KEY_ID=your_access_key_id
OSS_ACCESS_KEY_SECRET=your_access_key_secret
OSS_BUCKET=your_bucket_name
PORT=3000
```

### 3. 启动服务

开发模式（热重载）：

```bash
npm run dev
```

生产模式：

```bash
npm run build
npm start
```

### 4. 访问界面

打开浏览器访问：http://localhost:3000

## 项目结构

```
oss-manager/
├── src/
│   ├── config/          # 配置文件
│   │   └── oss.config.ts
│   ├── services/        # 业务逻辑层
│   │   └── oss.service.ts
│   ├── routes/          # API 路由
│   │   └── api.routes.ts
│   ├── controllers/     # 控制器
│   │   └── oss.controller.ts
│   ├── middlewares/     # 中间件
│   │   └── error.middleware.ts
│   ├── types/           # TypeScript 类型定义
│   │   └── index.ts
│   ├── web/             # 前端资源
│   │   ├── index.html
│   │   ├── css/
│   │   └── js/
│   └── server.ts        # 服务入口
├── plan/                # 计划文档
├── .env.example         # 环境变量示例
├── tsconfig.json
├── package.json
└── README.md
```

## API 接口

### 文件管理

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/objects` | 获取文件列表 |
| POST | `/api/upload` | 上传文件 |
| DELETE | `/api/objects/:key` | 删除文件 |
| GET | `/api/signed-url` | 获取临时访问链接 |
| GET | `/api/objects/:key/meta` | 获取文件元数据 |

### 查询参数

**获取文件列表 (`GET /api/objects`)**

- `prefix` - 前缀过滤（目录）
- `marker` - 分页标记
- `max-keys` - 每页数量（默认 100）
- `delimiter` - 分隔符

## 技术栈

- **运行时**: Node.js
- **语言**: TypeScript
- **Web 框架**: Express.js
- **OSS SDK**: ali-oss
- **前端**: 原生 HTML/CSS/JavaScript

## 开发计划

详见 [plan/oss-manager-plan.md](./plan/oss-manager-plan.md)

## License

MIT
