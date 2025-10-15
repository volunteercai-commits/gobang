# 五子棋React游戏部署指南

## 部署脚本说明

### 1. 完整部署脚本 (`deploy.sh`)
自动完成构建、上传、配置nginx等所有步骤。

**使用方法:**
```bash
./deploy.sh
```

**功能:**
- ✅ 自动安装依赖
- ✅ 构建React项目
- ✅ 上传到服务器
- ✅ 配置nginx
- ✅ 验证部署结果

### 2. 简化部署脚本 (`deploy-simple.sh`)
只构建项目，生成部署包，需要手动上传。

**使用方法:**
```bash
./deploy-simple.sh
```

**功能:**
- ✅ 构建React项目
- ✅ 创建部署包 `gobang-react-build.tar.gz`
- ⚠️ 需要手动上传和配置

## 部署前准备

### 1. 确保项目可以正常构建
```bash
npm install
npm run build
```

### 2. 检查服务器连接
```bash
ssh caixy.icu "echo '服务器连接正常'"
```

### 3. 确保服务器有足够权限
- 可以写入 `/var/www/html/`
- 可以修改nginx配置
- 可以重载nginx服务

## 部署步骤

### 使用完整部署脚本（推荐）
```bash
# 1. 进入项目目录
cd /path/to/gobang-react

# 2. 运行部署脚本
./deploy.sh

# 3. 等待部署完成
# 4. 访问 http://caixy.icu/gobang-react
```

### 使用简化部署脚本
```bash
# 1. 构建项目
./deploy-simple.sh

# 2. 上传部署包到服务器
scp gobang-react-build.tar.gz caixy.icu:/tmp/

# 3. 在服务器上解压
ssh caixy.icu "mkdir -p /var/www/html/gobang-react && tar -xzf /tmp/gobang-react-build.tar.gz -C /var/www/html/gobang-react/"

# 4. 配置nginx（手动）
# 5. 重载nginx
ssh caixy.icu "systemctl reload nginx"
```

## 项目特性

### 🎮 游戏功能
- 15×15标准五子棋棋盘
- 人人对战模式 (PVP)
- 人机对战模式 (PVC)
- 智能AI算法
- 悔棋功能（每人每局一次）
- 计分系统

### 🤖 AI特性
- 开局策略优化
- 威胁检测（活三、双三、四三、双四）
- 防守反击逻辑
- 执黑/执白不同策略

### 🎨 UI特性
- Canvas绘制，视觉效果佳
- 响应式设计，支持移动端
- 现代化界面设计
- 渐变色彩和阴影效果

### 🔧 技术栈
- React 18 + TypeScript
- Canvas API
- 智能AI算法
- 响应式CSS

## 访问地址

部署完成后，可以通过以下地址访问：
- 域名: `http://caixy.icu/gobang-react`
- IP地址: `http://[服务器IP]/gobang-react`

## 故障排除

### 1. 构建失败
```bash
# 清理并重新安装依赖
rm -rf node_modules package-lock.json
npm install
npm run build
```

### 2. 上传失败
```bash
# 检查SSH连接
ssh caixy.icu "echo '连接正常'"

# 检查服务器权限
ssh caixy.icu "ls -la /var/www/html/"
```

### 3. nginx配置问题
```bash
# 检查nginx配置
ssh caixy.icu "nginx -t"

# 查看nginx错误日志
ssh caixy.icu "tail -f /var/log/nginx/error.log"
```

### 4. 页面无法访问
```bash
# 检查文件是否存在
ssh caixy.icu "ls -la /var/www/html/gobang-react/"

# 检查nginx状态
ssh caixy.icu "systemctl status nginx"
```

## 更新部署

当代码有更新时，只需重新运行部署脚本：

```bash
./deploy.sh
```

脚本会自动：
1. 拉取最新代码
2. 重新构建项目
3. 上传新文件
4. 重载nginx
