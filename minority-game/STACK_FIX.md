# 🔧 Stack Too Deep 问题修复

## 已完成的修复

### 1. ✅ 启用 IR 优化器
在 `hardhat.config.cjs` 中添加了 `viaIR: true`：
```javascript
solidity: {
  version: "0.8.20",
  settings: {
    optimizer: {
      enabled: true,
      runs: 200
    },
    viaIR: true  // 解决Stack too deep问题
  }
}
```

### 2. ✅ 备份旧合约
将 `minority2.sol` 重命名为 `minority2.sol.bak`，避免编译冲突。

### 3. ✅ 添加辅助查询函数
在 `VotingGame.sol` 中添加了两个新函数，方便分批获取数据：

```solidity
// 获取基本信息（问题、选项、阶段、时间）
function getVoteBasicInfo(uint256 voteId) external view returns (
    string memory question,
    string[] memory options,
    VoteStage stage,
    uint256 commitEndTime,
    uint256 revealEndTime
)

// 获取状态信息（总投注、结果、创建者）
function getVoteStatus(uint256 voteId) external view returns (
    uint256 totalBets,
    bool finalized,
    uint256 winningOption,
    address creator
)
```

## 现在可以编译了！

### Hardhat 编译
```bash
npx hardhat compile
```

### Remix 编译
1. 打开 Remix: https://remix.ethereum.org
2. 复制 `contracts/VotingGame.sol`
3. 在编译器设置中：
   - Compiler: `0.8.20`
   - ✅ 勾选 **Enable optimization**
   - Runs: `200`
   - ✅ 展开 "Advanced Configurations"
   - ✅ 勾选 **Enable via-IR**
4. 点击 "Compile VotingGame.sol"

## 前端兼容性

前端代码保持不变，仍然使用 `getVoteInfo()` 函数。新增的两个函数是可选的，可以用来优化gas消耗：

```javascript
// 原来的方式（仍然可用）
const voteInfo = await contract.getVoteInfo(voteId);

// 或者使用新的拆分方式（省gas）
const basicInfo = await contract.getVoteBasicInfo(voteId);
const status = await contract.getVoteStatus(voteId);
```

## 关键改进

| 项目 | 改进 |
|-----|------|
| **Stack深度** | 使用viaIR优化，自动管理栈 |
| **编译兼容** | 移除minority2.sol冲突 |
| **查询灵活性** | 3种查询方式可选 |
| **Gas优化** | 可以只查询需要的数据 |

## 测试

编译成功后运行测试：
```bash
npx hardhat test
```

应该看到所有测试通过！✅
