import { ethers } from "ethers";
import { sendAlert } from "./bot_config.js";

const RPC_URL = "http://127.0.0.1:8545";
const provider = new ethers.JsonRpcProvider(RPC_URL);
const USDTContractAddress = "0xdac17f958d2ee523a2206206994597c13d831ec7";
const abi = [
    {
        constant: true,
        inputs: [{ name: "_owner", type:"address" }],
        name: "balanceOf",
        outputs: [{ name:"balance", type:"uint256" }],
        type: "function",
    },
    {
    anonymous: false,
    inputs: [
      { indexed: true, name: "from", type: "address" },
      { indexed: true, name: "to", type: "address" },
      { indexed: false, name: "value", type: "uint256" },
    ],
    name: "Transfer",
    type: "event",
  },
] as const;

export const checkBalance = (accountAddress: string): void => {
    const daiContract = new ethers.Contract(USDTContractAddress, abi, provider);
    
    daiContract.getFunction("balanceOf")(accountAddress)
    .then(async (balance) => {

        const formattedBalance = ethers.formatUnits(balance, 6);
       // console.log(`USDT balance: ${formattedBalance}`);

        const msg = `Your actual balance is: ${formattedBalance} USDT`
        await sendAlert(msg);
    })
    .catch((error) => {
        console.error("Error fetching balance: ", error);
    })
}


export const listenToTokenDeposits = (accountAddress: string): void => {
    if (!accountAddress) {
        console.log("⚠️ Cannot start listener: Wallet address is undefined.");
        return;
    }

    console.log("starting listening");
    const daiContract = new ethers.Contract(USDTContractAddress, abi, provider);

    const depositFilter = daiContract.filters["Transfer"]!(null, accountAddress);

    console.log(`Monitoring ${accountAddress} deposits`);

    daiContract.on(depositFilter, async (...args) => {
        try {
            const { args: eventArgs } = args[args.length - 1];
            const [from, , value] = eventArgs;

            const amount = ethers.formatUnits(value, 6);
            const msg = `💰 *New Deposit!*\n\n*Amount:* ${amount} USDT\n*From:* \`${from}\``;
            
            await sendAlert(msg).catch(err => console.error("Telegram failed:", err));
            
            console.log(`💰 Deposit Detected!`);
            console.log(`From: ${from} | Amount: ${amount} USDT`);
        } catch(err) {
            console.error("Error processing event:", err);
        }
    });
};


export const listenToTokenWithdrawals = (accountAddress: string): void => {
    const daiContract = new ethers.Contract(USDTContractAddress, abi, provider);

    const withdrawFilter = daiContract.filters["Transfer"]!(accountAddress, null);

    daiContract.on(withdrawFilter, async (...args) => {
        try {
            // const { args: eventArgs } = args[args.length - 1];
            const eventPayload = args[args.length - 1];
            const [, to, value] = eventPayload.args;
            const txHash = eventPayload.log.transactionHash;

            const amount = ethers.formatUnits(value, 6);
            const msg = `💸 *New Withdraw!*\n\n*Amount:* ${amount} USDT\n*To:* \`${to}\`\n*Tx:* [See on Explorer](https://etherscan.io/tx/${txHash})`;
            
            await sendAlert(msg).catch(err => console.error("Telegram failed:", err));
            
            console.log(`💸 Withdraw Detected!`);
            console.log(`To: ${to} | Amount: ${amount} USDT`);
        } catch(err) {
            console.error("Error processing event:", err);
        }
    });
};
