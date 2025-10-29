import {ethers} from "ethers";

const ALCHEMY_SEPOLIA_URL = 'https://eth-sepolia.g.alchemy.com/v2/t53Jwnd8zAK5Ko7oaaz2Q';
const provider = new ethers.JsonRpcProvider(ALCHEMY_SEPOLIA_URL);

const privateKey = '0xf2d2070d1e06c000286e9545519578d654a6a29a1cad96f3be8f6ff104afd935'
const wallet = new ethers.Wallet(privateKey, provider);

// WETH的ABI
const abiWETH = [
    "function balanceOf(address) public view returns(uint)",
    "function deposit() public payable",
    "function transfer(address, uint) public returns (bool)",
    "function withdraw(uint) public",
];
// WETH合约地址（Goerli测试网）
const addressWETH = '0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14' // WETH Contract

// 声明可写合约
const contractWETH = new ethers.Contract(addressWETH, abiWETH, wallet)
// 也可以声明一个只读合约，再用connect(wallet)函数转换成可写合约。
// const contractWETH = new ethers.Contract(addressWETH, abiWETH, provider)
// contractWETH.connect(wallet)

const address = await wallet.getAddress()

console.log("\n1. Read wETH balance")

const balanceWETH = await contractWETH.balanceOf(address)

console.log(`wETH balance before deposit: ${ethers.formatEther(balanceWETH)}\n`)

console.log("\n2. 调用desposit()函数，存入0.001 ETH")

// 发起交易
const tx = await contractWETH.deposit({value: ethers.parseEther("0.001")})
// 等待交易上链
await tx.wait()
console.log(`交易详情：`)
console.log(tx)
const balanceWETH_deposit = await contractWETH.balanceOf(address)
console.log(`存款后WETH持仓: ${ethers.formatEther(balanceWETH_deposit)}\n`)

console.log("\n3. 调用transfer()函数，给vitalik转账0.001 WETH")

// 发起交易
const tx2 = await contractWETH.transfer("vitalik.eth", ethers.parseEther("0.001"))
// 等待交易上链
await tx2.wait()
const balanceWETH_transfer = await contractWETH.balanceOf(address)
console.log(`转账后WETH持仓: ${ethers.formatEther(balanceWETH_transfer)}\n`)


const balanceWETH_vitalik = await contractWETH.balanceOf("vitalik.eth")
console.log(`转账后vitalik WETH持仓: ${ethers.formatEther(balanceWETH_vitalik)}\n`)

