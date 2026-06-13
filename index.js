const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits, ChannelType } = require('discord.js');
const express = require('express');
require('dotenv').config();

const app = express();
app.get('/', (req, res) => res.send('Bot is 24/7 Online!'));
app.listen(process.env.PORT || 3000, () => console.log("Web server ready."));

const client = new Client({
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

let isApplicationOpen = true; 

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}! Ultimate Fast Bot ready.`);
});

// Commands
client.on('messageCreate', async (message) => {
    if (!message.guild || message.author.bot) return;

    if (message.content === '!setup-app') {
        if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return message.reply("Aapke paas permission nahi hai.");
        }

        const embed = new EmbedBuilder()
            .setTitle("🛡️ OrangeMC — Discord Staff Recruitment")
            .setDescription("Hamare Discord server ke liye staff applications open hain! Isme aapko **10 advanced questions** ke answer dene honge.\n\n**Process:**\nNeeche diye gaye button par click karein, aapke liye ek private channel khulega jahan aapko answers dene hain.")
            .setColor("#ff6600")
            .setFooter({ text: 'OrangeMC Management Team', iconURL: message.guild.iconURL() });

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('start_app_btn')
                .setLabel('Apply Now (Open Ticket)')
                .setStyle(ButtonStyle.Success)
        );

        await message.channel.send({ embeds: [embed], components: [row] });
    }

    if (message.content === '!app-toggle') {
        if (!message.member.permissions.has(PermissionFlagsBits.Administrator)) {
            return message.reply("Aapke paas permission nahi hai.");
        }

        isApplicationOpen = !isApplicationOpen;
        const status = isApplicationOpen ? "🟢 OPEN" : "🔴 CLOSED";
        await message.reply(`Discord Staff Applications ab **${status}** ho chuke hain!`);
    }
});

// Ticket Handling for 10 Questions
client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton()) return;

    if (interaction.customId === 'start_app_btn') {
        if (!isApplicationOpen) {
            return await interaction.reply({ content: "Sorry! Applications abhi closed hain.", ephemeral: true });
        }

        // Fix: Pehle hi reply ko acknowledge kar rahe hain bina defer kiye taaki timeout na ho
        const channelName = `app-${interaction.user.username}`.toLowerCase().replace(/[^a-z0-9]/g, '');
        const existingChannel = interaction.guild.channels.cache.find(c => c.name === channelName);
        
        if (existingChannel) {
            return await interaction.reply({ content: `Aapka application channel pehle se khula hai: ${existingChannel}`, ephemeral: true });
        }

        // Instant reply taaki "Interaction Failed" na dikhaye
        await interaction.reply({ content: "⏳ Aapka private application channel banaya ja raha hai...", ephemeral: true });

        try {
            // Private Channel Create karna
            const ticketChannel = await interaction.guild.channels.create({
                name: channelName,
                type: ChannelType.GuildText,
                permissionOverwrites: [
                    {
                        id: interaction.guild.id, // Hide from everyone
                        deny: [PermissionFlagsBits.ViewChannel],
                    },
                    {
                        id: interaction.user.id, // Show to applicant
                        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory],
                    },
                    {
                        id: client.user.id, // Show to bot
                        allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.EmbedLinks],
                    }
                ],
            });

            const questionsEmbed = new EmbedBuilder()
                .setTitle("📝 OrangeMC Staff Application Form")
                .setDescription("Neeche diye gaye **10 Questions** ka jawab ek hi bade message me ya step-by-step isi channel me type karke bhejein.\n\n" +
                    "**1.** Aapki real age kya hai aur aap kahan se hain?\n" +
                    "**2.** Aap Discord par roz kitna samay (hours) de sakte hain?\n" +
                    "**3.** Kya aapne pehle kisi server me Staff/Mod ka kaam kiya hai?\n" +
                    "**4.** Aapko Discord permissions aur Moderation bots ki kitni samajh hai?\n" +
                    "**5.** Aap hamare hi server ke staff kyu banna chahte hain?\n" +
                    "**6.** Aap baaki applicants se kaise alag hain aur hamara server aapko kyu select kare?\n" +
                    "**7.** (Scenario) Agar chat me koi bhot toxic ho raha ho, toh aapka pehla action kya hoga?\n" +
                    "**8.** (Scenario) Agar koi co-staff apni powers ka galat use kare, toh aap kya karenge?\n" +
                    "**9.** (Scenario) Agar server par achanak link-spam ya bots ka Raid ho jaye, toh aap kya karenge?\n" +
                    "**10.** Kya aap bina bataye inactive hone par staff role se hataye jaane ke liye taiyar hain?\n\n" +
                    "*Jawab dene ke baad niche diye gaye **'Submit Application'** button par click karein.*")
                .setColor("#ffaa00");

            const row = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setCustomId(`submit_app_${interaction.user.id}`)
                    .setLabel('Submit Application')
                    .setStyle(ButtonStyle.Primary)
            );

            await ticketChannel.send({ content: `${interaction.user}, Welcome! Aapka form yahan taiyar hai.`, embeds: [questionsEmbed], components: [row] });
            
            // Edit the instant reply with the final channel link
            await interaction.editReply({ content: `✅ Aapka application channel ban gaya hai: ${ticketChannel}` });

        } catch (error) {
            console.error("Channel Create Error:", error);
            await interaction.editReply({ content: "❌ Channel banane me dikkat aayi. Check karein ki bot ke paas sahi permissions hain." });
        }
    }

    // Submit handling
    if (interaction.customId.startsWith('submit_app_')) {
        const userId = interaction.customId.split('_');
        if (interaction.user.id !== userId) {
            return await interaction.reply({ content: "Sirf applicant hi is button ko daba sakta hai.", ephemeral: true });
        }

        await interaction.reply({ content: "🔄 Application submit ho rahi hai... please wait." });

        try {
            const logChannel = client.channels.cache.get(process.env.APPLICATION_CHANNEL_ID);
            const messages = await interaction.channel.messages.fetch({ limit: 50 });
            
            // Purane se naye messages ko filter karna aur text text jodna
            const userMessages = messages
                .filter(m => m.author.id === userId)
                .map(m => m.content)
                .reverse()
                .join('\n');

            const logEmbed = new EmbedBuilder()
                .setTitle(`🛡️ New 10-Question Application: ${interaction.user.tag}`)
                .setDescription(`**Submitted Answers:**\n\n${userMessages || "*Koi text message nahi mila.*"}`)
                .setColor("#00ff66")
                .setThumbnail(interaction.user.displayAvatarURL())
                .setTimestamp();

            if (logChannel) {
                await logChannel.send({ embeds: [logEmbed] });
                await interaction.channel.send("✅ Aapka application review ke liye bhej diya gaya hai! Yeh channel 5 seconds me delete ho jayega.");
                
                setTimeout(async () => {
                    await interaction.channel.delete().catch(err => console.log("Channel delete error:", err));
                }, 5000);
            } else {
                await interaction.followUp({ content: "Error: Staff log channel nahi mila. APPLICATION_CHANNEL_ID check karein.", ephemeral: true });
            }
        } catch (err) {
            console.error(err);
            await interaction.followUp({ content: "Submission fail ho gayi.", ephemeral: true });
        }
    }
});

client.login(process.env.DISCORD_TOKEN);
