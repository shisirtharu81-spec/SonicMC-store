const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const express = require('express');
require('dotenv').config();

// 1. EXPRESS SERVER (To keep the bot online 24/7)
const app = express();
app.get('/', (req, res) => {
    res.send('Bot is 24/7 Online!');
});
app.listen(process.env.PORT || 3000, () => {
    console.log("Web server ready.");
});

// 2. DISCORD BOT SETUP
const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

let isApplicationOpen = true; 

client.once('ready', () => {
    console.log(`Logged in as ${client.user.username}!`);
});

// Commands
client.on('messageCreate', async (message) => {
    if (!message.guild || message.author.bot) return;

    if (message.content === '!setup-app') {
        if (!message.member.permissions.has('Administrator')) return message.reply("You do not have permission to use this command.");

        const embed = new EmbedBuilder()
            .setTitle("📝 Staff Recruitment")
            .setDescription("If you want to become a staff member on our server, click the button below to fill out the application form.")
            .setColor("#0099ff");

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('apply_btn')
                .setLabel('Apply Now')
                .setStyle(ButtonStyle.Primary)
        );

        await message.channel.send({ embeds: [embed], components: [row] });
    }

    if (message.content === '!app-toggle') {
        if (!message.member.permissions.has('Administrator')) return message.reply("You do not have permission to use this command.");

        isApplicationOpen = !isApplicationOpen;
        const status = isApplicationOpen ? "🟢 OPEN" : "🔴 CLOSED";
        await message.reply(`Staff Applications are now **${status}**!`);
    }
});

// Interaction Handling (Buttons & Modals)
client.on('interactionCreate', async (interaction) => {
    if (interaction.isButton() && interaction.customId === 'apply_btn') {
        if (!isApplicationOpen) {
            return await interaction.reply({ content: "Sorry! Staff applications are currently closed.", ephemeral: true });
        }

        const modal = new ModalBuilder().setCustomId('staff_modal').setTitle('Staff Application Form');

        // 1st Number: Discord Username & Real Name (Combined to save space)
        const nameInput = new TextInputBuilder()
            .setCustomId('app_names')
            .setLabel('Your Discord Username & Real Name?')
            .setPlaceholder('Example: orange_player (Rahul)')
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

        const ageInput = new TextInputBuilder().setCustomId('app_age').setLabel('What is your age?').setStyle(TextInputStyle.Short).setRequired(true);
        const reasonInput = new TextInputBuilder().setCustomId('app_reason').setLabel('Why should we accept you as staff?').setStyle(TextInputStyle.Paragraph).setRequired(true);
        const activityInput = new TextInputBuilder().setCustomId('app_activity').setLabel('How many hours can you dedicate daily?').setStyle(TextInputStyle.Short).setRequired(true);
        const scenarioInput = new TextInputBuilder().setCustomId('app_scenario').setLabel('How do you handle toxic players or hackers?').setStyle(TextInputStyle.Paragraph).setRequired(true);

        modal.addComponents(
            new ActionRowBuilder().addComponents(nameInput), // Position 1
            new ActionRowBuilder().addComponents(ageInput),
            new ActionRowBuilder().addComponents(reasonInput),
            new ActionRowBuilder().addComponents(activityInput),
            new ActionRowBuilder().addComponents(scenarioInput)
        );
        await interaction.showModal(modal);
    }

    if (interaction.isModalSubmit() && interaction.customId === 'staff_modal') {
        const names = interaction.fields.getTextInputValue('app_names');
        const age = interaction.fields.getTextInputValue('app_age');
        const reason = interaction.fields.getTextInputValue('app_reason');
        const activity = interaction.fields.getTextInputValue('app_activity');
        const scenario = interaction.fields.getTextInputValue('app_scenario');

        const logChannel = client.channels.cache.get(process.env.APPLICATION_CHANNEL_ID);

        const appEmbed = new EmbedBuilder()
            .setTitle("New Staff Application Submitted!")
            .setColor("#32a852")
            .addFields(
                { name: 'User & Real Name', value: names, inline: true },
                { name: 'Discord Tag', value: `${interaction.user.username} (${interaction.user.id})`, inline: true },
                { name: 'Age', value: age, inline: true },
                { name: 'Daily Activity', value: activity, inline: true },
                { name: 'Reason to Join', value: reason },
                { name: 'Handling Toxicity/Hackers', value: scenario }
            )
            .setTimestamp();

        // Exactly 8 Advanced Questions for Phase-2 Interview
        const remainingQuestionsEmbed = new EmbedBuilder()
            .setTitle("📝 Phase 2: 8 Interview Questions for Staff")
            .setColor("#e74c3c")
            .setDescription(`Ask these 8 advanced questions to ${interaction.user.username} during their manual review:\n\n` +
                "**1.** Do you have any previous staff experience on other Minecraft or Discord servers?\n" +
                "**2.** What specific skills or unique qualities can you bring to the OrangeMC team?\n" +
                "**3.** If a higher-ranking staff member is abusing their power, how will you respond?\n" +
                "**4.** What is your timezone and during what hours are you most active?\n" +
                "**5.** How do you handle stressful situations or intense arguments inside the public chat?\n" +
                "**6.** Do you have basic knowledge of server moderation plugins (e.g., AdvancedBan, Essentials)?\n" +
                "**7.** Why do you want to join our server specifically instead of other networks?\n" +
                "**8.** If an active player breaks a minor rule, would you warn them first or issue an instant ban?")
            .setFooter({ text: "OrangeMC Management Review Sheet" });

        if (logChannel) {
            await logChannel.send({ embeds: [appEmbed] });
            await logChannel.send({ embeds: [remainingQuestionsEmbed] });
            await interaction.reply({ content: "Your application has been successfully submitted! The admin team will review it shortly.", ephemeral: true });
        } else {
            await interaction.reply({ content: "Error: Application log channel not found.", ephemeral: true });
        }
    }
});

client.login(process.env.DISCORD_TOKEN);
