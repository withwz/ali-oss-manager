# 阿里云 OSS 内容管理查看器 - 开发计划

## 项目概述
使用 Node.js + TypeScript 开发一个阿里云 OSS 内容管理查看器，提供 Web 界面和 CLI 工具两种使用方式。

## 技术栈
- **运行时**: Node.js v23.8.0
- **语言**: TypeScript
- **OSS SDK**: ali-oss (阿里云官方 SDK)
- **Web 框架**: Express.js
- **前端**: 原生 HTML/CSS/JS 或 React (待定)
- **模板引擎**: EJS 或纯静态页面
- **包管理**: npm

## 核心功能模块

### 1. 项目初始化
- [ ] 初始化 TypeScript 项目 (package.json, tsconfig.json)
- [ ] 配置 ESLint + Prettier 代码规范
- [ ] 配置环境变量管理 (dotenv)

### 2. OSS 服务层
- [ ] 封装 ali-oss SDK 连接配置
- [ ] 实现文件列表获取 (支持分页、前缀过滤)
- [ ] 实现文件上传功能 (支持单文件、多文件、进度显示)
- [ ] 实现文件下载功能
- [ ] 实现文件删除功能 (单个、批量)
- [ ] 实现文件夹/目录管理 (创建、删除)
- [ ] 实现文件预览 (图片、文档)
- [ ] 实现文件元数据查询 (大小、类型、最后修改时间)
- [ ] 实现搜索功能 (按文件名、类型)

### 3. Web 服务
- [ ] 创建 Express 服务器
- [ ] 实现 RESTful API 接口
  - GET /api/buckets - 列出所有 Bucket
  - GET /api/objects - 列出文件
  - POST /api/upload - 上传文件
  - GET /api/download/:key - 下载文件
  - DELETE /api/objects/:key - 删除文件
  - GET /api/presignedUrl - 生成临时访问链接
- [ ] 实现 CORS 跨域配置
- [ ] 实现鉴权/权限控制 (可选)

### 4. Web UI 界面
- [ ] 整体布局设计 (响应式)
- [ ] Bucket 切换功能
- [ ] 文件列表展示 (表格/卡片视图)
- [ ] 文件上传区域 (拖拽支持)
- [ ] 文件预览功能 (图片、视频、PDF)
- [ ] 文件操作菜单 (下载、删除、复制链接)
- [ ] 面包屑导航 (目录层级)
- [ ] 搜索功能界面
- [ ] 上传进度显示

### 5. CLI 工具 (可选)
- [ ] ls - 列出文件
- [ ] upload - 上传文件
- [ ] download - 下载文件
- [ ] delete - 删除文件
- [ ] sync - 同步目录

## 目录结构
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
│   ├── utils/           # 工具函数
│   │   └── helpers.ts
│   ├── web/             # 前端资源
│   │   ├── index.html
│   │   ├── css/
│   │   └── js/
│   ├── cli/             # CLI 工具
│   │   └── index.ts
│   └── server.ts        # 服务入口
├── plan/                # 计划文档
├── .env.example         # 环境变量示例
├── tsconfig.json
├── package.json
└── README.md
```

## 开发步骤

### 阶段一：项目基础搭建
1. 初始化 npm 项目
2. 安装核心依赖
3. 配置 TypeScript
4. 创建基础目录结构

### 阶段二：OSS 核心服务
1. 封装 ali-oss SDK
2. 实现基础 CRUD 操作
3. 编写单元测试

### 阶段三：Web API 服务
1. 搭建 Express 服务器
2. 实现 RESTful API
3. 错误处理中间件
4. API 测试

### 阶段四：Web UI 开发
1. 设计界面布局
2. 实现文件列表展示
3. 实现上传下载功能
4. 实现预览功能
5. 响应式适配

### 阶段五：优化与部署
1. 性能优化
2. 安全加固
3. Docker 部署配置
4. 文档完善

## 核心依赖
```json
{
  "dependencies": {
    "ali-oss": "^6.18.0",
    "express": "^4.18.2",
    "dotenv": "^16.3.1",
    "multer": "^1.4.5-lts.1",
    "cors": "^2.8.5"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/node": "^20.10.0",
    "@types/multer": "^1.4.11",
    "@types/cors": "^2.8.17",
    "typescript": "^5.3.3",
    "tsx": "^4.7.0",
    "eslint": "^8.55.0",
    "prettier": "^3.1.1"
  }
}
```

## 环境变量配置
```env
# OSS 配置
OSS_REGION=oss-cn-hangzhou
OSS_ACCESS_KEY_ID=your_access_key_id
OSS_ACCESS_KEY_SECRET=your_access_key_secret
OSS_BUCKET=your_bucket_name

# 服务配置
PORT=3000
```

## 进度追踪
- [ ] 阶段一：项目基础搭建
- [ ] 阶段二：OSS 核心服务
- [ ] 阶段三：Web API 服务
- [ ] 阶段四：Web UI 开发
- [ ] 阶段五：优化与部署
