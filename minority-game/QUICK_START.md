# ⚡ 快速开始 - 30秒启动前端

## 🚀 Mac用户（推荐）

### 一条命令搞定！

```bash
cd minority-game && ./start-local.sh
```

**然后在浏览器打开：** http://localhost:8000/voting.html

### 配置MetaMask

1. 添加网络：
   - 网络名称: `Hardhat Local`
   - RPC URL: `http://127.0.0.1:8545`
   - 链ID: `31337`
   - 货币符号: `ETH`

2. 导入测试账户（有10000 ETH）：
   - 私钥: `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`

### 停止服务

```bash
./stop-local.sh
```

---

## 💻 Windows用户

### 终端1: 启动Hardhat节点

```bash
cd minority-game
npx hardhat node
```

保持运行！复制显示的测试账户私钥。

### 终端2: 部署合约

```bash
cd minority-game
npx hardhat run scripts/deploy.js --network localhost
```

**复制显示的合约地址！**

### 终端3: 配置并启动前端

1. 编辑 `frontend/voting.js` 第2行：
   ```javascript
   const CONTRACT_ADDRESS = "粘贴你的合约地址";
   ```

2. 启动HTTP服务器：
   ```bash
   cd minority-game/frontend
   python -m http.server 8000
   ```

3. 在浏览器打开：http://localhost:8000/voting.html

### 配置MetaMask

同Mac用户的步骤

---

## 🎮 开始使用

### 1. 连接钱包
点击页面上的 "连接钱包" 按钮

### 2. 创建投票
- 点击 "创建投票" 标签
- 输入问题和选项（每行一个）
- 点击 "创建投票"

### 3. 参与投票
- 点击 "参与投票" 标签
- 选择一个选项
- 输入下注金额（例如：0.1）
- 点击 "提交投票"

### 4. 揭示投票
- 等待1小时后，点击 "揭示投票"

### 5. 领取奖励
- 如果你是少数派，点击 "领取奖励"

---

## 📚 详细文档

需要更多帮助？查看：

- **[完整前端指南](FRONTEND_GUIDE.md)** - 所有细节
- **[测试指南](TESTING_GUIDE.md)** - 运行测试
- **[README.md](README.md)** - 项目总览

---

## 🆘 遇到问题？

### 端口被占用
```bash
# 查看并关闭占用端口的进程
lsof -ti:8545 | xargs kill  # Hardhat
lsof -ti:8000 | xargs kill  # 前端
```

### MetaMask没反应
1. 刷新页面
2. 检查是否在正确的网络（Hardhat Local, 链ID 31337）
3. 按F12查看浏览器控制台错误

### 合约调用失败
1. 确认合约地址已正确配置在 `frontend/voting.js`
2. 确认MetaMask已连接到Hardhat Local网络
3. 确认账户有ETH

---

**就是这么简单！享受你的投票游戏吧！** 🎉
