import { Telegraf } from 'telegraf';
import { message } from 'telegraf/filters';
import 'dotenv/config';
import { checkBalance, listenToTokenDeposits } from './wallet_listenner.js';


const bot = new Telegraf(process.env.BOT_TOKEN as string);

let isWaitingWallet = true;
let chatId: number;
let walletAddress: string;


bot.command('request', async (ctx) => {
  isWaitingWallet = true;
  await ctx.reply('Please send me the wallet address you want to watch:');
});

bot.on(message('text'), async (ctx) => {
    if(isWaitingWallet) {
        walletAddress = ctx.message.text;
        chatId = ctx.chat.id;

        console.log(`Received data from ${chatId}: ${walletAddress}`);

        isWaitingWallet = false;

        
        await ctx.reply(`✅ Data received! I have saved the wallet address: ${walletAddress}`);
        checkBalance(walletAddress);

        listenToTokenDeposits(walletAddress);

    } else {
        await ctx.reply('Use /request to send new wallet address');
    }
});

export async function sendAlert(message: string) {
    await bot.telegram.sendMessage(chatId, message, {
        parse_mode: 'Markdown',
    })
}

const start = async() => {
    bot.launch();
    console.log("🤖 Bot is live and listening...");
}

start().catch(console.error);
