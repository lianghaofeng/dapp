# 🔧 Fixing "Internal JSON-RPC Error" When Creating Votes

## ❌ The Error You Saw

```
Error: Internal JSON-RPC error
{
  "code": -32000,
  "message": "execution reverted"
}
```

This error appears when trying to create a vote from the frontend.

## 🎯 Root Cause

The error occurs because **CONTRACT_ADDRESS is not configured** in `frontend/voting.js`.

Look at line 1 in `voting.js`:
```javascript
const CONTRACT_ADDRESS = "YOUR_CONTRACT_ADDRESS_HERE";
```

When you click "CREATE VOTE", the frontend tries to send a transaction to this fake address, which:
1. Is not a deployed contract
2. Cannot execute the `createVote()` function
3. Causes the transaction to revert with "Internal JSON-RPC error"

## ✅ Solution: Use the Automated Startup Script

The easiest fix is to use the **one-command startup script** that auto-configures everything:

```bash
cd /home/user/dapp/minority-game
./start-local.sh
```

This script will:
1. ✅ Compile the contract
2. ✅ Start a local Hardhat node
3. ✅ Deploy the contract
4. ✅ **Automatically update `CONTRACT_ADDRESS` in voting.js**
5. ✅ Start an HTTP server
6. ✅ Open the frontend in your browser

**Then just open:** http://localhost:8000/voting.html

## 🔧 Manual Fix (If You Prefer)

If you want to manually configure instead of using the script:

### Step 1: Compile the Contract
```bash
cd minority-game
npx hardhat compile
```

### Step 2: Start Local Node (Terminal 1)
```bash
npx hardhat node
```
Keep this running! Don't close it.

### Step 3: Deploy Contract (Terminal 2)
```bash
npx hardhat run scripts/deploy.js --network localhost
```

You'll see output like:
```
✅ VotingGame 部署成功!
📄 合约地址: 0x5FbDB2315678afecb367f032d93F642f64180aa3
```

**Copy this address!** ⬆️

### Step 4: Update Frontend

Edit `frontend/voting.js` line 1:
```javascript
// Before
const CONTRACT_ADDRESS = "YOUR_CONTRACT_ADDRESS_HERE";

// After
const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
```

### Step 5: Start HTTP Server (Terminal 3)
```bash
cd frontend
python3 -m http.server 8000
```

### Step 6: Open Browser
```
http://localhost:8000/voting.html
```

## 🎯 How to Tell if It's Working

### ✅ Success Signs:
1. MetaMask connects without errors
2. "CREATE VOTE" button responds
3. You see transaction confirmation in MetaMask
4. Vote appears in the active votes list

### ❌ Still Broken? Check:

1. **Is CONTRACT_ADDRESS correct?**
   ```javascript
   console.log(CONTRACT_ADDRESS);  // Should NOT be "YOUR_CONTRACT_ADDRESS_HERE"
   ```

2. **Is the Hardhat node running?**
   - You should see output in Terminal 1 every time you interact
   - If node stopped, restart with `npx hardhat node`

3. **Is MetaMask connected to localhost?**
   - Network: Localhost 8545
   - Chain ID: 31337
   - RPC: http://127.0.0.1:8545

4. **Do you have test ETH?**
   - Hardhat gives you 10,000 ETH by default
   - Check balance in MetaMask

## 🌐 For BSC Testnet Deployment

If you want to deploy to BSC testnet instead of localhost:

### Step 1: Update hardhat.config.cjs
```javascript
networks: {
    bscTestnet: {
        url: "https://data-seed-prebsc-1-s1.binance.org:8545",
        chainId: 97,
        accounts: [process.env.PRIVATE_KEY]
    }
}
```

### Step 2: Set Private Key
```bash
# Create .env file
echo "PRIVATE_KEY=your-private-key-here" > .env
```

### Step 3: Deploy to BSC Testnet
```bash
npx hardhat run scripts/deploy.js --network bscTestnet
```

### Step 4: Update Frontend
```javascript
const CONTRACT_ADDRESS = "0xYourDeployedAddressOnBSC";
```

### Step 5: Switch MetaMask
- Network: BSC Testnet
- RPC: https://data-seed-prebsc-1-s1.binance.org:8545
- Chain ID: 97

## 📊 Comparison: Local vs Testnet

| Feature | Local Hardhat | BSC Testnet |
|---------|--------------|-------------|
| Setup Speed | ⚡ Instant | 🐌 Slower |
| Transaction Speed | ⚡ Instant | ⏱️ ~3 seconds |
| Cost | 🆓 Free (fake ETH) | 🆓 Free (test BNB) |
| Public Access | ❌ Only you | ✅ Anyone |
| Persistence | ❌ Resets on restart | ✅ Stays deployed |
| Best For | Development/Testing | Demo/Sharing |

## 🚨 Common Mistakes

### Mistake 1: Wrong Directory
```bash
# ❌ Wrong
cd /dapp
npx hardhat compile  # Error: No config file

# ✅ Correct
cd /dapp/minority-game
npx hardhat compile  # Works!
```

### Mistake 2: Node Not Running
```bash
# Frontend shows: "Internal JSON-RPC error"
# Solution: Start node in another terminal
npx hardhat node
```

### Mistake 3: Wrong Network in MetaMask
```
MetaMask on: BSC Testnet
Contract on: Localhost

Result: Transaction fails!

Solution: Match MetaMask network to contract deployment
```

### Mistake 4: Forgot to Redeploy After Changes
```
1. You edit VotingGame.sol
2. You refresh frontend
3. Error: "Wrong number of arguments"

Solution: Redeploy!
npx hardhat run scripts/deploy.js --network localhost
```

## 🎓 Understanding the Error

**"Internal JSON-RPC error"** is a generic error that means:
- The transaction was sent to the blockchain
- The blockchain tried to execute it
- Something went wrong during execution
- The transaction was reverted

Common causes:
1. ❌ Wrong contract address
2. ❌ Contract not deployed
3. ❌ Wrong function signature
4. ❌ Require() statement failed
5. ❌ Out of gas

In your case, it was #1 (wrong contract address).

## ✅ Quick Checklist

Before creating a vote, verify:

- [ ] Contract compiled successfully
- [ ] Hardhat node is running (or connected to testnet)
- [ ] Contract deployed successfully
- [ ] CONTRACT_ADDRESS updated in voting.js
- [ ] HTTP server is running
- [ ] MetaMask connected to correct network
- [ ] MetaMask account has test ETH/BNB

If all checked ✅, creating votes should work!

## 🎉 Success!

Once configured correctly, you should see:

1. Click "CREATE VOTE"
2. MetaMask popup appears
3. Confirm transaction
4. "✅ 投票创建成功!" message
5. Vote appears in active list

**Happy voting!** 🗳️

---

## 📞 Need Help?

If you're still getting errors after following this guide:

1. Check the Hardhat node output for error messages
2. Check browser console (F12) for JavaScript errors
3. Check MetaMask for network/account issues
4. Try the automated script first: `./start-local.sh`

**Pro tip:** The automated script is by far the easiest way! It handles all configuration automatically. 🚀
