import { ethers } from "ethers";
// 利用Infura的rpc节点连接以太坊网络
// 准备Infura API Key, 教程：https://github.com/AmazingAng/WTFSolidity/blob/main/Topics/Tools/TOOL02_Infura/readme.md
const INFURA_ID = '6dbcaabcb9954b1db39639f962315c9f'
// 连接以太坊主网
const provider = new ethers.JsonRpcProvider(`https://mainnet.infura.io/v3/${INFURA_ID}`)


// abi
const abiERC721 = [
    "function name() view returns (string)",
    "function symbol() view returns (string)",
    "function supportsInterface(bytes)public view returns (bool)"
]

const addressBAYC = "0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d"

const contractERC721 = new ethers.Contract(addressBAYC, abiERC721, provider)

const nameERC721 = await contractERC721.name()
const symbolERC721 = await contractERC721.symbol()
console.log("\n1. 读取ERC721合约信息")
console.log(`合约地址: ${addressBAYC}`)
console.log(`名称: ${nameERC721}`)
console.log(`代号: ${symbolERC721}`)

const selectERC721 = "0x80ac58cd"
const isERC721 = await contractERC721.supportsInterface(selectorERC721)
console.log("\n2. 利用ERC165的supportsInterface, 确定合约是否为ERC721标准")
console.log(`合约是否为ERC721标准: ${isERC721}`)

