import { ethers } from "ethers";
// 利用Infura的rpc节点连接以太坊网络
// 准备Infura API Key, 教程：https://github.com/AmazingAng/WTFSolidity/blob/main/Topics/Tools/TOOL02_Infura/readme.md
// const INFURA_ID = '6dbcaabcb9954b1db39639f962315c9f'
// // 连接以太坊主网
// const provider = new ethers.JsonRpcProvider(`https://mainnet.infura.io/v3/${INFURA_ID}`)

const ALCHEMY_GOERLI_URL = 'https://eth-sepolia.g.alchemy.com/v2/t53Jwnd8zAK5Ko7oaaz2Q';
const provider = new ethers.JsonRpcProvider(ALCHEMY_GOERLI_URL);


const wallet1 = ethers.Wallet.createRandom()
const wallet1WithProvider = wallet1.connect(provider)
const mnemonic = wallet1.mnemonic // 获取助记词

const privateKey = '0xf2d2070d1e06c000286e9545519578d654a6a29a1cad96f3be8f6ff104afd935'
const wallet2 = new ethers.Wallet(privateKey, provider);

// 从助记词创建wallet对象
const wallet3 = ethers.Wallet.fromPhrase(mnemonic.phrase)


const address1 = await wallet1.getAddress()
const address2 = await wallet2.getAddress() 
const address3 = await wallet3.getAddress() // 获取地址
console.log(`1. 获取钱包地址`);
console.log(`钱包1地址: ${address1}`);
console.log(`钱包2地址: ${address2}`);
console.log(`钱包3地址: ${address3}`);
console.log(`钱包1和钱包3的地址是否相同: ${address1 === address3}`);

console.log(`钱包1助记词: ${wallet1.mnemonic.phrase}`)

console.log(`钱包1私钥: ${wallet1.privateKey}`)

console.log(`钱包2私钥: ${wallet2.privateKey}`)

const txCount1 =await provider.getTransactionCount(wallet1WithProvider)
const txCount2 =await provider.getTransactionCount(wallet2)
console.log(`钱包1发送交易次数: ${txCount1}`)
console.log(`钱包2发送交易次数: ${txCount2}`)

console.log(`\n5. 发送ETH（测试网）`);

console.log(`钱包1: ${ethers.formatEther(await provider.getBalance(wallet1WithProvider))} ETH`)
console.log(`钱包2: ${ethers.formatEther(await provider.getBalance(wallet2))} ETH`)


// 创建交易请求，参数：to为接收地址，value为ETH数额
const tx = {
    to: address1,
    value: ethers.parseEther("0.001")
}

console.log(`\nii. 等待交易在区块链确认（需要几分钟）`)

//发送交易，获得收据
const receipt = await wallet2.sendTransaction(tx)
await receipt.wait() // 等待链上确认交易
console.log(receipt) // 打印交易的收据


// iv. 打印交易后余额
console.log(`\niii. 发送后余额`)
console.log(`钱包1: ${ethers.formatEther(await provider.getBalance(wallet1WithProvider))} ETH`)
console.log(`钱包2: ${ethers.formatEther(await provider.getBalance(wallet2))} ETH`)
