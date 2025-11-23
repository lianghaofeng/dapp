// bot.js
import {ethers} from "ethers";
import dotenv from "dotenv";
dotenv.config();

// --- 1. 设置 ---
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL); // Anvil RPC
const botWallet = new ethers.Wallet(process.env.BOT_PRIVATE_KEY, provider);

// 你需要把部署后的合约地址粘贴到这里
const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; // ‼️ 等下部署完再来填

const contractABI = [
    "function mint() external",
    "function totalSupply() view returns (uint256)",
    "function ownerOf(uint256) view returns (address)"
];

const iface = new ethers.Interface(contractABI);
const MINT_SELECTOR = iface.getFunction("mint").selector; // "mint()" 函数的机器码

console.log(`🤖 抢跑机器人已启动...`);
console.log(`机器人地址: ${botWallet.address}`);


setInterval(async () => {
    const blockNumber = await provider.getBlockNumber();
    console.log(`💓 [${new Date().toLocaleTimeString()}] 当前区块: ${blockNumber}`);
}, 1000); 

async function getNumericGas(tx){
    if(tx.maxPriorityFeePerGas != null && tx.maxFeePerGas != null){
        return{
            type: "eip1559",
            maxPriorityFeePerGas: tx.maxPriorityFeePerGas, // bigint
            maxFeePerGas: tx.maxFeePerGas
        }
    }
    if (tx.gasPrice != null) {
        return { type: "legacy", gasPrice: tx.gasPrice };
    }
    return null;
}

// --- 2. 监听 Mempool ---
const pendingListener = async (txHash) => {
    let tx;
    try {
        tx = await provider.getTransaction(txHash);
        if (!tx) return; // 交易可能很快消失了


        // --- 3. 过滤器 ---
        // 如果交易是发往我们的合约、调用的是 mint()、并且不是我们自己发的
        if (tx.to &&
            tx.to.toLowerCase() === CONTRACT_ADDRESS.toLowerCase() &&
            tx.data.includes(MINT_SELECTOR) &&
            tx.from.toLowerCase() !== botWallet.address.toLowerCase()
        ) {
            console.log(`[${new Date().toLocaleTimeString()}] 监听到受害者 Mint 交易! Hash: ${txHash}`);
            // console.log(`  > 受害者 Gas Price: ${ethers.formatUnits(tx.gasPrice, 'gwei')} Gwei`);
            
            const gasInfo = await getNumericGas(tx);
            if (!gasInfo) {
                console.warn("Unknown gas format, skipping");
                return;
            }

            // --- 4. 准备抢跑 ---
            // 我们的 Gas 费 = 受害者的 Gas + 1 Gwei (确保插队)
            const targetTokenId = (await new ethers.Contract(CONTRACT_ADDRESS, contractABI, provider).totalSupply()) + 1n;
            console.log(`  > 目标 Token ID: ${targetTokenId}`);

            let txOverrides = { gasLimit: 300_000n };
            if (gasInfo.type === "eip1559") {
                // bump priority and maxFee slightly
                const bump = ethers.parseUnits("1", "gwei"); // 1 gwei as bigint
                const newPriority = gasInfo.maxPriorityFeePerGas + bump;
                const newMaxFee = gasInfo.maxFeePerGas + bump * 3n; // ensure maxFee > priority
                txOverrides.maxPriorityFeePerGas = newPriority;
                txOverrides.maxFeePerGas = newMaxFee;

                console.log(`  > 受害者 maxPriorityFeePerGas: ${ethers.formatUnits(gasInfo.maxPriorityFeePerGas, 'gwei')} Gwei`);
                console.log(`  > 机器人 (EIP1559) Priority Fee: ${ethers.formatUnits(newPriority, 'gwei')} Gwei`);
            } else {
                // legacy
                const bump = ethers.parseUnits("1", "gwei");
                txOverrides.gasPrice = gasInfo.gasPrice + bump;
                console.log(`  > 受害者 gasPrice: ${ethers.formatUnits(gasInfo.gasPrice, 'gwei')} Gwei`);
                console.log(`  > 机器人 (Legacy) Gas Price: ${ethers.formatUnits(txOverrides.gasPrice, 'gwei')} Gwei`);
            }

            

            // --- 5. 发送抢跑交易 ---
            const tx_Bot = await botWallet.sendTransaction({
                to: CONTRACT_ADDRESS,
                data: tx.data,
                ...txOverrides
            });


            console.log(`  > 🚀 抢跑交易已发送! Hash: ${tx_Bot.hash}`);
            const receipt = await tx_Bot.wait();
            console.log(`  > ✅ 抢跑交易已上链! 区块: ${receipt.blockNumber}`);

            // --- 6. 验证结果 ---
            const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI, provider);
            const owner = await contract.ownerOf(targetTokenId);
            
            if (owner.toLowerCase() === botWallet.address.toLowerCase()) {
                console.log(`  > 🏆 抢跑成功! 机器人 (${botWallet.address.slice(0, 6)}) 拿到了 Token ID ${targetTokenId}`);
            } else {
                console.log(`  > ❌ 抢跑失败! Token ID ${targetTokenId} 的持有者是 ${owner}`);
            }
            
            provider.removeAllListeners('pending'); // 实验成功，停止监听
        }
    } catch (err) {
        // Mempool 错误很常见，忽略
        console.warn("pending handler error:", err);
    }
};



provider.on("pending", pendingListener);