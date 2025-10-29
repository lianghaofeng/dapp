import { ethers } from "ethers";

// const ALCHEMY_SEPOLIA_URL = 'https://eth-sepolia.g.alchemy.com/v2/t53Jwnd8zAK5Ko7oaaz2Q';
// const provider = new ethers.JsonRpcProvider(ALCHEMY_SEPOLIA_URL);

const infura_Mainnet_Url = "https://mainnet.infura.io/v3/8052ae7f89954a2ebeb767f8a1425849";
const provider = new ethers.JsonRpcProvider(infura_Mainnet_Url);

// USDT的合约地址
const contractAddress = '0xdac17f958d2ee523a2206206994597c13d831ec7'
// 构建USDT的Transfer的ABI
const abi = [
  "event Transfer(address indexed from, address indexed to, uint value)"
];
// 生成USDT合约对象
const contractUSDT = new ethers.Contract(contractAddress, abi, provider);

// 只监听一次
console.log("\n1. 利用contract.once()，监听一次Transfer事件");
contractUSDT.once('Transfer', (from, to, value)=>{
    // 打印结果
    console.log(
        `${from} -> ${to} ${ethers.formatUnits(ethers.getBigInt(value),6)}`
    )
})

// console.log("\n2. 利用contract()，持续监听Transfer事件");
// contractUSDT.on('Transfer', (from, to, value)=>{
//     // 打印结果
//     console.log(
//         `${from} -> ${to} ${ethers.formatUnits(ethers.getBigInt(value),6)}`
//     )
// })

console.log("... 正在监听新事件，请保持脚本运行 ...")
// 保持进程存活 (例如，每小时什么也不做一次)
setInterval(() => {}, 1000 * 60 * 60);