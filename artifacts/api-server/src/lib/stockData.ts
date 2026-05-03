export interface StockMeta {
  symbol: string;
  name: string;
  sector: string;
  exchange: string;
  basePrice: number;
  volatility: number;
  currency: string; // "INR" | "USD"
  marketCapB: number; // in billions of local currency
  pe?: number;
  pb?: number;
  eps?: number;
  roe?: number;
  debtToEquity?: number;
  dividendYield?: number;
  revenueB?: number;
  netProfitB?: number;
  promoterHolding?: number;
  fiiHolding?: number;
  diiHolding?: number;
  bookValue?: number;
  description?: string;
  capCategory?: "large" | "mid" | "small";
  trendBias?: number; // drift added to daily candle return: positive = bullish trend, negative = bearish
}

export const STOCKS: StockMeta[] = [
  // ── Indian NSE stocks ──────────────────────────────────────────────────────
  {
    symbol: "RELIANCE", name: "Reliance Industries Ltd.", sector: "Energy", exchange: "NSE",
    basePrice: 2950, volatility: 0.015, currency: "INR", marketCapB: 19900,
    capCategory: "large",
    pe: 28.4, pb: 2.1, eps: 103.8, roe: 8.7, debtToEquity: 0.35, dividendYield: 0.35,
    revenueB: 9017, netProfitB: 670, promoterHolding: 50.3, fiiHolding: 21.5, diiHolding: 17.2, bookValue: 1410,
    description: "India's largest company by revenue. Operates in energy, petrochemicals, retail, and digital services (Jio).",
  },
  {
    symbol: "TCS", name: "Tata Consultancy Services Ltd.", sector: "Information Technology", exchange: "NSE",
    basePrice: 3980, volatility: 0.013, currency: "INR", marketCapB: 14500,
    capCategory: "large",
    pe: 31.2, pb: 14.8, eps: 127.6, roe: 47.6, debtToEquity: 0.02, dividendYield: 1.5,
    revenueB: 2380, netProfitB: 466, promoterHolding: 72.3, fiiHolding: 12.8, diiHolding: 9.4, bookValue: 268,
    description: "India's largest IT services company. Serves global clients across banking, retail, manufacturing and more.",
  },
  {
    symbol: "HDFCBANK", name: "HDFC Bank Ltd.", sector: "Banking", exchange: "NSE",
    basePrice: 1620, volatility: 0.014, currency: "INR", marketCapB: 12300,
    capCategory: "large",
    pe: 19.8, pb: 2.8, eps: 81.8, roe: 15.2, debtToEquity: 6.8, dividendYield: 1.2,
    revenueB: 2174, netProfitB: 645, promoterHolding: 0, fiiHolding: 52.1, diiHolding: 26.4, bookValue: 579,
    description: "India's largest private sector bank by assets. Known for strong retail banking and quality loan book.",
  },
  {
    symbol: "INFY", name: "Infosys Ltd.", sector: "Information Technology", exchange: "NSE",
    basePrice: 1780, volatility: 0.016, currency: "INR", marketCapB: 7400,
    capCategory: "large",
    pe: 25.4, pb: 7.6, eps: 70.1, roe: 30.7, debtToEquity: 0.04, dividendYield: 2.4,
    revenueB: 1535, netProfitB: 262, promoterHolding: 14.7, fiiHolding: 33.5, diiHolding: 34.2, bookValue: 234,
    description: "India's second-largest IT services company. Strong presence in North America with digital transformation services.",
  },
  {
    symbol: "ICICIBANK", name: "ICICI Bank Ltd.", sector: "Banking", exchange: "NSE",
    basePrice: 1230, volatility: 0.016, currency: "INR", marketCapB: 8650,
    capCategory: "large",
    pe: 18.3, pb: 3.0, eps: 67.2, roe: 17.4, debtToEquity: 7.1, dividendYield: 0.9,
    revenueB: 1680, netProfitB: 440, promoterHolding: 0, fiiHolding: 46.8, diiHolding: 32.5, bookValue: 410,
    description: "India's second-largest private sector bank. Diversified across retail, corporate, and SME segments.",
  },
  {
    symbol: "HINDUNILVR", name: "Hindustan Unilever Ltd.", sector: "FMCG", exchange: "NSE",
    basePrice: 2350, volatility: 0.011, currency: "INR", marketCapB: 5520,
    capCategory: "large",
    pe: 53.4, pb: 11.8, eps: 44.0, roe: 21.7, debtToEquity: 0.0, dividendYield: 1.8,
    revenueB: 601, netProfitB: 102, promoterHolding: 61.9, fiiHolding: 14.6, diiHolding: 14.5, bookValue: 199,
    description: "India's leading FMCG company. Portfolio spans food, home care, personal care and beauty segments.",
  },
  {
    symbol: "SBIN", name: "State Bank of India", sector: "Banking", exchange: "NSE",
    basePrice: 820, volatility: 0.018, currency: "INR", marketCapB: 7320,
    capCategory: "large",
    pe: 10.4, pb: 1.7, eps: 78.8, roe: 16.6, debtToEquity: 12.1, dividendYield: 1.8,
    revenueB: 3940, netProfitB: 618, promoterHolding: 57.5, fiiHolding: 10.4, diiHolding: 24.6, bookValue: 482,
    description: "India's largest public sector bank. Extensive rural and urban network across the country.",
  },
  {
    symbol: "BAJFINANCE", name: "Bajaj Finance Ltd.", sector: "NBFC", exchange: "NSE",
    basePrice: 7200, volatility: 0.024, currency: "INR", marketCapB: 4350,
    capCategory: "large",
    pe: 33.8, pb: 6.2, eps: 213.0, roe: 19.2, debtToEquity: 3.9, dividendYield: 0.3,
    revenueB: 528, netProfitB: 144, promoterHolding: 54.8, fiiHolding: 22.5, diiHolding: 12.4, bookValue: 1160,
    description: "India's largest non-banking financial company. Specializes in consumer lending, SME finance and deposits.",
  },
  {
    symbol: "BHARTIARTL", name: "Bharti Airtel Ltd.", sector: "Telecom", exchange: "NSE",
    basePrice: 1680, volatility: 0.019, currency: "INR", marketCapB: 9820,
    capCategory: "large",
    pe: 78.2, pb: 8.5, eps: 21.5, roe: 11.3, debtToEquity: 2.4, dividendYield: 0.4,
    revenueB: 1514, netProfitB: 88, promoterHolding: 55.9, fiiHolding: 18.1, diiHolding: 14.6, bookValue: 197,
    description: "India's largest telecom operator. Rapidly expanding 5G network across 500+ cities.",
  },
  {
    symbol: "KOTAKBANK", name: "Kotak Mahindra Bank Ltd.", sector: "Banking", exchange: "NSE",
    basePrice: 1870, volatility: 0.015, currency: "INR", marketCapB: 3720,
    capCategory: "large",
    pe: 22.1, pb: 3.5, eps: 84.6, roe: 16.3, debtToEquity: 6.2, dividendYield: 0.1,
    revenueB: 862, netProfitB: 160, promoterHolding: 25.9, fiiHolding: 38.4, diiHolding: 23.5, bookValue: 534,
    description: "India's premium private sector bank known for quality assets and strong capital adequacy.",
  },
  {
    symbol: "WIPRO", name: "Wipro Ltd.", sector: "Information Technology", exchange: "NSE",
    basePrice: 480, volatility: 0.017, currency: "INR", marketCapB: 2500,
    capCategory: "mid",
    pe: 22.6, pb: 3.7, eps: 21.2, roe: 16.8, debtToEquity: 0.12, dividendYield: 0.2,
    revenueB: 897, netProfitB: 111, promoterHolding: 72.9, fiiHolding: 10.4, diiHolding: 9.1, bookValue: 130,
    description: "Global IT services and consulting firm. Strong footprint in North America and Europe.",
  },
  {
    symbol: "LT", name: "Larsen & Toubro Ltd.", sector: "Infrastructure", exchange: "NSE",
    basePrice: 3620, volatility: 0.016, currency: "INR", marketCapB: 5080,
    capCategory: "large",
    pe: 34.5, pb: 4.8, eps: 104.8, roe: 14.6, debtToEquity: 1.8, dividendYield: 0.8,
    revenueB: 2209, netProfitB: 148, promoterHolding: 0, fiiHolding: 22.4, diiHolding: 36.8, bookValue: 754,
    description: "India's largest engineering & construction conglomerate. Active in defense, IT, and heavy engineering.",
  },
  {
    symbol: "AXISBANK", name: "Axis Bank Ltd.", sector: "Banking", exchange: "NSE",
    basePrice: 1120, volatility: 0.018, currency: "INR", marketCapB: 3460,
    capCategory: "large",
    pe: 15.8, pb: 2.1, eps: 70.9, roe: 14.2, debtToEquity: 7.5, dividendYield: 0.1,
    revenueB: 1120, netProfitB: 220, promoterHolding: 8.2, fiiHolding: 50.2, diiHolding: 26.4, bookValue: 534,
    description: "India's third largest private sector bank. Growing retail and digital banking franchise.",
  },
  {
    symbol: "HCLTECH", name: "HCL Technologies Ltd.", sector: "Information Technology", exchange: "NSE",
    basePrice: 1680, volatility: 0.014, currency: "INR", marketCapB: 4560,
    capCategory: "large",
    pe: 27.2, pb: 7.1, eps: 61.8, roe: 26.2, debtToEquity: 0.06, dividendYield: 3.1,
    revenueB: 1094, netProfitB: 165, promoterHolding: 60.8, fiiHolding: 18.2, diiHolding: 13.5, bookValue: 236,
    description: "Third-largest Indian IT company. Known for software and infrastructure services to global enterprises.",
  },
  {
    symbol: "MARUTI", name: "Maruti Suzuki India Ltd.", sector: "Automobile", exchange: "NSE",
    basePrice: 12400, volatility: 0.018, currency: "INR", marketCapB: 3860,
    capCategory: "large",
    pe: 25.8, pb: 4.2, eps: 481.0, roe: 17.3, debtToEquity: 0.0, dividendYield: 1.0,
    revenueB: 1340, netProfitB: 149, promoterHolding: 58.2, fiiHolding: 18.3, diiHolding: 13.2, bookValue: 2950,
    description: "India's leading passenger vehicle manufacturer. Dominant market share in entry-level and mid-size segments.",
  },
  {
    symbol: "TITAN", name: "Titan Company Ltd.", sector: "Consumer Discretionary", exchange: "NSE",
    basePrice: 3450, volatility: 0.019, currency: "INR", marketCapB: 3060,
    capCategory: "large",
    pe: 89.4, pb: 17.2, eps: 38.6, roe: 20.1, debtToEquity: 0.04, dividendYield: 0.3,
    revenueB: 424, netProfitB: 34, promoterHolding: 52.9, fiiHolding: 17.6, diiHolding: 17.9, bookValue: 200,
    description: "Leading jewelry, watches, and eyewear company in India. Tanishq is India's most trusted jewelry brand.",
  },
  {
    symbol: "SUNPHARMA", name: "Sun Pharmaceutical Industries", sector: "Pharmaceuticals", exchange: "NSE",
    basePrice: 1820, volatility: 0.016, currency: "INR", marketCapB: 4360,
    capCategory: "large",
    pe: 38.4, pb: 5.4, eps: 47.4, roe: 14.8, debtToEquity: 0.03, dividendYield: 0.6,
    revenueB: 486, netProfitB: 99, promoterHolding: 54.5, fiiHolding: 19.2, diiHolding: 16.4, bookValue: 338,
    description: "India's largest pharmaceutical company. Strong generic drug presence in the US and emerging markets.",
  },
  {
    symbol: "TATAMOTORS", name: "Tata Motors Ltd.", sector: "Automobile", exchange: "NSE",
    basePrice: 940, volatility: 0.028, currency: "INR", marketCapB: 3450,
    capCategory: "large",
    pe: 10.6, pb: 3.8, eps: 88.7, roe: 41.5, debtToEquity: 1.4, dividendYield: 0.4,
    revenueB: 4384, netProfitB: 310, promoterHolding: 46.4, fiiHolding: 17.8, diiHolding: 19.5, bookValue: 247,
    description: "India's leading automobile manufacturer. Owns Jaguar Land Rover and growing EV business.",
  },
  {
    symbol: "TATASTEEL", name: "Tata Steel Ltd.", sector: "Metals", exchange: "NSE",
    basePrice: 162, volatility: 0.026, currency: "INR", marketCapB: 2020,
    capCategory: "mid",
    pe: 15.4, pb: 1.6, eps: 10.5, roe: 10.8, debtToEquity: 1.9, dividendYield: 1.2,
    revenueB: 2297, netProfitB: 131, promoterHolding: 33.8, fiiHolding: 18.4, diiHolding: 26.4, bookValue: 101,
    description: "One of the world's top steel producers. Operations in India and Europe with high-grade steel products.",
  },
  {
    symbol: "ADANIENT", name: "Adani Enterprises Ltd.", sector: "Conglomerate", exchange: "NSE",
    basePrice: 2650, volatility: 0.038, currency: "INR", marketCapB: 3020,
    capCategory: "large",
    pe: 62.5, pb: 8.2, eps: 42.4, roe: 13.5, debtToEquity: 1.1, dividendYield: 0.1,
    revenueB: 988, netProfitB: 40, promoterHolding: 72.6, fiiHolding: 10.2, diiHolding: 7.4, bookValue: 323,
    description: "Flagship company of the Adani Group. Incubates new businesses across airports, green energy, defense.",
  },
  {
    symbol: "ITC", name: "ITC Ltd.", sector: "FMCG", exchange: "NSE",
    basePrice: 468, volatility: 0.014, currency: "INR", marketCapB: 5830,
    capCategory: "large",
    pe: 27.6, pb: 7.5, eps: 16.9, roe: 27.8, debtToEquity: 0.0, dividendYield: 3.3,
    revenueB: 753, netProfitB: 199, promoterHolding: 0, fiiHolding: 41.7, diiHolding: 37.6, bookValue: 62,
    description: "Leading Indian conglomerate with cigarettes, FMCG, agri-business, paper, and hotels.",
  },
  {
    symbol: "TECHM", name: "Tech Mahindra Ltd.", sector: "Information Technology", exchange: "NSE",
    basePrice: 1520, volatility: 0.022, currency: "INR", marketCapB: 1860,
    capCategory: "mid",
    pe: 28.4, pb: 3.9, eps: 53.5, roe: 14.1, debtToEquity: 0.07, dividendYield: 1.6,
    revenueB: 538, netProfitB: 59, promoterHolding: 35.2, fiiHolding: 25.8, diiHolding: 18.4, bookValue: 390,
    description: "IT and BPO services company. Strong in telecom vertical. Part of Mahindra Group.",
  },
  {
    symbol: "JSWSTEEL", name: "JSW Steel Ltd.", sector: "Metals", exchange: "NSE",
    basePrice: 940, volatility: 0.024, currency: "INR", marketCapB: 2290,
    capCategory: "mid",
    pe: 20.4, pb: 2.8, eps: 46.1, roe: 14.5, debtToEquity: 1.3, dividendYield: 0.6,
    revenueB: 1730, netProfitB: 96, promoterHolding: 44.8, fiiHolding: 26.2, diiHolding: 16.8, bookValue: 335,
    description: "India's largest private steel producer. Expanding capacity aggressively to serve domestic demand.",
  },
  {
    symbol: "NESTLEIND", name: "Nestle India Ltd.", sector: "FMCG", exchange: "NSE",
    basePrice: 2280, volatility: 0.012, currency: "INR", marketCapB: 2200,
    capCategory: "large",
    pe: 72.1, pb: 68.5, eps: 31.6, roe: 97.2, debtToEquity: 0.0, dividendYield: 1.5,
    revenueB: 191, netProfitB: 31, promoterHolding: 62.8, fiiHolding: 13.6, diiHolding: 10.8, bookValue: 33,
    description: "India's leading FMCG company. Maggi noodles, KitKat, Munch and Nescafe are iconic brands.",
  },
  {
    symbol: "ASIANPAINT", name: "Asian Paints Ltd.", sector: "Consumer Discretionary", exchange: "NSE",
    basePrice: 2620, volatility: 0.016, currency: "INR", marketCapB: 2510,
    capCategory: "large",
    pe: 52.8, pb: 14.2, eps: 49.6, roe: 27.2, debtToEquity: 0.03, dividendYield: 1.0,
    revenueB: 348, netProfitB: 47, promoterHolding: 52.6, fiiHolding: 17.8, diiHolding: 17.4, bookValue: 184,
    description: "India's #1 paint company. Operations in 15 countries. Known for quality paints and innovative home decor.",
  },
  {
    symbol: "ULTRACEMCO", name: "UltraTech Cement Ltd.", sector: "Cement", exchange: "NSE",
    basePrice: 11200, volatility: 0.017, currency: "INR", marketCapB: 3240,
    capCategory: "large",
    pe: 38.2, pb: 5.8, eps: 293.2, roe: 15.8, debtToEquity: 0.28, dividendYield: 0.4,
    revenueB: 726, netProfitB: 81, promoterHolding: 59.7, fiiHolding: 14.6, diiHolding: 16.4, bookValue: 1931,
    description: "India's largest cement company. Significant capacity expansion underway to meet infrastructure demand.",
  },
  {
    symbol: "ONGC", name: "Oil & Natural Gas Corp Ltd.", sector: "Energy", exchange: "NSE",
    basePrice: 268, volatility: 0.019, currency: "INR", marketCapB: 3380,
    capCategory: "large",
    pe: 7.8, pb: 1.1, eps: 34.4, roe: 14.6, debtToEquity: 0.36, dividendYield: 4.5,
    revenueB: 1700, netProfitB: 434, promoterHolding: 58.9, fiiHolding: 8.4, diiHolding: 26.4, bookValue: 244,
    description: "India's largest oil & gas exploration company. Government-owned with massive reserves onshore and offshore.",
  },
  {
    symbol: "NTPC", name: "NTPC Ltd.", sector: "Power", exchange: "NSE",
    basePrice: 370, volatility: 0.016, currency: "INR", marketCapB: 3590,
    capCategory: "large",
    pe: 18.5, pb: 2.4, eps: 20.0, roe: 13.1, debtToEquity: 1.5, dividendYield: 2.4,
    revenueB: 1812, netProfitB: 202, promoterHolding: 51.1, fiiHolding: 14.6, diiHolding: 25.2, bookValue: 154,
    description: "India's largest power utility. Expanding into renewable energy with a target of 60GW by 2032.",
  },
  {
    symbol: "BPCL", name: "Bharat Petroleum Corp Ltd.", sector: "Energy", exchange: "NSE",
    basePrice: 320, volatility: 0.021, currency: "INR", marketCapB: 1390,
    capCategory: "mid", trendBias: -0.015,
    pe: 8.4, pb: 1.8, eps: 38.1, roe: 22.4, debtToEquity: 1.2, dividendYield: 5.6,
    revenueB: 4982, netProfitB: 165, promoterHolding: 52.9, fiiHolding: 11.2, diiHolding: 22.4, bookValue: 177,
    description: "India's second-largest oil refining and marketing company. Network of 20,000+ fuel stations.",
  },
  {
    symbol: "ZOMATO", name: "Zomato Ltd.", sector: "Internet & Technology", exchange: "NSE",
    basePrice: 248, volatility: 0.035, currency: "INR", marketCapB: 2200,
    capCategory: "mid", trendBias: -0.018,
    pe: 412.0, pb: 10.8, eps: 0.6, roe: 2.8, debtToEquity: 0.0, dividendYield: 0.0,
    revenueB: 127, netProfitB: 4, promoterHolding: 0, fiiHolding: 58.2, diiHolding: 16.8, bookValue: 23,
    description: "India's leading food delivery platform. Expanding into quick commerce (Blinkit) and dining.",
  },
  {
    symbol: "IRCTC", name: "Indian Railway Catering and Tourism Corp Ltd.", sector: "Services", exchange: "NSE",
    basePrice: 935, volatility: 0.02, currency: "INR", marketCapB: 750,
    capCategory: "large",
    pe: 58.4, pb: 16.2, eps: 16.0, roe: 27.1, debtToEquity: 0.0, dividendYield: 1.2,
    revenueB: 4.2, netProfitB: 1.3, promoterHolding: 62.4, fiiHolding: 9.2, diiHolding: 15.8, bookValue: 58,
    description: "Indian Railways ticketing, catering, and tourism services company.",
  },
  {
    symbol: "HUDCO", name: "Housing and Urban Development Corp Ltd.", sector: "Financials", exchange: "NSE",
    basePrice: 285, volatility: 0.021, currency: "INR", marketCapB: 520,
    capCategory: "mid",
    pe: 16.8, pb: 2.3, eps: 16.9, roe: 13.7, debtToEquity: 6.4, dividendYield: 1.9,
    revenueB: 2.9, netProfitB: 0.6, promoterHolding: 89.8, fiiHolding: 2.1, diiHolding: 3.4, bookValue: 124,
    description: "Government-owned housing finance and infrastructure lender.",
  },
  {
    symbol: "NHPC", name: "NHPC Ltd.", sector: "Power", exchange: "NSE",
    basePrice: 112, volatility: 0.019, currency: "INR", marketCapB: 410,
    capCategory: "mid",
    pe: 18.2, pb: 1.6, eps: 6.2, roe: 8.9, debtToEquity: 0.9, dividendYield: 2.8,
    revenueB: 1.8, netProfitB: 0.3, promoterHolding: 67.4, fiiHolding: 4.8, diiHolding: 11.2, bookValue: 70,
    description: "Hydropower generation company focused on renewable energy.",
  },
  {
    symbol: "SJVN", name: "SJVN Ltd.", sector: "Power", exchange: "NSE",
    basePrice: 138, volatility: 0.022, currency: "INR", marketCapB: 115,
    capCategory: "small",
    pe: 21.4, pb: 2.1, eps: 6.5, roe: 9.8, debtToEquity: 0.8, dividendYield: 2.4,
    revenueB: 1.2, netProfitB: 0.25, promoterHolding: 81.9, fiiHolding: 2.2, diiHolding: 4.1, bookValue: 65,
    description: "Hydropower and renewable energy company with projects across India and abroad.",
  },
  {
    symbol: "RVNL", name: "Rail Vikas Nigam Ltd.", sector: "Infrastructure", exchange: "NSE",
    basePrice: 382, volatility: 0.029, currency: "INR", marketCapB: 185,
    capCategory: "small", trendBias: -0.016,
    pe: 24.8, pb: 3.4, eps: 15.4, roe: 14.2, debtToEquity: 0.3, dividendYield: 0.9,
    revenueB: 2.1, netProfitB: 0.44, promoterHolding: 72.8, fiiHolding: 5.8, diiHolding: 9.3, bookValue: 113,
    description: "Indian railway infrastructure execution company.",
  },
  {
    symbol: "ISEC", name: "ICICI Securities Ltd.", sector: "Financials", exchange: "NSE",
    basePrice: 684, volatility: 0.026, currency: "INR", marketCapB: 92,
    capCategory: "small",
    pe: 18.9, pb: 4.7, eps: 36.2, roe: 24.1, debtToEquity: 0.1, dividendYield: 2.1,
    revenueB: 0.9, netProfitB: 0.18, promoterHolding: 79.2, fiiHolding: 4.3, diiHolding: 6.5, bookValue: 145,
    description: "Retail brokerage and financial services company.",
  },
  {
    symbol: "TATAPOWER", name: "Tata Power Company Ltd.", sector: "Power", exchange: "NSE",
    basePrice: 428, volatility: 0.028, currency: "INR", marketCapB: 1370,
    capCategory: "mid", trendBias: -0.016,
    pe: 34.6, pb: 4.2, eps: 12.4, roe: 12.8, debtToEquity: 1.6, dividendYield: 0.5,
    revenueB: 587, netProfitB: 43, promoterHolding: 46.9, fiiHolding: 19.4, diiHolding: 17.8, bookValue: 102,
    description: "India's leading integrated power company with generation, transmission and distribution businesses.",
  },
  {
    symbol: "IRFC", name: "Indian Railway Finance Corp Ltd.", sector: "Financial Services", exchange: "NSE",
    basePrice: 195, volatility: 0.031, currency: "INR", marketCapB: 2540,
    capCategory: "mid", trendBias: -0.014,
    pe: 28.2, pb: 3.8, eps: 6.9, roe: 13.6, debtToEquity: 9.4, dividendYield: 1.1,
    revenueB: 262, netProfitB: 64, promoterHolding: 86.4, fiiHolding: 3.2, diiHolding: 4.8, bookValue: 51,
    description: "Dedicated market borrowing arm of Indian Railways. Funds rolling stock and infrastructure assets.",
  },
  {
    symbol: "POLYCAB", name: "Polycab India Ltd.", sector: "Consumer Discretionary", exchange: "NSE",
    basePrice: 6180, volatility: 0.022, currency: "INR", marketCapB: 922,
    capCategory: "mid", trendBias: -0.017,
    pe: 44.2, pb: 9.8, eps: 139.8, roe: 23.4, debtToEquity: 0.1, dividendYield: 0.5,
    revenueB: 203, netProfitB: 17, promoterHolding: 67.6, fiiHolding: 14.2, diiHolding: 9.6, bookValue: 631,
    description: "India's largest manufacturer of cables and wires. Fast-growing FMEG brand with fans and lights.",
  },
  {
    symbol: "PERSISTENT", name: "Persistent Systems Ltd.", sector: "Information Technology", exchange: "NSE",
    basePrice: 5240, volatility: 0.024, currency: "INR", marketCapB: 808,
    capCategory: "mid", trendBias: -0.019,
    pe: 62.8, pb: 16.4, eps: 83.4, roe: 27.2, debtToEquity: 0.0, dividendYield: 0.4,
    revenueB: 99, netProfitB: 12, promoterHolding: 31.2, fiiHolding: 32.4, diiHolding: 24.6, bookValue: 319,
    description: "Fast-growing IT services company focused on BFSI and technology verticals globally.",
  },
  {
    symbol: "COFORGE", name: "Coforge Ltd.", sector: "Information Technology", exchange: "NSE",
    basePrice: 7820, volatility: 0.027, currency: "INR", marketCapB: 486,
    capCategory: "mid", trendBias: -0.021,
    pe: 70.4, pb: 14.2, eps: 111.1, roe: 21.8, debtToEquity: 0.2, dividendYield: 0.4,
    revenueB: 79, netProfitB: 7, promoterHolding: 0, fiiHolding: 38.4, diiHolding: 22.8, bookValue: 550,
    description: "Mid-tier IT services company. Strong in BFSI and travel verticals with AI-driven solutions.",
  },
  {
    symbol: "INDHOTEL", name: "The Indian Hotels Company Ltd.", sector: "Consumer Discretionary", exchange: "NSE",
    basePrice: 692, volatility: 0.026, currency: "INR", marketCapB: 986,
    capCategory: "mid", trendBias: -0.013,
    pe: 64.8, pb: 9.2, eps: 10.7, roe: 15.4, debtToEquity: 0.4, dividendYield: 0.4,
    revenueB: 79, netProfitB: 15, promoterHolding: 38.1, fiiHolding: 22.6, diiHolding: 26.4, bookValue: 75,
    description: "Flagship hospitality company of Tata Group. Operates Taj, Vivanta and Ginger hotel brands.",
  },
  {
    symbol: "MUTHOOTFIN", name: "Muthoot Finance Ltd.", sector: "Financial Services", exchange: "NSE",
    basePrice: 1980, volatility: 0.023, currency: "INR", marketCapB: 795,
    capCategory: "mid", trendBias: -0.012,
    pe: 16.8, pb: 3.2, eps: 117.9, roe: 20.8, debtToEquity: 3.4, dividendYield: 1.0,
    revenueB: 142, netProfitB: 43, promoterHolding: 73.4, fiiHolding: 9.2, diiHolding: 12.8, bookValue: 619,
    description: "India's largest gold loan NBFC. Strong presence in South India with growing pan-India operations.",
  },
  {
    symbol: "VOLTAS", name: "Voltas Ltd.", sector: "Consumer Discretionary", exchange: "NSE",
    basePrice: 1620, volatility: 0.025, currency: "INR", marketCapB: 536,
    capCategory: "small",
    pe: 82.4, pb: 8.6, eps: 19.7, roe: 11.2, debtToEquity: 0.0, dividendYield: 0.5,
    revenueB: 106, netProfitB: 7, promoterHolding: 30.3, fiiHolding: 20.8, diiHolding: 26.4, bookValue: 188,
    description: "India's leading air conditioner brand. Tata Group company with engineering projects division.",
  },
  {
    symbol: "DIXON", name: "Dixon Technologies Ltd.", sector: "Consumer Discretionary", exchange: "NSE",
    basePrice: 16800, volatility: 0.038, currency: "INR", marketCapB: 1010,
    capCategory: "mid",
    pe: 148.2, pb: 28.4, eps: 113.4, roe: 21.6, debtToEquity: 0.3, dividendYield: 0.1,
    revenueB: 337, netProfitB: 7, promoterHolding: 34.2, fiiHolding: 26.8, diiHolding: 22.4, bookValue: 591,
    description: "India's largest EMS (electronics manufacturing services) company. Manufactures TVs, mobiles, and appliances.",
  },
  {
    symbol: "CUMMINSIND", name: "Cummins India Ltd.", sector: "Capital Goods", exchange: "NSE",
    basePrice: 3490, volatility: 0.022, currency: "INR", marketCapB: 484,
    capCategory: "small",
    pe: 42.6, pb: 12.2, eps: 81.9, roe: 29.6, debtToEquity: 0.0, dividendYield: 1.4,
    revenueB: 73, netProfitB: 11, promoterHolding: 51.0, fiiHolding: 19.4, diiHolding: 18.6, bookValue: 286,
    description: "Leading manufacturer of diesel and natural gas engines in India. Subsidiary of US-based Cummins Inc.",
  },
  {
    symbol: "ABFRL", name: "Aditya Birla Fashion and Retail Ltd.", sector: "Consumer Discretionary", exchange: "NSE",
    basePrice: 294, volatility: 0.034, currency: "INR", marketCapB: 284,
    capCategory: "small",
    pe: undefined, pb: 6.8, eps: -4.2, roe: -8.4, debtToEquity: 2.1, dividendYield: 0.0,
    revenueB: 147, netProfitB: -4, promoterHolding: 55.2, fiiHolding: 14.6, diiHolding: 22.4, bookValue: 43,
    description: "India's leading fashion retailer. Owns Pantaloons, Louis Philippe, Van Heusen, and Allen Solly brands.",
  },
  {
    symbol: "ASTRAL", name: "Astral Ltd.", sector: "Consumer Discretionary", exchange: "NSE",
    basePrice: 2140, volatility: 0.026, currency: "INR", marketCapB: 360,
    capCategory: "small", trendBias: -0.014,
    pe: 72.8, pb: 14.2, eps: 29.4, roe: 20.8, debtToEquity: 0.06, dividendYield: 0.2,
    revenueB: 66, netProfitB: 5, promoterHolding: 56.4, fiiHolding: 16.8, diiHolding: 16.2, bookValue: 151,
    description: "Leading pipes and adhesive products manufacturer in India with pan-India distribution.",
  },

  // ── US stocks ─────────────────────────────────────────────────────────────
  { symbol: "AAPL", name: "Apple Inc.", sector: "Technology", exchange: "NASDAQ", basePrice: 189.5, volatility: 0.018, currency: "USD", marketCapB: 2950, pe: 28.5, pb: 47.2, eps: 6.6, roe: 171.0, dividendYield: 0.5, description: "World's most valuable consumer electronics company. iPhone, Mac, services ecosystem." },
  { symbol: "MSFT", name: "Microsoft Corp.", sector: "Technology", exchange: "NASDAQ", basePrice: 415.2, volatility: 0.016, currency: "USD", marketCapB: 3080, pe: 36.4, pb: 13.2, eps: 11.4, roe: 37.3, dividendYield: 0.7, description: "Enterprise software and cloud leader. Azure, Office 365, and Copilot AI products." },
  { symbol: "NVDA", name: "NVIDIA Corp.", sector: "Technology", exchange: "NASDAQ", basePrice: 875.0, volatility: 0.032, currency: "USD", marketCapB: 2160, pe: 67.4, pb: 34.0, eps: 13.0, roe: 53.2, dividendYield: 0.04, description: "World's leading GPU maker. Dominant in AI training chips and data center accelerators." },
  { symbol: "TSLA", name: "Tesla Inc.", sector: "Consumer Discretionary", exchange: "NASDAQ", basePrice: 248.0, volatility: 0.042, currency: "USD", marketCapB: 792, pe: 62.1, pb: 12.4, eps: 4.0, roe: 22.5, dividendYield: 0.0, description: "Leading EV manufacturer. Expanding into energy storage and autonomous driving." },
  { symbol: "AMZN", name: "Amazon.com Inc.", sector: "Consumer Discretionary", exchange: "NASDAQ", basePrice: 185.0, volatility: 0.022, currency: "USD", marketCapB: 1940, pe: 43.5, pb: 8.2, eps: 4.3, roe: 19.2, dividendYield: 0.0, description: "World's largest e-commerce company. AWS cloud platform and Prime ecosystem." },
  { symbol: "GOOGL", name: "Alphabet Inc.", sector: "Communication Services", exchange: "NASDAQ", basePrice: 176.0, volatility: 0.019, currency: "USD", marketCapB: 2190, pe: 23.8, pb: 6.2, eps: 7.4, roe: 26.4, dividendYield: 0.5, description: "Google search, YouTube, cloud, and Waymo autonomous vehicles." },
  { symbol: "META", name: "Meta Platforms Inc.", sector: "Communication Services", exchange: "NASDAQ", basePrice: 510.0, volatility: 0.025, currency: "USD", marketCapB: 1310, pe: 26.3, pb: 8.1, eps: 19.4, roe: 32.8, dividendYield: 0.4, description: "Facebook, Instagram, WhatsApp. Investing heavily in AI and metaverse." },
  { symbol: "JPM", name: "JPMorgan Chase & Co.", sector: "Financials", exchange: "NYSE", basePrice: 198.0, volatility: 0.014, currency: "USD", marketCapB: 571, pe: 11.8, pb: 1.9, eps: 16.8, roe: 16.2, dividendYield: 2.4, description: "America's largest bank. Investment banking, consumer banking, and asset management." },
  { symbol: "AMD", name: "Advanced Micro Devices", sector: "Technology", exchange: "NASDAQ", basePrice: 178.0, volatility: 0.038, currency: "USD", marketCapB: 288, pe: 148.0, pb: 3.8, eps: 1.2, roe: 2.6, dividendYield: 0.0, description: "CPU and GPU maker competing with Intel and NVIDIA. EPYC data center chips gaining share." },
  { symbol: "COIN", name: "Coinbase Global Inc.", sector: "Financials", exchange: "NASDAQ", basePrice: 225.0, volatility: 0.055, currency: "USD", marketCapB: 54, pe: undefined, pb: 6.2, eps: undefined, roe: 35.4, dividendYield: 0.0, description: "Largest US crypto exchange. Revenue tied to crypto trading volumes and institutional adoption." },
];

// Seeded random number generator for deterministic data
function seededRng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

export interface Candle {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export function generateCandles(symbol: string, periodDays: number, interval: "1d" | "1w"): Candle[] {
  const stock = STOCKS.find(s => s.symbol === symbol);
  const basePrice = stock?.basePrice ?? 100;
  const volatility = stock?.volatility ?? 0.02;

  const rng = seededRng(symbol.split("").reduce((a, c) => a + c.charCodeAt(0), 0) + periodDays);
  const trendBias = stock?.trendBias ?? 0;
  const candles: Candle[] = [];

  const end = new Date();
  end.setHours(0, 0, 0, 0);
  const step = interval === "1w" ? 7 : 1;
  const totalCandles = Math.ceil(periodDays / step);

  let price = basePrice * (0.85 + rng() * 0.3);

  for (let i = totalCandles - 1; i >= 0; i--) {
    const date = new Date(end);
    date.setDate(date.getDate() - i * step);

    if (interval === "1d" && (date.getDay() === 0 || date.getDay() === 6)) continue;

    const dailyReturn = (rng() - 0.48 + trendBias) * volatility * 2;
    const open = price;
    const close = open * (1 + dailyReturn);
    const highMult = 1 + rng() * volatility;
    const lowMult = 1 - rng() * volatility;
    const high = Math.max(open, close) * highMult;
    const low = Math.min(open, close) * lowMult;
    const volume = Math.floor(500_000 + rng() * 80_000_000);

    candles.push({
      date: date.toISOString().split("T")[0],
      open: +open.toFixed(2),
      high: +high.toFixed(2),
      low: +low.toFixed(2),
      close: +close.toFixed(2),
      volume,
    });

    price = close;
  }

  return candles;
}

export function periodToDays(period: string): number {
  switch (period) {
    case "1mo": return 30;
    case "3mo": return 90;
    case "6mo": return 180;
    case "1y": return 365;
    case "2y": return 730;
    default: return 90;
  }
}

// ── Technical Indicator Calculations ──────────────────────────────────────────

export function calcSMA(closes: number[], period: number): (number | null)[] {
  return closes.map((_, i) => {
    if (i < period - 1) return null;
    const slice = closes.slice(i - period + 1, i + 1);
    return +(slice.reduce((a, b) => a + b, 0) / period).toFixed(4);
  });
}

export function calcEMA(closes: number[], period: number): (number | null)[] {
  const k = 2 / (period + 1);
  const result: (number | null)[] = new Array(closes.length).fill(null);
  let ema = closes.slice(0, period).reduce((a, b) => a + b, 0) / period;
  result[period - 1] = +ema.toFixed(4);
  for (let i = period; i < closes.length; i++) {
    ema = closes[i] * k + ema * (1 - k);
    result[i] = +ema.toFixed(4);
  }
  return result;
}

export function calcRSI(closes: number[], period = 14): (number | null)[] {
  const result: (number | null)[] = new Array(closes.length).fill(null);
  if (closes.length < period + 1) return result;

  let avgGain = 0, avgLoss = 0;
  for (let i = 1; i <= period; i++) {
    const diff = closes[i] - closes[i - 1];
    if (diff > 0) avgGain += diff; else avgLoss -= diff;
  }
  avgGain /= period; avgLoss /= period;

  const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
  result[period] = +(100 - 100 / (1 + rs)).toFixed(2);

  for (let i = period + 1; i < closes.length; i++) {
    const diff = closes[i] - closes[i - 1];
    const gain = diff > 0 ? diff : 0;
    const loss = diff < 0 ? -diff : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
    const r = avgLoss === 0 ? 100 : avgGain / avgLoss;
    result[i] = +(100 - 100 / (1 + r)).toFixed(2);
  }
  return result;
}

export interface MACDData {
  macd: number | null;
  signal: number | null;
  histogram: number | null;
}

export function calcMACD(closes: number[]): MACDData[] {
  const ema12 = calcEMA(closes, 12);
  const ema26 = calcEMA(closes, 26);

  const macdLine: (number | null)[] = closes.map((_, i) => {
    if (ema12[i] == null || ema26[i] == null) return null;
    return +((ema12[i] as number) - (ema26[i] as number)).toFixed(4);
  });

  const macdValues = macdLine.filter((v): v is number => v !== null);
  const signalEMA = calcEMA(macdValues, 9);
  let sigIdx = 0;
  const signalFull: (number | null)[] = macdLine.map(v => {
    if (v === null) return null;
    return signalEMA[sigIdx++];
  });

  return closes.map((_, i) => ({
    macd: macdLine[i],
    signal: signalFull[i],
    histogram: macdLine[i] != null && signalFull[i] != null
      ? +((macdLine[i] as number) - (signalFull[i] as number)).toFixed(4)
      : null,
  }));
}

export interface BBData {
  upper: number | null;
  middle: number | null;
  lower: number | null;
}

export function calcBollingerBands(closes: number[], period = 20, stdDev = 2): BBData[] {
  return closes.map((_, i) => {
    if (i < period - 1) return { upper: null, middle: null, lower: null };
    const slice = closes.slice(i - period + 1, i + 1);
    const mean = slice.reduce((a, b) => a + b, 0) / period;
    const variance = slice.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / period;
    const sd = Math.sqrt(variance);
    return {
      upper: +(mean + stdDev * sd).toFixed(4),
      middle: +mean.toFixed(4),
      lower: +(mean - stdDev * sd).toFixed(4),
    };
  });
}

export function getStockBySymbol(symbol: string): StockMeta | undefined {
  return STOCKS.find(s => s.symbol === symbol.toUpperCase());
}

export function getCurrentPrice(symbol: string): { price: number; change: number; changePercent: number } {
  const candles = generateCandles(symbol.toUpperCase(), 5, "1d");
  const stock = getStockBySymbol(symbol);
  if (candles.length < 2) return { price: stock?.basePrice ?? 100, change: 0, changePercent: 0 };
  const latest = candles[candles.length - 1];
  const prev = candles[candles.length - 2];
  const change = +(latest.close - prev.close).toFixed(2);
  const changePercent = +((change / prev.close) * 100).toFixed(2);
  return { price: latest.close, change, changePercent };
}

// ── Extended Indicators ────────────────────────────────────────────────────

export interface StochasticData { k: number | null; d: number | null; }

export function calcStochastic(
  highs: number[], lows: number[], closes: number[], kPeriod = 14, dPeriod = 3
): StochasticData[] {
  const n = closes.length;
  const k: (number | null)[] = new Array(n).fill(null);
  for (let i = kPeriod - 1; i < n; i++) {
    const h = Math.max(...highs.slice(i - kPeriod + 1, i + 1));
    const l = Math.min(...lows.slice(i - kPeriod + 1, i + 1));
    k[i] = h === l ? 50 : +((closes[i] - l) / (h - l) * 100).toFixed(2);
  }
  const kFilled = k.map(v => v ?? 0);
  const dSmoothed = calcSMA(kFilled, dPeriod);
  const d: (number | null)[] = k.map((v, i) => v === null ? null : dSmoothed[i]);
  return closes.map((_, i) => ({ k: k[i], d: d[i] }));
}

export function calcCCI(
  highs: number[], lows: number[], closes: number[], period = 20
): (number | null)[] {
  return closes.map((_, i) => {
    if (i < period - 1) return null;
    const typicals = Array.from({ length: period }, (__, j) => {
      const idx = i - period + 1 + j;
      return (highs[idx] + lows[idx] + closes[idx]) / 3;
    });
    const mean = typicals.reduce((a, b) => a + b, 0) / period;
    const meanDev = typicals.reduce((a, b) => a + Math.abs(b - mean), 0) / period;
    if (meanDev === 0) return 0;
    return +((typicals[typicals.length - 1] - mean) / (0.015 * meanDev)).toFixed(2);
  });
}

export function calcWilliamsR(
  highs: number[], lows: number[], closes: number[], period = 14
): (number | null)[] {
  return closes.map((_, i) => {
    if (i < period - 1) return null;
    const h = Math.max(...highs.slice(i - period + 1, i + 1));
    const l = Math.min(...lows.slice(i - period + 1, i + 1));
    if (h === l) return -50;
    return +((h - closes[i]) / (h - l) * -100).toFixed(2);
  });
}

export function calcATR(
  highs: number[], lows: number[], closes: number[], period = 14
): (number | null)[] {
  const tr: number[] = highs.map((h, i) =>
    i === 0 ? h - lows[i] : Math.max(h - lows[i], Math.abs(h - closes[i - 1]), Math.abs(lows[i] - closes[i - 1]))
  );
  const result: (number | null)[] = new Array(closes.length).fill(null);
  if (tr.length < period) return result;
  let atr = tr.slice(0, period).reduce((a, b) => a + b, 0) / period;
  result[period - 1] = +atr.toFixed(4);
  for (let i = period; i < tr.length; i++) {
    atr = (atr * (period - 1) + tr[i]) / period;
    result[i] = +atr.toFixed(4);
  }
  return result;
}

export function calcOBV(closes: number[], volumes: number[]): number[] {
  const obv: number[] = [0];
  for (let i = 1; i < closes.length; i++) {
    if (closes[i] > closes[i - 1]) obv.push(obv[i - 1] + volumes[i]);
    else if (closes[i] < closes[i - 1]) obv.push(obv[i - 1] - volumes[i]);
    else obv.push(obv[i - 1]);
  }
  return obv;
}

export interface ADXData { adx: number | null; plusDI: number | null; minusDI: number | null; }

export function calcADX(
  highs: number[], lows: number[], closes: number[], period = 14
): ADXData[] {
  const n = closes.length;
  const results: ADXData[] = new Array(n).fill({ adx: null, plusDI: null, minusDI: null });
  if (n < period * 2 + 2) return results;

  const tr: number[] = [0], plusDM: number[] = [0], minusDM: number[] = [0];
  for (let i = 1; i < n; i++) {
    const up = highs[i] - highs[i - 1], down = lows[i - 1] - lows[i];
    tr.push(Math.max(highs[i] - lows[i], Math.abs(highs[i] - closes[i - 1]), Math.abs(lows[i] - closes[i - 1])));
    if (up > down && up > 0) { plusDM.push(up); minusDM.push(0); }
    else if (down > up && down > 0) { plusDM.push(0); minusDM.push(down); }
    else { plusDM.push(0); minusDM.push(0); }
  }

  let sTR = tr.slice(1, period + 1).reduce((a, b) => a + b, 0);
  let sPlus = plusDM.slice(1, period + 1).reduce((a, b) => a + b, 0);
  let sMinus = minusDM.slice(1, period + 1).reduce((a, b) => a + b, 0);
  let adxVal = 0; const dxArr: number[] = [];

  for (let i = period + 1; i < n; i++) {
    sTR = sTR - sTR / period + tr[i];
    sPlus = sPlus - sPlus / period + plusDM[i];
    sMinus = sMinus - sMinus / period + minusDM[i];
    const pDI = sTR === 0 ? 0 : +(100 * sPlus / sTR).toFixed(2);
    const mDI = sTR === 0 ? 0 : +(100 * sMinus / sTR).toFixed(2);
    const dx = pDI + mDI === 0 ? 0 : +(100 * Math.abs(pDI - mDI) / (pDI + mDI)).toFixed(2);
    dxArr.push(dx);
    if (dxArr.length >= period) {
      adxVal = dxArr.length === period
        ? dxArr.reduce((a, b) => a + b, 0) / period
        : (adxVal * (period - 1) + dx) / period;
      results[i] = { adx: +adxVal.toFixed(2), plusDI: pDI, minusDI: mDI };
    } else {
      results[i] = { adx: null, plusDI: pDI, minusDI: mDI };
    }
  }
  return results;
}

export function computeComprehensiveScore(
  closes: number[], highs: number[], lows: number[], volumes: number[]
) {
  const rsiArr = calcRSI(closes);
  const macdArr = calcMACD(closes);
  const bbArr = calcBollingerBands(closes);
  const stochArr = calcStochastic(highs, lows, closes);
  const cciArr = calcCCI(highs, lows, closes);
  const wrArr = calcWilliamsR(highs, lows, closes);
  const obvArr = calcOBV(closes, volumes);

  const rsi = rsiArr[rsiArr.length - 1];
  const macd = macdArr[macdArr.length - 1];
  const bb = bbArr[bbArr.length - 1];
  const stoch = stochArr[stochArr.length - 1];
  const cci = cciArr[cciArr.length - 1];
  const wr = wrArr[wrArr.length - 1];
  const latest = closes[closes.length - 1];

  let rsiScore = 5;
  if (rsi !== null) {
    if (rsi < 25) rsiScore = 9.5; else if (rsi < 35) rsiScore = 7.5;
    else if (rsi < 45) rsiScore = 6; else if (rsi < 55) rsiScore = 5;
    else if (rsi < 65) rsiScore = 3.5; else if (rsi < 75) rsiScore = 2; else rsiScore = 0.5;
  }
  let macdScore = 5;
  if (macd.histogram !== null && macd.macd !== null) {
    if (macd.histogram > 0 && macd.macd > 0) macdScore = 8;
    else if (macd.histogram > 0) macdScore = 6.5;
    else if (macd.histogram < 0 && macd.macd < 0) macdScore = 2;
    else macdScore = 3.5;
  }
  let stochScore = 5;
  if (stoch.k !== null && stoch.d !== null) {
    const { k, d } = stoch;
    if (k < 20 && k > d) stochScore = 9.5; else if (k < 20) stochScore = 7.5;
    else if (k < 40) stochScore = 6; else if (k < 60) stochScore = 5;
    else if (k < 80) stochScore = 3.5; else if (k > 80 && k < d) stochScore = 1.5; else stochScore = 2.5;
  }
  let cciScore = 5;
  if (cci !== null) {
    if (cci < -200) cciScore = 9.5; else if (cci < -100) cciScore = 7.5;
    else if (cci < -50) cciScore = 6; else if (cci < 50) cciScore = 5;
    else if (cci < 100) cciScore = 3.5; else if (cci < 200) cciScore = 2; else cciScore = 0.5;
  }
  let wrScore = 5;
  if (wr !== null) {
    if (wr < -80) wrScore = 8.5; else if (wr < -60) wrScore = 6.5;
    else if (wr < -40) wrScore = 5; else if (wr < -20) wrScore = 3.5; else wrScore = 2;
  }
  let bbScore = 5;
  if (bb.upper !== null && bb.lower !== null && bb.middle !== null) {
    if (latest <= bb.lower * 1.005) bbScore = 8.5; else if (latest < bb.middle) bbScore = 5.5;
    else if (latest >= bb.upper * 0.995) bbScore = 1.5; else bbScore = 4.5;
  }
  let obvScore = 5;
  if (obvArr.length > 20) {
    const chg = (obvArr[obvArr.length - 1] - obvArr[obvArr.length - 11]) / (Math.abs(obvArr[obvArr.length - 11]) + 1);
    if (chg > 0.1) obvScore = 8; else if (chg > 0.02) obvScore = 6.5;
    else if (chg < -0.1) obvScore = 2; else if (chg < -0.02) obvScore = 3.5;
  }

  const raw = rsiScore*0.25 + macdScore*0.20 + stochScore*0.18 + cciScore*0.12 + wrScore*0.10 + bbScore*0.10 + obvScore*0.05;
  const score = Math.max(5, Math.min(95, Math.round(raw * 10)));

  const signals: string[] = [];
  if (rsiScore >= 7.5) signals.push("RSI oversold — strong buy zone");
  else if (rsiScore <= 2) signals.push("RSI overbought — take profits");
  if (macdScore >= 7) signals.push("MACD bullish crossover confirmed");
  else if (macdScore <= 3) signals.push("MACD bearish crossover");
  if (stochScore >= 8) signals.push("Stochastic oversold with bullish reversal");
  else if (stochScore <= 2.5) signals.push("Stochastic overbought");
  if (cciScore >= 7.5) signals.push("CCI deeply oversold");
  if (wrScore >= 8) signals.push("Williams %R: extreme oversold");
  if (bbScore >= 8) signals.push("Price at lower Bollinger Band support");
  if (obvScore >= 6.5) signals.push("OBV rising — institutional accumulation");
  if (rsiScore >= 7.5 && macdScore >= 7) signals.push("RSI + MACD bullish momentum confirmation");
  if (stochScore >= 8 && cciScore >= 7.5) signals.push("Stochastic + CCI oversold reversal setup");
  if (bbScore >= 8 && obvScore >= 6.5) signals.push("Bollinger + OBV accumulation breakout setup");
  if (wrScore >= 8 && macdScore >= 6.5) signals.push("Williams %R + MACD mean-reversion bounce");

  const direction = score >= 58 ? "bullish" : score <= 42 ? "bearish" : "neutral";
  const overallSignal = score >= 70 ? "strong_buy" : score >= 58 ? "buy" : score <= 30 ? "strong_sell" : score <= 42 ? "sell" : "neutral";
  return { score, direction, overallSignal, signals: signals.slice(0, 5), currentRsi: rsi };
}

export type IndicatorMode = "app" | "rsi" | "macd" | "sma" | "ema" | "bb" | "price_action" | "swing_confluence";

export function computeIndicatorModeScore(
  mode: IndicatorMode,
  closes: number[],
  highs: number[],
  lows: number[],
  volumes: number[]
) {
  const rsiArr = calcRSI(closes);
  const macdArr = calcMACD(closes);
  const sma20Arr = calcSMA(closes, 20);
  const sma50Arr = calcSMA(closes, 50);
  const ema12Arr = calcEMA(closes, 12);
  const ema26Arr = calcEMA(closes, 26);
  const bbArr = calcBollingerBands(closes);
  const stochArr = calcStochastic(highs, lows, closes);
  const cciArr = calcCCI(highs, lows, closes);
  const wrArr = calcWilliamsR(highs, lows, closes);
  const obvArr = calcOBV(closes, volumes);

  const latestClose = closes[closes.length - 1];
  const latestRsi = rsiArr[rsiArr.length - 1];
  const latestMacd = macdArr[macdArr.length - 1];
  const latestSma20 = sma20Arr[sma20Arr.length - 1];
  const latestSma50 = sma50Arr[sma50Arr.length - 1];
  const latestEma12 = ema12Arr[ema12Arr.length - 1];
  const latestEma26 = ema26Arr[ema26Arr.length - 1];
  const latestBb = bbArr[bbArr.length - 1];
  const latestStoch = stochArr[stochArr.length - 1];
  const latestCci = cciArr[cciArr.length - 1];
  const latestWr = wrArr[wrArr.length - 1];
  const obvChange = obvArr.length > 10 ? obvArr[obvArr.length - 1] - obvArr[obvArr.length - 11] : 0;
  const last = closes[closes.length - 1];
  const prev5 = closes[Math.max(0, closes.length - 6)];
  const prev10 = closes[Math.max(0, closes.length - 11)];
  const prev20 = closes[Math.max(0, closes.length - 21)];
  const range20High = Math.max(...highs.slice(-20));
  const range20Low = Math.min(...lows.slice(-20));
  const body = last - (closes[closes.length - 2] ?? last);
  const bodyPct = last ? body / last : 0;
  const trend5 = prev5 ? (last - prev5) / prev5 : 0;
  const trend10 = prev10 ? (last - prev10) / prev10 : 0;
  const trend20 = prev20 ? (last - prev20) / prev20 : 0;

  const useApp = () => computeComprehensiveScore(closes, highs, lows, volumes);

  if (mode === "app") return useApp();

  let score = 50;
  const signals: string[] = [];

  if (mode === "rsi") {
    if (latestRsi != null) {
      if (latestRsi < 30) {
        score = 78;
        signals.push("RSI oversold — rebound setup");
      } else if (latestRsi < 40) {
        score = 64;
        signals.push("RSI improving from weak zone");
      } else if (latestRsi > 70) {
        score = 28;
        signals.push("RSI overbought — profit booking risk");
      } else if (latestRsi > 60) {
        score = 40;
        signals.push("RSI elevated — trend stretched");
      } else {
        score = 52;
        signals.push("RSI neutral");
      }
    }
  } else if (mode === "macd") {
    if (latestMacd.macd != null && latestMacd.histogram != null) {
      if (latestMacd.histogram > 0 && latestMacd.macd > 0) {
        score = 77;
        signals.push("MACD bullish crossover confirmed");
      } else if (latestMacd.histogram > 0) {
        score = 63;
        signals.push("MACD turning positive");
      } else if (latestMacd.histogram < 0 && latestMacd.macd < 0) {
        score = 31;
        signals.push("MACD bearish momentum");
      } else {
        score = 46;
        signals.push("MACD neutral");
      }
    }
  } else if (mode === "sma") {
    if (latestSma20 != null && latestSma50 != null) {
      if (latestClose > latestSma20 && latestSma20 > latestSma50) {
        score = 76;
        signals.push("Price above SMA20 and SMA50");
      } else if (latestClose > latestSma20) {
        score = 61;
        signals.push("Price above short-term SMA");
      } else if (latestClose < latestSma50) {
        score = 34;
        signals.push("Price below SMA50");
      } else {
        score = 48;
        signals.push("SMA trend mixed");
      }
    }
  } else if (mode === "ema") {
    if (latestEma12 != null && latestEma26 != null) {
      if (latestEma12 > latestEma26 && latestClose > latestEma12) {
        score = 75;
        signals.push("EMA12 above EMA26 with price confirmation");
      } else if (latestEma12 > latestEma26) {
        score = 62;
        signals.push("EMA bullish alignment");
      } else if (latestEma12 < latestEma26) {
        score = 35;
        signals.push("EMA bearish alignment");
      } else {
        score = 49;
        signals.push("EMA mixed");
      }
    }
  } else if (mode === "bb") {
    if (latestBb.upper != null && latestBb.lower != null && latestBb.middle != null) {
      if (latestClose <= latestBb.lower * 1.01) {
        score = 79;
        signals.push("Price near lower Bollinger Band");
      } else if (latestClose < latestBb.middle) {
        score = 60;
        signals.push("Price below mid-band");
      } else if (latestClose >= latestBb.upper * 0.99) {
        score = 30;
        signals.push("Price near upper Bollinger Band");
      } else {
        score = 50;
        signals.push("Bollinger Bands neutral");
      }
    }
  } else if (mode === "price_action") {
    const higherHighs = highs.length >= 3 && highs[highs.length - 1] > highs[highs.length - 2] && highs[highs.length - 2] > highs[highs.length - 3];
    const higherLows = lows.length >= 3 && lows[lows.length - 1] > lows[lows.length - 2] && lows[lows.length - 2] > lows[lows.length - 3];
    const breakout = last >= range20High * 0.995;
    const supportHold = last > range20Low * 1.03;
    const bullishCandle = bodyPct > 0.005;
    const bearishCandle = bodyPct < -0.005;

    if (breakout && bullishCandle) {
      score = 80;
      signals.push("Price action breakout above 20-day range");
    } else if (higherHighs && higherLows && supportHold) {
      score = 74;
      signals.push("Price action uptrend with higher highs and higher lows");
    } else if (trend10 > 0.03 && trend20 > 0.01) {
      score = 68;
      signals.push("Price action trending higher");
    } else if (bearishCandle && trend5 < -0.02) {
      score = 32;
      signals.push("Bearish price action pressure");
    } else if (trend20 < -0.03) {
      score = 40;
      signals.push("Price action weak below recent trend");
    } else {
      score = 52;
      signals.push("Price action mixed");
    }

    const squeeze = range20High > 0 && range20Low > 0 && (range20High - range20Low) / range20High < 0.08;
    if (squeeze && bullishCandle) signals.push("Tight range breakout setup");

  } else if (mode === "swing_confluence") {
    // ── Trend-Pullback Confluence (TPC) ────────────────────────────────────
    // Best swing trading method: uptrend → healthy pullback → momentum resuming
    // Based on Minervini SEPA, O'Neil CAN SLIM, and Stan Weinstein Stage Analysis
    let pts = 50;

    // 1. UPTREND FILTER — price must be above both EMAs, EMA20 above EMA50
    const inUptrend = latestEma12 != null && latestEma26 != null && latestClose > latestEma12 && latestEma12 > latestEma26;
    const aboveEma50 = latestSma50 != null && latestClose > latestSma50;
    const ema20AboveEma50 = latestEma12 != null && latestSma50 != null && latestEma12 > latestSma50;

    if (inUptrend && aboveEma50 && ema20AboveEma50) {
      pts += 18;
      signals.push("Uptrend: price above EMA20 & EMA50 with golden alignment");
    } else if (inUptrend || (aboveEma50 && ema20AboveEma50)) {
      pts += 8;
      signals.push("Partial uptrend structure — awaiting full alignment");
    } else if (latestClose < (latestSma50 ?? latestClose)) {
      pts -= 18;
      signals.push("Downtrend: price below EMA50 — avoid long entries");
    }

    // 2. PULLBACK QUALITY — ideal entry is price near EMA20 (within 3%)
    const distFromEma20 = latestEma12 != null ? (latestClose - latestEma12) / latestEma12 : null;
    if (distFromEma20 != null) {
      if (distFromEma20 >= -0.03 && distFromEma20 <= 0.04) {
        pts += 15;
        signals.push("Pullback to EMA20 — ideal swing entry zone");
      } else if (distFromEma20 > 0.04 && distFromEma20 < 0.10) {
        pts += 5;
        signals.push("Slight extension above EMA20 — still tradeable");
      } else if (distFromEma20 > 0.10) {
        pts -= 10;
        signals.push("Price stretched >10% above EMA20 — high entry risk");
      } else if (distFromEma20 < -0.08) {
        pts -= 12;
        signals.push("Price deeply below EMA20 — trend may be broken");
      }
    }

    // 3. RSI PULLBACK ZONE — ideal RSI for swing re-entry is 40–60
    if (latestRsi != null) {
      if (latestRsi >= 40 && latestRsi <= 60) {
        pts += 12;
        signals.push(`RSI ${latestRsi.toFixed(0)} in ideal swing entry zone (40–60)`);
      } else if (latestRsi > 60 && latestRsi < 70) {
        pts += 4;
        signals.push(`RSI ${latestRsi.toFixed(0)} slightly elevated — momentum still present`);
      } else if (latestRsi >= 70) {
        pts -= 12;
        signals.push(`RSI ${latestRsi.toFixed(0)} overbought — poor swing entry timing`);
      } else if (latestRsi < 30) {
        pts -= 8;
        signals.push(`RSI ${latestRsi.toFixed(0)} deeply oversold — trend may be breaking`);
      }
    }

    // 4. MACD MOMENTUM RESUMING — histogram turning positive = buyers returning
    if (latestMacd.macd != null && latestMacd.histogram != null && latestMacd.signal != null) {
      const prevMacd = macdArr.length > 2 ? macdArr[macdArr.length - 2] : null;
      const histTurning = prevMacd?.histogram != null && prevMacd.histogram < 0 && latestMacd.histogram > 0;
      const histImproving = prevMacd?.histogram != null && latestMacd.histogram > prevMacd.histogram && latestMacd.histogram > -0.5;

      if (histTurning && latestMacd.macd > 0) {
        pts += 14;
        signals.push("MACD histogram bullish crossover — momentum resuming");
      } else if (histTurning || histImproving) {
        pts += 8;
        signals.push("MACD histogram improving — sellers weakening");
      } else if (latestMacd.histogram < 0 && latestMacd.macd < 0) {
        pts -= 10;
        signals.push("MACD bearish — momentum not yet recovered");
      }
    }

    // 5. VOLUME DRY-UP on pullback (key sign sellers are exhausted)
    const avgVol20 = volumes.length >= 20 ? volumes.slice(-20).reduce((a, b) => a + b, 0) / 20 : null;
    const avgVol5 = volumes.length >= 5 ? volumes.slice(-5).reduce((a, b) => a + b, 0) / 5 : null;
    if (avgVol20 && avgVol5) {
      const volRatio = avgVol5 / avgVol20;
      if (volRatio < 0.75) {
        pts += 10;
        signals.push("Volume drying up on pullback — sellers exhausting");
      } else if (volRatio > 1.5) {
        pts -= 6;
        signals.push("High volume on pullback — distribution risk");
      }
    }

    // 6. TIGHT BASE / LOW VOLATILITY SQUEEZE before next move
    const bbWidth = latestBb.upper != null && latestBb.lower != null && latestBb.middle != null
      ? (latestBb.upper - latestBb.lower) / latestBb.middle
      : null;
    if (bbWidth != null && bbWidth < 0.06 && inUptrend) {
      pts += 8;
      signals.push("Tight Bollinger squeeze in uptrend — breakout setup forming");
    }

    // 7. HIGHER HIGHS + HIGHER LOWS structure
    const hhhl = highs.length >= 4 &&
      highs[highs.length - 1] > highs[highs.length - 3] &&
      lows[lows.length - 1] > lows[lows.length - 3];
    if (hhhl && inUptrend) {
      pts += 6;
      signals.push("Higher highs & higher lows — strong trend structure");
    }

    score = Math.max(5, Math.min(95, Math.round(pts)));
    if (!signals.length) signals.push("Swing confluence neutral — no clear setup");
  }

  const momentumBoost =
    (latestStoch.k != null && latestStoch.d != null && latestStoch.k < 20 && latestStoch.k > latestStoch.d ? 6 : 0) +
    (latestCci != null && latestCci < -100 ? 4 : 0) +
    (latestWr != null && latestWr < -80 ? 4 : 0) +
    (obvChange > 0 ? 3 : 0);

  score = Math.max(5, Math.min(95, Math.round(score + momentumBoost)));
  const direction = score >= 58 ? "bullish" : score <= 42 ? "bearish" : "neutral";
  const overallSignal = score >= 70 ? "strong_buy" : score >= 58 ? "buy" : score <= 30 ? "strong_sell" : score <= 42 ? "sell" : "neutral";

  if (!signals.length) signals.push("Indicator mode neutral");

  return { score, direction, overallSignal, signals, currentRsi: latestRsi };
}

export function generateHorizonPrediction(
  symbol: string, currentPrice: number, volatility: number, score: number, horizonDays: number
) {
  let s = symbol.split("").reduce((a, c) => a + c.charCodeAt(0), 0) + horizonDays * 31 + Math.floor(Date.now() / 86400000);
  const rng = () => { s = (s * 9301 + 49297) % 233280; return s / 233280; };

  const biasPct = ((score - 50) / 50) * 0.28 * Math.min(horizonDays / 30, 2.5);
  const horizonVol = volatility * Math.sqrt(horizonDays / 252);
  const changePercent = +((biasPct + (rng() - 0.48) * horizonVol * 0.4) * 100).toFixed(2);
  const targetPrice = +(currentPrice * (1 + changePercent / 100)).toFixed(2);
  const changeAmount = +(targetPrice - currentPrice).toFixed(2);
  const direction = changePercent > 0.25 ? "bullish" : changePercent < -0.25 ? "bearish" : "neutral";
  const baseConf = score >= 68 ? 76 : score >= 58 ? 68 : score >= 42 ? 56 : 48;
  const confidence = Math.max(30, Math.min(88, Math.round(baseConf - Math.min(horizonDays * 0.2, 18) + (rng() - 0.5) * 8)));
  return { targetPrice, changeAmount, direction, confidence };
}

export function computeSignals(closes: number[]) {
  const rsiValues = calcRSI(closes);
  const macdData = calcMACD(closes);
  const bb = calcBollingerBands(closes);
  const latest = closes[closes.length - 1];

  const currentRsi = rsiValues[rsiValues.length - 1];
  const latestMacd = macdData[macdData.length - 1];
  const latestBB = bb[bb.length - 1];

  const rsiSignal = currentRsi == null ? "neutral"
    : currentRsi < 35 ? "oversold"
    : currentRsi > 65 ? "overbought"
    : "neutral";

  const macdSignal = latestMacd.macd == null || latestMacd.histogram == null ? "neutral"
    : latestMacd.histogram > 0 && latestMacd.macd > 0 ? "bullish"
    : latestMacd.histogram < 0 && latestMacd.macd < 0 ? "bearish"
    : "neutral";

  const bbSignal = latestBB.upper == null ? "neutral"
    : latest > latestBB.upper * 0.99 ? "near_upper"
    : latest < latestBB.lower! * 1.01 ? "near_lower"
    : "neutral";

  let score = 0;
  if (rsiSignal === "oversold") score += 2;
  if (rsiSignal === "overbought") score -= 2;
  if (macdSignal === "bullish") score += 2;
  if (macdSignal === "bearish") score -= 2;
  if (bbSignal === "near_lower") score += 1;
  if (bbSignal === "near_upper") score -= 1;

  const overallSignal = score >= 4 ? "strong_buy"
    : score >= 2 ? "buy"
    : score <= -4 ? "strong_sell"
    : score <= -2 ? "sell"
    : "neutral";

  return { currentRsi, rsiSignal, macdSignal, bbSignal, overallSignal };
}
