# 🌐 浏览器端诊断指南

## 症状
- ✗ 创建投票后立即显示"Commit Phase Ended"
- ✗ 能看到上次 hardhat node 会话创建的旧投票
- ✗ 清除浏览器缓存无效

## 🔍 在浏览器Console执行以下诊断

打开浏览器，按 **F12** 打开开发者工具，切换到 **Console** 标签。

### 步骤1: 检查当前连接的网络

```javascript
const network = await provider.getNetwork()
console.log('🌐 当前网络:', {
    name: network.name,
    chainId: network.chainId.toString()
})
```

**预期输出**：
```
🌐 当前网络: { name: 'unknown', chainId: '1337' }
```

**如果显示其他 chainId**：
- `97` = BSC Testnet ⚠️（这就是问题！）
- `56` = BSC Mainnet ⚠️（危险！）
- `1` = Ethereum Mainnet ⚠️（危险！）

**解决方法**：
1. 在MetaMask中切换到 "Localhost 8545"
2. 或者手动添加网络：
   - 网络名称: Localhost 8545
   - RPC URL: `http://127.0.0.1:8545`
   - Chain ID: `1337`
   - 货币符号: ETH

---

### 步骤2: 检查合约地址

```javascript
console.log('📍 合约地址:', CONTRACT_ADDRESS)
```

**预期输出**：
```
📍 合约地址: 0x8464135c8F25Da09e49BC8782676a84730C318bC
```

**或其他地址都可以**（取决于部署）

---

### 步骤3: 检查投票数量

```javascript
try {
    const counter = await contract.voteCounter()
    console.log('🗳️  投票总数:', counter.toString())
} catch (error) {
    console.error('❌ 获取投票数失败:', error.message)
}
```

**预期输出**（如果刚重启节点）：
```
🗳️  投票总数: 0
```

**如果显示 1, 2, 3... 等**：
- 说明合约中确实有投票数据
- 要么是连接到了测试网（有持久数据）
- 要么是节点没有真正重启

**如果显示错误**：
- `could not detect network` → MetaMask没连接或网络错误
- `call revert exception` → 合约地址错误
- `invalid address` → CONTRACT_ADDRESS 配置错误

---

### 步骤4: 检查钱包连接状态

```javascript
console.log('👛 钱包状态:', {
    provider: !!provider ? '✅ 已连接' : '❌ 未连接',
    signer: !!signer ? '✅ 已连接' : '❌ 未连接',
    contract: !!contract ? '✅ 已连接' : '❌ 未连接',
    userAddress: userAddress || '❌ 未连接'
})
```

**预期输出**：
```
👛 钱包状态: {
    provider: '✅ 已连接',
    signer: '✅ 已连接',
    contract: '✅ 已连接',
    userAddress: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'
}
```

---

### 步骤5: 检查第一个投票的详细信息（如果存在）

```javascript
try {
    const counter = await contract.voteCounter()
    if (Number(counter) > 0) {
        const voteInfo = await contract.getVoteInfo(1)
        const now = Math.floor(Date.now() / 1000)

        console.log('📊 投票 #1 详情:', {
            question: voteInfo[2],
            stage: voteInfo[4],
            commitEndTime: voteInfo[5].toString(),
            revealEndTime: voteInfo[6].toString(),
            currentTime: now,
            commitTimeLeft: Number(voteInfo[5]) - now,
            revealTimeLeft: Number(voteInfo[6]) - now,
            createdAt: new Date(Number(voteInfo[10]) * 1000).toLocaleString()
        })

        console.log('⏰ 时间分析:')
        if (now < Number(voteInfo[5])) {
            console.log('✅ Commit阶段进行中，剩余:', Math.floor((Number(voteInfo[5]) - now) / 60), '分钟')
        } else if (now < Number(voteInfo[6])) {
            console.log('✅ Reveal阶段进行中，剩余:', Math.floor((Number(voteInfo[6]) - now) / 60), '分钟')
        } else {
            console.log('⏱️ 投票已结束')
        }
    } else {
        console.log('✅ 没有投票（这是正常的新合约状态）')
    }
} catch (error) {
    console.error('❌ 获取投票详情失败:', error.message)
}
```

这会显示投票的详细时间信息，帮助判断是否真的"立即结束"。

---

### 步骤6: 完整诊断脚本（一键执行）

复制以下整段代码到Console：

```javascript
(async function diagnose() {
    console.log('🔍 开始诊断...\n')

    // 1. 网络检查
    try {
        const network = await provider.getNetwork()
        console.log('1️⃣ 网络信息:', {
            name: network.name,
            chainId: network.chainId.toString()
        })
        if (network.chainId.toString() !== '1337') {
            console.warn('⚠️  警告: 不是本地测试网! 预期 chainId: 1337')
        }
    } catch (error) {
        console.error('❌ 网络检查失败:', error.message)
    }

    // 2. 合约地址
    console.log('\n2️⃣ 合约地址:', CONTRACT_ADDRESS)

    // 3. 投票数量
    try {
        const counter = await contract.voteCounter()
        console.log('\n3️⃣ 投票总数:', counter.toString())

        // 4. 如果有投票，显示详情
        if (Number(counter) > 0) {
            console.log('\n4️⃣ 投票列表:')
            for (let i = 1; i <= Number(counter); i++) {
                try {
                    const voteInfo = await contract.getVoteInfo(i)
                    const now = Math.floor(Date.now() / 1000)
                    const commitTimeLeft = Number(voteInfo[5]) - now
                    const stage = Number(voteInfo[4])

                    console.log(`\n   投票 #${i}:`, {
                        question: voteInfo[2],
                        stage: ['Active', 'Committing', 'Revealing', 'Finalized', 'Claiming'][stage],
                        commitEndTime: new Date(Number(voteInfo[5]) * 1000).toLocaleString(),
                        剩余时间: commitTimeLeft > 0 ? `${Math.floor(commitTimeLeft / 60)}分钟` : '已结束',
                        创建时间: new Date(Number(voteInfo[10]) * 1000).toLocaleString()
                    })
                } catch (error) {
                    console.error(`   ❌ 获取投票 #${i} 失败:`, error.message)
                }
            }
        }
    } catch (error) {
        console.error('❌ 获取投票数失败:', error.message)
    }

    // 5. 钱包状态
    console.log('\n5️⃣ 钱包状态:', {
        provider: !!provider ? '✅' : '❌',
        signer: !!signer ? '✅' : '❌',
        contract: !!contract ? '✅' : '❌',
        userAddress: userAddress || '❌ 未连接'
    })

    console.log('\n✅ 诊断完成')
})()
```

---

## 📊 诊断结果分析

### 结果A: chainId 不是 1337

**问题**：MetaMask连接到了BSC测试网或其他网络

**解决**：
1. 在MetaMask中切换到 "Localhost 8545"
2. 刷新页面
3. 重新连接钱包

---

### 结果B: voteCounter 不是 0

**问题**：合约中有旧数据

**可能原因**：
1. **节点没有真正重启** - 在终端运行 `ps aux | grep hardhat` 检查
2. **连接到了测试网** - 测试网的数据是持久的
3. **有多个硬件钱包或节点** - 连接到了错误的节点

**解决**：
```bash
# 1. 杀掉所有 node 进程
killall -9 node

# 2. 确认 8545 端口空闲
lsof -i :8545

# 3. 启动新节点
npx hardhat node

# 4. 重新部署
npx hardhat run scripts/deploy-alt-address.js --network localhost

# 5. 浏览器硬刷新
Cmd+Shift+R (Mac) 或 Ctrl+Shift+R (Windows)
```

---

### 结果C: 投票立即显示"Ended"但时间显示还有很久

**问题**：前端显示逻辑bug或时间计算错误

**检查**：
```javascript
const voteInfo = await contract.getVoteInfo(1)
const now = Math.floor(Date.now() / 1000)
console.log('合约时间:', Number(voteInfo[5]))
console.log('当前时间:', now)
console.log('差值(秒):', Number(voteInfo[5]) - now)
```

如果差值是正数（比如 300 = 5分钟），但前端显示"Ended"，那就是前端显示bug。

---

### 结果D: 所有检查都正常，但还是有问题

**可能是**：
1. 浏览器标签页缓存 - **关闭标签页，重新打开**
2. Service Worker缓存 - 在Console执行：
   ```javascript
   navigator.serviceWorker.getRegistrations().then(registrations => {
       registrations.forEach(registration => registration.unregister())
   })
   ```
3. 打开了多个标签页 - **检查其他标签页**

---

## 🎯 最可能的原因

根据症状"能看到上次创建的投票"，最可能的原因是：

### 原因1: MetaMask连接到BSC测试网 (90%可能性) ⚠️

BSC测试网的数据是持久化的，即使你关闭浏览器、重启电脑，数据还在。

**验证方法**：在Console执行
```javascript
(await provider.getNetwork()).chainId.toString()
```

如果返回 `"97"`，那就是BSC测试网！

**解决**：切换到 Localhost 8545

---

### 原因2: 有旧的hardhat node还在运行 (8%可能性)

**验证方法**：
```bash
ps aux | grep hardhat
lsof -i :8545
```

---

### 原因3: 浏览器标签页缓存 (2%可能性)

**解决**：关闭所有标签页，重新打开

---

## 📝 标准排查流程

1. **先执行浏览器诊断**（上面的一键诊断脚本）
2. **查看 chainId** - 必须是 1337
3. **查看 voteCounter** - 应该是 0（如果刚重启）
4. **如果不是0** - 停止节点，重启，重新部署
5. **如果chainId不对** - 在MetaMask切换网络

---

## 🆘 如果还是不行

请提供以下信息：
1. 浏览器Console一键诊断脚本的**完整输出**
2. 终端 `ps aux | grep hardhat` 的输出
3. 终端 `lsof -i :8545` 的输出
4. MetaMask当前连接的网络名称

我会根据这些信息进一步分析！
