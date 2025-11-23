import { ethers } from "ethers";

import { FlashbotsBundleProvider, FlashbotsBundleResolution } from "@flashbots/ethers-provider-bundle";

const RPC_URL = "https://sepolia.infura.io/v3/6dbcaabcb9954b1db39639f962315c9f"; // 替换!
const provider = new ethers.JsonRpcProvider(RPC_URL);

const GWEI = 10n ** 9n;
const CHAIN_ID = 11155111n;

const authKey = '0xf2d2070d1e06c000286e9545519578d654a6a29a1cad96f3be8f6ff104afd935'
const authSigner = new ethers.Wallet(authKey, provider)

const flashbotsProvider = await FlashbotsBundleProvider.create(
    provider,
    authSigner,
    // 使用主网 Flashbots，需要把下面两行删去
    'https://relay-sepolia.flashbots.net', // 显式使用 Sepolia 中继
    'sepolia' // 显式指定网络
);

const privateKey = '0xf2d2070d1e06c000286e9545519578d654a6a29a1cad96f3be8f6ff104afd935'
const wallet = new ethers.Wallet(privateKey, provider)
// EIP 1559 transaction
const transaction0 = {
    chainId: CHAIN_ID,
    type: 2,
    to: "0x25df6DA2f4e5C178DdFF45038378C0b08E0Bce54",
    value: ethers.parseEther("0.001"),
    maxFeePerGas: GWEI * 100n,
    maxPriorityFeePerGas: GWEI * 50n
}

const transactionBundle = [

    {
        signer: wallet, // ethers signer
        transaction: transaction0 // ethers populated transaction object
    }
    // 也可以加入mempool中签名好的交易（可以是任何人发送的）
    // ,{
    //     signedTransaction: SIGNED_ORACLE_UPDATE_FROM_PENDING_POOL // serialized signed transaction hex
    // }
]

console.log("开始模拟...");

// 签名交易
const signedTransactions = await flashbotsProvider.signBundle(transactionBundle)
// 设置交易的目标执行区块（在哪个区块执行）
const targetBlockNumber = (await provider.getBlockNumber()) + 1
// 模拟
const simulation = await flashbotsProvider.simulate(signedTransactions, targetBlockNumber)

// 检查模拟是否成功
if ("error" in simulation) {
    console.log(`模拟交易出错: ${simulation.error.message}`);
} else {
    console.log(`模拟交易成功`);
    console.log(JSON.stringify(simulation, (key, value) => 
        typeof value === 'bigint' 
            ? value.toString() 
            : value, // return everything else unchanged
        2
    ));
}

console.log("开始循环发送 Bundle，持续 100 个区块...");

for (let i = 1; i <= 1000; i++) {

    let targetBlockNumberNew = targetBlockNumber + i - 1;
    console.log(`正在尝试区块: ${targetBlockNumberNew}`);

    // 发送交易
    const res = await flashbotsProvider.sendRawBundle(signedTransactions, targetBlockNumberNew);
    if ("error" in res) {
        console.warn(`发送到区块 ${targetBlockNumberNew} 出错: ${res.error.message}`);
        continue;
    }
    // 检查交易是否上链
    const bundleResolution = await res.wait();
    // 交易有三个状态: 成功上链/没有上链/Nonce过高。
    if (bundleResolution === FlashbotsBundleResolution.BundleIncluded) {
    console.log(`恭喜, 交易成功上链，区块: ${targetBlockNumberNew}`);
    console.log(JSON.stringify(res, null, 2));
    process.exit(0);
    } else if (
    bundleResolution === FlashbotsBundleResolution.BlockPassedWithoutInclusion
    ) {
    console.log(`请重试, 交易没有被纳入区块: ${targetBlockNumberNew}`);
    } else if (
    bundleResolution === FlashbotsBundleResolution.AccountNonceTooHigh
    ) {
    console.log("Nonce 太高，请重新设置");
    process.exit(1);
    }
}

