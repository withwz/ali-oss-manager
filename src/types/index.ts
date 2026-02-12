// OSS 相关类型定义
export interface OSSConfig {
  region: string;
  accessKeyId: string;
  accessKeySecret: string;
  bucket: string;
}

// 文件对象类型
export interface OSSObject {
  name: string;
  url: string;
  size: number;
  lastModified: Date;
  type: 'file' | 'folder';
  contentType?: string;
}

// 列表查询参数
export interface ListObjectsParams {
  prefix?: string;
  marker?: string;
  'max-keys'?: number;
  delimiter?: string;
}

// 上传结果
export interface UploadResult {
  name: string;
  url: string;
  size: number;
}

// Bucket 信息
export interface BucketInfo {
  name: string;
  region: string;
  creationDate: Date;
}

// API 响应类型
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// 分页响应
export interface PaginatedResponse<T> {
  items: T[];
  isTruncated: boolean;
  nextMarker?: string;
  prefix?: string;
  commonPrefixes?: string[];
}
