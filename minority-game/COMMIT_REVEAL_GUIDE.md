# 🔐 Commit-Reveal 机制详解

## 📖 什么是Commit-Reveal？

Commit-Reveal（提交-揭示）是一种两阶段投票机制，用于防止抢跑攻击和投票操纵。

### 问题场景

如果没有Commit-Reveal机制，投票会这样进行：

```javascript
// ❌ 不安全的投票
await contract.vote(voteId, choice, { value: betAmount });
```

**问题：**
1. 你的选择立即公开
2. 后来的投票者可以看到你的选择
3. 他们可以根据你的选择来调整策略（抢跑攻击）
4. 在少数派获胜的游戏中，这会破坏公平性

### 解决方案：Commit-Reveal

分为两个阶段：

#### 阶段1: Commit（提交加密承诺）

```javascript
// ✅ 安全的提交
const secret = ethers.randomBytes(32);
const commitHash = ethers.keccak256(
    ethers.solidityPacked(
        ['uint256', 'uint256', 'bytes32', 'address'],
        [voteId, choice, secret, userAddress]
    )
);

await contract.commit(voteId, commitHash, { value: betAmount });
```

**此时：**
- 只提交了一个哈希值，不暴露选择
- 其他人无法知道你选了什么
- 但你已经锁定了选择（无法更改）

#### 阶段2: Reveal（揭示选择）

```javascript
// ✅ 揭示你的选择
await contract.reveal(voteId, choice, secret);
```

**此时：**
- 合约验证 hash(choice + secret) 是否匹配之前的commit
- 如果匹配，记录你的选择
- 所有人同时揭示，公平竞争

---

## 🧪 测试中的自动化

### 问题：测试需要手动reveal吗？

**不需要！** 我们提供了自动化函数。

### 方案1：手动两阶段（灵活）

```javascript
// 适用于需要精确控制时间的测试
await doCommit(player1, 0, ethers.parseEther("1.0"));
await doCommit(player2, 1, ethers.parseEther("2.0"));
await doCommit(player3, 1, ethers.parseEther("3.0"));

// 手动控制时间
await time.increase(COMMIT_DURATION + 1);

// 统一reveal
await doRevealAll();
```

### 方案2：自动一体化（推荐）

```javascript
// ✅ 一行搞定！自动commit + 自动reveal
await commitAndRevealMultiple([
    { player: player1, choice: 0, betAmount: ethers.parseEther("1.0") },
    { player: player2, choice: 1, betAmount: ethers.parseEther("2.0") },
    { player: player3, choice: 1, betAmount: ethers.parseEther("3.0") }
]);
```

**工作原理：**
1. 自动为每个玩家生成随机secret
2. 计算commitHash并提交
3. 保存secret到内存
4. 自动等待commit阶段结束
5. 切换到reveal阶段
6. 自动用保存的secret reveal所有玩家

---

## 🌐 前端中的实现

### 用户体验流程

#### 步骤1：用户提交投票（Commit）

```javascript
// 前端自动生成secret
const secret = ethers.hexlify(ethers.randomBytes(32));

// 计算commitHash
const commitHash = ethers.keccak256(
    ethers.solidityPacked(
        ['uint256', 'uint256', 'bytes32', 'address'],
        [voteId, choice, secret, userAddress]
    )
);

// 提交commit
await contract.commit(voteId, commitHash, { value: betAmount });

// ⚠️ 重要：保存到localStorage
localStorage.setItem(`commit_${voteId}`, JSON.stringify({
    choice,
    secret,
    voteId
}));
```

#### 步骤2：等待commit阶段结束

- 显示倒计时："Commit阶段剩余 XX:XX"
- 不允许修改选择
- 可以查看自己的commit状态

#### 步骤3：用户揭示投票（Reveal）

**方式A：手动reveal**
```javascript
// 用户点击"揭示投票"按钮
const commitData = JSON.parse(localStorage.getItem(`commit_${voteId}`));
await contract.reveal(voteId, commitData.choice, commitData.secret);
```

**方式B：自动reveal（可选）**
```javascript
// 前端检测到reveal阶段开始
if (stage === VoteStage.Revealing && userHasCommit) {
    // 询问用户是否自动reveal
    if (confirm("检测到可以揭示投票了，是否立即揭示？")) {
        const commitData = JSON.parse(localStorage.getItem(`commit_${voteId}`));
        await contract.reveal(voteId, commitData.choice, commitData.secret);
    }
}
```

### 为什么需要保存到localStorage？

1. **用户可能关闭页面**：commit后用户关闭浏览器，1小时后回来reveal
2. **页面刷新**：保证数据不丢失
3. **跨设备不行**：只能在同一浏览器同一设备reveal

---

## 🎯 实际游戏场景

### 场景：3个玩家投票

**时间线：**

```
T=0: 投票创建
├─ 问题："你最喜欢的水果？"
└─ 选项：["苹果", "香蕉", "橙子"]

T=0-60分钟: Commit阶段
├─ T=5分钟:  Alice commit（哈希: 0xabc...）→ 选择保密
├─ T=20分钟: Bob commit（哈希: 0xdef...）→ 选择保密
└─ T=45分钟: Carol commit（哈希: 0x123...）→ 选择保密

💡 此时没人知道别人选了什么！

T=60分钟: Commit阶段结束，自动切换到Reveal阶段

T=60-90分钟: Reveal阶段
├─ T=62分钟: Alice reveal → 选择"苹果"（1 ETH）
├─ T=65分钟: Bob reveal → 选择"香蕉"（2 ETH）
└─ T=70分钟: Carol reveal → 选择"香蕉"（3 ETH）

T=90分钟: Reveal阶段结束

T=90+: 结算
├─ 统计：苹果(1 ETH), 香蕉(5 ETH), 橙子(0 ETH)
├─ 获胜：苹果（最少投注）
└─ Alice获得：1 ETH（本金）+ 5 ETH（失败者）= 6 ETH 🎉
```

---

## 🔒 安全性保证

### 1. 无法预测

```solidity
// ✅ 使用随机secret
bytes32 secret = keccak256(abi.encodePacked(block.timestamp, msg.sender, randomValue));
```

### 2. 无法篡改

```solidity
// ✅ Commit时锁定
commits[msg.sender].commitHash = commitHash;

// ✅ Reveal时验证
bytes32 expectedHash = keccak256(abi.encodePacked(voteId, choice, secret, msg.sender));
require(expectedHash == commits[msg.sender].commitHash, "Hash mismatch");
```

### 3. 防止不揭示

```solidity
// ✅ 未揭示者失去押金
if (!revealed) {
    // 押金被没收，不退还
    emit BetConfiscated(voteId, player, betAmount);
}
```

---

## ❓ 常见问题

### Q1: 如果我忘记reveal怎么办？

**A:** 你会**失去全部押金**（100%投注金额）。这是设计的惩罚机制，鼓励诚实揭示。

**建议：**
- 前端应该发送浏览器通知
- 显示醒目的倒计时
- 提供自动reveal选项

### Q2: 可以先看别人reveal再决定吗？

**A:** 不行！你在commit时就已经锁定选择了。即使你等到最后一刻reveal，选择也无法改变。

### Q3: 为什么要等待时间？不能立即reveal吗？

**A:** 必须等待！否则：
1. 早揭示的人暴露选择
2. 晚commit的人可以看到选择
3. 破坏公平性

### Q4: Secret丢了怎么办？

**A:** 无法reveal，押金会被没收。所以：
- 前端必须可靠保存secret
- 建议用户备份（导出JSON）
- localStorage + 云端备份（加密）

### Q5: 合约能否自动reveal？

**A:** **不能！** 区块链智能合约无法自动执行，必须有人发起交易。

可以的方案：
- 前端定时检测并提醒
- 提供"自动reveal"选项（前端定时调用）
- Chainlink Keepers等外部服务（需额外费用）

---

## 📊 对比表

| 特性 | 直接投票 | Commit-Reveal |
|------|----------|--------------|
| 选择保密性 | ❌ 立即公开 | ✅ 保密直到reveal |
| 防止抢跑 | ❌ 容易被抢跑 | ✅ 无法抢跑 |
| 实现复杂度 | ✅ 简单 | ⚠️ 较复杂 |
| 用户步骤 | 1步 | 2步 |
| Gas费用 | 低 | 较高（2次交易） |
| 安全性 | 低 | 高 |
| 适用场景 | 普通投票 | 竞争性投票 |

---

## 🚀 最佳实践

### 测试中

```javascript
// ✅ 推荐：使用自动化函数
await commitAndRevealMultiple([
    { player: player1, choice: 0, betAmount: ethers.parseEther("1.0") },
    { player: player2, choice: 1, betAmount: ethers.parseEther("2.0") }
]);
```

### 前端中

```javascript
// ✅ 推荐：完整的用户体验
class VotingManager {
    async commit(voteId, choice, betAmount) {
        const secret = this.generateSecret();
        const commitHash = this.calculateHash(voteId, choice, secret);

        // 提交交易
        await contract.commit(voteId, commitHash, { value: betAmount });

        // 保存数据
        this.saveCommit(voteId, { choice, secret, timestamp: Date.now() });

        // 设置提醒
        this.scheduleRevealReminder(voteId);
    }

    async autoReveal(voteId) {
        const commitData = this.loadCommit(voteId);
        if (!commitData) return;

        await contract.reveal(voteId, commitData.choice, commitData.secret);
        this.clearCommit(voteId);
    }
}
```

---

## 📚 延伸阅读

- [Commit-Reveal Scheme (Wikipedia)](https://en.wikipedia.org/wiki/Commitment_scheme)
- [Ethereum Smart Contract Best Practices](https://consensys.github.io/smart-contract-best-practices/)
- [Solidity Commit-Reveal Pattern](https://medium.com/@hayeah/how-to-create-a-commit-reveal-voting-contract-in-solidity-6b1b34b14762)

---

**现在你已经了解了Commit-Reveal的全部细节！** 🎓

测试中使用 `commitAndRevealMultiple()` 即可自动化完成整个流程！
