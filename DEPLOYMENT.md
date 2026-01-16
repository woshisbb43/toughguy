# Cloudflare Pages 部署指南

## 部署步骤

### 1. 创建 KV 命名空间

在 Cloudflare Dashboard 中：
1. 进入 **Workers & Pages** → **KV**
2. 点击 **Create a namespace**
3. 命名为 `LOTTERY_CONFIG`
4. 记下创建的 KV 命名空间 ID

### 2. 部署到 Cloudflare Pages

#### 方式 A：通过 Git 自动部署（推荐）

1. 登录 Cloudflare Dashboard
2. 进入 **Workers & Pages** → **Create application** → **Pages** → **Connect to Git**
3. 选择你的 GitHub 仓库
4. 配置构建设置：
   - **Framework preset**: None
   - **Build command**: 留空
   - **Build output directory**: `/`（或留空）
5. 点击 **Save and Deploy**

#### 方式 B：使用 Wrangler CLI

```bash
# 安装 wrangler
npm install -g wrangler

# 登录
wrangler login

# 部署
npx wrangler pages deploy . --project-name=toughguy
```

### 3. 绑定 KV 到 Pages

部署完成后：

1. 进入 **Pages 项目** → **Settings** → **Functions**
2. 找到 **KV namespace bindings**
3. 点击 **Add binding**
4. 配置：
   - **Variable name**: `LOTTERY_CONFIG`
   - **KV namespace**: 选择刚才创建的 `LOTTERY_CONFIG`
5. 点击 **Save**

### 4. 重新部署

绑定 KV 后，需要重新部署才能生效：
- Git 部署：推送新的 commit 触发自动部署
- CLI 部署：再次运行 `npx wrangler pages deploy .`

## 功能说明

### API 端点

- **GET /api/config** - 获取配置
  - 从 KV 读取 `lottery_config` 键
  - 如果不存在，返回默认配置

- **POST /api/config** - 保存配置
  - 请求体格式：
    ```json
    {
      "people": ["张三", "李四"],
      "prizes": ["一等奖", "二等奖"]
    }
    ```
  - 保存到 KV 的 `lottery_config` 键

### 页面功能

1. **主页 (index.html)**
   - 启动时自动从 KV 加载配置
   - 点击"配置管理"跳转到管理页面

2. **管理页面 (admin.html)**
   - 加载 KV 中的配置
   - 支持添加/删除人员和奖品
   - 点击"保存配置"将数据保存到 KV
   - 点击"返回抽奖"回到主页

## 本地测试

如果要在本地测试 KV 功能：

```bash
# 安装依赖
npm install -g wrangler

# 创建本地 KV
wrangler kv:namespace create "LOTTERY_CONFIG" --preview

# 启动本地开发服务器
npx wrangler pages dev . --kv LOTTERY_CONFIG
```

## 故障排查

### 配置加载失败
- 检查 KV 绑定是否正确
- 检查浏览器控制台是否有错误
- 确认 `/api/config` 端点可访问

### 保存失败
- 检查 POST 请求是否成功
- 检查 KV 写入权限
- 查看 Functions 日志

### 本地文件访问
如果直接双击 `index.html` 打开：
- 无法访问 `/api/config`（需要服务器环境）
- 会使用默认配置
- 建议使用 `python3 -m http.server 8000` 或部署到 Pages
