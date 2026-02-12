import dotenv from 'dotenv';
import type { OSSConfig } from '../types';

dotenv.config();

export const ossConfig: OSSConfig = {
  region: process.env.OSS_REGION || 'oss-cn-hangzhou',
  accessKeyId: process.env.OSS_ACCESS_KEY_ID || '',
  accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET || '',
  bucket: process.env.OSS_BUCKET || '',
};

// 验证配置
export function validateConfig(): boolean {
  const { accessKeyId, accessKeySecret, bucket } = ossConfig;
  if (!accessKeyId || !accessKeySecret || !bucket) {
    console.error('OSS 配置不完整，请检查环境变量');
    return false;
  }
  return true;
}

// 服务器配置
export const serverConfig = {
  port: parseInt(process.env.PORT || '3000', 10),
};
