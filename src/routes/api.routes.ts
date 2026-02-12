import type { Router } from 'express';
import express from 'express';
import { OSSController } from '../controllers/oss.controller';

const router: Router = express.Router();
const controller = new OSSController();

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
 * @route   GET /api/search
 * @desc    搜索文件
 * @query   q - 搜索关键词
 */
router.get('/search', controller.searchObjects);

export default router;
