import type { Router } from 'express';
import express from 'express';
import multer from 'multer';
import { OSSController } from '../controllers/oss.controller';

const router: Router = express.Router();
const controller = new OSSController();

// 配置内存存储
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB
  },
});

/**
 * @route   GET /api/buckets
 * @desc    获取所有 Bucket 列表
 */
router.get('/buckets', controller.getBuckets);

/**
 * @route   GET /api/objects
 * @desc    获取文件列表
 * @query   prefix - 前缀过滤
 * @query   marker - 分页标记
 * @query   max-keys - 每页数量
 * @query   delimiter - 分隔符
 */
router.get('/objects', controller.getObjects);

/**
 * @route   GET /api/objects/:key/meta
 * @desc    获取文件元数据
 */
router.get('/objects/:key/meta', controller.getObjectMeta);

/**
 * @route   GET /api/signed-url
 * @desc    获取文件签名 URL
 * @query   key - 文件 key
 * @query   expires - 过期时间（秒）
 */
router.get('/signed-url', controller.getSignedUrl);

/**
 * @route   POST /api/upload
 * @desc    上传文件
 * @body    key - 可选，指定存储路径
 */
router.post('/upload', upload.single('file'), controller.uploadFile);

/**
 * @route   DELETE /api/objects/:key
 * @desc    删除单个文件
 */
router.delete('/objects/:key', controller.deleteObject);

/**
 * @route   DELETE /api/objects/batch
 * @desc    批量删除文件
 * @body    keys - 文件 key 数组
 */
router.delete('/objects/batch', controller.deleteObjects);

/**
 * @route   GET /api/search
 * @desc    搜索文件
 * @query   q - 搜索关键词
 */
router.get('/search', controller.searchObjects);

export default router;
