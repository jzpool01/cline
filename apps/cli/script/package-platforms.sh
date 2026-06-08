#!/usr/bin/env bash
#
# package-platforms.sh
#
# 将每个平台目录下的二进制文件原地压缩为归档文件：
#   - macOS / Linux : bin/tcode -> bin/tcode.tar.gz
#   - Windows       : bin/tcode.exe -> bin/tcode.zip
#
# 压缩完成后删除原始二进制文件。
# 目录中的其他文件（package.json, extensions/, hub/）保持不变。
#
# Usage:
#   cd apps/cli
#   bash script/package-platforms.sh
#
# Prerequisites:
#   - Platform binaries built via: bun run build:platforms

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CLI_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
DIST_DIR="$CLI_DIR/dist"

if [ ! -d "$DIST_DIR" ]; then
	echo "ERROR: $DIST_DIR not found. Run 'bun run build:platforms' first."
	exit 1
fi

echo "=== Packaging platform binaries ==="
echo ""

for dir in "$DIST_DIR"/tcode-*-*; do
	[ -d "$dir" ] || continue

	platform="$(basename "$dir")"
	bin_dir="$dir/bin"

	case "$platform" in
		tcode-darwin-*|tcode-linux-*)
			binary="$bin_dir/tcode"
			archive="$bin_dir/tcode.tar.gz"
			;;
		tcode-windows-*)
			binary="$bin_dir/tcode.exe"
			archive="$bin_dir/tcode.zip"
			;;
		*)
			echo "  SKIP: $platform (unknown platform)"
			continue
			;;
	esac

	if [ ! -f "$binary" ]; then
		echo "  SKIP: $platform (binary not found: $binary)"
		continue
	fi

	echo "  $platform"
	echo "    compress: $binary -> $(basename "$archive")"

	case "$platform" in
		tcode-darwin-*|tcode-linux-*)
			tar czf "$archive" -C "$bin_dir" "$(basename "$binary")"
			;;
		tcode-windows-*)
			if command -v zip &>/dev/null; then
				(cd "$bin_dir" && zip -q "$(basename "$archive")" "$(basename "$binary")")
			elif command -v 7z &>/dev/null; then
				7z a -tzip -mx=9 "$archive" "$binary" >/dev/null
			else
				echo "    ERROR: 'zip' command not found. Install zip or 7z."
				exit 1
			fi
			;;
	esac

	rm -f "$binary"
	echo "    removed: $(basename "$binary")"
done

echo ""
echo "=== Done ==="
