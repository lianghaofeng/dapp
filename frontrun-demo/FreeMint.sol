// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract FreeMint is ERC721 {
    uint256 public totalSupply;

    constructor() ERC721("Free Mint NFT", "FreeMint") {}

    function mint() external {
        totalSupply++;
        _mint(msg.sender, totalSupply); // 把 tokenId (1, 2, 3...) 发给调用者
    }
}