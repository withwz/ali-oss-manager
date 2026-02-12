import OSS from 'ali-oss';
import { ossConfig, validateConfig } from '../config/oss.config';
import type {
  OSSObject,
  ListObjectsParams,
  UploadResult,
  BucketInfo,
  PaginatedResponse,
} from '../types';

export class OSSService {
  private client: OSS;

  constructor() {
    if (!validateConfig()) {
      throw new Error('OSS 配置无效');
    }
    this.client = new OSS(ossConfig);
  }

  /**
   * 列出所有 Bucket
   */
  async listBuckets(): Promise<BucketInfo[]> {
    try {
      const result = await this.client.listBuckets();
      return (
        result.buckets?.map((bucket) => ({
          name: bucket.name,
          region: bucket.region || '',
          creationDate: new Date(bucket.creationDate),
        })) || []
      );
    } catch (error) {
      throw new Error(`列出 Bucket 失败: ${(error as Error).message}`);
    }
  }

  /**
   * 列出文件
   */
  async listObjects(params: ListObjectsParams = {}): Promise<PaginatedResponse<OSSObject>> {
    try {
      const result = await this.client.list({
        prefix: params.prefix,
        marker: params.marker,
        'max-keys': params['max-keys'] || 100,
        delimiter: params.delimiter,
      });

      const items: OSSObject[] = [];

      // 处理文件夹（公共前缀）
      if (result.prefixes) {
        result.prefixes.forEach((prefix) => {
          items.push({
            name: prefix,
            url: '',
            size: 0,
            lastModified: new Date(),
            type: 'folder',
          });
        });
      }

      // 处理文件
      if (result.objects) {
        result.objects
          .filter((obj) => obj.name !== (params.prefix || ''))
          .forEach((obj) => {
            items.push({
              name: obj.name,
              url: this.client.signatureUrl(obj.name),
              size: obj.size,
              lastModified: new Date(obj.lastModified),
              type: 'file',
              contentType: '',
            });
          });
      }

      return {
        items,
        isTruncated: result.isTruncated || false,
        nextMarker: result.nextMarker,
        prefix: result.prefix,
        commonPrefixes: result.prefixes,
      };
    } catch (error) {
      throw new Error(`列出文件失败: ${(error as Error).message}`);
    }
  }

  /**
   * 上传文件
   */
  async uploadFile(
    key: string,
    file: Buffer | string | ReadableStream,
    progress?: (p: number, checkpoint: any) => void
  ): Promise<UploadResult> {
    try {
      const result = await this.client.put(key, file, {
        progress,
      });

      return {
        name: result.name,
        url: result.url,
        size: 0, // OSS put 结果不包含 size，需要额外获取
      };
    } catch (error) {
      throw new Error(`上传文件失败: ${(error as Error).message}`);
    }
  }

  /**
   * 删除文件
   */
  async deleteObject(key: string): Promise<void> {
    try {
      await this.client.delete(key);
    } catch (error) {
      throw new Error(`删除文件失败: ${(error as Error).message}`);
    }
  }

  /**
   * 批量删除文件
   */
  async deleteObjects(keys: string[]): Promise<void> {
    try {
      await this.client.deleteMulti(keys);
    } catch (error) {
      throw new Error(`批量删除失败: ${(error as Error).message}`);
    }
  }

  /**
   * 获取文件签名 URL（临时访问链接）
   */
  getSignedUrl(key: string, expires = 3600): string {
    return this.client.signatureUrl(key, { expires });
  }

  /**
   * 获取文件元数据
   */
  async getObjectMeta(key: string): Promise<OSSObject> {
    try {
      const result = await this.client.head(key);
      return {
        name: key,
        url: this.client.signatureUrl(key),
        size: parseInt(result.meta?.size || '0', 10),
        lastModified: new Date(result.meta?.lastModified || Date.now()),
        type: 'file',
        contentType: result.meta?.contentType,
      };
    } catch (error) {
      throw new Error(`获取文件元数据失败: ${(error as Error).message}`);
    }
  }

  /**
   * 检查文件是否存在
   */
  async objectExists(key: string): Promise<boolean> {
    try {
      await this.client.head(key);
      return true;
    } catch {
      return false;
    }
  }
}
