import type { Request, Response } from 'express';
import { OSSService } from '../services/oss.service';
import type { ApiResponse, ListObjectsParams } from '../types';

export class OSSController {
  private ossService: OSSService;

  constructor() {
    this.ossService = new OSSService();
  }

  /**
   * 获取 Bucket 列表
   */
  getBuckets = async (req: Request, res: Response): Promise<void> => {
    try {
      const buckets = await this.ossService.listBuckets();
      const response: ApiResponse = { success: true, data: buckets };
      res.json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        error: (error as Error).message,
      };
      res.status(500).json(response);
    }
  };

  /**
   * 获取文件列表
   */
  getObjects = async (req: Request, res: Response): Promise<void> => {
    try {
      const params: ListObjectsParams = {
        prefix: req.query.prefix as string,
        marker: req.query.marker as string,
        'max-keys': req.query['max-keys'] ? parseInt(req.query['max-keys'] as string, 10) : 100,
        delimiter: req.query.delimiter as string,
      };
      const result = await this.ossService.listObjects(params);
      const response: ApiResponse = { success: true, data: result };
      res.json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        error: (error as Error).message,
      };
      res.status(500).json(response);
    }
  };

  /**
   * 获取文件签名 URL
   */
  getSignedUrl = async (req: Request, res: Response): Promise<void> => {
    try {
      const { key } = req.params;
      const expires = req.query.expires ? parseInt(req.query.expires as string, 10) : 3600;
      const url = this.ossService.getSignedUrl(key, expires);
      const response: ApiResponse = { success: true, data: { url } };
      res.json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        error: (error as Error).message,
      };
      res.status(500).json(response);
    }
  };

  /**
   * 获取文件元数据
   */
  getObjectMeta = async (req: Request, res: Response): Promise<void> => {
    try {
      const { key } = req.params;
      const meta = await this.ossService.getObjectMeta(key);
      const response: ApiResponse = { success: true, data: meta };
      res.json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        error: (error as Error).message,
      };
      res.status(500).json(response);
    }
  };

  /**
   * 上传文件
   */
  uploadFile = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.file) {
        const response: ApiResponse = { success: false, error: '没有文件上传' };
        res.status(400).json(response);
        return;
      }

      const key = req.body.key || req.file.originalname;
      const result = await this.ossService.uploadFile(key, req.file.buffer);
      const response: ApiResponse = { success: true, data: result };
      res.json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        error: (error as Error).message,
      };
      res.status(500).json(response);
    }
  };

  /**
   * 删除文件
   */
  deleteObject = async (req: Request, res: Response): Promise<void> => {
    try {
      const { key } = req.params;
      await this.ossService.deleteObject(key);
      const response: ApiResponse = { success: true, message: '删除成功' };
      res.json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        error: (error as Error).message,
      };
      res.status(500).json(response);
    }
  };

  /**
   * 批量删除文件
   */
  deleteObjects = async (req: Request, res: Response): Promise<void> => {
    try {
      const { keys } = req.body;
      if (!Array.isArray(keys) || keys.length === 0) {
        const response: ApiResponse = { success: false, error: '无效的 keys 参数' };
        res.status(400).json(response);
        return;
      }
      await this.ossService.deleteObjects(keys);
      const response: ApiResponse = { success: true, message: '删除成功' };
      res.json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        error: (error as Error).message,
      };
      res.status(500).json(response);
    }
  };

  /**
   * 搜索文件
   */
  searchObjects = async (req: Request, res: Response): Promise<void> => {
    try {
      const keyword = req.query.q as string;
      if (!keyword) {
        const response: ApiResponse = { success: false, error: '缺少搜索关键词' };
        res.status(400).json(response);
        return;
      }
      const results = await this.ossService.searchObjects(keyword);
      const response: ApiResponse = { success: true, data: { items: results } };
      res.json(response);
    } catch (error) {
      const response: ApiResponse = {
        success: false,
        error: (error as Error).message,
      };
      res.status(500).json(response);
    }
  };
}
