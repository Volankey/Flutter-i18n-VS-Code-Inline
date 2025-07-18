# 自动发布指南

本项目已配置自动发布功能，当检测到包含版本信息的 commit 时，会自动执行测试、构建和发布流程。

## 🚀 如何触发自动发布

### 1. Commit 信息格式

在 commit 信息中包含 `version: x.y.z` 格式的版本号：

```bash
# 正确格式示例
git commit -m "feat: 添加新功能 version: 1.2.3"
git commit -m "version: 2.0.0 - 重大更新"
git commit -m "fix: 修复bug\n\nversion: 1.1.1"
```

### 2. 分支要求

- 只有推送到 `main` 分支的 commit 才会触发自动发布
- 确保你的更改已经合并到 main 分支

### 3. 版本号格式

- 必须遵循语义化版本规范：`主版本号.次版本号.修订号`
- 例如：`1.0.0`, `2.1.3`, `0.5.12`

## 📋 自动发布流程

当检测到符合条件的 commit 时，GitHub Actions 会自动执行以下步骤：

1. **提取版本号** - 从 commit 信息中解析版本号
2. **更新 package.json** - 自动更新项目版本
3. **运行测试** - 执行类型检查、代码检查和单元测试
4. **构建扩展** - 打包生成 .vsix 文件
5. **发布到市场** - 使用 AZURE_DEV secret 发布到 VS Code Marketplace
6. **创建 GitHub Release** - 自动创建 GitHub 发布版本
7. **上传构件** - 保存发布文件作为构件

## ⚙️ 配置要求

### GitHub Secrets

确保以下 secrets 已在 GitHub 仓库中配置：

- `AZURE_DEV` - Azure DevOps Personal Access Token，用于发布到 VS Code Marketplace
- `GITHUB_TOKEN` - 自动提供，用于创建 GitHub Release

### 权限设置

确保 GitHub Actions 有以下权限：
- `contents: write` - 创建 releases
- `actions: read` - 读取 workflow 状态

## 🔍 监控发布状态

1. 访问 GitHub 仓库的 **Actions** 标签页
2. 查看 "CI/CD" workflow 的运行状态
3. 点击具体的 workflow run 查看详细日志

## ❌ 常见问题

### pnpm 可执行文件未找到

**错误信息**: "Unable to locate executable file: pnpm"

**解决方案**:
- 已在 CI 配置中修复：确保 pnpm 在 Node.js setup 之前安装
- 本地开发：运行 `npm install -g pnpm` 全局安装 pnpm

### VS Code 测试环境错误

**错误信息**: "Missing X server or $DISPLAY" 或 "SIGSEGV"

**解决方案**:
- 已在 CI 配置中修复：使用 xvfb 提供虚拟显示器
- 简化了 Node.js 版本矩阵，只使用 20.x 版本
- 为 VS Code 扩展测试提供了正确的图形环境

### 版本号提取失败

**错误信息**: "❌ 未能从 commit 信息中提取到有效版本号"

**解决方案**:
- 检查 commit 信息格式是否正确
- 确保使用 `version: x.y.z` 格式
- 版本号必须是三段式数字格式

### 发布权限错误

**错误信息**: 发布到 marketplace 失败

**解决方案**:
- 检查 `AZURE_DEV` secret 是否正确配置
- 确认 Personal Access Token 有发布权限
- 验证 publisher 信息是否匹配

### 测试失败

**错误信息**: 测试或代码检查失败

**解决方案**:
- 在本地运行 `pnpm run test` 确保测试通过
- 运行 `pnpm run lint` 修复代码风格问题
- 运行 `pnpm run check-types` 修复类型错误

## 📝 手动发布

如果需要手动发布，可以使用以下命令：

```bash
# 安装依赖
pnpm install

# 运行测试
pnpm run test

# 构建扩展
pnpm run package

# 发布到市场
pnpm run vsce:publish
```

## 🔗 相关链接

- [VS Code Extension Publishing](https://code.visualstudio.com/api/working-with-extensions/publishing-extension)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Semantic Versioning](https://semver.org/)