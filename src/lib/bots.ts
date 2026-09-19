const BOT_NAMES = [
  'SteamBot_42',
  'SkinFlipper',
  'TradeKing',
  'CSGO_Whale',
  'FloatHunter',
  'CaseOpener99',
  'PurpleRain',
  'GoldRush',
  'MidTierMike',
  'KnifeDreamer',
  'AuctionShark',
  'BidSniper',
  'MarketRat',
  'EuroTrader',
  'NightOwl_ST',
]

export function randomBotName(exclude?: string): string {
  const pool = exclude ? BOT_NAMES.filter((n) => n !== exclude) : BOT_NAMES
  return pool[Math.floor(Math.random() * pool.length)]!
}

export { BOT_NAMES }
