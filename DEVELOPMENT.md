# 开发环境配置

本文档介绍如何设置 MYS 项目的开发环境。

## 前置条件

- Docker 和 Docker Compose
- Node.js 20+
- npm

## 开发环境

该项目包含用于开发和测试的 Docker Compose 配置，用于运行 Elasticsearch 和 Kibana。

### 启动开发环境

```bash
# 启动 Elasticsearch 和 Kibana
docker compose up -d

# 检查服务是否运行
docker compose ps

# 查看日志
docker compose logs -f
```

### 访问服务

- **Elasticsearch**: http://localhost:9200
- **Kibana**: http://localhost:5601

默认认证信息：
- 用户名: `elastic`
- 密码: `changeme`

### 数据和配置

- Elasticsearch 数据: `./dev-data/elasticsearch/`
- Kibana 数据: `./dev-data/kibana/`
- Elasticsearch 配置: `./dev-config/elasticsearch/`
- Kibana 配置: `./dev-config/kibana/`

### 运行数据收集

```bash
# 安装依赖
npm install

# 编译 TypeScript
npx tsc

# 运行数据收集（带限制）
MAX_RUNTIME=300 MAX_ITERATIONS=100 LOG_LEVEL=info node dist/index.js [checkpoint]
```

### 环境变量

- `MAX_RUNTIME`: 最大运行时间（秒，默认: 3600）
- `MAX_ITERATIONS`: 最大迭代次数（默认: 10000）
- `LOG_LEVEL`: 日志级别（默认: info）

### 停止开发环境

```bash
# 停止服务
docker compose down

# 停止并删除数据卷（警告：这将删除所有数据）
docker compose down -v
```

## GitHub Actions

该项目包含用于手动数据收集运行的 GitHub Action 工作流。可以从 Actions 选项卡手动触发工作流，并配置以下参数：

- 起始检查点
- 最大运行时间
- 最大迭代次数

完成后，如果收集到新数据，操作将创建一个包含新数据的 Pull Request，供审查和合并。