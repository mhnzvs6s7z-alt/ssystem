const {
  Client, GatewayIntentBits, Partials,
  ActionRowBuilder, ButtonBuilder, ButtonStyle,
  StringSelectMenuBuilder, ChannelType,
  PermissionsBitField, MessageFlags,
  ContainerBuilder, TextDisplayBuilder, SeparatorBuilder,
} = require("discord.js");

const fs = require("fs");
const config = require("./config.js");
require("dotenv").config(); 

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildVoiceStates,
    GatewayIntentBits.MessageContent,
  ],
  partials: [Partials.Channel, Partials.Message],
});

function loadData() {
  let data;
  try { data = JSON.parse(fs.readFileSync("./data.json", "utf8")); }
  catch { data = {}; }
  if (!data.autoLine) data.autoLine = { image: null, channels: [] };
  if (!data.security) data.security = { blockLinks: false, blockBadWords: false, blockImages: false, blockSpam: false };
  if (!data.autoResponses) data.autoResponses = [];
  if (!data.ticketCount) data.ticketCount = 0;
  if (!data.statusChannels) data.statusChannels = {};
  if (!data.bank) data.bank = {};
  if (!data.system) data.system = {};
  if (!data.system.bandAlias) data.system.bandAlias = "باند";
  if (!data.system.kickAlias) data.system.kickAlias = "كيك";
  if (!data.system.timeAlias) data.system.timeAlias = "تايم";
  if (!data.system.ontimeAlias) data.system.ontimeAlias = "أونتايم";
  if (!data.system.onbandAlias) data.system.onbandAlias = "أونباند";
  if (!data.system.extraRoles) data.system.extraRoles = [];
  if (!data.system.commandLogs) data.system.commandLogs = [];
  return data;
}
function isOwner(member) {
  return member.roles.cache.has("1526583380508938300");
}

function isAllowed(member, data) {
  if (isOwner(member)) return true;
  return (data.system?.extraRoles || []).some(r =>
    member.roles.cache.has(r)
  );
}

const spamMap = new Map();
const awaitingMap = new Map();
const e = config.emojis;

function buildDashboardContainer() {
  const c = new ContainerBuilder();
  c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${e.dashboard} Dashboard`));
  c.addSeparatorComponents(new SeparatorBuilder().setDivider(true));
  c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
    `مـنـور يـالأونـر ${e.orangeStars}\n\n` +
    `هـاذا الامـبـد خـاص بـكـنـتـرول بـوت بـإصـدار v2 ${e.cloud}\n\n` +
    `( هـنـا الأوامـر كـامـلـه خـاصـه بـالـبـوت help )\n\n` +
    `اسـتـخـدم دروب داون لـتـجـهـيـز بـوت ${e.anim003}`
  ));
  c.addSeparatorComponents(new SeparatorBuilder().setDivider(true));
  c.addActionRowComponents(new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder().setCustomId("dashboard_select").setPlaceholder("اختر خيار...")
      .addOptions([
        { label: "Setup New Ticket", description: "إعداد نظام التذاكر", value: "setup_ticket", emoji: { id: "1487436129778270249", animated: true } },
        { label: "Setup Auto Line", description: "إعداد الخط التلقائي", value: "setup_autoline", emoji: { id: "1487436129778270249", animated: true } },
        { label: "Setup Security", description: "إعداد الحماية", value: "setup_security", emoji: { id: "1487436129778270249", animated: true } },
        { label: "Setup Auto Response", description: "إعداد الرد التلقائي", value: "setup_autoresponse", emoji: { id: "1487436129778270249", animated: true } },
        { label: "Setup System", description: "إعداد نظام الأوامر", value: "setup_system", emoji: { id: "1487436371751731270", animated: true } },
      ])
  ));
  return c;
}

function buildSecurityContainer() {
  const data = loadData(); const sec = data.security;
  const c = new ContainerBuilder();
  c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# تـسـطـيـب الـحـمـايـة ${e.dashboard}`));
  c.addSeparatorComponents(new SeparatorBuilder().setDivider(true));
  c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
    `مـنـور يـالأونـر ${e.dashboard}\n` +
    `هـاذا الامـبـد خـاص بـك تـرطـيب الـحـمـايـة خـاصـه بـالسـيـرفـر ${e.cloud}\n\n` +
    `${e.hashtag} الأزرار ووضـيـفـتـها :\n` +
    `حـظـر روابـط ${e.lock}\n` +
    `حـظـر شـتـائـم أَو كـلام وُصـخ ${e.lock}\n` +
    `حـظـر صـور ${e.lock}\n` +
    `حـظـر رسـائـل مـتـكـررة أَو سـبـام ${e.lock}`
  ));
  c.addSeparatorComponents(new SeparatorBuilder().setDivider(true));
  c.addActionRowComponents(new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder().setCustomId("security_select").setPlaceholder("اختر ما تريد تفعيله...")
      .setMinValues(0).setMaxValues(4)
      .addOptions([
        { label: "حـظـر روابـط", value: "block_links", default: sec.blockLinks, emoji: { id: "1288454558430793790" } },
        { label: "حـظـر شـتـائـم أَو كـلام وُصـخ", value: "block_badwords", default: sec.blockBadWords, emoji: { id: "1288454558430793790" } },
        { label: "حـظـر صـور", value: "block_images", default: sec.blockImages, emoji: { id: "1288454558430793790" } },
        { label: "حـظـر رسـائـل مـتـكـررة أَو سـبـام", value: "block_spam", default: sec.blockSpam, emoji: { id: "1288454558430793790" } },
      ])
  ));
  return c;
}

function buildTicketPanelContainer(title, description) {
  const c = new ContainerBuilder();
  c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# ${title}`));
  c.addSeparatorComponents(new SeparatorBuilder().setDivider(true));
  c.addTextDisplayComponents(new TextDisplayBuilder().setContent(description));
  return c;
}

function buildTicketWelcomeContainer(user, adminRoleId) {
  const c = new ContainerBuilder();
  c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`${user} | <@&${adminRoleId}>`));
  c.addSeparatorComponents(new SeparatorBuilder().setDivider(true));
  c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
    `مرحـبا في تكـت الدعـم الفنـي ${e.cloud}\n\n` +
    `الرجاء انتـظار طـاقم الادارة للرد عليـك وحـل جمـيع مشـاكلك <:64148givelove:1483571092030361802>\n\n` +
    `> ${e.hashtag} شيك هنا **__ <#1487437732958568458> __**\n` +
    `> ${e.hashtag} شيك هنا **__ <#1489385576829419661> __**`
  ));
  c.addSeparatorComponents(new SeparatorBuilder().setDivider(true));
  c.addActionRowComponents(new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder().setCustomId("ticket_tools").setPlaceholder("أدوات التذكرة")
      .addOptions([
        { label: "اسـتـلام تـذكـرة", value: "claim_ticket", emoji: { id: "1368889107597496370", animated: true } },
        { label: "إغـلاق تـذكـرة", value: "close_ticket", emoji: { id: "1368889107597496370", animated: true } },
        { label: "إضـافـة عـضـو", value: "add_member", emoji: { id: "1368889107597496370", animated: true } },
        { label: "اسـتـدعـاء صـاحـب تـذكـرة", value: "call_owner", emoji: { id: "1368889107597496370", animated: true } },
        { label: "تـغـيـر اسـم تـذكـرة", value: "rename_ticket", emoji: { id: "1368889107597496370", animated: true } },
      ])
  ));
  return c;
}

function buildSystemDashContainer(data) {
  const sys = data.system;
  const c = new ContainerBuilder();
  c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
    `# System control <a:graystars:1487436423975141406>`
  ));
  c.addSeparatorComponents(new SeparatorBuilder().setDivider(true));
  c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
    `مـنـور يـا لـاونـر <a:Shinystars:1526583380508938300>\n` +
    `هـذا كـنـتـرول سـيـسـتـم مـثـل مـا طـلـبـت <:3_Worry:1457209171228233773>`
  ));
  c.addSeparatorComponents(new SeparatorBuilder().setDivider(true));
  c.addActionRowComponents(new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder().setCustomId("system_dash_select").setPlaceholder("اختر خيار...")
      .addOptions([
        { label: "See commands", value: "see_commands", emoji: { id: "1487436129778270249", animated: true } },
        { label: "Make Update For Commands", value: "update_commands", emoji: { id: "1487436129778270249", animated: true } },
        { label: "See Last Logs for commands", value: "see_logs", emoji: { id: "1487436129778270249", animated: true } },
        { label: "Command Permissions", value: "cmd_permissions", emoji: { id: "1487436129778270249", animated: true } },
        { label: "Reset Menu", value: "reset_menu", emoji: { id: "1487436129778270249", animated: true } },
        { label: "New commands ( v1.1 )", value: "new_commands", emoji: { id: "1487436129778270249", animated: true } },
      ])
  ));
  return c;
}

function buildSeeCommandsContainer(data) {
  const sys = data.system;
  const c = new ContainerBuilder();
  c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# الأوامـر الـحـالـيـة <a:Shinystars:1487436371751731270>`));
  c.addSeparatorComponents(new SeparatorBuilder().setDivider(true));
  c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
    `<a:cloud:1487436129778270249> **بـانـد** — \`${sys.bandAlias}\`\n` +
    `<a:cloud:1487436129778270249> **كـيـك** — \`${sys.kickAlias}\`\n` +
    `<a:cloud:1487436129778270249> **تـايـم** — \`${sys.timeAlias}\`\n` +
    `<a:cloud:1487436129778270249> **أون تـايـم** — \`${sys.ontimeAlias}\`\n` +
    `<a:cloud:1487436129778270249> **أون بـانـد** — \`${sys.onbandAlias}\``
  ));
  return c;
}

function buildPermissionsContainer() {
  const c = new ContainerBuilder();
  c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# Permissions <a:cloud:1487436129778270249>`));
  c.addSeparatorComponents(new SeparatorBuilder().setDivider(true));
  c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
    `> هـذول رُتـب فـقـط الـي تـقـدر تـسـتـخـدم الأوامـر <a:Shinystars:1526583380508938300>\n` +
    `تـبـي تـضـيـف رُتـب اكـتـب\n` +
    `\`+Dashboard\`\n` +
    `> واخـتـار **Sᴇᴛᴜᴘ Sʏsᴛᴇᴍ** واتـبـع الخـطـوات <:Wtf:1487436357549690921>`
  ));
  return c;
}

function buildNewCommandsContainer() {
  const c = new ContainerBuilder();
  c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# New Commands v1.1 <a:Shinystars:1487436371751731270>`));
  c.addSeparatorComponents(new SeparatorBuilder().setDivider(true));
  c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
    `<a:cloud:1487436129778270249> **أوامـر رومـات نـصـيـة**\n` +
    `\`ق\` — قـفـل روم\n` +
    `\`ف\` — فـتـح روم\n\n` +
    `<a:cloud:1487436129778270249> **أوامـر رومـات صـوتـيـة**\n` +
    `\`سمع [إيدي روم]\` — تـفـعـيـل السـمـاع\n` +
    `\`لاسمع [إيدي روم]\` — إيـقـاف السـمـاع\n\n` +
    `<a:cloud:1487436129778270249> **أوامـر بـنـك**\n` +
    `\`رواتب\` — عـرض الـراتـب\n` +
    `\`رصيد\` — عـرض الـرصـيـد\n` +
    `\`تحويل [@عضو] [مبلغ]\` — تـحـويـل رصـيـد`
  ));
  c.addSeparatorComponents(new SeparatorBuilder().setDivider(true));
  c.addActionRowComponents(new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder().setCustomId("new_commands_select").setPlaceholder("إدارة السيرفر...")
      .addOptions([
        { label: "إخـفـاء جـمـيـع رومـات", value: "hide_all", emoji: { id: "1487436129778270249", animated: true } },
        { label: "قـفـل جـمـيـع رومـات", value: "lock_all", emoji: { id: "1288454558430793790" } },
        { label: "إظـهـار كـاتـغـوري مـع رومـات", value: "show_category", emoji: { id: "1487436129778270249", animated: true } },
        { label: "إخـفـاء كـاتـغـوري مـع رومـات", value: "hide_category", emoji: { id: "1288454558430793790" } },
        { label: "قـفـل كـاتـغـوري مـع رومـات", value: "lock_category", emoji: { id: "1288454558430793790" } },
        { label: "فـتـح كـاتـغـوري مـع رومـات", value: "unlock_category", emoji: { id: "1487436129778270249", animated: true } },
      ])
  ));
  return c;
}

client.once("ready", () => {
  console.log(`البوت شغال | ${client.user.tag}`);
  client.user.setActivity("v2 | +Dashboard", { type: 3 });
});

client.on("guildMemberAdd", async (member) => {
  const data = loadData();
  const ch = data.statusChannels[member.guild.id];
  if (!ch) return;
  const channel = member.guild.channels.cache.get(ch.channelId);
  if (!channel) return;
  await channel.setName(`Members Server ( ${member.guild.memberCount} )`).catch(() => {});
});

client.on("guildMemberRemove", async (member) => {
  const data = loadData();
  const ch = data.statusChannels[member.guild.id];
  if (!ch) return;
  const channel = member.guild.channels.cache.get(ch.channelId);
  if (!channel) return;
  await channel.setName(`Members Server ( ${member.guild.memberCount} )`).catch(() => {});
});

const badWords = ["fuck","shit","ass","damn","bitch","كس","طيز","لعن","زب","شرموط","منيوك","خرا"];

client.on("messageCreate", async (message) => {
  if (message.author.bot) return;
  const data = loadData();

  if (data.autoLine.image && data.autoLine.channels.includes(message.channel.id) && message.content.trim() !== "") {
    await message.channel.send({ files: [data.autoLine.image] }).catch(() => {});
  }

  const sec = data.security;
  const hasPerm = message.member?.permissions.has(PermissionsBitField.Flags.ManageMessages);
  if (!hasPerm) {
    if (sec.blockLinks && /https?:\/\/\S+/i.test(message.content)) { await message.delete().catch(() => {}); return; }
    if (sec.blockBadWords && badWords.some(w => message.content.toLowerCase().includes(w))) { await message.delete().catch(() => {}); return; }
    if (sec.blockImages && message.attachments.size > 0) { await message.delete().catch(() => {}); return; }
    if (sec.blockSpam) {
      const key = `${message.guild.id}-${message.author.id}`;
      const now = Date.now();
      const ud = spamMap.get(key) || { msgs: [] };
      ud.msgs = ud.msgs.filter(t => now - t < 5000);
      ud.msgs.push(now);
      spamMap.set(key, ud);
      if (ud.msgs.length >= 5) { await message.delete().catch(() => {}); return; }
    }
  }

  for (const ar of data.autoResponses) {
    if (message.content.toLowerCase().includes(ar.trigger.toLowerCase())) {
      await message.channel.send(ar.response).catch(() => {});
      break;
    }
  }

  const sys = data.system;

  // ─── أوامر بدون بريفكس (بنك) ──────────────────────────────────────────────
  const bankCmds = ["رواتب","رصيد","تحويل"];
  const isBankCmd = bankCmds.some(cmd => message.content.trim().startsWith(cmd));

  if (isBankCmd && isAllowed(message.member, data)) {
    const parts = message.content.trim().split(/\s+/);
    const cmd = parts[0];

    if (cmd === "رصيد") {
      const target = message.mentions.users.first() || message.author;
      const balance = data.bank[target.id] || 0;
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# رصيد <a:Shinystars:1487436371751731270>`));
      c.addSeparatorComponents(new SeparatorBuilder().setDivider(true));
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `<a:cloud:1487436129778270249> رصـيـد ${target} هـو **${balance}** <:Wtf:1487436357549690921>`
      ));
      await message.channel.send({ components: [c], flags: [MessageFlags.IsComponentsV2] });
      return;
    }

    if (cmd === "رواتب") {
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# رواتب <a:Shinystars:1487436371751731270>`));
      c.addSeparatorComponents(new SeparatorBuilder().setDivider(true));
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `<a:cloud:1487436129778270249> الـراتـب الـيـومـي: **500** <:Wtf:1487436357549690921>\n` +
        `<a:cloud:1487436129778270249> الـراتـب الأسـبـوعـي: **3500** <:Wtf:1487436357549690921>`
      ));
      await message.channel.send({ components: [c], flags: [MessageFlags.IsComponentsV2] });
      return;
    }

    if (cmd === "تحويل") {
      const target = message.mentions.users.first();
      const amount = parseInt(parts[2]);
      if (!target || isNaN(amount) || amount <= 0) {
        await message.reply("الاستخدام: `تحويل @عضو [مبلغ]`"); return;
      }
      const senderBalance = data.bank[message.author.id] || 0;
      if (senderBalance < amount) { await message.reply("رصيدك ما يكفي."); return; }
      data.bank[message.author.id] = senderBalance - amount;
      data.bank[target.id] = (data.bank[target.id] || 0) + amount;
      saveData(data);
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# تحويل <a:Shinystars:1487436371751731270>`));
      c.addSeparatorComponents(new SeparatorBuilder().setDivider(true));
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `<a:cloud:1487436129778270249> تـم تـحـويـل **${amount}** إلـى ${target} <:Wtf:1487436357549690921>`
      ));
      await message.channel.send({ components: [c], flags: [MessageFlags.IsComponentsV2] });
      return;
    }
  }

  // ─── أوامر السيستم بدون بريفكس ────────────────────────────────────────────
  if (isAllowed(message.member, data) && message.content.trim().startsWith("ق ")) {
    const chId = message.mentions.channels.first()?.id || message.channel.id;
    const ch = message.guild.channels.cache.get(chId);
    if (ch) await ch.permissionOverwrites.edit(message.guild.id, { SendMessages: false }).catch(() => {});
    await message.reply("تـم قـفـل الـروم."); return;
  }
  if (isAllowed(message.member, data) && message.content.trim().startsWith("ف ")) {
    const chId = message.mentions.channels.first()?.id || message.channel.id;
    const ch = message.guild.channels.cache.get(chId);
    if (ch) await ch.permissionOverwrites.edit(message.guild.id, { SendMessages: true }).catch(() => {});
    await message.reply("تـم فـتـح الـروم."); return;
  }
  if (isAllowed(message.member, data) && message.content.trim().startsWith("سمع ")) {
    const vcId = message.content.trim().split(/\s+/)[1];
    const vc = message.guild.channels.cache.get(vcId);
    if (vc && vc.type === ChannelType.GuildVoice) {
      await vc.permissionOverwrites.edit(message.guild.id, { Connect: true, Speak: true }).catch(() => {});
      await message.reply("تـم فـتـح الـروم الـصـوتـي."); return;
    }
  }
  if (isAllowed(message.member, data) && message.content.trim().startsWith("لاسمع ")) {
    const vcId = message.content.trim().split(/\s+/)[1];
    const vc = message.guild.channels.cache.get(vcId);
    if (vc && vc.type === ChannelType.GuildVoice) {
      await vc.permissionOverwrites.edit(message.guild.id, { Connect: false, Speak: false }).catch(() => {});
      await message.reply("تـم قـفـل الـروم الـصـوتـي."); return;
    }
  }

  // ─── أوامر السيستم الديناميكية ────────────────────────────────────────────
  if (isAllowed(message.member, data)) {
    const parts = message.content.trim().split(/\s+/);
    const cmd = parts[0];
    const target = message.mentions.members.first();

    if (cmd === sys.bandAlias && target) {
      await target.ban({ reason: `باند بواسطة ${message.author.tag}` }).catch(() => {});
      data.system.commandLogs.push({ type: "band", mod: message.author.id, target: target.id, at: Date.now() });
      saveData(data);
      await message.reply(`تـم تـبـنـيـد عـضـو ${target.user} <:Wtf:1487436357549690921>`); return;
    }
    if (cmd === sys.kickAlias && target) {
      await target.kick(`كيك بواسطة ${message.author.tag}`).catch(() => {});
      data.system.commandLogs.push({ type: "kick", mod: message.author.id, target: target.id, at: Date.now() });
      saveData(data);
      await message.reply(`تـم كـيـك عـضـو ${target.user} <:Wtf:1487436357549690921>`); return;
    }
    if (cmd === sys.timeAlias && target) {
      const duration = parseInt(parts[2]) || 10;
      await target.timeout(duration * 60 * 1000, `تايم بواسطة ${message.author.tag}`).catch(() => {});
      data.system.commandLogs.push({ type: "timeout", mod: message.author.id, target: target.id, at: Date.now() });
      saveData(data);
      await message.reply(`تـم تـايـم عـضـو ${target.user} <:Wtf:1487436357549690921>`); return;
    }
    if (cmd === sys.ontimeAlias && target) {
      await target.timeout(null).catch(() => {});
      data.system.commandLogs.push({ type: "untimeout", mod: message.author.id, target: target.id, at: Date.now() });
      saveData(data);
      await message.reply(`تـم أون تـايـم عـضـو ${target.user} <:Wtf:1487436357549690921>`); return;
    }
    if (cmd === sys.onbandAlias && target) {
      await message.guild.bans.remove(target.id).catch(() => {});
      data.system.commandLogs.push({ type: "unban", mod: message.author.id, target: target.id, at: Date.now() });
      saveData(data);
      await message.reply(`تـم أون بـانـد عـضـو ${target.user} <:Wtf:1487436357549690921>`); return;
    }
  }

  // ─── Awaiting Collectors ───────────────────────────────────────────────────

  const ticketKey = `${message.author.id}_ticket`;
  if (awaitingMap.has(ticketKey)) {
    const state = awaitingMap.get(ticketKey);
    if (state.step === "title") { state.title = message.content; state.step = "description"; awaitingMap.set(ticketKey, state); await message.reply(`ادخـل وصـف الـتـذكـرة ${e.anim009}`); return; }
    if (state.step === "description") { state.description = message.content; state.step = "buttonName"; awaitingMap.set(ticketKey, state); await message.reply(`ادخـل اسـم زر خـاص بـتـذكـرة ${e.anim008}`); return; }
    if (state.step === "buttonName") { state.buttonName = message.content; state.step = "buttonEmoji"; awaitingMap.set(ticketKey, state); await message.reply(`ادخـل إيـمـوجـي الزر خـاص بـالـتـذكـرة، إِذا لا تـريـد اكـتـب "لا" ${e.anim005}`); return; }
    if (state.step === "buttonEmoji") { state.buttonEmoji = message.content === "لا" ? null : message.content; state.step = "image"; awaitingMap.set(ticketKey, state); await message.reply(`هـل تـريـد إضـافـة صـورَة فـي تـذكـرة، إِذا لا تـريـد اكـتـب "لا" ${e.red}`); return; }
    if (state.step === "image") {
      if (message.content === "لا") state.image = null;
      else if (message.attachments.size > 0) state.image = message.attachments.first().url;
      else state.image = message.content;
      state.step = "panelChannel"; awaitingMap.set(ticketKey, state);
      await message.reply(`مـنـشـن روم الـذي يـرسـل له بـنـل تـذكـرة ${e.anim003}`); return;
    }
    if (state.step === "panelChannel") {
      const mentioned = message.mentions.channels.first();
      if (!mentioned) { await message.reply("منشن الروم بشكل صحيح."); return; }
      state.panelChannel = mentioned.id; state.step = "adminRole"; awaitingMap.set(ticketKey, state);
      await message.reply(`مـنـشـن رُتـبـة الإِدارَة المـسـؤولَة عـن تـذاكـر ${e.cloud}`); return;
    }
    if (state.step === "adminRole") {
      const role = message.mentions.roles.first();
      if (!role) { await message.reply("منشن الرتبة بشكل صحيح."); return; }
      state.adminRole = role.id; awaitingMap.delete(ticketKey);
      const panelCh = message.guild.channels.cache.get(state.panelChannel);
      if (!panelCh) { await message.reply("ما لقيت الروم."); return; }
      const btnBuilder = new ButtonBuilder().setCustomId(`open_ticket_${state.adminRole}`).setLabel(state.buttonName).setStyle(ButtonStyle.Secondary);
      if (state.buttonEmoji) { const m = state.buttonEmoji.match(/<a?:\w+:(\d+)>/); if (m) btnBuilder.setEmoji({ id: m[1] }); else btnBuilder.setEmoji(state.buttonEmoji); }
      const panelContainer = buildTicketPanelContainer(state.title, state.description);
      panelContainer.addActionRowComponents(new ActionRowBuilder().addComponents(btnBuilder));
      const sendOpts = { components: [panelContainer], flags: [MessageFlags.IsComponentsV2] };
      if (state.image) sendOpts.files = [state.image];
      await panelCh.send(sendOpts);
      await message.reply(`تـم إرسـال بـنـل الـتـذاكـر، وشـكـراً لـك ${e.onlinePing} الـى ${panelCh}`); return;
    }
  }

  const alKey = `${message.author.id}_autoline`;
  if (awaitingMap.has(alKey)) {
    const state = awaitingMap.get(alKey);
    if (state.step === "image") {
      let img = null;
      if (message.attachments.size > 0) img = message.attachments.first().url;
      else if (/https?:\/\/\S+/i.test(message.content)) img = message.content.trim();
      if (!img) { await message.reply("أرسل رابط صورة أو أرفق صورة."); return; }
      state.image = img; state.step = "channels"; awaitingMap.set(alKey, state);
      await message.reply(`تـم اسـتـلام صـورَة، مـنـشـن رومات الـذي يـرسـل لهـا خـط ${e.byEz}`); return;
    }
    if (state.step === "channels") {
      const mentioned = message.mentions.channels;
      if (mentioned.size === 0) { await message.reply("منشن رومات بشكل صحيح."); return; }
      const channelIds = mentioned.map(c => c.id);
      const d2 = loadData(); d2.autoLine.image = state.image;
      d2.autoLine.channels = [...new Set([...d2.autoLine.channels, ...channelIds])];
      saveData(d2); awaitingMap.delete(alKey);
      await message.reply(`تم تفعيل الخط التلقائي على ${channelIds.map(id => `<#${id}>`).join(", ")}`); return;
    }
  }

  const arKey = `${message.author.id}_autoresponse`;
  if (awaitingMap.has(arKey)) {
    const state = awaitingMap.get(arKey);
    if (state.step === "trigger") { state.trigger = message.content; state.step = "response"; awaitingMap.set(arKey, state); await message.reply(`ادخـل رَدي عـلـى الـرسـالـة ${e.heart}`); return; }
    if (state.step === "response") {
      const d2 = loadData(); d2.autoResponses.push({ trigger: state.trigger, response: message.content });
      saveData(d2); awaitingMap.delete(arKey);
      await message.reply(`تم إضافة الرد التلقائي!\nعند كتابة: **${state.trigger}** سيرد البوت بـ: **${message.content}**`); return;
    }
  }

  const sysKey = `${message.author.id}_system`;
  if (awaitingMap.has(sysKey)) {
    const state = awaitingMap.get(sysKey);
    const steps = ["band","kick","time","ontime","onband"];
    const questions = [
      `اِدخـل اِخـتِصـار جـديـد لِلـكـيـك ${e.cloud}`,
      `اِدخـل اِخـتِصـار جـديـد لِلـتـايـم ${e.cloud}`,
      `اِدخـل اِخـتِصـار جـديـد لِلأون تـايـم ${e.cloud}`,
      `اِدخـل اِخـتِصـار جـديـد لِلأون بـانـد ${e.cloud}`,
    ];
    if (state.step === "band") { state.band = message.content; state.step = "kick"; awaitingMap.set(sysKey, state); await message.reply(questions[0]); return; }
    if (state.step === "kick") { state.kick = message.content; state.step = "time"; awaitingMap.set(sysKey, state); await message.reply(questions[1]); return; }
    if (state.step === "time") { state.time = message.content; state.step = "ontime"; awaitingMap.set(sysKey, state); await message.reply(questions[2]); return; }
    if (state.step === "ontime") { state.ontime = message.content; state.step = "onband"; awaitingMap.set(sysKey, state); await message.reply(questions[3]); return; }
    if (state.step === "onband") {
      state.onband = message.content; state.step = "confirm"; awaitingMap.set(sysKey, state);
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `هـل أنـت مـوافـق عـلـى تـحـديـث لـلأوامـر الـجـديـدة؟ <a:fire:1487435523718119446>\n\n` +
        `باند: \`${state.band}\` | كيك: \`${state.kick}\` | تايم: \`${state.time}\` | أونتايم: \`${state.ontime}\` | أونباند: \`${state.onband}\``
      ));
      c.addSeparatorComponents(new SeparatorBuilder().setDivider(true));
      c.addActionRowComponents(new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("system_confirm_yes").setLabel("نـعـم").setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId("system_confirm_no").setLabel("لا").setStyle(ButtonStyle.Secondary),
      ));
      await message.channel.send({ components: [c], flags: [MessageFlags.IsComponentsV2] });
      return;
    }
  }

  const updateKey = `${message.author.id}_update_cmds`;
  if (awaitingMap.has(updateKey)) {
    const state = awaitingMap.get(updateKey);
    if (state.step === "band") { state.band = message.content; state.step = "kick"; awaitingMap.set(updateKey, state); await message.reply(`اِدخـل اِخـتِصـار جـديـد لِلـكـيـك ${e.cloud}`); return; }
    if (state.step === "kick") { state.kick = message.content; state.step = "time"; awaitingMap.set(updateKey, state); await message.reply(`اِدخـل اِخـتِصـار جـديـد لِلـتـايـم ${e.cloud}`); return; }
    if (state.step === "time") { state.time = message.content; state.step = "ontime"; awaitingMap.set(updateKey, state); await message.reply(`اِدخـل اِخـتِصـار جـديـد لِلأون تـايـم ${e.cloud}`); return; }
    if (state.step === "ontime") { state.ontime = message.content; state.step = "onband"; awaitingMap.set(updateKey, state); await message.reply(`اِدخـل اِخـتِصـار جـديـد لِلأون بـانـد ${e.cloud}`); return; }
    if (state.step === "onband") {
      state.onband = message.content; awaitingMap.delete(updateKey);
      const d2 = loadData();
      d2.system.bandAlias = state.band; d2.system.kickAlias = state.kick;
      d2.system.timeAlias = state.time; d2.system.ontimeAlias = state.ontime;
      d2.system.onbandAlias = state.onband;
      saveData(d2);
      await message.reply(`تم تحديث الأوامر بنجاح!`); return;
    }
  }

  const permKey = `${message.author.id}_perm_role`;
  if (awaitingMap.has(permKey)) {
    const role = message.mentions.roles.first();
    if (!role) { await message.reply("منشن الرتبة بشكل صحيح."); return; }
    const d2 = loadData();
    if (!d2.system.extraRoles.includes(role.id)) d2.system.extraRoles.push(role.id);
    saveData(d2); awaitingMap.delete(permKey);
    await message.reply(`تـم إضـافـة ${role} لـصـلاحـيـات الأوامـر.`); return;
  }

  const catKey = `${message.author.id}_category_action`;
  if (awaitingMap.has(catKey)) {
    const state = awaitingMap.get(catKey);
    const catId = message.content.trim();
    const category = message.guild.channels.cache.get(catId);
    if (!category || category.type !== ChannelType.GuildCategory) { await message.reply("أدخل إيدي كاتغوري صحيح."); return; }
    const children = message.guild.channels.cache.filter(c => c.parentId === catId);
    awaitingMap.delete(catKey);
    for (const [, ch] of children) {
      try {
        if (state.action === "show_category") await ch.permissionOverwrites.edit(message.guild.id, { ViewChannel: true });
        if (state.action === "hide_category") await ch.permissionOverwrites.edit(message.guild.id, { ViewChannel: false });
        if (state.action === "lock_category") await ch.permissionOverwrites.edit(message.guild.id, { SendMessages: false });
        if (state.action === "unlock_category") await ch.permissionOverwrites.edit(message.guild.id, { SendMessages: true });
      } catch {}
    }
    await message.reply("تـم تـطـبـيـق الـتـعـديـل عـلـى الـكـاتـغـوري."); return;
  }

  const amKey = `${message.author.id}_addmember`;
  if (awaitingMap.has(amKey)) {
    const state = awaitingMap.get(amKey);
    const targetUser = message.mentions.users.first();
    if (!targetUser) { await message.reply("منشن العضو بشكل صحيح."); return; }
    const ch = message.guild.channels.cache.get(state.channelId);
    if (ch) { await ch.permissionOverwrites.edit(targetUser.id, { ViewChannel: true, SendMessages: true }); await message.reply(`تم إضافة ${targetUser} للتذكرة.`); }
    awaitingMap.delete(amKey); return;
  }

  const rtKey = `${message.author.id}_renameticket`;
  if (awaitingMap.has(rtKey)) {
    const state = awaitingMap.get(rtKey);
    const ch = message.guild.channels.cache.get(state.channelId);
    if (ch) { await ch.setName(message.content).catch(() => {}); await message.reply(`تم تغيير اسم التذكرة إلى **${message.content}**`); }
    awaitingMap.delete(rtKey); return;
  }

  // ─── Commands (بريفكس) ────────────────────────────────────────────────────
  if (!message.content.startsWith(config.prefix)) return;
  const args = message.content.slice(config.prefix.length).trim().split(/\s+/);
  const command = args.shift().toLowerCase();

  if (command === "ping") {
    if (!isOwner(message.member)) return message.reply("ما عندك صلاحية لهذا الأمر.");
    const vcId = args[0];
    if (!vcId) return message.reply("أرسل إيدي الروم الصوتي بعد الأمر.");
    const vc = message.guild.channels.cache.get(vcId);
    if (!vc || vc.type !== ChannelType.GuildVoice) return message.reply("الروم الصوتي غير موجود.");
    const botVoice = message.guild.members.me.voice;
    if (botVoice.channel) { botVoice.disconnect(); return message.reply("البوت طلع من الروم الصوتي."); }
    else {
      try {
        const { joinVoiceChannel } = require("@discordjs/voice");
        joinVoiceChannel({ channelId: vc.id, guildId: message.guild.id, adapterCreator: message.guild.voiceAdapterCreator });
        return message.reply(`البوت دخل **${vc.name}**`);
      } catch { return message.reply("تحتاج تثبت `@discordjs/voice` لهذه الميزة."); }
    }
  }

  if (command === "status") {
    if (!isOwner(message.member)) return message.reply("ما عندك صلاحية لهذا الأمر.");
    const vcId = args[0];
    if (!vcId) return message.reply("أرسل إيدي الروم الصوتي.");
    const vc = message.guild.channels.cache.get(vcId);
    if (!vc || vc.type !== ChannelType.GuildVoice) return message.reply("الروم الصوتي غير موجود.");
    const count = message.guild.memberCount;
    try { await vc.setName(`Members Server ( ${count} )`); }
    catch { return message.reply("ما قدر البوت يغير اسم الروم، تحقق من الصلاحيات."); }
    const d2 = loadData(); d2.statusChannels[message.guild.id] = { channelId: vcId }; saveData(d2);
    return message.reply(`تم تفعيل ستاتس الأعضاء على **${vc.name}** | العدد الحالي: **${count}**`);
  }

  if (command === "dashboard") {
    if (!isOwner(message.member)) return message.reply("ما عندك صلاحية لهذا الأمر.");
    await message.channel.send({ components: [buildDashboardContainer()], flags: [MessageFlags.IsComponentsV2] });
  }
});

client.on("interactionCreate", async (interaction) => {
  const member = interaction.member;
  const data = loadData();

  if (interaction.isStringSelectMenu() && interaction.customId === "dashboard_select") {
    if (!isOwner(member)) return interaction.reply({ content: "ما عندك صلاحية.", flags: MessageFlags.Ephemeral });
    const value = interaction.values[0];

    if (value === "setup_ticket") {
      await interaction.reply({
        content: `هـل أنـت مـتـأكـد مـن طـلـب تـسـطـيـب نـظـام تـذكـرة؟ ${e.byEz}`,
        components: [new ActionRowBuilder().addComponents(
          new ButtonBuilder().setCustomId("ticket_confirm_yes").setLabel("نعم").setStyle(ButtonStyle.Success),
          new ButtonBuilder().setCustomId("ticket_confirm_no").setLabel("لا").setStyle(ButtonStyle.Danger)
        )],
        flags: MessageFlags.Ephemeral,
      });
    }
    if (value === "setup_autoline") {
      awaitingMap.set(`${interaction.user.id}_autoline`, { step: "image" });
      await interaction.reply({ content: `الـرجـاء إرسـال رابط صـورَة أَو إرفـاق صـورَة ${e.graystars}`, flags: MessageFlags.Ephemeral });
    }
    if (value === "setup_security") {
      await interaction.reply({ components: [buildSecurityContainer()], flags: [MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral] });
    }
    if (value === "setup_autoresponse") {
      awaitingMap.set(`${interaction.user.id}_autoresponse`, { step: "trigger" });
      await interaction.reply({ content: `ادخـل رَّد الـذي تـريـد الـرد علـيه ${e.heart}`, flags: MessageFlags.Ephemeral });
    }
    if (value === "setup_system") {
      awaitingMap.set(`${interaction.user.id}_system`, { step: "band" });
      await interaction.reply({ content: `اِدخـل اِخـتِصـار جـديـد لِلـبـانـد ${e.cloud}`, flags: MessageFlags.Ephemeral });
    }
  }

  if (interaction.isButton() && interaction.customId === "system_confirm_yes") {
    const sysKey = `${interaction.user.id}_system`;
    const state = awaitingMap.get(sysKey);
    if (!state) return interaction.reply({ content: "انتهت الجلسة.", flags: MessageFlags.Ephemeral });
    awaitingMap.delete(sysKey);
    const d2 = loadData();
    d2.system.bandAlias = state.band; d2.system.kickAlias = state.kick;
    d2.system.timeAlias = state.time; d2.system.ontimeAlias = state.ontime;
    d2.system.onbandAlias = state.onband;
    saveData(d2);
    const _sContainer = new ContainerBuilder();
    _sContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent("تـم تـحـديـث الأوامـر بـنـجـاح!"));
    await interaction.update({ components: [_sContainer], flags: [MessageFlags.IsComponentsV2] });
    await interaction.channel.send({ components: [buildSystemDashContainer(d2)], flags: [MessageFlags.IsComponentsV2] });
  }

  if (interaction.isButton() && interaction.customId === "system_confirm_no") {
    awaitingMap.delete(`${interaction.user.id}_system`);
    const _snContainer = new ContainerBuilder();
    _snContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent("تـم إلـغـاء الـعـمـلـيـة."));
    await interaction.update({ components: [_snContainer], flags: [MessageFlags.IsComponentsV2] });
  }

  if (interaction.isStringSelectMenu() && interaction.customId === "system_dash_select") {
    if (!isOwner(member)) return interaction.reply({ content: "ما عندك صلاحية.", flags: MessageFlags.Ephemeral });
    const value = interaction.values[0];

    if (value === "see_commands") {
      await interaction.reply({ components: [buildSeeCommandsContainer(data)], flags: [MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral] });
    }
    if (value === "update_commands") {
      awaitingMap.set(`${interaction.user.id}_update_cmds`, { step: "band" });
      await interaction.reply({ content: `اِدخـل اِخـتِصـار جـديـد لِلـبـانـد ${e.cloud}`, flags: MessageFlags.Ephemeral });
    }
    if (value === "see_logs") {
      const logs = data.system.commandLogs.slice(-10).reverse();
      const logText = logs.length === 0 ? "لا يوجد سجلات بعد." :
        logs.map(l => `<a:cloud:1487436129778270249> **${l.type}** — <@${l.mod}> ← <@${l.target}> — <t:${Math.floor(l.at/1000)}:R>`).join("\n");
      const c = new ContainerBuilder();
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(`# سـجـلات الأوامـر <a:Shinystars:1487436371751731270>`));
      c.addSeparatorComponents(new SeparatorBuilder().setDivider(true));
      c.addTextDisplayComponents(new TextDisplayBuilder().setContent(logText));
      await interaction.reply({ components: [c], flags: [MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral] });
    }
    if (value === "cmd_permissions") {
      awaitingMap.set(`${interaction.user.id}_perm_role`, true);
      await interaction.reply({ components: [buildPermissionsContainer()], flags: [MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral] });
      await interaction.followUp({ content: "مـنـشـن الـرتـبـة الـتـي تـريـد إضـافـتـهـا.", flags: MessageFlags.Ephemeral });
    }
    if (value === "reset_menu") {
      await interaction.reply({ components: [buildSystemDashContainer(data)], flags: [MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral] });
    }
    if (value === "new_commands") {
      await interaction.reply({ components: [buildNewCommandsContainer()], flags: [MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral] });
    }
  }

  if (interaction.isStringSelectMenu() && interaction.customId === "new_commands_select") {
    if (!isAllowed(member, data)) return interaction.reply({ content: "ما عندك صلاحية.", flags: MessageFlags.Ephemeral });
    const value = interaction.values[0];
    const guild = interaction.guild;

    if (value === "hide_all") {
      await interaction.reply({ content: "جارٍ إخفاء جميع الرومات...", flags: MessageFlags.Ephemeral });
      for (const [, ch] of guild.channels.cache) {
        if (ch.type === ChannelType.GuildText || ch.type === ChannelType.GuildVoice)
          await ch.permissionOverwrites.edit(guild.id, { ViewChannel: false }).catch(() => {});
      }
    }
    if (value === "lock_all") {
      await interaction.reply({ content: "جارٍ قفل جميع الرومات...", flags: MessageFlags.Ephemeral });
      for (const [, ch] of guild.channels.cache) {
        if (ch.type === ChannelType.GuildText)
          await ch.permissionOverwrites.edit(guild.id, { SendMessages: false }).catch(() => {});
      }
    }
    const categoryActions = ["show_category","hide_category","lock_category","unlock_category"];
    if (categoryActions.includes(value)) {
      awaitingMap.set(`${interaction.user.id}_category_action`, { action: value });
      await interaction.reply({ content: "أرسل إيدي الكاتغوري.", flags: MessageFlags.Ephemeral });
    }
  }

  if (interaction.isButton() && interaction.customId === "ticket_confirm_yes") {
    if (!isOwner(member)) return interaction.reply({ content: "ما عندك صلاحية.", flags: MessageFlags.Ephemeral });
    awaitingMap.set(`${interaction.user.id}_ticket`, { step: "title" });
    const _tContainer = new ContainerBuilder();
    _tContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent(`ادخـل عـنـوان الـتـذكـرة ${e.anim011}`));
    await interaction.update({ components: [_tContainer], flags: [MessageFlags.IsComponentsV2] });
  }
  if (interaction.isButton() && interaction.customId === "ticket_confirm_no") {
    const _cContainer = new ContainerBuilder();
    _cContainer.addTextDisplayComponents(new TextDisplayBuilder().setContent("تم إلغاء العملية."));
    await interaction.update({ components: [_cContainer], flags: [MessageFlags.IsComponentsV2] });
  }

  if (interaction.isStringSelectMenu() && interaction.customId === "security_select") {
    if (!isOwner(member)) return interaction.reply({ content: "ما عندك صلاحية.", flags: MessageFlags.Ephemeral });
    const d2 = loadData(); const selected = interaction.values;
    d2.security.blockLinks = selected.includes("block_links");
    d2.security.blockBadWords = selected.includes("block_badwords");
    d2.security.blockImages = selected.includes("block_images");
    d2.security.blockSpam = selected.includes("block_spam");
    saveData(d2);
    await interaction.reply({ content: "تم حفظ نتائج !", flags: MessageFlags.Ephemeral });
  }

  if (interaction.isStringSelectMenu() && interaction.customId === "ticket_tools") {
    const value = interaction.values[0];
    const channel = interaction.channel;
    if (value === "claim_ticket") { await interaction.reply({ content: `${interaction.user} استلم التذكرة.` }); }
    if (value === "close_ticket") {
      if (!isOwner(member)) return interaction.reply({ content: "ما عندك صلاحية.", flags: MessageFlags.Ephemeral });
      await interaction.reply({ content: "سيتم إغلاق التذكرة خلال 5 ثوانٍ..." });
      setTimeout(() => channel.delete().catch(() => {}), 5000);
    }
    if (value === "add_member") { awaitingMap.set(`${interaction.user.id}_addmember`, { channelId: channel.id }); await interaction.reply({ content: "منشن العضو الذي تريد إضافته.", flags: MessageFlags.Ephemeral }); }
    if (value === "call_owner") {
      const ownerId = channel.topic;
      if (ownerId) await interaction.reply({ content: `<@${ownerId}> صاحب التذكرة يتم استدعاؤك!` });
      else await interaction.reply({ content: "ما قدرت أحدد صاحب التذكرة.", flags: MessageFlags.Ephemeral });
    }
    if (value === "rename_ticket") { awaitingMap.set(`${interaction.user.id}_renameticket`, { channelId: channel.id }); await interaction.reply({ content: "أرسل الاسم الجديد للتذكرة.", flags: MessageFlags.Ephemeral }); }
  }

  if (interaction.isButton() && interaction.customId.startsWith("open_ticket_")) {
    const adminRoleId = interaction.customId.split("open_ticket_")[1];
    const guild = interaction.guild; const user = interaction.user;
    const d2 = loadData(); d2.ticketCount = (d2.ticketCount || 0) + 1; saveData(d2);
    const ticketChannel = await guild.channels.create({
      name: `ticket-${d2.ticketCount}-${user.username}`,
      type: ChannelType.GuildText, topic: user.id,
      permissionOverwrites: [
        { id: guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
        { id: user.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] },
        { id: adminRoleId, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ManageMessages] },
      ],
    });
    await ticketChannel.send({ components: [buildTicketWelcomeContainer(user, adminRoleId)], flags: [MessageFlags.IsComponentsV2] });
    await interaction.reply({ content: `تم فتح تذكرتك في ${ticketChannel}`, flags: MessageFlags.Ephemeral });
  }
});

client.login(process.env.TOKEN);
