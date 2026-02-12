import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import apiRoutes from './routes/api.routes';
import { errorHandler, notFoundHandler } from './middlewares/error.middleware';
import { serverConfig } from './config/oss.config';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API 路由（放在静态文件之前）
app.use('/api', apiRoutes);

// 静态文件服务（Web UI）
app.use(express.static(path.join(__dirname, 'web')));

// SPA fallback - 使用所有未匹配的路由返回 index.html
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'web', 'index.html'));
});

// 错误处理
app.use(notFoundHandler);
app.use(errorHandler);

// 启动服务器
app.listen(serverConfig.port, () => {
  console.log(`OSS Manager 服务已启动: http://localhost:${serverConfig.port}`);
});
