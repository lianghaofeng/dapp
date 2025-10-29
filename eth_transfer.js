// 文件: sendEth.js
// 运行: node sendEth.js

import { ethers } from "ethers";

// --- 1. 配置 ---

// 你的 RPC 节点 URL (例如 Infura, Alchemy)
// 我们以 Sepolia 测试网为例
const RPC_URL = "https://sepolia.infura.io/v3/8052ae7f89954a2ebeb767f8a1425849"; // 替换!

// 你的私钥 (!! 确保这个账户在 Sepolia 上有 ETH 用于支付 Gas !!)
// (!! 再次警告：不要使用你之前泄露的那个私钥 !!)
const SENDER_PRIVATE_KEY = "0xf2d2070d1e06c000286e9545519578d654a6a29a1cad96f3be8f6ff104afd935"; // 替换!

const wallet = new ethers.Wallet(SENDER_PRIVATE_KEY)

// 目标地址 (你要把 ETH 转给谁)
const RECIPIENT_ADDRESS = wallet.address; // 替换!

// --- 2. 主函数 ---

async function main() {
    // 1. 设置 Provider 和 Signer (Wallet)
    // Provider 用于连接到以太坊网络
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    
    // Wallet (即 Signer) 用于签名和发送交易
    const signer = new ethers.Wallet(SENDER_PRIVATE_KEY, provider);

    console.log(`正在使用地址: ${signer.address}`);

    // 2. 准备交易参数
    const amountToSend = "0.01"; // 你想发送的 ETH 数量 (字符串)
    const amountInWei = ethers.parseEther(amountToSend); // 转换为 Wei (最小单位)
    console.log(`准备发送 ${amountToSend} ETH (即 ${amountInWei} Wei) 到 ${RECIPIENT_ADDRESS}...`);

    try {
        // 3. (可选) 获取推荐的 Gas 价格
        // (ethers v6+ 通常会自动处理，但这是个好习惯)
        const feeData = await provider.getFeeData();
        const gasPrice = feeData.gasPrice;
        console.log(`当前 Gas 价格: ${ethers.formatUnits(gasPrice, "gwei")} Gwei`);

        // 4. 创建交易请求对象
        const txRequest = {
            to: RECIPIENT_ADDRESS,       // 接收者地址
            value: amountInWei,          // 要发送的 ETH (以 Wei 为单位)
            gasPrice: gasPrice           // 使用获取到的 Gas 价格
            // 'gasLimit' (Gas 上限) 通常由 ethers 自动估算
            // 'nonce' (随机数) 也通常由 ethers 自动管理
        };

        // 5. (重要) 发送交易
        // signer.sendTransaction 会做三件事：
        // a. 自动估算 Gas Limit (除非你手动指定)
        // b. 自动获取 Nonce (除非你手动指定)
        // c. 用 signer 的私钥签名交易
        // d. 将签名后的交易广播到网络
        console.log("正在发送交易...");
        const txResponse = await signer.sendTransaction(txRequest);

        console.log(`交易已发送! Hash: ${txResponse.hash}`);
        console.log("正在等待交易确认 (这可能需要几分钟)...");

        // 6. 等待交易被矿工打包确认 (推荐至少等待 1 个区块)
        const receipt = await txResponse.wait(1);

        console.log("--- 交易成功！ ---");
        console.log(`交易已在区块 ${receipt.blockNumber} 被确认`);
        console.log(`查看交易详情: https://sepolia.etherscan.io/tx/${txResponse.hash}`);

    } catch (error) {
        console.error("--- 交易失败！ ---");
        console.error("错误原因:", error.reason || error.message);
    }
}

// 运行主函数
main();