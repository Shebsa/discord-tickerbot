require("dotenv").config();
const fetch = require("node-fetch");

const Discord = require("discord.js");

const bots = [
  {
    token: process.env.GME_BOT_TOKEN,
    ticker: process.env.GME_BOT_TICKER,
  },
  {
    token: process.env.AMC_BOT_TOKEN,
    ticker: process.env.AMC_BOT_TICKER,
  },
];

function relDiff(a, b) {
  return 100 * ((a - b) / ((a + b) / 2));
}

const fetchTickerData = async (client, ticker, index) => {
  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${ticker}?region=US&lang=en-US&includePrePost=false&interval=2m&useYfid=true&range=1d&corsDomain=finance.yahoo.com&.tsrc=finance`;

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

  const arrow = diff > 0 ? "↗" : "↘";
  const plusMinus = diff > 0 ? "+" : "-";

  const activityName = `${plusMinus}${Math.abs(diff)} (${plusMinus}${Math.abs(
    percentage
  )}%) ${arrow}`;
  console.log(activityName);

  const activity = {
    activity: {
      type: "WATCHING",
      name: activityName,
    },
    status: "online",
  };
  client.user.setPresence(activity);

  const guild = await client.guilds.fetch(process.env.GUILD_ID);
  guild.me.setNickname(
    `${index + 1}) ${json.chart.result[0].meta.regularMarketPrice}`
  );

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

bots.forEach((bot, index) => {
  const client = new Discord.Client();
  client.login(bot.token);

  client.on("ready", () => {
    console.log(`Logged in as ${client.user.tag}`);
    fetchTickerData(client, bot.ticker, index);
    setInterval(function () {
      fetchTickerData(client, bot.ticker, index);
    }, 5000);
  });
});
