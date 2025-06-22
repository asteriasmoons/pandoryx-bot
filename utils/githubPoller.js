const axios = require('axios');
const GitHubFeed = require('../models/GitHubFeed');

async function checkGitHubFeeds(client) {
  const feeds = await GitHubFeed.find();

  for (const feed of feeds) {
    try {
      const [owner, repo] = feed.repoUrl.split('/').slice(-2);
      const apiUrl = `https://api.github.com/repos/${owner}/${repo}/commits/${feed.branch}`;

      const res = await axios.get(apiUrl, {
        headers: { 'User-Agent': 'Pandoryx-Bot' }
      });

      const latestSha = res.data.sha;
      if (latestSha !== feed.lastCommitSha) {
        const channel = await client.channels.fetch(feed.channelId);
        if (!channel) continue;

        await channel.send({
          content: `📦 New commit in **[${owner}/${repo}](${feed.repoUrl})**:\n[${res.data.commit.message}](${res.data.html_url}) by **${res.data.commit.author.name}**`
        });

        feed.lastCommitSha = latestSha;
        await feed.save();
      }
    } catch (err) {
      console.error(`❌ Error checking ${feed.repoUrl}:`, err.response?.data?.message || err.message);
    }
  }
}

module.exports = { checkGitHubFeeds };