# 🌐 前端运行指南

## 📋 前置条件

1. ✅ 已安装MetaMask浏览器插件
2. ✅ 合约已部署（本地测试网或BSC测试网）
3. ✅ 知道合约地址

## 🚀 方法1：使用本地测试网（推荐新手）

### 步骤1: 启动本地Hardhat网络

打开**第一个终端**：

```bash
cd minority-game
npx hardhat node
```

你会看到类似输出：
```
Started HTTP and WebSocket JSON-RPC server at http://127.0.0.1:8545/

Accounts
========
Account #0: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 (10000 ETH)
Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
...
```

**保持这个终端运行！**

### 步骤2: 部署合约

打开**第二个终端**：

```bash
cd minority-game
npx hardhat run scripts/deploy.js --network localhost
```

输出会显示合约地址：
```
VotingGame deployed to: 0x5FbDB2315678afecb367f032d93F642f64180aa3
```

**📝 复制这个合约地址！**

### 步骤3: 配置MetaMask

1. 打开MetaMask
2. 点击网络下拉菜单 → "添加网络" → "手动添加网络"
3. 填入以下信息：
   ```
   网络名称: Hardhat Local
   RPC URL: http://127.0.0.1:8545
   链ID: 31337
   货币符号: ETH
   ```
4. 保存并切换到这个网络

5. 导入测试账户：
   - 点击账户图标 → "导入账户"
   - 粘贴私钥（从步骤1的输出复制）
   - 例如：`0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`

### 步骤4: 配置前端合约地址

编辑 `frontend/voting.js` 文件的第2行：

```javascript
const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; // 替换成你的合约地址
```

### 步骤5: 启动HTTP服务器

打开**第三个终端**：

#### 方法A: 使用Python（Mac自带）

```bash
cd minority-game/frontend
python3 -m http.server 8000
```

#### 方法B: 使用npx（如果安装了Node.js）

```bash
cd minority-game/frontend
npx http-server -p 8000
```

#### 方法C: 使用VS Code

1. 安装 "Live Server" 插件
2. 右键点击 `voting.html`
3. 选择 "Open with Live Server"

### 步骤6: 在浏览器中打开

访问：**http://localhost:8000/voting.html**

你应该会看到漂亮的紫色渐变投票界面！

---

## 🌍 方法2：使用BSC测试网

### 步骤1: 配置.env文件

创建 `.env` 文件：

```bash
cd minority-game
cp .env.example .env
nano .env  # 或使用其他编辑器
```

填入：
```env
PRIVATE_KEY=你的钱包私钥（不要0x前缀）
BSCSCAN_API_KEY=你的BscScan API密钥
```

### 步骤2: 获取测试币

1. 打开MetaMask，切换到 "BSC Testnet" 网络
2. 如果没有这个网络，添加它：
   ```
   网络名称: BSC Testnet
   RPC URL: https://data-seed-prebsc-1-s1.binance.org:8545/
   链ID: 97
   货币符号: tBNB
   区块浏览器: https://testnet.bscscan.com
   ```
3. 访问水龙头获取测试币：https://testnet.binance.org/faucet-smart
4. 复制你的钱包地址，粘贴并领取tBNB

### 步骤3: 部署到BSC测试网

```bash
npx hardhat run scripts/deploy.js --network bscTestnet
```

**📝 复制显示的合约地址！**

### 步骤4: 验证合约（可选）

```bash
npx hardhat verify --network bscTestnet <合约地址>
```

### 步骤5: 配置前端

编辑 `frontend/voting.js` 的第2行，填入合约地址。

### 步骤6: 部署前端

#### 选项A: 使用GitHub Pages（免费托管）

1. 创建新的GitHub仓库
2. 上传 `frontend/` 文件夹内容
3. 在仓库设置中启用GitHub Pages
4. 访问 `https://你的用户名.github.io/仓库名/voting.html`

#### 选项B: 使用本地服务器

同方法1的步骤5和步骤6

---

## 🎮 使用前端

### 连接钱包

1. 打开网页后，点击 "连接钱包" 按钮
2. MetaMask会弹出，选择要连接的账户
3. 点击 "下一步" → "连接"
4. 连接成功后会显示你的地址

### 创建投票

1. 点击 "创建投票" 标签
2. 填写问题（例如："你最喜欢的水果？"）
3. 填写选项（2-10个），每行一个
   ```
   苹果
   香蕉
   橙子
   ```
4. 点击 "创建投票"
5. MetaMask会弹出确认交易，点击 "确认"
6. 等待交易确认

### 参与投票

1. 点击 "参与投票" 标签
2. 看到所有活跃的投票
3. 选择你要投的选项
4. 输入下注金额（例如：0.1）
5. 点击 "提交投票"
6. MetaMask会弹出，确认支付0.1 ETH
7. 等待交易确认

### 揭示投票

1. 等待投票阶段结束（默认1小时）
2. 点击 "揭示投票" 按钮
3. 确认交易
4. 系统会自动使用你之前保存的选择和密钥

### 查看结果和领取奖励

1. 等待揭示阶段结束（默认30分钟）
2. 点击 "查看结果" 标签
3. 如果你获胜，会显示 "你赢了！"
4. 点击 "领取奖励" 按钮
5. 确认交易，获得奖励！

---

## 🔧 常见问题

### Q1: MetaMask没有弹出？

**解决：**
- 检查MetaMask是否已安装并解锁
- 刷新页面重试
- 检查浏览器控制台是否有错误（F12打开）

### Q2: 交易失败："user rejected transaction"

**解决：**
- 这是你在MetaMask中点击了"拒绝"
- 重新操作并点击"确认"

### Q3: 合约调用失败

**解决：**
1. 检查合约地址是否正确配置
2. 检查网络是否匹配（本地用localhost，BSC用testnet）
3. 检查账户是否有足够的ETH/tBNB
4. 打开浏览器控制台查看详细错误

### Q4: 看不到任何投票

**解决：**
1. 检查MetaMask是否连接
2. 检查网络是否正确
3. 确认合约地址是否正确
4. 创建第一个投票测试

### Q5: "Cannot read property of undefined"

**解决：**
- 这通常是合约地址未配置
- 检查 `voting.js` 第2行是否填入了实际地址
- 不应该是 `"YOUR_CONTRACT_ADDRESS_HERE"`

---

## 🎨 界面功能说明

### 顶部导航
- **连接钱包** - 连接MetaMask
- **账户显示** - 显示当前连接的地址（缩略格式）

### 三个标签页

#### 1️⃣ 创建投票
- 发布你自己的投票问题
- 设置2-10个选项
- 成为投票创建者

#### 2️⃣ 参与投票
- 查看所有活跃投票
- 提交隐藏的投票（Commit阶段）
- 揭示你的选择（Reveal阶段）
- 看到投票状态和剩余时间

#### 3️⃣ 我的投票
- 查看你参与的所有投票
- 查看投票结果
- 领取奖励
- 查看每个选项的总额

---

## 📱 移动端使用

1. 在手机上安装MetaMask App
2. 打开App内的浏览器
3. 访问前端网址
4. 按照正常流程使用

---

## 🔒 安全提示

1. ⚠️ **永远不要分享你的私钥**
2. ⚠️ **仅在测试网使用测试币**
3. ⚠️ **合约未经审计，仅供学习**
4. ✅ 本地测试网的私钥可以随意使用（因为是测试）
5. ✅ BSC测试网的币没有真实价值

---

## 📊 推荐的测试流程

### 单人测试：

```bash
# 终端1: 启动网络
npx hardhat node

# 终端2: 部署
npx hardhat run scripts/deploy.js --network localhost

# 终端3: 前端
cd frontend && python3 -m http.server 8000

# 浏览器: 打开 http://localhost:8000/voting.html
```

### 多人测试（模拟真实场景）：

1. 部署到BSC测试网
2. 分享前端链接给朋友
3. 每个人用自己的MetaMask
4. 大家一起投票看谁是少数派！

---

## 🎯 下一步

1. 测试所有功能是否正常
2. 尝试不同的投票场景
3. 检查奖励计算是否正确
4. 考虑UI/UX改进
5. 准备主网部署（需要审计）

祝你玩得开心！🎉
