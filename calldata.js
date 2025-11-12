import { ethers } from "ethers";
// 利用Infura的rpc节点连接以太坊网络
// 准备Infura API Key, 教程：https://github.com/AmazingAng/WTFSolidity/blob/main/Topics/Tools/TOOL02_Infura/readme.md
const INFURA_ID = '6dbcaabcb9954b1db39639f962315c9f'
// 连接以太坊主网
const provider = new ethers.JsonRpcProvider(`https://mainnet.infura.io/v3/${INFURA_ID}`)

const privateKey = '0xf2d2070d1e06c000286e9545519578d654a6a29a1cad96f3be8f6ff104afd935'
const wallet = new ethers.Wallet(privateKey, provider);


// WETH的ABI
const abiWETH = [
    "function balanceOf(address) public view returns(uint)",
    "function deposit() public payable",
];

// WETH合约地址（Goerli测试网）
const addressWETH = '0xb4fbf271143f4fbf7b91a5ded31805e42b2208d6'

// 声明WETH合约
const contractWETH = new ethers.Contract(addressWETH, abiWETH, wallet)


const address = await wallet.getAddress()
// 1. 读取WETH合约的链上信息（WETH abi）
console.log("\n1. 读取WETH余额")
// 编码calldata
const param1 = contractWETH.interface.encodeFunctionData(
    "balanceOf",
    [address]
  );
console.log(`编码结果： ${param1}`)
// 创建交易
const tx1 = {
    to: addressWETH,
    data: param1
}
// 发起交易，可读操作（view/pure）可以用 provider.call(tx)
const balanceWETH = await provider.call(tx1)
console.log(`存款前WETH持仓: ${ethers.formatEther(balanceWETH)}\n`)


// 编码calldata
const param2 = contractWETH.interface.encodeFunctionData(
    "deposit"          
    );
console.log(`编码结果： ${param2}`)
// 创建交易
const tx2 = {
    to: addressWETH,
    data: param2,
    value: ethers.parseEther("0.001")}
// 发起交易，写入操作需要 wallet.sendTransaction(tx)
const receipt1 = await wallet.sendTransaction(tx2)
// 等待交易上链
await receipt1.wait()
console.log(`交易详情：`)
console.log(receipt1)
const balanceWETH_deposit = await contractWETH.balanceOf(address)
console.log(`存款后WETH持仓: ${ethers.formatEther(balanceWETH_deposit)}\n`)
