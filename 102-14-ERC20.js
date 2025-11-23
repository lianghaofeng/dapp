import { ethers } from "ethers";

// 利用Infura的rpc节点连接以太坊网络
// 准备Infura API Key, 教程：https://github.com/AmazingAng/WTFSolidity/blob/main/Topics/Tools/TOOL02_Infura/readme.md
const INFURA_ID = '6dbcaabcb9954b1db39639f962315c9f'
// 连接以太坊主网
const provider = new ethers.JsonRpcProvider(`https://mainnet.infura.io/v3/${INFURA_ID}`)

async function erc20Checker(addr){
    // 获取合约bytecode
    let code = await provider.getCode(addr)
    // 非合约地址的bytecode是0x
    if(code != "0x"){
        // 检查bytecode中是否包含transfer函数和totalSupply函数的selector
        if(code.includes("a9059cbb") && code.includes("18160ddd")){
            // 如果有，则是ERC20
            return true
        }else{
            // 如果没有，则不是ERC20
            return false
        }
    }else{
        return null;
    }
}

// DAI address (mainnet)
const daiAddr = "0x6b175474e89094c44da98b954eedeac495271d0f"
// BAYC address (mainnet)
const baycAddr = "0xbc4ca0eda7647a8ab7c2061c2e118a18a936f13d"

const main = async () => {
    // 检查DAI合约是否为ERC20
    let isDaiERC20 = await erc20Checker(daiAddr)
    console.log(`1. Is DAI a ERC20 contract: ${isDaiERC20}`)

    // 检查BAYC合约是否为ERC20
    let isBaycERC20 = await erc20Checker(baycAddr)
    console.log(`2. Is BAYC a ERC20 contract: ${isBaycERC20}`)
}

main()

