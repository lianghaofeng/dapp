import { ethers } from "ethers";

// const ALCHEMY_SEPOLIA_URL = 'https://eth-sepolia.g.alchemy.com/v2/t53Jwnd8zAK5Ko7oaaz2Q';
// const provider = new ethers.JsonRpcProvider(ALCHEMY_SEPOLIA_URL);

const infuraUrl = "https://sepolia.infura.io/v3/8052ae7f89954a2ebeb767f8a1425849";
const provider = new ethers.JsonRpcProvider(infuraUrl);


// WETH ABI，只包含我们关心的Transfer事件
const abiWETH = [
    "event Transfer(address indexed from, address indexed to, uint amount)"
];


// 测试网WETH地址
const addressWETH = '0xdd13E55209Fd76AfE204dBda4007C227904f0a81'
// 声明合约实例
const contract = new ethers.Contract(addressWETH, abiWETH, provider)


// 得到当前block
const block = await provider.getBlockNumber()
// const block = 9459509;
console.log(`当前区块高度: ${block}`);
console.log(`打印事件详情:`);
const transferEvents = await contract.queryFilter('Transfer', block - 10, block)
// 打印第1个Transfer事件

if (transferEvents.length > 0){
    console.log(transferEvents[0])


    // 解析Transfer事件的数据（变量在args中）
    console.log("\n2. 解析事件：")
    const amount = ethers.formatUnits(ethers.getBigInt(transferEvents[0].args["amount"]), "ether");
    console.log(`地址 ${transferEvents[0].args["from"]} 转账${amount} WETH 到地址 ${transferEvents[0].args["to"]}`)

} else {
    console.log(`在最近的 10 个区块中没有找到 Transfer 事件。`);
}


// 当前区块高度: 9481003
// 打印事件详情:
// EventLog {
//   provider: JsonRpcProvider {},
//   transactionHash: '0x8541a7a73ba7c4a49544328d64d40b95872a2a101c5950d3e392bff0bb0098f5',
//   blockHash: '0xb5efd8fb6e30796028858d80fc1946f5c0dcbe607b33fecb051c37cf07a3295e',
//   blockNumber: 9472318,
//   removed: false,
//   address: '0xdd13E55209Fd76AfE204dBda4007C227904f0a81',
//   data: '0x00000000000000000000000000000000000000000000000000038720d4431000',
//   topics: [
//     '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef',
//     '0x000000000000000000000000b8552a57ca4fa5fe2f14f32199dba62ea8276c08',
//     '0x0000000000000000000000003585cbbaaeabedfdf5ce89b73e7f6e22a571a483'
//   ],
//   index: 84,
//   transactionIndex: 62,
//   interface: Interface {
//     fragments: [ [EventFragment] ],
//     deploy: ConstructorFragment {
//       type: 'constructor',
//       inputs: [],
//       payable: false,
//       gas: null
//     },
//     fallback: null,
//     receive: false
//   },
//   fragment: EventFragment {
//     type: 'event',
//     inputs: [ [ParamType], [ParamType], [ParamType] ],
//     name: 'Transfer',
//     anonymous: false
//   },
//   args: Result(3) [
//     '0xB8552A57ca4fA5fE2f14f32199dBA62EA8276c08',
//     '0x3585CBBAaeaBedfdF5ce89b73E7F6e22A571A483',
//     993000000000000n
//   ]
// }

// 2. 解析事件：
// 地址 0xB8552A57ca4fA5fE2f14f32199dBA62EA8276c08 转账0.000993 WETH 到地址 0x3585CBBAaeaBedfdF5ce89b73E7F6e22A571A483