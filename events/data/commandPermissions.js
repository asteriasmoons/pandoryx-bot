// data/commandPermissions.js

const commandGroups = {
  single: ['help', 'clear', 'report', 'messagetags'],
  embeds: ['embed.create', 'embed.edit', 'embed.delete', 'embed.send', 'embed.view', 'embed.list'],
  notes: ['note.add', 'note.view', 'note.remove'],
  warns: ['warn.add', 'warn.view', 'warn.remove'],
  bans: ['ban.add', 'ban.remove', 'ban.list', 'ban.view'],
  kicks: ['kick.add', 'kick.list', 'kick.view', 'kick.remove'],
  autorole: ['autorole.add', 'autorole.view', 'autorole.remove'],
  timeouts: ['timeout.add', 'timeout.remove', 'timeout.list', 'timeout.view'],
  reactionrole: ['reactionrole.create', 'reactionrole.add', 'reactionrole.remove', 'reactionrole.delete', 'reactionrole.list'],
  tickets: ['ticketpanel.create', 'ticketpanel.edit', 'ticketpanel.delete', 'ticketpanel.list', 'ticketpanel.post', 'ticketpanel.setrole', 'ticketpanel.settranscriptchannel'],
  logs: ['log.config', 'log.view'],
  roles: ['rolepanel.create', 'rolepanel.addrole', 'rolepanel.publish', 'rolepanel.editembed', 'rolepanel.list', 'rolepanel.delete'],
  stickymessages: ['sticky.embed.create', 'sticky.embed.edit', 'sticky.embed.send', 'sticky.embed.delete', 'sticky.embed.remove'],
  levels: ['level.profile', 'level.role-add', 'level.role-remove', 'level.role-list', 'level.reset', 'level.set-announcement'],
  levelconfigs: ['levelconfig.set-thresholds', 'levelconfig.view-thresholds', 'levelconfig.reset-thresholds'],
  reminders: ['reminder.create', 'reminder.list', 'reminder.edit', 'reminder.delete', 'reminder.timezone'],
  github: ['github.watch', 'github.unwatch', 'github.list'],
  leavemessages: ['setleave.set', 'setleave.test'],
  welcomemessages: ['setwelcome.set', 'setwelcome.test'],
  confessions: ['confessions.setup', 'confessions.send'],
  verification: ['verify.panel', 'verify.panel_edit']
};

const groupLabels = {
  single: 'Singles',
  embeds: 'Embeds',
  notes: 'User Notes',
  warns: 'Warnings',
  bans: 'Banning',
  kicks: 'Kicking',
  autorole: 'Autoroles',
  timeouts: 'Timeouts',
  reactionrole: 'Reaction Roles',
  tickets: 'Ticket System',
  logs: 'Mod Logs',
  roles: 'Role Panels',
  stickymessages: 'Sticky Messaging',
  levels: 'Leveling',
  levelconfigs: 'Level Configuration',
  reminders: 'Reminders System',
  github: 'Github Feeds',
  leavemessages: 'Leave Messages',
  welcomemessages: 'Welcome Messages',
  confessions: 'Confessions',
  verification: 'Verification'
};

module.exports = { commandGroups, groupLabels };