import nextcord
from nextcord.ext import commands
from nextcord.ui import Button, View, Select

# --- INTERACTIVE INTERFACE COMPONENTS ---

class ShopDropdown(Select):
    def __init__(self):
        options = [
            nextcord.SelectOption(label="Minecraft Accounts", description="Premium MC Accounts & Alts", emoji="🎮"),
            nextcord.SelectOption(label="Discord Nitro", description="Cheap Nitro Boost/Basic", emoji="✨"),
            nextcord.SelectOption(label="Streaming Services", description="Netflix, Spotify, Premium keys", emoji="🍿")
        ]
        super().__init__(placeholder="🛒 Select a category to browse...", min_values=1, max_values=1, options=options)

    async def callback(self, interaction: nextcord.Interaction):
        selection = self.values
        
        # Unique Embeds for each chosen category
        embed = nextcord.Embed(title=f"🛍️ {selection} Section", color=0x00ffaa)
        
        if selection == "Minecraft Accounts":
            embed.add_field(name="🔹 MC Full Access (MFA)", value="**Price:** $2.00\n**Stock:** 🟢 24 Left", inline=False)
            embed.add_field(name="🔹 MC Semi-Full Access (SFA)", value="**Price:** $1.00\n**Stock:** 🟢 10 Left", inline=False)
        elif selection == "Discord Nitro":
            embed.add_field(name="🔹 Nitro 1 Month (Promo)", value="**Price:** $1.50\n**Stock:** 🟢 50 Left", inline=False)
            embed.add_field(name="🔹 Nitro 1 Year (Boost)", value="**Price:** $25.00\n**Stock:** 🔴 Out of Stock", inline=False)
        elif selection == "Streaming Services":
            embed.add_field(name="🔹 Netflix 1 Month Premium", value="**Price:** $1.99\n**Stock:** 🟢 5 Left", inline=False)
            
        # Creating the Interactive Action View
        view = View(timeout=None)
        view.add_item(Button(label="Buy Now", style=nextcord.ButtonStyle.green, custom_id="buy_btn"))
        
        # Re-adding the dropdown so users can switch categories easily
        view.add_item(ShopDropdown())
        
        await interaction.response.edit_message(embed=embed, view=view)


class ShopView(View):
    def __init__(self):
        super().__init__(timeout=None)
        self.add_item(ShopDropdown())


# --- BOT MAIN SETUP ---

class StoreBot(commands.Bot):
    def __init__(self):
        intents = nextcord.Intents.default()
        intents.message_content = True
        super().__init__(intents=intents)

    async def on_ready(self):
        print(f"🔥 {self.user.name} Store Bot is now Online and Ready!")
        # Set an English custom status activity for your bot
        await self.change_presence(activity=nextcord.Game(name="Managing SonicMC Store 🛒"))

bot = StoreBot()


# --- INTERACTIVE SLASH COMMAND FOR SHOP GUI ---

@bot.slash_command(name="shop", description="Open the interactive store GUI menu")
async def shop(interaction: nextcord.Interaction):
    embed = nextcord.Embed(
        title="🏪 Welcome to SonicMC Store",
        description="Please select a category from the dropdown menu below to view our products. Our delivery process is secure and streamlined.",
        color=0x3498db
    )
    # Automatically pulls server icon if it exists
    if interaction.guild.icon:
        embed.set_thumbnail(url=interaction.guild.icon.url)
        
    embed.add_field(name="⚡ Instant Delivery", value="Products will be delivered directly to your DMs post-verification.", inline=True)
    embed.add_field(name="🛡️ 100% Secure", value="Automated systems running 24/7 with active support.", inline=True)
    embed.set_footer(text="Powered by SonicMC • Interact using the menu below")
    
    await interaction.response.send_message(embed=embed, view=ShopView())


# --- BUTTON CLICK CALLBACK (POP-UP FORMS) ---

@bot.event
async def on_interaction(interaction: nextcord.Interaction):
    if interaction.type == nextcord.InteractionType.component:
        custom_id = interaction.data.get("custom_id")
        
        if custom_id == "buy_btn":
            # Opens an interactive Graphic Modal (Form Pop-up) inside Discord
            modal = nextcord.ui.Modal(title="Complete Your Purchase")
            
            product_input = nextcord.ui.TextInput(
                label="Product Name", 
                placeholder="e.g., MC Full Access", 
                required=True
            )
            email_input = nextcord.ui.TextInput(
                label="Your Email Address (For Delivery)", 
                placeholder="example@email.com", 
                required=True
            )
            
            modal.add_item(product_input)
            modal.add_item(email_input)
            
            # Action upon submitting the form
            async def modal_callback(modal_interaction: nextcord.Interaction):
                await modal_interaction.response.send_message(
                    f"✅ **Order Request Received!**\nProduct Requested: `{product_input.value}`\n\nOur system/staff will reach out to your DMs shortly with a payment gateway link!", 
                    ephemeral=True
                )
            
            modal.callback = modal_callback
            await interaction.response.send_modal(modal)


# ⚠️ PASTE YOUR SECRETS HERE
bot.run("YOUR_DISCORD_BOT_TOKEN_HERE")
