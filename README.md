# Ditto Market

Ditto WebOS 官方应用市场数据仓库。

## 目录结构

```
Ditto_Market/
├── apps/
│   └── {appId}/                    # 反域名格式，如 com.example.myapp
│       ├── manifest.json           # 应用清单（含 market 字段）
│       ├── screenshots/            # 截图（最多 8 张）
│       └── changelog.md            # 版本变更日志
├── data/
│   ├── categories.json             # 分类定义
│   ├── featured.json               # 首页推荐配置
│   └── reviews/
│       └── {appId}.json            # 评论数据
├── scripts/
│   └── validate-pr.js              # PR 自动验证
└── README.md
```

## 发布应用

### 1. Fork 本仓库

点击右上角 Fork 按钮。

### 2. 创建应用目录

在 `apps/` 下创建以应用 ID 命名的目录（反域名格式，如 `com.example.myapp`）。

### 3. 添加 manifest.json

```json
{
  "id": "com.example.myapp",
  "name": "My App",
  "version": "1.0.0",
  "description": "应用描述",
  "icon": "📦",
  "entry": "index.html",
  "category": "productivity",
  "sandbox": "trusted",
  "permissions": ["storage"],
  "window": {
    "width": 800,
    "height": 600,
    "minWidth": 400,
    "minHeight": 300,
    "resizable": true,
    "maximizable": true
  },
  "market": {
    "summary": "一句话描述",
    "description": "详细描述（支持 Markdown）",
    "category": "productivity",
    "tags": ["标签1", "标签2"],
    "screenshots": ["screenshots/01.png"],
    "changelog": "changelog.md",
    "downloadUrl": "https://github.com/YOUR_USERNAME/YOUR_REPO/releases/download/v1.0.0/com.example.myapp.dit",
    "publisher": "你的名字",
    "homepage": "https://example.com",
    "sourceUrl": "https://github.com/YOUR_USERNAME/YOUR_REPO"
  }
}
```

### 4. 上传 .dit 包

使用 `ditto pack` 打包后，在你的 GitHub 仓库创建 Release 并上传 .dit 文件。将 Release 下载链接填入 `market.downloadUrl`。

### 5. 提交 PR

提交 Pull Request，CI 会自动验证 manifest 格式。管理员审核通过后应用将自动上架。

## 可用分类

| ID | 名称 | 图标 |
|---|---|---|
| productivity | 效率工具 | 📊 |
| social | 社交 | 💬 |
| entertainment | 娱乐 | 🎮 |
| development | 开发工具 | 🛠️ |
| theme | 主题 | 🎨 |
| widget | 小组件 | 📱 |
| plugin | 插件 | 🔌 |
| education | 教育 | 📚 |
| utility | 系统工具 | ⚙️ |

## 评论

评论数据存储在 `data/reviews/{appId}.json`，通过 PR 提交。

```json
[
  {
    "userId": "github:username",
    "rating": 5,
    "comment": "很棒的应用！",
    "version": "1.0.0",
    "createdAt": "2026-05-01T10:30:00Z"
  }
]
```

## 验证

```bash
node scripts/validate-pr.js
```

## 许可

MIT
