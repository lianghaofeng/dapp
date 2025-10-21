// import {ethers} from "https://cdn-cors.ethers.io/lib/ethers-5.6.9.umd.min.js";
import {ethers} from "ethers";
// const provider = new ethers.getDefaultProvider();

const infuraUrl = "https://mainnet.infura.io/v3/6dbcaabcb9954b1db39639f962315c9f";
const provider = new ethers.JsonRpcProvider(infuraUrl);

const main = async () => {
    try {
        console.log("Querying Vitalik eth balance... ");

        const balance = await provider.getBalance('vitalik.eth');
        console.log(`\nETH Balance of vitalik: \n ${ethers.formatEther(balance)} ETH`);
    } catch (error) {
        console.error("Failed to query: ", error);
    }
    
}
main();


// import { ethers } from "ethers";
// const provider = ethers.getDefaultProvider();
// const main = async () => {
//     const balance = await provider.getBalance(`vitalik.eth`);
//     console.log(`ETH Balance of vitalik: ${ethers.formatEther(balance)} ETH`);
// }
// main()