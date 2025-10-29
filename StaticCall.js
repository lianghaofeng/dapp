import {ethers} from "ethers";

// const tx = await contract.函数名.staticCall( 参数, {override})
// console.log(`交易会成功吗？：`, tx)

// 函数名：为模拟调用的函数名。
// 参数：调用函数的参数。
// {override}：选填，可包含以下参数：
// from：执行时的msg.sender，也就是你可以模拟任何一个人的调用，比如Vitalik。
// value：执行时的msg.value。
// blockTag：执行时的区块高度。
// gasPrice
// gasLimit
// nonce

const infuraUrl = "https://mainnet.infura.io/v3/8052ae7f89954a2ebeb767f8a1425849";
const provider = new ethers.JsonRpcProvider(infuraUrl);

// 利用私钥和provider创建wallet对象
const privateKey = '0xf2d2070d1e06c000286e9545519578d654a6a29a1cad96f3be8f6ff104afd935'
const wallet = new ethers.Wallet(privateKey, provider)

// DAI的ABI
const abiDAI = [
    "function balanceOf(address) public view returns(uint)",
    "function transfer(address, uint) public returns (bool)",
];

// DAI合约地址（主网）
const addressDAI = '0x6B175474E89094C44Da98b954EedeAC495271d0F' // DAI Contract

// 创建DAI合约实例
const contractDAI = new ethers.Contract(addressDAI, abiDAI, provider)

const address = await wallet.getAddress()
console.log("\n1. 读取测试钱包的DAI余额")
const balanceDAI = await contractDAI.balanceOf(address)
console.log(`DAI持仓: ${ethers.formatEther(balanceDAI)}\n`)

console.log("\n1. 读取vitalik钱包的DAI余额")
const balanceDAI2 = await contractDAI.balanceOf("vitalik.eth")
console.log(`DAI持仓: ${ethers.formatEther(balanceDAI2)}\n`)
try{
    console.log("\n2.  用staticCall尝试调用transfer转账1 DAI，msg.sender为Vitalik地址")

    // 发起交易
    const tx = await contractDAI.transfer.staticCall("vitalik.eth", ethers.parseEther("1"), {from:  await provider.resolveName("vitalik.eth")})
    console.log(`交易会成功吗？：`, tx)
} catch (error) {
    console.log(`交易会成功吗？： false`);
    console.error(`模拟失败 (这是预期的)，原因: ${error.reason || error.message};${error.reason};${error.message}`);
}



