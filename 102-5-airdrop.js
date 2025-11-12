import { ethers } from "ethers";

console.log("\n1. 创建HD钱包")
// 通过助记词生成HD钱包
const mnemonic = 'receive brave cash better green theme theory license ride glow soup deposit person obvious normal skull kidney wet market stereo cover valid machine glove'
const hdNode = ethers.HDNodeWallet.fromPhrase(mnemonic)
console.log(hdNode);

console.log("\n2. 通过HD钱包派生20个钱包")
const numWallet = 20
// 派生路径：m / purpose' / coin_type' / account' / change / address_index
// 我们只需要切换最后一位address_index，就可以从hdNode派生出新钱包
let basePath = "44'/60'/0'/0";
let addresses = [];
for (let i = 0; i < numWallet; i++) {
    let hdNodeNew = hdNode.derivePath(basePath + "/" + i);
    let walletNew = new ethers.Wallet(hdNodeNew.privateKey);
    addresses.push(walletNew.address);
}
console.log(addresses)
const amounts = Array(20).fill(ethers.parseEther("0.0001"))
console.log(`发送数额：${amounts}`)

//准备 alchemy API 可以参考https://github.com/AmazingAng/WTF-Solidity/blob/main/Topics/Tools/TOOL04_Alchemy/readme.md 
const infura_Mainnet_Url = "https://mainnet.infura.io/v3/8052ae7f89954a2ebeb767f8a1425849";
const provider = new ethers.JsonRpcProvider(infura_Mainnet_Url);

// 利用私钥和provider创建wallet对象
// 如果这个钱包没goerli测试网ETH了
// 请使用自己的小号钱包测试，钱包地址: 0x338f8891D6BdC58eEB4754352459cC461EfD2a5E ,请不要给此地址发送任何ETH
// 注意不要把自己的私钥上传到github上
const privateKey = '0x21ac72b6ce19661adf31ef0d2bf8c3fcad003deee3dc1a1a64f5fa3d6b049c06'
const wallet = new ethers.Wallet(privateKey, provider)

// Airdrop的ABI
const abiAirdrop = [
    "function multiTransferToken(address,address[],uint256[]) external",
    "function multiTransferETH(address[],uint256[]) public payable",
];
// Airdrop合约地址（Goerli测试网）
const addressAirdrop = '0x71C2aD976210264ff0468d43b198FD69772A25fa' // Airdrop Contract
// 声明Airdrop合约
const contractAirdrop = new ethers.Contract(addressAirdrop, abiAirdrop, wallet)

// WETH的ABI
const abiWETH = [
    "function balanceOf(address) public view returns(uint)",
    "function transfer(address, uint) public returns (bool)",
    "function approve(address, uint256) public returns (bool)"
];
// WETH合约地址（Goerli测试网）
const addressWETH = '0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6' // WETH Contract
// 声明WETH合约
const contractWETH = new ethers.Contract(addressWETH, abiWETH, wallet)

console.log("\n3. 读取一个地址的ETH和WETH余额")
//读取WETH余额
const balanceWETH = await contractWETH.balanceOf(addresses[10])
console.log(`WETH持仓: ${ethers.formatEther(balanceWETH)}\n`)
//读取ETH余额
const balanceETH = await provider.getBalance(addresses[10])
console.log(`ETH持仓: ${ethers.formatEther(balanceETH)}\n`)

console.log("\n4. 调用multiTransferETH()函数，给每个钱包转 0.0001 ETH")
// 发起交易
const tx = await contractAirdrop.multiTransferETH(addresses, amounts, {value: ethers.parseEther("0.002")})
// 等待交易上链
await tx.wait()
// console.log(`交易详情：`)
// console.log(tx)
const balanceETH2 = await provider.getBalance(addresses[10])
console.log(`发送后该钱包ETH持仓: ${ethers.formatEther(balanceETH2)}\n`)



console.log("\n5. 调用multiTransferToken()函数，给每个钱包转 0.0001 WETH")
// 先approve WETH给Airdrop合约
const txApprove = await contractWETH.approve(addressAirdrop, ethers.parseEther("1"))
await txApprove.wait()
// 发起交易
const tx2 = await contractAirdrop.multiTransferToken(addressWETH, addresses, amounts)
// 等待交易上链
await tx2.wait()
// console.log(`交易详情：`)
// console.log(tx2)
// 读取WETH余额
const balanceWETH2 = await contractWETH.balanceOf(addresses[10])
console.log(`发送后该钱包WETH持仓: ${ethers.formatEther(balanceWETH2)}\n`)

