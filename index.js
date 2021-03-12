require("dotenv").config();
const fetch = require("node-fetch");

const Binance = require("node-binance-api");
const binance = new Binance();

const Discord = require("discord.js");

const stockBots = [
  {
    token: process.env.OMX_BOT_TOKEN,
    ticker: process.env.OMX_BOT_TICKER,
    order: 1
  },
  {
    token: process.env.SPY_BOT_TOKEN,
    ticker: process.env.SPY_BOT_TICKER,
    order: 2
  },
  {
    token: process.env.GME_BOT_TOKEN,
    ticker: process.env.GME_BOT_TICKER,
    order: 1
  },
  {
    token: process.env.AMC_BOT_TOKEN,
    ticker: process.env.AMC_BOT_TICKER,
    order: 2
  },
];

const cryptoBots = [
  {
    token: process.env.BTC_BOT_TOKEN,
    ticker: process.env.BTC_BOT_TICKER,
    currency: "USD",
    order: 1
  },
  {
    token: process.env.ETH_BOT_TOKEN,
    ticker: process.env.ETH_BOT_TICKER,
    currency: "USD",
    order: 2
  },
];

function relDiff(a, b) {
  return 100 * Math.abs((a - b) / ((a + b) / 2));
}

const setName = async (guild, index, currentPrice, currency) => {
  guild.me.setNickname(`${index}) ${currentPrice} ${currency}`);
};

const setSubtitle = async (diff, percentage, client) => {
  const arrow = diff > 0 ? "↗" : "↘";
  const plusMinus = diff > 0 ? "+" : "-";

  const activityName = `${plusMinus}${Math.abs(
    diff
  )} (${plusMinus}${percentage}%) ${arrow} | Bot created by @Shebsa#7397`;
  console.log(activityName);

  const activity = {
    activity: {
      type: "WATCHING",
      name: activityName,
    },
    status: "online",
  };
  client.user.setPresence(activity);
};

const setNameColor = async (guild, diff) => {
  const positiveRole = await guild.roles.fetch(process.env.POSITIVE_ROLE_ID);
  const negativeRole = await guild.roles.fetch(process.env.NEGATIVE_ROLE_ID);

  const roleManager = await guild.me.roles;

  try {
    if (diff > 0) {
      roleManager.remove(negativeRole);
      roleManager.add(positiveRole);
    } else {
      roleManager.add(negativeRole);
      roleManager.remove(positiveRole);
    }
  } catch (e) {
    console.log(e);
  }
};

const fetchTickerData = async (client, bot, index) => {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${bot.ticker}?region=US&lang=en-US&includePrePost=false&interval=2m&useYfid=true&range=1d&corsDomain=finance.yahoo.com&.tsrc=finance`;

  const response = await fetch(url);
  const json = await response.json();

  const percentage = relDiff(
    json.chart.result[0].meta.regularMarketPrice,
    json.chart.result[0].meta.previousClose
  ).toFixed(2);

  const diff = (
    json.chart.result[0].meta.regularMarketPrice -
    json.chart.result[0].meta.previousClose
  ).toFixed(2);

  const guild = await client.guilds.fetch(process.env.GUILD_ID);

  setName(
    guild,
    bot.order,
    json.chart.result[0].meta.regularMarketPrice,
    json.chart.result[0].meta.currency
  );

  setSubtitle(diff, percentage, client);

  setNameColor(guild, diff);
};

const fetchCryptoTicker = async (client, bot, index) => {
  binance.websockets.prevDay(bot.ticker, async (_, response) => {
    const guild = await client.guilds.fetch(process.env.GUILD_ID);

    setName(
      guild,
      bot.order,
      parseFloat(response.averagePrice).toFixed(2),
      bot.currency
    );

    setSubtitle(
      parseFloat(response.priceChange).toFixed(2),
      parseFloat(response.percentChange).toFixed(2),
      client
    );

    setNameColor(guild, parseFloat(response.priceChange));
  });
};

stockBots.forEach((bot, index) => {
  const client = new Discord.Client();
  client.login(bot.token);

  client.on("ready", () => {
    console.log(`Logged in as ${client.user.tag}`);
    fetchTickerData(client, bot, index);
    setInterval(function () {
      fetchTickerData(client, bot, index);
    }, 5000);
  });
});

cryptoBots.forEach((bot, index) => {
  const client = new Discord.Client();
  client.login(bot.token);

  client.on("ready", () => {
    console.log(`Logged in as ${client.user.tag}`);
    fetchCryptoTicker(client, bot, index);
  });
});
