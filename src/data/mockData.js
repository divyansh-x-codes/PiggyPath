export const STOCKS = [
  { id: 'msft', name: 'Microsoft', ticker: 'MSFT', logo: 'MS', color: '#7C3AED', sector: 'IT', desc: 'Microsoft Corporation is an American multinational technology company.', basePrice: 420, change: 0.0, volume: '9.45L', avgPrice: 418.50, pe: 32.4, eps: 13.0, mktCap: '3.1T' },
  { id: 'aapl', name: 'Apple Inc', ticker: 'AAPL', logo: '🍎', color: '#111', sector: 'IT', desc: 'Apple Inc. is an American multinational technology company.', basePrice: 180, change: 0.0, volume: '12.3L', avgPrice: 178.00, pe: 29.1, eps: 6.8, mktCap: '3.0T' },
  { id: 'googl', name: 'Google', ticker: 'GOOGL', logo: 'G', color: '#EA4335', sector: 'IT', desc: 'Alphabet Inc. is an American multinational technology company.', basePrice: 150, change: 0.0, volume: '8.2L', avgPrice: 148.00, pe: 25.5, eps: 5.4, mktCap: '2.1T' },
  { id: 'reliance', name: 'Reliance', ticker: 'RIL', logo: 'R', color: '#1d4ed8', sector: 'Energy', desc: 'Reliance Industries Limited is an Indian multinational conglomerate.', basePrice: 2890, change: 1.8, volume: '5.2L', avgPrice: 2870, pe: 24.6, eps: 117.5, mktCap: '19.5L Cr' },
  { id: 'tcs', name: 'TCS', ticker: 'TCS', logo: 'TC', color: '#0ea5e9', sector: 'IT', desc: 'Tata Consultancy Services is an Indian multinational IT services company.', basePrice: 3520, change: 0.9, volume: '3.1L', avgPrice: 3490, pe: 28.3, eps: 124.4, mktCap: '12.8L Cr' },
  { id: 'infosys', name: 'Infosys', ticker: 'INFY', logo: 'IN', color: '#059669', sector: 'IT', desc: 'Infosys Limited is an Indian multinational IT company.', basePrice: 1680, change: -0.6, volume: '8.7L', avgPrice: 1700, pe: 22.1, eps: 76.0, mktCap: '7.0L Cr' },
];

export const NEWS = [
  { id: 1, cat: 'Trending', stock: 'Microsoft', ticker: 'MSFT', title: 'Why We Should Buy Microsoft Now', body: 'Analysts bullish on Microsoft Azure cloud business.', change: '+2.5%' },
];

export const IPO_DATA = {
  current: [],
  closed: [],
  listed: []
};
