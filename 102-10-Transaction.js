import { ethers } from "ethers";

// const iface = ethers.Interface([
//     "function balanceOf(address) public view returns(uint)",
//     "function transfer(address, uint) public returns (bool)",
//     "function approve(address, uint256) public returns (bool)"
// ]);

const INFURA_ID = '6dbcaabcb9954b1db39639f962315c9f'
// 连接以太坊主网
const provider = new ethers.WebSocketProvider(`wss://mainnet.infura.io/ws/v3/${INFURA_ID}`)

let network = provider.getNetwork()
network.then(res => console.log(`[${(new Date).toLocaleTimeString()}] 连接到 chain ID ${res.chainId}`));

const iface = new ethers.Interface([
"function transfer(address, uint) public returns (bool)",
])

const selector = iface.getFunction("transfer").selector
console.log(`函数选择器是${selector}`)

// 处理bigInt
function handleBigInt(key, value) {
    if (typeof value === "bigint") {
        return value.toString() + "n"; // or simply return value.toString();
    }
return value;
}


let j = 0
provider.on('pending', async (txHash) => {
if (txHash) {

    try{
        const tx = await provider.getTransaction(txHash)
        j++
        if (tx !== null && tx.data.indexOf(selector) !== -1) {
            console.log(`[${(new Date).toLocaleTimeString()}]监听到第${j + 1}个pending交易:${txHash}`)
            console.log(`打印解码交易详情:${JSON.stringify(iface.parseTransaction(tx), handleBigInt, 2)}`)
            console.log(`转账目标地址:${iface.parseTransaction(tx).args[0]}`)
            console.log(`转账金额:${ethers.formatEther(iface.parseTransaction(tx).args[1])}`)
            provider.removeListener('pending', this)
        }
    }catch (error) {
        console.warn(`[${(new Date).toLocaleTimeString()}] 查询 txHash ${txHash} 失败: ${error.message}`);
    }
    
}})
