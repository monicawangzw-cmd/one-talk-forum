import { Redis } from '@upstash/redis';
import fs from 'fs';
import path from 'path';

// 检测是否在 Vercel 环境（有 Upstash 环境变量就用云存储）
const isVercel = process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN;

let redis: Redis | null = null;
if (isVercel) {
  redis = new Redis({
    url: process.env.KV_REST_API_URL as string,
    token: process.env.KV_REST_API_TOKEN as string,
  });
}

// 本地存储固定路径：用项目根目录下的 data 文件夹，不受 .next 重新 build 影响
// 优先用环境变量 FORUM_DATA_DIR 指定，否则回退到项目根目录 data/
const LOCAL_DATA_DIR = process.env.FORUM_DATA_DIR || path.join(process.cwd(), 'data');

export async function getItem<T>(key: string, defaultValue: T): Promise<T> {
  try {
    if (redis) {
      const value = await redis.get(key);
      return value === null ? defaultValue : (value as T);
    } else {
      const filePath = path.join(LOCAL_DATA_DIR, `${key}.json`);
      if (!fs.existsSync(filePath)) {
        fs.mkdirSync(path.dirname(filePath), { recursive: true });
        fs.writeFileSync(filePath, JSON.stringify(defaultValue, null, 2));
        return defaultValue;
      }
      const data = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('getItem error:', key, error);
    return defaultValue;
  }
}

export async function setItem<T>(key: string, value: T): Promise<void> {
  try {
    if (redis) {
      await redis.set(key, JSON.parse(JSON.stringify(value)));
    } else {
      if (!fs.existsSync(LOCAL_DATA_DIR)) {
        fs.mkdirSync(LOCAL_DATA_DIR, { recursive: true });
      }
      const filePath = path.join(LOCAL_DATA_DIR, `${key}.json`);
      fs.writeFileSync(filePath, JSON.stringify(value, null, 2));
    }
  } catch (error) {
    console.error('setItem error:', key, error);
  }
}