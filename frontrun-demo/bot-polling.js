// bot-polling.js - 使用轮询而不是事件监听
import {ethers} from "ethers";
import dotenv from "dotenv";
dotenv.config();

// --- 1. 设置 ---
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const botWallet = new ethers.Wallet(process.env.BOT_PRIVATE_KEY, provider);

const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

const contractABI = [
    "function mint() external",
    "function totalSupply() view returns (uint256)",
    "function ownerOf(uint256) view returns (address)"
];

const iface = new ethers.Interface(contractABI);
const MINT_SELECTOR = iface.getFunction("mint").selector;

console.log(`🤖 抢跑机器人已启动 (轮询模式)...`);
console.log(`机器人地址: ${botWallet.address}`);
console.log(`合约地址: ${CONTRACT_ADDRESS}`);
console.log(`正在监控 mempool...\n`);

const processedTxs = new Set();
// 记录上一次看到的 pending 交易哈希集合
let lastPendingHashes = new Set();
let pollCount = 0;

let successCount = 0;
let failCount = 0;

// --- 2. 轮询 Mempool ---
async function pollMempool() {
    
    pollCount++;
    if (pollCount % 20 === 0) { // 每秒打印一次（假设50ms轮询）
        const blockNum = await provider.getBlockNumber();
        console.log(`💓 [${new Date().toLocaleTimeString()}] 当前区块: ${blockNum} | 已检查 ${processedTxs.size} 笔交易`);
    }
    
    try {
        // 获取 pending 区块
        const pendingBlock = await provider.send("eth_getBlockByNumber", ["pending", true]);
        
        if (!pendingBlock || !pendingBlock.transactions) {
            return;
        }
        
        const pendingTxs = pendingBlock.transactions;

        // 获取当前 pending 交易的哈希集合
        const currentPendingHashes = new Set(pendingTxs.map(tx => tx.hash));

        // 找出新出现的交易（在当前有，但在上次没有）
        const newTxHashes = [...currentPendingHashes].filter(hash => !lastPendingHashes.has(hash));
        
        if (newTxHashes.length > 0) {
            console.log(`📦 [${new Date().toLocaleTimeString()}] Mempool 中发现 ${newTxHashes.length} 笔新交易`);
        }

        // 更新上次的哈希集合
        lastPendingHashes = currentPendingHashes;
        
        // --- 3. 检查每笔交易 ---
        for (const tx of pendingTxs) {
            if (processedTxs.has(tx.hash)) continue;
            processedTxs.add(tx.hash);
            
            // 过滤目标交易
            if (tx.to &&
                tx.to.toLowerCase() === CONTRACT_ADDRESS.toLowerCase() &&
                tx.input.startsWith(MINT_SELECTOR) &&
                tx.from.toLowerCase() !== botWallet.address.toLowerCase()
            ) {
                console.log(`\n🎯 [${new Date().toLocaleTimeString()}] 发现目标 Mint 交易!`);
                console.log(`   Hash: ${tx.hash}`);
                console.log(`   From: ${tx.from}`);
                
                // 异步执行抢跑，不阻塞轮询
                executeFrontrun(tx).catch(err => {
                    console.error(`❌ 抢跑异常:`, err.message);
                    failCount++;
                });
            }
        }
        // 定期清理已完成的交易（防止 Set 无限增长）
        if (processedTxs.size > 1000) {
            console.log(`🧹 清理历史交易记录...`);
            // 只保留最近的 500 个
            const txArray = Array.from(processedTxs);
            processedTxs.clear();
            txArray.slice(-500).forEach(hash => processedTxs.add(hash));
        }

    } catch (err) {
        // 静默处理错误，继续轮询
        if (err.message && !err.message.includes("could not detect network")) {
            console.error("轮询错误:", err.message);
        }
    }
}

// --- 4. 执行抢跑 ---
async function executeFrontrun(victimTx) {
    try {
        const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI, provider);
        const targetTokenId = (await contract.totalSupply()) + 1n;
        console.log(`   > 目标 Token ID: ${targetTokenId}`);

        // 解析受害者的 gas 并提高
        let txOverrides = { gasLimit: 300_000n };
        
        if (victimTx.maxPriorityFeePerGas && victimTx.maxFeePerGas) {
            const bump = ethers.parseUnits("1", "gwei"); // 提高 5 Gwei 确保优先
            const victimPriority = BigInt(victimTx.maxPriorityFeePerGas);
            const victimMaxFee = BigInt(victimTx.maxFeePerGas);
            
            txOverrides.maxPriorityFeePerGas = victimPriority + bump;
            txOverrides.maxFeePerGas = victimMaxFee + bump * 2n;
            
            console.log(`   > 受害者 Priority Fee: ${ethers.formatUnits(victimPriority, 'gwei')} Gwei`);
            console.log(`   > 机器人 Priority Fee: ${ethers.formatUnits(txOverrides.maxPriorityFeePerGas, 'gwei')} Gwei`);
        } else if (victimTx.gasPrice) {
            const bump = ethers.parseUnits("5", "gwei");
            const victimGasPrice = BigInt(victimTx.gasPrice);
            txOverrides.gasPrice = victimGasPrice + bump;
            
            console.log(`   > 受害者 Gas Price: ${ethers.formatUnits(victimGasPrice, 'gwei')} Gwei`);
            console.log(`   > 机器人 Gas Price: ${ethers.formatUnits(txOverrides.gasPrice, 'gwei')} Gwei`);
        }

        // --- 5. 发送抢跑交易 ---
        const mintData = iface.encodeFunctionData("mint", []);
        const tx_Bot = await botWallet.sendTransaction({
            to: CONTRACT_ADDRESS,
            data: mintData,
            ...txOverrides
        });

        console.log(`   > 🚀 抢跑交易已发送! Hash: ${tx_Bot.hash}`);
        
        const receipt = await tx_Bot.wait();
        console.log(`   > ✅ 抢跑交易已上链! 区块: ${receipt.blockNumber}`);

        // --- 6. 验证结果 ---
        const owner = await contract.ownerOf(targetTokenId);
        
        if (owner.toLowerCase() === botWallet.address.toLowerCase()) {
            console.log(`   > 🏆 抢跑成功! Token ID ${targetTokenId} 属于机器人 ${botWallet.address.slice(0,8)}...`);
            successCount++;
        } else {
            console.log(`   > ❌ 抢跑失败! Token ID ${targetTokenId} 属于 ${owner.slice(0,8)}...`);
            failCount++;
        }
        console.log(`\n📊 统计: 成功 ${successCount} 次 | 失败 ${failCount} 次\n`);
        
    } catch (err) {
        console.error("❌ 抢跑执行失败:", err.message);
        failCount++;
    }
}

// 每 50ms 轮询一次（20次/秒）
const pollInterval = setInterval(pollMempool, 50);

// 5 分钟后自动停止
setTimeout(() => {
    clearInterval(pollInterval);
    console.log("\n⏰ 监听超时，机器人停止");
    process.exit(0);
}, 300000);

// 处理 Ctrl+C
process.on('SIGINT', () => {
    clearInterval(pollInterval);
    console.log("\n\n👋 机器人已停止");
    process.exit(0);
});