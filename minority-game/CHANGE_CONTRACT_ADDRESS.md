# 🔄 更改本地合约部署地址

## 为什么要更改？
避免 MetaMask 将 Hardhat 默认地址标记为恶意。

## 方法1：使用不同的部署账户（简单）

修改部署脚本，使用 Hardhat 的第二个或第三个账户部署：

### 编辑 `scripts/deploy.js`

**当前代码：**
```javascript
const [deployer] = await ethers.getSigners();  // 使用第1个账户
```

**修改为：**
```javascript
const signers = await ethers.getSigners();
const deployer = signers[1];  // 使用第2个账户（或 [2], [3] 等）
```

### 重新部署
```bash
cd /home/user/dapp/minority-game

# 停止旧的 Hardhat 节点（如果在运行）
lsof -ti:8545 | xargs kill

# 启动新节点
npx hardhat node &

# 等待几秒
sleep 3

# 重新部署（会得到不同的合约地址）
npx hardhat run scripts/deploy.js --network localhost

# 更新前端配置
./update-contract-address.sh
```

新的合约地址会是类似 `0x70997970C51812dc3A010C7d01b50e0d17dc79C8` 而不是 `0x5FbDB...`。

---

## 方法2：修改 Hardhat 配置的账户

修改 `hardhat.config.cjs`，自定义账户：

```javascript
networks: {
  localhost: {
    url: "http://127.0.0.1:8545",
    chainId: 1337,
    accounts: {
      mnemonic: "your custom mnemonic here",  // 自定义助记词
      count: 10
    }
  }
}
```

但这会改变所有测试账户，不推荐。

---

## 方法3：部署到 BSC 测试网（推荐用于演示）

完全避免本地地址问题：

```bash
# 1. 获取测试 BNB
# https://testnet.bnbchain.org/faucet-smart

# 2. 设置私钥
echo "PRIVATE_KEY=your_private_key_here" > .env

# 3. 部署到 BSC 测试网
npx hardhat run scripts/deploy.js --network bscTestnet

# 4. 更新前端
./update-contract-address.sh
```

在 MetaMask 切换到 **BSC Testnet**，不会再有警告。

---

## 推荐方案

**开发阶段：**
- 使用方法1（改用第2个账户）
- 或直接忽略 MetaMask 警告

**演示/分享：**
- 部署到 BSC Testnet
- 更专业，没有警告
- 别人也能访问

**生产环境：**
- 部署到 BSC 主网
- 经过完整审计
- 使用安全的私钥管理
