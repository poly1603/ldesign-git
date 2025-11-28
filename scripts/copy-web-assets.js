#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('📦 检查 Web UI 资源...');

// 创建目标目录
const distDir = path.join(__dirname, '../dist');
const webUiDir = path.join(distDir, 'web-ui');

// 检查是否有 Web UI 构建产物
const serverSrc = path.join(__dirname, '../web-ui/server/dist');
const clientSrc = path.join(__dirname, '../web-ui/client/dist');

const hasServer = fs.existsSync(serverSrc);
const hasClient = fs.existsSync(clientSrc);

if (!hasServer && !hasClient) {
  console.log('ℹ️  Web UI 未构建，跳过复制');
  console.log('💡 如需使用 Web UI，请运行: pnpm run build:web');
  process.exit(0);
}

// 创建 Web UI 目录
if (!fs.existsSync(webUiDir)) {
  fs.mkdirSync(webUiDir, { recursive: true });
}

// 复制服务器构建产物
const serverDest = path.join(webUiDir, 'server');

if (hasServer) {
  try {
    copyRecursive(serverSrc, serverDest);
    console.log('✅ 服务器文件已复制');
  } catch (error) {
    console.error('❌ 复制服务器文件失败:', error.message);
  }
} else {
  console.log('⚠️  服务器构建产物不存在，跳过');
}

// 复制客户端构建产物
const clientDest = path.join(webUiDir, 'client');

if (hasClient) {
  try {
    copyRecursive(clientSrc, clientDest);
    console.log('✅ 客户端文件已复制');
  } catch (error) {
    console.error('❌ 复制客户端文件失败:', error.message);
  }
} else {
  console.log('⚠️  客户端构建产物不存在，跳过');
}

console.log('✨ Web UI 资源检查完成！');

// 递归复制目录
function copyRecursive(src, dest) {
  if (!fs.existsSync(dest)) {
    fs.mkdirSync(dest, { recursive: true });
  }

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      copyRecursive(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}