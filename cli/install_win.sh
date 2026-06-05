#!/bin/bash
#
# tcode - 一键安装脚本 (Windows / Git Bash / WSL / MSYS2)
# 使用方法: curl -fsSL https://example.com/install_win.sh | bash
#
# 可选参数:
#   TCODE_VERSION  - 指定版本 (默认: latest)
#   TCODE_INSTALL_DIR - 安装目录 (默认: ~/AppData/Local/tcode)
#

set -euo pipefail

# ─── 颜色定义 ──────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ─── 配置 ──────────────────────────────────────────────────
REPO_URL="https://example.com"
VERSION="${TCODE_VERSION:-latest}"
ARCH="$(uname -m)"

# 架构映射
case "$ARCH" in
    x86_64|AMD64)  ARCH="x64" ;;
    aarch64|ARM64) ARCH="arm64" ;;
    *)             echo -e "${RED}不支持的架构: $ARCH${NC}"; exit 1 ;;
esac

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  tcode v${VERSION} 安装程序 (Windows)${NC}"
echo -e "${BLUE}  架构: ${ARCH}${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# ─── 检查依赖 ──────────────────────────────────────────────
command -v curl >/dev/null 2>&1 || { echo -e "${RED}错误: 需要 curl，请先安装 Git Bash 或使用 WSL${NC}"; exit 1; }

# ─── 选择下载方式 ──────────────────────────────────────────
INSTALL_DIR="${TCODE_INSTALL_DIR:-$HOME/AppData/Local/tcode}"
mkdir -p "$INSTALL_DIR"

TMP_DIR=$(mktemp -d)
trap 'rm -rf "$TMP_DIR"' EXIT

echo -e "${YELLOW}⬇️  正在下载 tcode...${NC}"

# 优先尝试下载安装包 (setup.exe)
SETUP_URL="${REPO_URL}/downloads/tcode-${VERSION}-windows-${ARCH}-setup.exe"
ZIP_URL="${REPO_URL}/downloads/tcode-${VERSION}-windows-${ARCH}.zip"

if curl -fsSL -o "$TMP_DIR/tcode-setup.exe" "$SETUP_URL" 2>/dev/null; then
    echo -e "${YELLOW}📦 正在静默安装...${NC}"
    "$TMP_DIR/tcode-setup.exe" /SILENT /DIR="$INSTALL_DIR"
    echo ""
    echo -e "${GREEN}✅ tcode 安装完成！${NC}"
    echo -e "   安装目录: ${GREEN}$INSTALL_DIR${NC}"
    echo -e "   在开始菜单中找到 tcode 即可启动。"
else
    echo -e "${YELLOW}⚠️  安装包下载失败，尝试便携版 (zip)...${NC}"

    curl -fsSL -o "$TMP_DIR/tcode.zip" "$ZIP_URL"

    echo -e "${YELLOW}📦 解压中...${NC}"
    unzip -qo "$TMP_DIR/tcode.zip" -d "$INSTALL_DIR"

    echo ""
    echo -e "${GREEN}✅ tcode 安装完成！${NC}"
    echo -e "   安装目录: ${GREEN}$INSTALL_DIR${NC}"
    echo ""
    echo -e "   请将以下路径添加到 PATH 环境变量："
    echo -e "   ${GREEN}$INSTALL_DIR${NC}"
    echo ""
    echo -e "   运行 ${GREEN}tcode --help${NC} 查看使用方法。"
fi

echo ""
echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}🎉 感谢使用 tcode！${NC}"
echo -e "${BLUE}========================================${NC}"
