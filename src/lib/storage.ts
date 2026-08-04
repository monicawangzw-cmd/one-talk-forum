import { kv } from '@vercel/kv';
import fs from 'fs';
import path from 'path';

// 检测是否在 Vercel 环境（有KV环境变量就用云存储）
const isVercel = process.env.VERCEL_KV_REST_API_URL && process.env.VERCEL_KV_REST_API_TOKEN;

export async function getItem<T>(key: string, defaultValue: T): Promise<T> {
  try {
    if (isVercel) {
      const value = await kv.get(key);
      return value === null ? defaultValue : (value as T);
    } else {
      const filePath = path.join(process.cwd(), 'data', `${key}.json`);
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
    if (isVercel) {
      await kv.set(key, JSON.parse(JSON.stringify(value)));
    } else {
      const dir = path.join(process.cwd(), 'data');
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      const filePath = path.join(dir, `${key}.json`);
      fs.writeFileSync(filePath, JSON.stringify(value, null, 2));
    }
  } catch (error) {
    console.error('setItem error:', key, error);
  }
}