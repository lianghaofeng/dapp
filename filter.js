import { ethers } from "ethers";

// const ALCHEMY_SEPOLIA_URL = 'https://eth-sepolia.g.alchemy.com/v2/t53Jwnd8zAK5Ko7oaaz2Q';
// const provider = new ethers.JsonRpcProvider(ALCHEMY_SEPOLIA_URL);

const infura_Mainnet_Url = "https://mainnet.infura.io/v3/8052ae7f89954a2ebeb767f8a1425849";
const provider = new ethers.JsonRpcProvider(infura_Mainnet_Url);


const addressUSDT = '0xdac17f958d2ee523a2206206994597c13d831ec7'
// 交易所地址
const accountBinance = '0x28C6c06298d514Db089934071355E5743bf21d60'
// 构建ABI
const abi = [
  "event Transfer(address indexed from, address indexed to, uint value)",
  "function balanceOf(address) public view returns(uint)",
];
// 构建合约对象
const contractUSDT = new ethers.Contract(addressUSDT, abi, provider);

const balanceUSDT = await contractUSDT.balanceOf(accountBinance)
console.log(`USDT余额: ${ethers.formatUnits(balanceUSDT,6)}\n`)

// 2. 创建过滤器，监听转移USDT进交易所
console.log("\n2. 创建过滤器，监听USDT转进交易所")
let filterBinanceIn = contractUSDT.filters.Transfer(null, accountBinance);
console.log("过滤器详情：")
console.log(filterBinanceIn);
contractUSDT.on(filterBinanceIn, (res) => {
  console.log('---------监听USDT进入交易所--------');
  console.log(
    `${res.args[0]} -> ${res.args[1]} ${ethers.formatUnits(res.args[2],6)}`
  )
})


// // 3. 创建过滤器，监听交易所转出USDT
// let filterToBinanceOut = contractUSDT.filters.Transfer(accountBinance);
// console.log("\n3. 创建过滤器，监听USDT转出交易所")
// console.log("过滤器详情：")
// console.log(filterToBinanceOut);
// contractUSDT.on(filterToBinanceOut, (res) => {
// console.log('---------监听USDT转出交易所--------');
// console.log(
//     `${res.args[0]} -> ${res.args[1]} ${ethers.formatUnits(res.args[2],6)}`
// )
// }
// );


console.log("... 正在监听新事件，请保持脚本运行 ...")
// 保持进程存活 (例如，每小时什么也不做一次)
setInterval(() => {}, 1000 * 60 * 60);
