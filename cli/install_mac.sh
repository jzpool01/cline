#!/bin/bash
#
# tcode - 一键安装脚本 (macOS / Linux)
# 使用方法: curl -fsSL https://example.com/install_mac.sh | bash
#
# 可选参数:
#   TCODE_VERSION  - 指定版本 (默认: latest)
#   TCODE_INSTALL_DIR - 安装目录 (默认自动选择)
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
OS="$(uname -s | tr '[:upper:]' '[:lower:]')"
ARCH="$(uname -m)"

# 架构映射
case "$ARCH" in
    x86_64)  ARCH="x64" ;;
    aarch64|arm64) ARCH="arm64" ;;
    *)       echo -e "${RED}不支持的架构: $ARCH${NC}"; exit 1 ;;
esac

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  tcode v${VERSION} 安装程序${NC}"
echo -e "${BLUE}  系统: ${OS} / ${ARCH}${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# ─── 检查依赖 ──────────────────────────────────────────────
command -v curl >/dev/null 2>&1 || { echo -e "${RED}错误: 需要 curl，请先安装${NC}"; exit 1; }

# ─── 下载 ──────────────────────────────────────────────────
TMP_DIR=$(mktemp -d)
trap 'rm -rf "$TMP_DIR"' EXIT

echo -e "${YELLOW}⬇️  正在下载 tcode...${NC}"

if [[ "$OS" == "darwin" ]]; then
    # macOS: 下载 DMG
    DMG_URL="${REPO_URL}/downloads/tcode-${VERSION}-macos-${ARCH}.dmg"
    curl -fsSL "$DMG_URL" -o "$TMP_DIR/tcode.dmg"

    echo -e "${YELLOW}📦 正在安装到 /Applications...${NC}"

    # 挂载 DMG
    hdiutil attach "$TMP_DIR/tcode.dmg" -mountpoint "$TMP_DIR/mount" -quiet -nobrowse
    trap 'hdiutil detach "$TMP_DIR/mount" -quiet 2>/dev/null; rm -rf "$TMP_DIR"' EXIT

    # 拷贝应用到应用程序目录
    if [ -d "/Applications/tcode.app" ]; then
        rm -rf "/Applications/tcode.app"
    fi
    cp -r "$TMP_DIR/mount/tcode.app" /Applications/

    # 卸载 DMG
    hdiutil detach "$TMP_DIR/mount" -quiet

    # ✅ 关键：清除 quarantine 属性（在用户自己电脑上执行）
    echo -e "${YELLOW}🔓 正在移除 macOS 安全隔离属性...${NC}"
    xattr -r -d com.apple.quarantine /Applications/tcode.app 2>/dev/null || true

    echo ""
    echo -e "${GREEN}✅ tcode 安装完成！${NC}"
    echo -e "   在 Launchpad 或 Applications 中打开 ${GREEN}tcode${NC} 即可使用。"
    echo ""

elif [[ "$OS" == "linux" ]]; then
    # Linux: 下载 tar.gz
    TAR_URL="${REPO_URL}/downloads/tcode-${VERSION}-linux-${ARCH}.tar.gz"
    curl -fsSL "$TAR_URL" -o "$TMP_DIR/tcode.tar.gz"

    # 选择安装目录
    INSTALL_DIR="${TCODE_INSTALL_DIR:-/usr/local/bin}"
    if [ ! -w "$INSTALL_DIR" ]; then
        echo -e "${YELLOW}⚠️  没有写入权限: $INSTALL_DIR，尝试 ~/.local/bin${NC}"
        INSTALL_DIR="$HOME/.local/bin"
        mkdir -p "$INSTALL_DIR"
    fi

    echo -e "${YELLOW}📦 正在安装到 $INSTALL_DIR...${NC}"
    tar -xzf "$TMP_DIR/tcode.tar.gz" -C "$INSTALL_DIR" tcode
    chmod +x "$INSTALL_DIR/tcode"

    echo ""
    echo -e "${GREEN}✅ tcode 安装完成！${NC}"
    echo -e "   确保 ${GREEN}$INSTALL_DIR${NC} 在 PATH 中。"
    echo -e "   运行 ${GREEN}tcode --help${NC} 查看使用方法。"
    echo ""
else
    echo -e "${RED}错误: 不支持的操作系统: $OS${NC}"
    exit 1
fi

echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}🎉 感谢使用 tcode！${NC}"
echo -e "${BLUE}========================================${NC}"
