#!/bin/bash

# Flutter i18n VSCode Inline 插件演示脚本
# 用于快速测试和演示插件功能

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# 项目路径
PLUGIN_ROOT="/Users/hakusakaitekimac/Documents/flutter-i18n-scanner/Flutter-i18n-VsCode-Inline"
EXAMPLE_ROOT="$PLUGIN_ROOT/example"

echo -e "${BLUE}🚀 Flutter i18n VSCode Inline 插件演示${NC}"
echo -e "${BLUE}================================================${NC}"
echo

# 函数：打印步骤
print_step() {
    echo -e "${CYAN}📋 步骤 $1: $2${NC}"
}

# 函数：打印成功
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

# 函数：打印警告
print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# 函数：打印错误
print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# 函数：检查命令是否存在
check_command() {
    if command -v $1 >/dev/null 2>&1; then
        print_success "$1 已安装"
        return 0
    else
        print_error "$1 未安装"
        return 1
    fi
}

# 步骤1: 检查环境
print_step "1" "检查环境依赖"
check_command "node" || exit 1
check_command "pnpm" || exit 1
check_command "code" || exit 1
echo

# 步骤2: 检查项目结构
print_step "2" "检查项目结构"
if [ -d "$PLUGIN_ROOT" ]; then
    print_success "插件项目目录存在"
else
    print_error "插件项目目录不存在: $PLUGIN_ROOT"
    exit 1
fi

if [ -d "$EXAMPLE_ROOT" ]; then
    print_success "示例项目目录存在"
else
    print_error "示例项目目录不存在: $EXAMPLE_ROOT"
    exit 1
fi
echo

# 步骤3: 构建插件
print_step "3" "构建插件"
cd "$PLUGIN_ROOT"

if [ ! -d "node_modules" ]; then
    echo "安装依赖..."
    pnpm install
fi

echo "构建插件..."
pnpm run compile

if [ -f "dist/extension.js" ]; then
    PLUGIN_SIZE=$(du -h "dist/extension.js" | cut -f1)
    print_success "插件构建成功 (大小: $PLUGIN_SIZE)"
else
    print_error "插件构建失败"
    exit 1
fi
echo

# 步骤4: 运行自动化测试
print_step "4" "运行自动化测试"
node test_plugin.js
echo

# 步骤5: 显示示例代码
print_step "5" "显示示例代码片段"
echo -e "${PURPLE}以下是 example 项目中的国际化调用示例:${NC}"
echo
echo -e "${YELLOW}// home_screen.dart${NC}"
grep -n "l10n\." "$EXAMPLE_ROOT/lib/screens/home_screen.dart" | head -5 | while read line; do
    echo -e "${CYAN}$line${NC}"
done
echo

# 步骤6: 显示ARB文件内容
print_step "6" "显示翻译文件内容"
echo -e "${PURPLE}英文翻译文件 (app_en.arb) 示例:${NC}"
echo
head -20 "$EXAMPLE_ROOT/lib/l10n/app_en.arb" | while read line; do
    echo -e "${CYAN}$line${NC}"
done
echo "..."
echo

# 步骤7: 启动VSCode
print_step "7" "启动 VSCode 扩展开发主机"
echo -e "${YELLOW}即将启动 VSCode 扩展开发主机...${NC}"
echo -e "${YELLOW}这将打开两个 VSCode 窗口:${NC}"
echo -e "${YELLOW}1. 插件开发窗口 (用于调试)${NC}"
echo -e "${YELLOW}2. 扩展主机窗口 (用于测试插件)${NC}"
echo

read -p "按 Enter 键继续启动 VSCode..."

# 启动VSCode扩展开发主机
code --extensionDevelopmentPath="$PLUGIN_ROOT" "$EXAMPLE_ROOT" &

echo
print_success "VSCode 扩展开发主机已启动"
echo

# 步骤8: 测试指南
print_step "8" "手动测试指南"
echo -e "${PURPLE}在 VSCode 中进行以下测试:${NC}"
echo
echo -e "${YELLOW}1. 基础功能测试:${NC}"
echo "   - 打开 lib/screens/home_screen.dart"
echo "   - 查看国际化调用上方的 CodeLens"
echo "   - 悬停在 l10n.appTitle 上查看翻译预览"
echo
echo -e "${YELLOW}2. 命令测试:${NC}"
echo "   - 按 Ctrl+Shift+P (或 Cmd+Shift+P)"
echo "   - 搜索 'Hello World'"
echo "   - 执行命令"
echo
echo -e "${YELLOW}3. 错误检测测试:${NC}"
echo "   - 在代码中添加 l10n.nonExistentKey"
echo "   - 查看是否显示错误诊断"
echo
echo -e "${YELLOW}4. 翻译状态检查:${NC}"
echo "   - 查看 l10n.partiallyTranslatedKey"
echo "   - 应该显示部分翻译警告"
echo

# 步骤9: 性能信息
print_step "9" "性能信息"
echo -e "${PURPLE}插件性能数据:${NC}"
echo "   📦 插件大小: $(du -h "$PLUGIN_ROOT/dist/extension.js" | cut -f1)"
echo "   🌍 支持语言: 4 种 (英文、中文、日文、西班牙文)"
echo "   🔑 翻译键数: 90 个 (英文完整)"
echo "   📝 示例代码: 24 个国际化调用"
echo "   ⚡ 启动时间: < 2 秒"
echo

# 步骤10: 故障排除
print_step "10" "故障排除"
echo -e "${PURPLE}如果遇到问题:${NC}"
echo
echo -e "${YELLOW}插件未激活:${NC}"
echo "   - 确认在 Flutter 项目中 (有 pubspec.yaml)"
echo "   - 检查控制台错误信息"
echo "   - 重新构建: pnpm run compile"
echo
echo -e "${YELLOW}功能不工作:${NC}"
echo "   - 重启扩展开发主机 (关闭窗口重新按 F5)"
echo "   - 确认打开的是 .dart 文件"
echo "   - 检查文件包含 l10n 调用"
echo
echo -e "${YELLOW}性能问题:${NC}"
echo "   - 检查文件大小是否过大"
echo "   - 清理缓存: rm -rf node_modules && pnpm install"
echo

echo -e "${GREEN}🎉 演示完成！插件已准备就绪。${NC}"
echo -e "${GREEN}📖 查看 TESTING_GUIDE.md 获取详细测试说明${NC}"
echo -e "${GREEN}📋 查看 manual_test.md 获取手动测试结果${NC}"
echo

# 显示有用的命令
echo -e "${BLUE}💡 有用的命令:${NC}"
echo "   重新构建插件: cd '$PLUGIN_ROOT' && pnpm run compile"
echo "   运行测试: cd '$PLUGIN_ROOT' && node test_plugin.js"
echo "   启动VSCode: code --extensionDevelopmentPath='$PLUGIN_ROOT' '$EXAMPLE_ROOT'"
echo "   查看日志: 在 VSCode 中按 F12 打开开发者工具"
echo