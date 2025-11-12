import { ethers } from "ethers";
// 利用Infura的rpc节点连接以太坊网络
// 准备Infura API Key, 教程：https://github.com/AmazingAng/WTFSolidity/blob/main/Topics/Tools/TOOL02_Infura/readme.md
const INFURA_ID = '6dbcaabcb9954b1db39639f962315c9f'
// 连接以太坊主网
const provider = new ethers.WebSocketProvider(`wss://mainnet.infura.io/ws/v3/${INFURA_ID}`)

function throttle(fn, delay) {
    let timer;
    return function(){
        if(!timer) {
            fn.apply(this, arguments)
            timer = setTimeout(()=>{
                clearTimeout(timer)
                timer = null
            },delay)
        }
    }
}

let i = 0
provider.on("pending", async (txHash) => {
    if (txHash && i < 100) {
        // 打印txHash
        console.log(`[${(new Date).toLocaleTimeString()}] 监听Pending交易 ${i}: ${txHash} \r`);
        i++
        }
});

let j = 0
provider.on("pending", throttle(async (txHash) => {
    if (txHash && j <= 100) {
        // 获取tx详情
        let tx = await provider.getTransaction(txHash);
        console.log(`\n[${(new Date).toLocaleTimeString()}] 监听Pending交易 ${j}: ${txHash} \r`);
        console.log(tx);
        j++
        }
}, 1000));
