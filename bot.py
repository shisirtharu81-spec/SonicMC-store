import nextcord
from nextcord.ext import commands
from nextcord.ui import Button, View, Select
from flask import Flask
from threading import Thread
import os

# ==========================================
# 🌐 STEP 1: BACKGROUND WEB SERVER FOR 24/7 KEEP-ALIVE
# ==========================================
app = Flask('')

@app.route('/')
def home():
    return "🟢 SonicMC Store Bot is operational and running 24/7!"

def run_server():
    app.run(host='0.0.0.0', port=8080)

def keep_alive():
    t = Thread(target=run_server)
    t.start()


# ==========================================
# 🎨 STEP 2: ADVANCED & ANIMATED GUI INTERFACE
# ==========================================

class ShopDropdown(Select):
    def __init__(self):
        options = [
            nextcord.SelectOption(label="Minecraft Accounts", description="Premium MC Accounts & Alts", emoji="🎮"),
            nextcord.SelectOption(label="Discord Nitro", description="Super cheap Nitro Boost/Basic", emoji="✨"),
            nextcord.SelectOption(label="Streaming Services", description="Netflix, Spotify, Premium keys", emoji="🍿")
        ]
        super().__init__(placeholder="⚡ Choose a category from the market...", min_values=1, max_values=1, options=options)

    async def callback(self, interaction: nextcord.Interaction):
        selection = self.values
        
        embed = nextcord.Embed(
            title=f"🛒 {selection} Catalog", 
            description=f"*Select a product below. Or browse full stock on our [Official Web Store](https://storemec.storemc.qzz.io).* \n*Availability updates in real-time.*",
            color=0x00ffaa
        )
        
        if selection == "Minecraft Accounts":
            embed.add_field(name="⚙️ MC Full Access (MFA)", value="> **Price:** $2.00\n> **Stock:** 🟢 24 Available\n> **Features:** Full Email Changeable", inline=False)
            embed.add_field(name="⚙️ MC Semi-Full Access (SFA)", value="> **Price:** $1.00\n> **Stock:** 🟢 10 Available\n> **Features:** Name/Skin Changeable", inline=False)
        elif selection == "Discord Nitro":
            embed.add_field(name="🚀 Nitro 1 Month (Promo Links)", value="> **Price:** $1.50\n> **Stock:** 🟢 50 Available\n> **Features:** Instant activation link", inline=False)
            embed.add_field(name="🚀 Nitro 1 Year (Direct Boost)", value="> **Price:** $25.00\n> **Stock:** 🔴 Out of Stock\n> **Features:** Upgrades your own account", inline=False)
        elif selection == "Streaming Services":
            embed.add_field(name="📺 Netflix 1 Month Premium", value="> **Price:** $1.99\n> **Stock:** 🟢 5 Available\n> **Features:** Ultra HD (4K) Ultra-Screen", inline=False)
            
        embed.set_footer(text="Click 'Purchase Order' to instantly secure your item.")
        
        view = View(timeout=None)
        view.add_item(Button(label="Purchase Order", style=nextcord.ButtonStyle.blurple, custom_id="buy_btn", emoji="💳"))
        
        # 🌐 Aapka Store Link Button Category View Ke Liye
        view.add_item(Button(label="Visit Web Store", style=nextcord.ButtonStyle.link, url="https://storemec.storemc.qzz.io"))
        
        view.add_item(ShopDropdown())
        
        await interaction.response.edit_message(embed=embed, view=view)


class ShopView(View):
    def __init__(self):
        super().__init__(timeout=None)
        # 🌐 Aapka Store Link Button Main Menu Ke Liye
        self.add_item(Button(label="Visit Web Store", style=nextcord.ButtonStyle.link, url="https://storemec.storemc.qzz.io"))
        self.add_item(ShopDropdown())


# ==========================================
# ⚙️ STEP 3: CORE BOT SETUP & INITIATION
# ==========================================

class SonicStoreBot(commands.Bot):
    def __init__(self):
        intents = nextcord.Intents.default()
        intents.message_content = True
        super().__init__(intents=intents)

    async def on_ready(self):
        print(f"==========================================")
        print(f"🔥 STATUS: {self.user.name} is online!")
        print(f"🌐 24/7 Hosting Layer: ACTIVE")
        print(f"==========================================")
        await self.change_presence(activity=nextcord.Streaming(name="SonicMC Market 🛒", url="https://twitch.tv/monstercat"))

bot = SonicStoreBot()


# ==========================================
# 🚀 STEP 4: INTERACTIVE SLASH COMMAND
# ==========================================

@bot.slash_command(name="shop", description="Launch the interactive GUI shopping application")
async def shop(interaction: nextcord.Interaction):
    embed = nextcord.Embed(
        title="✨ SonicMC Premium Marketplace ✨",
        description="Welcome to our fully automated marketplace. Use the intuitive drop-down panel below to browse premium digital assets or visit our [Official Web Store](https://storemec.storemc.qzz.io) for automatic packages.",
        color=0x3498db
    )
    
    if interaction.guild.icon:
        embed.set_thumbnail(url=interaction.guild.icon.url)
        
    embed.add_field(name="⚡ Automated Pipeline", value="📦 Instant distribution pipeline right into your private DMs.", inline=False)
    embed.add_field(name="🛡️ Escrow Protection", value="🔒 Fully verified, encrypted checkout infrastructure.", inline=False)
    
    # 🌐 Footer URL Update
    embed.set_footer(text="Web: storemec.storemc.qzz.io • Built for SonicMC")
    
    await interaction.response.send_message(embed=embed, view=ShopView())


# ==========================================
# 📲 STEP 5: INTERACTIVE MODALS (POP-UP CLIENT FORMS)
# ==========================================

@bot.event
async def on_interaction(interaction: nextcord.Interaction):
    if interaction.type == nextcord.InteractionType.component:
        custom_id = interaction.data.get("custom_id")
        
        if custom_id == "buy_btn":
            modal = nextcord.ui.Modal(title="Secure Checkout Window")
            
            product_input = nextcord.ui.TextInput(
                label="Confirm Product Name", 
                placeholder="e.g., MC Full Access (MFA)", 
                required=True,
                max_length=100
            )
            email_input = nextcord.ui.TextInput(
                label="Your Email (For Product Key Delivery)", 
                placeholder="buyer@domain.com", 
                required=True,
                max_length=150
            )
            
            modal
