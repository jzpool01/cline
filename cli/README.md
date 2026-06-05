# tcode 一键安装

## macOS / Linux

在终端中运行以下命令即可安装：

```bash
curl -fsSL https://example.com/install_mac.sh | bash
```

> **原理说明：** 脚本通过管道直接传给 `bash` 执行，没有保存到磁盘，因此不会被 macOS 的 Gatekeeper 添加 `com.apple.quarantine` 属性。脚本内部下载 tcode 后，会在**你的电脑上**自动执行 `xattr -d` 清除隔离属性，确保你可以直接打开使用。

### 指定版本

```bash
# 安装指定版本
TCODE_VERSION=1.2.3 curl -fsSL https://example.com/install_mac.sh | bash

# 指定安装目录（Linux）
TCODE_INSTALL_DIR=~/tools curl -fsSL https://example.com/install_mac.sh | bash
```

### 安全审查（可选）

如果你对管道执行不放心，可以先下载审查再执行：

```bash
# 先下载查看内容
curl -fsSL https://example.com/install_mac.sh -o install-tcode.sh
less install-tcode.sh   # 审查脚本内容

# 确认无误后执行
bash install-tcode.sh
```

---

## Windows

在 **Git Bash** 或 **WSL** 终端中运行：

```bash
curl -fsSL https://example.com/install_win.sh | bash
```

### 安全审查（可选）

```bash
# 下载查看
curl -fsSL https://example.com/install_win.sh -o install_win.sh
less install_win.sh          # 审查脚本内容

# 确认无误后执行
bash install_win.sh
```

---

## 手动下载

如果你不想使用命令行，也可以直接下载对应平台的安装包：

| 平台 | 下载链接 |
|------|---------|
| macOS (Intel) | [tcode-macos-x64.dmg](https://example.com/downloads/tcode-latest-macos-x64.dmg) |
| macOS (Apple Silicon) | [tcode-macos-arm64.dmg](https://example.com/downloads/tcode-latest-macos-arm64.dmg) |
| Windows (x64) | [tcode-setup.exe](https://example.com/downloads/tcode-latest-windows-x64-setup.exe) |
| Linux (x64) | [tcode-linux-x64.tar.gz](https://example.com/downloads/tcode-latest-linux-x64.tar.gz) |
| Linux (arm64) | [tcode-linux-arm64.tar.gz](https://example.com/downloads/tcode-latest-linux-arm64.tar.gz) |

> **macOS 手动安装说明：**
>
> 首次打开时，系统可能会提示"无法验证开发者"。
>
> 解决方案一：右键 → 打开（选择"仍要打开"）
>
> 解决方案二：在终端运行以下命令清除隔离属性：
> ```bash
> xattr -r -d com.apple.quarantine /Applications/tcode.app
> ```

---

## 验证安装

安装完成后，在终端运行：

```bash
# macOS / Linux
tcode --version

# Windows (CMD)
tcode --version

# Windows (PowerShell)
.\tcode --version
```

## 卸载

### macOS

```bash
rm -rf /Applications/tcode.app
rm -rf ~/Library/Application\ Support/tcode
```

### Linux

```bash
rm -f /usr/local/bin/tcode
rm -rf ~/.config/tcode
```

### Windows

```
控制面板 → 程序和功能 → tcode → 卸载
```

或者如果是便携版：

```
删除 tcode 所在目录即可
```

---

## 常见问题

### Q: `curl | bash` 安全吗？

A: 这是 Homebrew、Rust、nvm 等主流工具都采用的标准安装方式。如果仍有顾虑，建议先下载审查脚本内容后再执行。

### Q: Windows 上 `curl | bash` 安全吗？

A: 同上，这是 Git Bash / WSL 环境下的标准做法。你也可以先下载审查。

### Q: 安装后找不到 `tcode` 命令？

A: macOS 请检查 `/Applications/tcode.app` 是否存在；Linux 请确认安装目录在 `PATH` 中；Windows 请检查安装目录是否已添加到 `PATH`。
