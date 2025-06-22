const axios = require('axios');
const { EmbedBuilder } = require('discord.js');
const GitHubFeed = require('../models/GitHubFeed');

async function checkGitHubFeeds(client) {
  const feeds = await GitHubFeed.find();

  for (const feed of feeds) {
    try {
      const [owner, repo] = feed.repoUrl.split('/').slice(-2);
      const channel = await client.channels.fetch(feed.channelId);
      if (!channel) continue;

      // === COMMITS ===
      const commitsRes = await axios.get(
        `https://api.github.com/repos/${owner}/${repo}/commits?sha=${feed.branch}`,
        { headers: { 'User-Agent': 'Pandoryx-Bot' } }
      );

      const commits = commitsRes.data;
      if (Array.isArray(commits) && commits.length > 0) {
        const newCommits = [];
        for (const commit of commits) {
          if (commit.sha === feed.lastCommitSha) break;
          newCommits.push(commit);
        }

        newCommits.reverse(); // post oldest first

        for (const commitData of newCommits) {
          const commit = commitData.commit;
          const shortSha = commitData.sha.slice(0, 7);
          const authorName = commit.author?.name || 'Unknown';
          const avatar = commitData.author?.avatar_url;

          const embed = new EmbedBuilder()
            .setColor(0x24292e)
            .setTitle(`New Commit: ${shortSha}`)
            .setURL(commitData.html_url)
            .setDescription(commit.message || '*No commit message*')
            .addFields(
              { name: 'Author', value: authorName, inline: true },
              { name: 'Branch', value: feed.branch, inline: true },
              { name: 'Repo', value: `[${repo}](${feed.repoUrl})`, inline: true }
            )
            .setTimestamp(new Date(commit.author.date))
            .setFooter({ text: `${owner}/${repo} • Commit` });

          if (avatar) embed.setThumbnail(avatar);
          await channel.send({ embeds: [embed] });
        }

        feed.lastCommitSha = commits[0].sha;
      }

      // === ISSUES ===
      const issuesRes = await axios.get(
        `https://api.github.com/repos/${owner}/${repo}/issues?state=open&sort=created&direction=desc`,
        { headers: { 'User-Agent': 'Pandoryx-Bot' } }
      );

      const issues = issuesRes.data;
      for (const issue of issues) {
        if (issue.pull_request) continue; // ignore PRs
        if (feed.lastIssueId && issue.id <= feed.lastIssueId) break;

        const embed = new EmbedBuilder()
          .setColor(0x2da44e)
          .setTitle(`New Issue: #${issue.number} - ${issue.title}`)
          .setURL(issue.html_url)
          .setDescription(issue.body?.slice(0, 300) || '*No description*')
          .addFields(
            { name: 'Author', value: issue.user?.login || 'Unknown', inline: true },
            { name: 'Repo', value: `[${repo}](${feed.repoUrl})`, inline: true }
          )
          .setTimestamp(new Date(issue.created_at))
          .setFooter({ text: `${owner}/${repo} • Issue` });

        if (issue.user?.avatar_url) embed.setThumbnail(issue.user.avatar_url);

        await channel.send({ embeds: [embed] });

        if (!feed.lastIssueId || issue.id > feed.lastIssueId) {
          feed.lastIssueId = issue.id;
        }
      }

      // === RELEASES ===
      const releasesRes = await axios.get(
        `https://api.github.com/repos/${owner}/${repo}/releases`,
        { headers: { 'User-Agent': 'Pandoryx-Bot' } }
      );

      const releases = releasesRes.data;
      for (const release of releases) {
        if (feed.lastReleaseId && release.id <= feed.lastReleaseId) break;

        const embed = new EmbedBuilder()
          .setColor(0x6e40c9)
          .setTitle(`New Release: ${release.name || release.tag_name}`)
          .setURL(release.html_url)
          .setDescription(release.body?.slice(0, 500) || '*No description*')
          .addFields(
            { name: 'Repo', value: `[${repo}](${feed.repoUrl})`, inline: true },
            { name: 'Tag', value: release.tag_name, inline: true }
          )
          .setTimestamp(new Date(release.published_at))
          .setFooter({ text: `${owner}/${repo} • Release` });

        await channel.send({ embeds: [embed] });

        if (!feed.lastReleaseId || release.id > feed.lastReleaseId) {
          feed.lastReleaseId = release.id;
        }
      }

      await feed.save();
    } catch (err) {
      console.error(`Error checking ${feed.repoUrl}:`, err.response?.data?.message || err.message);
    }
  }
}

module.exports = { checkGitHubFeeds };