# 开发指南

本文档描述了 Flutter i18n VS Code Inline 扩展的开发工作流程和工具配置。

## 开发环境设置

### 前置要求

- Node.js 18.x 或 20.x
- pnpm (推荐的包管理器)
- VS Code

### 安装依赖

```bash
pnpm install
```

## 开发工具

### 代码格式化

项目使用 Prettier 进行代码格式化：

```bash
# 格式化所有代码
pnpm run format

# 检查格式化
pnpm run format:check
```

### 代码检查

项目使用 ESLint 进行代码检查：

```bash
# 运行 linter
pnpm run lint

# 自动修复可修复的问题
pnpm run lint:fix
```

### 类型检查

```bash
# TypeScript 类型检查
pnpm run check-types
```

## 测试

### 运行测试

```bash
# 运行所有测试
pnpm run test

# 运行测试并生成覆盖率报告
pnpm run test:coverage

# 监视模式运行测试
pnpm run test:watch
```

### 测试覆盖率

测试覆盖率报告会生成在 `coverage/` 目录中。项目配置了以下覆盖率阈值：

- 语句覆盖率: 80%
- 分支覆盖率: 70%
- 函数覆盖率: 80%
- 行覆盖率: 80%

## Git 工作流程

### Commit 规范

项目使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

```
type(scope): description

[optional body]

[optional footer]
```

支持的类型：
- `feat`: 新功能
- `fix`: 错误修复
- `docs`: 文档更新
- `style`: 代码格式化
- `refactor`: 代码重构
- `test`: 测试相关
- `chore`: 构建过程或辅助工具的变动
- `perf`: 性能优化
- `ci`: CI/CD 相关

### Git Hooks

项目配置了以下 Git hooks：

#### Pre-commit
- 运行 lint-staged 对暂存的文件进行格式化和检查
- 自动修复可修复的 ESLint 问题
- 格式化代码

#### Commit-msg
- 验证 commit 消息是否符合 Conventional Commits 规范

### Lint-staged 配置

对于 TypeScript 和 JavaScript 文件：
- 运行 ESLint 并自动修复
- 运行 Prettier 格式化

对于 JSON 和 Markdown 文件：
- 运行 Prettier 格式化

## 构建和打包

```bash
# 开发构建
pnpm run compile

# 生产构建
pnpm run package

# 监视模式构建
pnpm run watch
```

## VS Code 配置

项目包含了 VS Code 工作区配置，提供：

- 保存时自动格式化
- ESLint 自动修复
- 导入语句自动整理
- 适当的文件排除设置

## CI/CD

项目配置了 GitHub Actions 工作流程：

- **测试**: 在 Node.js 18.x 和 20.x 上运行测试
- **代码检查**: 类型检查、linting 和格式化检查
- **构建**: 构建扩展包
- **覆盖率**: 生成并上传测试覆盖率报告

## 开发最佳实践

1. **提交前检查**：确保所有测试通过，代码格式正确
2. **类型安全**：尽量避免使用 `any` 类型
3. **测试覆盖**：为新功能编写相应的测试
4. **文档更新**：更新相关文档和注释
5. **性能考虑**：注意扩展的启动时间和内存使用

## 故障排除

### 常见问题

1. **ESLint 错误**: 运行 `pnpm run lint:fix` 自动修复
2. **格式化问题**: 运行 `pnpm run format` 格式化代码
3. **类型错误**: 运行 `pnpm run check-types` 检查类型问题
4. **测试失败**: 检查测试日志，确保模拟配置正确

### 清理和重置

```bash
# 清理构建输出
rm -rf out coverage

# 重新安装依赖
rm -rf node_modules pnpm-lock.yaml
pnpm install
```