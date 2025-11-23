// victim.js
import { ethers } from "ethers";

// --- 1. 设置 ---
const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);

// Anvil 账户 1 的私钥 (受害者)
const VICTIM_PRIVATE_KEY = '0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a';
const victimWallet = new ethers.Wallet(VICTIM_PRIVATE_KEY, provider);

// ‼️ 你需要把部署后的合约地址粘贴到这里
const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3"; 

const contractABI = [
    "function mint() external",
    "function totalSupply() view returns (uint256)",
    "function ownerOf(uint256) view returns (address)"
];
const contract = new ethers.Contract(CONTRACT_ADDRESS, contractABI, victimWallet);

console.log(`👤 受害者已准备...`);
console.log(`受害者地址: ${victimWallet.address}`);

// --- 2. 发送交易 ---
const main = async () => {
    try {
        console.log(`[${new Date().toLocaleTimeString()}]👤 受害者: 正在发送 mint() 交易...`);
        
        const tx = await contract.mint({
            // 我们设置一个“正常”的 Gas Price
            gasPrice: ethers.parseUnits('10', 'gwei'), 
            gasLimit: 300000
        });

        const targetTokenId = (await new ethers.Contract(CONTRACT_ADDRESS, contractABI, provider).totalSupply()) + 1n;
        console.log(`  > 目标 Token ID: ${targetTokenId}`);

        console.log(`👤 受害者: 交易已发送, Hash: ${tx.hash}`);
        await tx.wait();
        console.log(`[${new Date().toLocaleTimeString()}]👤 受害者: 交易已上链。`);
        const currentTokenId = (await new ethers.Contract(CONTRACT_ADDRESS, contractABI, provider).totalSupply())
        
        // 1. 拿到你自己的地址
        const victimAddress = victimWallet.address; // 确保你能访问到 victimWallet

        // 2. 检查你 *期望* 的那个 Token ID 的持有者
        const ownerOfTarget = await contract.ownerOf(targetTokenId); 

        // 3. 比较
        if (ownerOfTarget.toLowerCase() === victimAddress.toLowerCase()) {
            console.log(`✅ 验证成功! 我 (${victimAddress.slice(0,6)}) 拿到了 目标 Token ID ${targetTokenId}`);
        } else {
            // 如果不属于你，那它一定是被机器人拿走了
            console.log(`❌ 验证失败! 目标 Token ID ${targetTokenId} 属于 ${ownerOfTarget.slice(0,6)}... (抢跑成功)`);
        }

    } catch (err) {
        console.error("受害者交易失败:", err.message);
    }
}

main();