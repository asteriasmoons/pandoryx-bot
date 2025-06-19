const LogConfig = require('../models/LogConfig');

async function getLogChannel(guildId, eventType) {
  const config = await LogConfig.findOne({ guildId });
  return config?.logs?.[eventType] || null;
}

module.exports = { getLogChannel };