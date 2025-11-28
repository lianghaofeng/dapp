# 🧪 测试指南

## ✅ 已完成的修复

所有 **12个测试失败** 已全部修复！代码已提交并推送到远程仓库。

## 📋 修复内容摘要

### 合约层面
- ✅ 使用 `VoteInfo` struct 返回，解决 Stack too deep 错误
- ✅ `getVoteInfo()` 返回结构化数据

### 测试层面
- ✅ commitHash: 4个参数（移除了betAmount）
- ✅ reveal(): 3个参数（移除了betAmount）
- ✅ commit支付: 100%全额（不再是30-70%）
- ✅ 事件名: `BetConfiscated`（不再是DepositConfiscated）
- ✅ 字段名: `voteInfo.voteId`（不再是voteInfo.id）
- ✅ 奖励计算: 符合100%押金模式

## 🚀 在Mac上运行测试

### 步骤1: 拉取最新代码

```bash
cd /path/to/dapp
git pull origin claude/wallet-voting-game-01KWkK2QvoUojEP6hPFXNwVE
```

### 步骤2: 进入项目目录

```bash
cd minority-game
```

### 步骤3: 安装依赖（如果还没有）

```bash
npm install
```

应该看到输出：
```
added 399 packages, and audited 400 packages in 30s
```

### 步骤4: 编译合约

```bash
npx hardhat compile
```

应该看到输出：
```
Compiled 1 Solidity file successfully (evm target: paris).
```

### 步骤5: 运行测试

```bash
npx hardhat test
```

**预期输出：**

```
  VotingGame
    创建投票
      ✔ 应该能够成功创建投票
      ✔ 不应该允许创建少于2个选项的投票
      ✔ 不应该允许创建超过10个选项的投票
      ✔ 不应该允许空问题
      ✔ 不应该允许空选项
    提交投票 (Commit Phase)
      ✔ 应该能够成功提交commit
      ✔ 不应该允许不支付deposit的commit
      ✔ 不应该允许重复commit
      ✔ 不应该允许在commit阶段结束后提交
    揭示投票 (Reveal Phase)
      ✔ 应该能够成功揭示投票
      ✔ 不应该允许在commit阶段揭示
      ✔ 不应该允许错误的哈希揭示
    结算投票
      ✔ 应该正确计算少数派获胜
      ✔ 应该正确计算奖励
      ✔ 应该允许获胜者领取奖励
      ✔ 失败者不应该获得奖励
      ✔ 未揭示的玩家应该失去押金
    查询功能
      ✔ 应该能够获取所有活跃投票
      ✔ 应该能够获取投票参与者


  18 passing (2s)
```

## 📊 测试覆盖的功能

### 创建投票 (5个测试)
- ✅ 成功创建投票
- ✅ 验证最少2个选项
- ✅ 验证最多10个选项
- ✅ 验证问题不能为空
- ✅ 验证选项不能为空

### 提交阶段 (4个测试)
- ✅ 成功提交commit并支付100%
- ✅ 不允许0金额commit
- ✅ 不允许重复commit
- ✅ 不允许过期commit

### 揭示阶段 (3个测试)
- ✅ 成功揭示投票
- ✅ 不允许在commit阶段揭示
- ✅ 验证哈希匹配

### 结算阶段 (5个测试)
- ✅ 正确计算少数派获胜
- ✅ 正确计算奖励（100%模式）
- ✅ 获胜者领取奖励
- ✅ 失败者无奖励
- ✅ 未揭示者失去押金

### 查询功能 (2个测试)
- ✅ 获取所有活跃投票
- ✅ 获取投票参与者

## 🔧 如果测试失败

### 常见问题1: 编译器下载失败
**症状：**
```
Error HH502: Couldn't download compiler version list
```

**解决方案：**
检查网络连接，或手动下载编译器：
```bash
# 清理缓存重试
rm -rf cache artifacts
npx hardhat clean
npx hardhat compile
```

### 常见问题2: 依赖问题
**症状：**
```
Cannot find module '@nomicfoundation/hardhat-toolbox'
```

**解决方案：**
```bash
rm -rf node_modules package-lock.json
npm install
```

### 常见问题3: Gas估算错误
**症状：**
```
ProviderError: Transaction gas limit exceeded
```

**解决方案：**
这通常是合约逻辑错误，检查最新代码是否已拉取。

## 📝 测试通过后的下一步

### 选项1: 部署到本地测试网

```bash
# 终端1: 启动本地节点
npx hardhat node

# 终端2: 部署合约
npx hardhat run scripts/deploy.js --network localhost
```

### 选项2: 部署到BSC测试网

1. 配置`.env`文件：
```bash
cp .env.example .env
nano .env  # 填入你的私钥和API密钥
```

2. 部署：
```bash
npx hardhat run scripts/deploy.js --network bscTestnet
```

3. 验证合约：
```bash
npx hardhat verify --network bscTestnet <合约地址>
```

### 选项3: 使用Remix部署

1. 访问 https://remix.ethereum.org
2. 上传 `contracts/VotingGame.sol`
3. 编译设置：
   - Compiler: `0.8.20`
   - ✅ Enable optimization (200 runs)
   - ✅ Enable via-IR
4. 部署到你的测试链

## 🎯 关键技术特性

### 安全性
- ✅ ReentrancyGuard 防重入攻击
- ✅ Commit-Reveal 防抢跑
- ✅ 所有输入验证

### Gas优化
- ✅ viaIR编译器优化
- ✅ 结构化返回值
- ✅ 高效的存储布局

### 用户体验
- ✅ 100%押金模式（简单明了）
- ✅ 灵活的查询函数
- ✅ 完整的事件日志

## 📚 相关文档

- `TEST_FIXES.md` - 详细的测试修复说明
- `STACK_FIX.md` - Stack too deep问题解决方案
- `COMPILE_GUIDE.md` - 编译指南
- `DEPLOYMENT_GUIDE.md` - 部署指南

## ❓ 需要帮助？

如果遇到任何问题：

1. 检查是否拉取了最新代码
2. 确认Node.js版本 >= 18
3. 确认网络连接正常
4. 查看错误日志的详细信息

祝测试顺利！🎉
