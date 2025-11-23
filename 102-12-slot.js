import { ethers } from "ethers";

const infura_Mainnet_Url = "https://mainnet.infura.io/v3/8052ae7f89954a2ebeb767f8a1425849";
const provider = new ethers.JsonRpcProvider(infura_Mainnet_Url);

// 目标合约地址: Arbitrum ERC20 bridge（主网）
const addressBridge = '0x8315177aB297bA92A06054cE80a67Ed4DBd7ed3a' // DAI Contract
// 合约所有者 slot
const slot = `0xb53127684a568b3173ae13b9f8a6016e243e63b6e8ee1178d6a717850b5d6103`

const main = async () => {
    console.log("开始读取特定slot的数据")
    const privateData = await provider.getStorage(addressBridge, slot)
    console.log("读出的数据（owner地址）: ", ethers.getAddress(ethers.dataSlice(privateData, 12)))    
}

main()