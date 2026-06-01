export type Store = {
  id: string;
  name: string;
  handle: string;
  emoji: string;
  cover: string;
  rating: number;
  followers: string;
  live: boolean;
  viewers?: number;
  category: string;
  tagline: string;
};

export type Product = {
  id: string;
  name: string;
  price: number;
  oldPrice?: number;
  emoji: string;
  storeId: string;
  rating: number;
  sold: string;
  description: string;
};

export const stores: Store[] = [
  { id: "s1", name: "Verde Natural", handle: "@verdenatural", emoji: "🥑", cover: "from-emerald-400 to-teal-600", rating: 4.9, followers: "128k", live: true, viewers: 2341, category: "Orgânicos", tagline: "Direto do produtor" },
  { id: "s2", name: "TechBlue", handle: "@techblue", emoji: "💻", cover: "from-blue-500 to-indigo-700", rating: 4.8, followers: "89k", live: true, viewers: 891, category: "Eletrônicos", tagline: "Tecnologia que conecta" },
  { id: "s3", name: "Moda Viva", handle: "@modaviva", emoji: "👗", cover: "from-pink-400 to-rose-600", rating: 4.7, followers: "245k", live: false, category: "Moda", tagline: "Estilo todo dia" },
  { id: "s4", name: "Casa & Cor", handle: "@casaecor", emoji: "🏠", cover: "from-amber-400 to-orange-600", rating: 4.6, followers: "56k", live: true, viewers: 432, category: "Casa", tagline: "Decore com amor" },
  { id: "s5", name: "Sport Pro", handle: "@sportpro", emoji: "⚽", cover: "from-green-500 to-emerald-700", rating: 4.8, followers: "192k", live: false, category: "Esportes", tagline: "Performance real" },
  { id: "s6", name: "Beauty Box", handle: "@beautybox", emoji: "💄", cover: "from-fuchsia-400 to-purple-600", rating: 4.9, followers: "310k", live: true, viewers: 5210, category: "Beleza", tagline: "Sua beleza, ao vivo" },
];

export const products: Product[] = [
  { id: "p1", name: "Abacate Orgânico (1kg)", price: 18.9, oldPrice: 24.9, emoji: "🥑", storeId: "s1", rating: 4.9, sold: "2.1k", description: "Abacates orgânicos selecionados, colhidos no ponto certo. Direto da fazenda para sua casa." },
  { id: "p2", name: "Fone Bluetooth Pro", price: 249.0, oldPrice: 399.0, emoji: "🎧", storeId: "s2", rating: 4.7, sold: "850", description: "Cancelamento de ruído ativo, bateria de 30h, conexão multi-dispositivo." },
  { id: "p3", name: "Vestido Floral Verão", price: 129.9, emoji: "👗", storeId: "s3", rating: 4.8, sold: "3.4k", description: "Tecido leve e fresco, perfeito para os dias quentes. Estampa exclusiva." },
  { id: "p4", name: "Luminária Pendente", price: 189.0, oldPrice: 249.0, emoji: "💡", storeId: "s4", rating: 4.6, sold: "412", description: "Design moderno, ilumina e decora qualquer ambiente." },
  { id: "p5", name: "Tênis Runner X", price: 349.0, emoji: "👟", storeId: "s5", rating: 4.9, sold: "5.6k", description: "Amortecimento de alta performance para corridas longas." },
  { id: "p6", name: "Kit Skincare Glow", price: 159.9, oldPrice: 219.0, emoji: "✨", storeId: "s6", rating: 4.9, sold: "8.2k", description: "Rotina completa para pele radiante: limpeza, hidratação e proteção." },
  { id: "p7", name: "Smartwatch Aqua", price: 599.0, oldPrice: 799.0, emoji: "⌚", storeId: "s2", rating: 4.8, sold: "1.2k", description: "Resistente à água, GPS integrado, monitor de saúde 24h." },
  { id: "p8", name: "Mel Silvestre 500g", price: 32.0, emoji: "🍯", storeId: "s1", rating: 5.0, sold: "980", description: "Mel puro, extraído de florestas preservadas." },
];

export const findStore = (id: string) => stores.find((s) => s.id === id);
export const findProduct = (id: string) => products.find((p) => p.id === id);
export const productsByStore = (storeId: string) => products.filter((p) => p.storeId === storeId);