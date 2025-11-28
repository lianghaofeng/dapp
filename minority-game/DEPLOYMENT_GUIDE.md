# 🚀 完整部署和运行指南

## 目录
1. [与之前Remix部署方式的对比](#与remix部署方式的对比)
2. [Hardhat部署方式详解](#hardhat部署方式详解)
3. [完整部署流程](#完整部署流程)
4. [使用Remix部署（备选方案）](#使用remix部署备选方案)
5. [前端配置和使用](#前端配置和使用)
6. [常见问题](#常见问题)

---

## 与Remix部署方式的对比

### 之前的方式：Avail + Remix
```
Avail测试链 → Remix在线IDE → 手动编译 → 手动部署 → 复制ABI
```
**优点：** 可视化、简单直观
**缺点：** 手动操作多、难以自动化、测试不便

### 现在的方式：Hardhat
```
本地开发环境 → Hardhat编译 → 自动化测试 → 脚本部署 → 验证合约
```
**优点：** 自动化、可测试、可重复、专业
**缺点：** 需要学习命令行

---

## Hardhat部署方式详解

### 什么是Hardhat？
Hardhat是一个专业的以太坊开发环境，提供：
- ✅ 智能合约编译
- ✅ 自动化测试
- ✅ 本地区块链模拟
- ✅ 脚本化部署
- ✅ 合约验证

### 项目结构
```
minority-game/
├── contracts/           # 智能合约代码
│   └── VotingGame.sol
├── scripts/            # 部署和交互脚本
│   ├── deploy.js       # 部署合约
│   ├── verify.js       # 验证合约
│   └── interact.js     # 与合约交互
├── test/               # 测试用例
│   └── VotingGame.test.js
├── frontend/           # 前端文件
│   ├── voting.html
│   └── voting.js
├── hardhat.config.cjs  # Hardhat配置
├── package.json        # 依赖管理
└── .env               # 环境变量（私钥等）
```

---

## 完整部署流程

### 步骤1: 安装依赖
```bash
cd minority-game
npm install
```

**这一步做了什么？**
- 安装Hardhat开发工具
- 安装OpenZeppelin合约库（安全的标准合约）
- 安装ethers.js（与区块链交互）
- 安装测试工具

**可能遇到的警告：**
```
npm warn deprecated @types/minimatch@6.0.0
npm warn deprecated inflight@1.0.6
13 low severity vulnerabilities
```
这些警告通常不影响功能，可以忽略。如果想解决，运行：
```bash
npm audit fix
```

### 步骤2: 配置环境变量
```bash
cp .env.example .env
nano .env  # 或用你喜欢的编辑器
```

**填写以下信息：**
```env
# 你的钱包私钥（不带0x前缀）
PRIVATE_KEY=你的私钥

# BSC测试网RPC（不用改）
BSC_TESTNET_URL=https://data-seed-prebsc-1-s1.binance.org:8545

# BSCScan API密钥（用于验证合约，可选）
BSCSCAN_API_KEY=从bscscan.com获取
```

**⚠️ 安全提示：**
- 永远不要上传.env文件到Git
- 测试网钱包不要用主网钱包
- 获取测试币：https://testnet.bnbchain.org/faucet-smart

### 步骤3: 编译合约
```bash
npx hardhat compile
```

**这一步做了什么？**
- 检查Solidity语法
- 编译成字节码（区块链能理解的代码）
- 生成ABI（前端调用合约的接口）
- 输出到`artifacts/`文件夹

**成功输出：**
```
Compiled 2 Solidity files successfully
```

### 步骤4: 运行测试（重要！）
```bash
npx hardhat test
```

**这一步做了什么？**
- 启动本地模拟区块链
- 部署合约到模拟链
- 运行所有测试用例（18个测试）
- 确保合约逻辑正确

**成功输出示例：**
```
  VotingGame
    创建投票
      ✓ 应该能够成功创建投票
      ✓ 不应该允许创建少于2个选项的投票
      ...

  18 passing (2s)
```

**如果测试失败：** 检查合约代码或联系开发者

### 步骤5: 选择部署目标

#### 选项A: 部署到本地测试网（推荐先尝试）
```bash
# 终端1: 启动本地区块链
npx hardhat node

# 终端2: 部署合约
npx hardhat run scripts/deploy.js --network localhost
```

**优点：**
- 完全免费
- 即时确认
- 可以随时重置

**本地测试网会给你：**
- 20个预充值账户（每个10000 ETH）
- RPC地址：http://127.0.0.1:8545
- Chain ID: 31337

#### 选项B: 部署到BSC测试网
```bash
npx hardhat run scripts/deploy.js --network bscTestnet
```

**准备工作：**
1. 获取测试BNB：https://testnet.bnbchain.org/faucet-smart
2. 确保.env配置正确

**输出示例：**
```
开始部署 VotingGame 合约...
部署账户: 0x1234...5678
账户余额: 0.5 ETH

正在部署合约...
✅ VotingGame 合约已部署到: 0xabcd...ef01

=== 前端配置 ===
请将以下地址更新到 frontend/voting.js 中:
const CONTRACT_ADDRESS = "0xabcd...ef01";

✅ 部署信息已保存到 deployment-info.json
```

#### 选项C: 部署到BSC主网（生产环境）
```bash
npx hardhat run scripts/deploy.js --network bscMainnet
```

**⚠️ 警告：主网部署需要真实BNB，请充分测试后再部署！**

### 步骤6: 验证合约（可选但推荐）
```bash
npx hardhat run scripts/verify.js --network bscTestnet
```

**作用：**
- 在BSCScan上公开源代码
- 用户可以直接在区块链浏览器查看和调用
- 增加可信度

**成功后访问：**
```
https://testnet.bscscan.com/address/你的合约地址#code
```

### 步骤7: 测试合约交互（可选）
```bash
npx hardhat run scripts/interact.js --network bscTestnet
```

**这个脚本会：**
- 连接到已部署的合约
- 创建一个测试投票
- 显示投票信息
- 确认一切正常

---

## 使用Remix部署（备选方案）

如果你更喜欢可视化方式，也可以用Remix：

### 步骤1: 准备合约代码
打开 `contracts/VotingGame.sol`，复制全部内容

### 步骤2: 打开Remix
访问：https://remix.ethereum.org

### 步骤3: 创建文件
1. 在左侧文件管理器，创建新文件 `VotingGame.sol`
2. 粘贴合约代码

### 步骤4: 安装依赖
在Remix中创建 `ReentrancyGuard.sol`，从OpenZeppelin复制：
```
https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/security/ReentrancyGuard.sol
```

或者修改合约第一行为：
```solidity
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/master/contracts/security/ReentrancyGuard.sol";
```

### 步骤5: 编译
1. 点击左侧"Solidity Compiler"图标
2. 选择编译器版本：0.8.20
3. 点击"Compile VotingGame.sol"

### 步骤6: 部署
1. 点击左侧"Deploy & Run"图标
2. 选择环境：
   - "Injected Provider": 连接MetaMask（BSC测试网）
   - "Remix VM": 本地模拟
3. 点击"Deploy"
4. 在MetaMask确认交易

### 步骤7: 获取合约地址和ABI
1. 部署成功后，在"Deployed Contracts"下方找到合约地址
2. 复制地址
3. 在"Solidity Compiler"标签下，点击"ABI"复制

---

## 前端配置和使用

### 步骤1: 更新合约地址
编辑 `frontend/voting.js`：
```javascript
const CONTRACT_ADDRESS = "0xabcd...ef01"; // 替换为你的合约地址
```

### 步骤2: 在浏览器打开
直接双击 `frontend/voting.html` 或用本地服务器：
```bash
# 使用Python
cd frontend
python3 -m http.server 8000

# 使用Node.js
npx http-server frontend -p 8000

# 然后访问：http://localhost:8000/voting.html
```

### 步骤3: 连接MetaMask
1. 确保MetaMask已安装
2. 切换到正确的网络（BSC测试网）
3. 点击"连接 MetaMask"
4. 批准连接

### 步骤4: 创建第一个投票
1. 点击"创建投票"标签
2. 输入问题：例如"你最喜欢的编程语言？"
3. 添加选项：JavaScript、Python、Rust
4. 点击"创建投票"
5. 在MetaMask确认交易

### 步骤5: 参与投票
1. 切换到"参与投票"标签
2. 点击"刷新"查看投票
3. 选择一个投票，点击"参与投票"
4. 选择你的答案
5. 输入投注金额（例如0.01 BNB）
6. 点击"提交"
7. **💡 注意：现在会直接支付全额投注金额**

### 步骤6: 揭示投票
1. 等待提交阶段结束（1小时）
2. 在"参与投票"或"我的投票"标签
3. 点击"提交揭示"
4. 确认交易

### 步骤7: 领取奖励
1. 等待揭示阶段结束（30分钟）
2. 切换到"我的投票"标签
3. 如果获胜，点击"领取奖励"
4. 确认交易

---

## 核心改动说明

### 💰 100%押金模式
**之前（30-70%押金）：**
- 提交时：支付30-70%的押金
- 揭示时：验证押金范围
- 奖励：投注 + 押金 + 分成

**现在（100%押金）：**
- **提交时：直接支付全额投注金额**
- 揭示时：不需要验证金额
- 奖励：投注 + 分成

**好处：**
- ✅ 更简单：用户只需要一次支付
- ✅ 更公平：所有人支付相同比例
- ✅ 更安全：减少复杂度降低bug风险
- ✅ 更易理解：所见即所得

**代码改动：**
```javascript
// 旧代码
const deposit = betAmount * randomPercent / 100; // 30-70%
await contract.commit(voteId, commitHash, { value: deposit });

// 新代码
await contract.commit(voteId, commitHash, { value: betAmount }); // 100%
```

---

## 整个系统的工作流程

```
┌─────────────┐
│  用户钱包    │ MetaMask
└──────┬──────┘
       │ 连接
       ↓
┌─────────────────────┐
│  前端界面 (HTML/JS)  │
│  - voting.html       │  ← 你在浏览器看到的
│  - voting.js         │  ← 连接钱包和合约
└──────┬──────────────┘
       │ 调用
       ↓
┌─────────────────────┐
│  智能合约 (Solidity) │
│  VotingGame.sol      │  ← 部署在区块链上
└──────┬──────────────┘
       │ 存储
       ↓
┌─────────────────────┐
│  区块链 (BSC/本地)   │
│  - 状态数据          │  ← 投票记录、余额等
│  - 交易历史          │  ← 不可篡改
└─────────────────────┘
```

### 创建投票流程
```
1. 用户在前端填写问题和选项
   ↓
2. voting.js 调用 contract.createVote()
   ↓
3. MetaMask 弹窗请求签名
   ↓
4. 交易发送到区块链
   ↓
5. 矿工打包交易
   ↓
6. 合约执行 createVote() 函数
   ↓
7. 触发 VoteCreated 事件
   ↓
8. 前端收到确认，显示成功
```

### 投票流程
```
提交阶段（1小时）：
1. 用户选择选项和金额
2. 生成随机secret
3. 计算commitHash = keccak256(voteId, choice, secret, address)
4. 发送全额投注金额 + commitHash
5. 信息保存到localStorage（secret不上链）

揭示阶段（30分钟）：
1. 用户提交reveal
2. 从localStorage读取secret
3. 合约验证hash匹配
4. 公开选择和金额

结算阶段：
1. 任何人调用finalizeVote()
2. 计算每个选项的总投注
3. 找出投注最少的选项（少数派）
4. 少数派获胜

领奖阶段：
1. 获胜者调用claimReward()
2. 计算奖励 = 投注 + (失败者总投注 * 个人投注 / 获胜者总投注)
3. 转账到玩家地址
```

---

## 常见问题

### Q1: Hardhat编译失败："Error HH19"
**问题：** `Your project is an ESM project`
**解决：** 已修复，hardhat.config.js改为.cjs，package.json移除"type": "module"

### Q2: 测试失败
**可能原因：**
- 时间相关测试在慢速机器上失败
- OpenZeppelin版本不匹配

**解决：**
```bash
rm -rf node_modules package-lock.json
npm install
npx hardhat test
```

### Q3: 部署失败："insufficient funds"
**原因：** 钱包余额不足
**解决：**
- 本地测试网：重启 `npx hardhat node`
- BSC测试网：从水龙头获取测试币

### Q4: MetaMask无法连接
**检查：**
1. MetaMask已安装？
2. 网络正确？（BSC测试网 Chain ID: 97）
3. 合约地址正确？
4. 浏览器控制台有错误？

### Q5: 交易pending很久
**BSC测试网：** 通常5-10秒
**如果超过1分钟：**
- 检查gas price是否太低
- 在BSCScan查看交易状态
- 考虑加速或取消交易

### Q6: 找不到commit信息
**原因：** localStorage被清除
**解决：**
- 不要清除浏览器数据
- 或者使用合约的getCommit()查询链上数据
- 未来可以添加后端存储

### Q7: 如何重置一切重新开始？
```bash
# 清除本地文件
rm -rf artifacts cache node_modules
rm deployment-info.json

# 重新安装
npm install

# 重新编译
npx hardhat compile

# 重新部署
npx hardhat run scripts/deploy.js --network localhost
```

---

## 与Avail的对比

| 特性 | Avail + Remix | Hardhat + Scripts |
|------|---------------|-------------------|
| 部署方式 | 手动点击 | 脚本自动化 |
| 测试 | 手动测试 | 自动化单元测试 |
| 可重复性 | 需要记住步骤 | 一键部署 |
| 版本控制 | 不易追踪 | Git完整记录 |
| 团队协作 | 难以共享 | 易于协作 |
| 本地测试 | 需要外部链 | 内置模拟链 |
| 学习曲线 | 低 | 中 |
| 专业度 | 入门 | 专业 |

**建议：**
- 学习阶段：用Remix理解合约
- 开发阶段：用Hardhat测试和部署
- 生产环境：必须用Hardhat

---

## 下一步

1. ✅ 在本地测试网充分测试
2. ✅ 邀请朋友在BSC测试网试用
3. ✅ 收集反馈改进
4. ✅ 审计合约安全性（可选但推荐）
5. 🚀 部署到BSC主网

**有问题随时问！** 祝部署顺利！ 🎉
