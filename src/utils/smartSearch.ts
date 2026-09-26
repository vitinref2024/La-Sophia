import { Product } from '../types';
import { CATEGORIES } from '../data/menuData';

/**
 * Strips accents, lowercases and cleans string
 */
export function normalizeText(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\w\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Maps common Portuguese culinary typos/synonyms
 */
function standardizeTerm(word: string): string {
  if (['mussarela', 'mucarela', 'mozarela', 'muzarela', 'muzzarella'].includes(word)) {
    return 'mussarela';
  }
  if (['catupiry', 'catupiri', 'katupiry', 'katupiri'].includes(word)) {
    return 'catupiry';
  }
  if (['calabreza'].includes(word)) {
    return 'calabresa';
  }
  if (['esfira', 'esfiras', 'esfiha', 'esfihas'].includes(word)) {
    return 'esfiha';
  }
  if (['piza', 'pizzas'].includes(word)) {
    return 'pizza';
  }
  if (['refri', 'refrigerantes', 'refrigerante', 'bebida', 'bebidas'].includes(word)) {
    return 'bebida';
  }
  if (['parmesao', 'parmezao'].includes(word)) {
    return 'parmesao';
  }
  return word;
}

/**
 * Fast Levenshtein distance for fuzzy matching
 */
function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const row: number[] = [];
  for (let i = 0; i <= b.length; i++) {
    row[i] = i;
  }

  for (let i = 1; i <= a.length; i++) {
    let prev = i;
    for (let j = 1; j <= b.length; j++) {
      let val: number;
      if (a[i - 1] === b[j - 1]) {
        val = row[j - 1];
      } else {
        val = Math.min(row[j - 1] + 1, prev + 1, row[j] + 1);
      }
      row[j - 1] = prev;
      prev = val;
    }
    row[b.length] = prev;
  }

  return row[b.length];
}

/**
 * Checks if a token matches any word or substring in the target string
 */
function tokenMatches(token: string, targetNormalized: string, targetWords: string[]): boolean {
  if (targetNormalized.includes(token)) {
    return true;
  }

  // Exact or prefix match against any word
  for (const word of targetWords) {
    if (word === token || word.startsWith(token)) {
      return true;
    }
  }

  // Typo tolerance: only for words with 4+ characters
  if (token.length >= 4) {
    const maxAllowedDist = token.length >= 7 ? 2 : 1;
    for (const word of targetWords) {
      if (Math.abs(word.length - token.length) <= maxAllowedDist) {
        if (levenshtein(token, word) <= maxAllowedDist) {
          return true;
        }
      }
    }
  }

  return false;
}

// Cache category names
const categoryLabelsMap: Record<string, string> = {};
CATEGORIES.forEach((c) => {
  categoryLabelsMap[c.id] = normalizeText(c.label);
});

/**
 * Intelligent search function:
 * - Tolerant to accents, plurals, typos, casing
 * - Searches product name, category, description, ingredients, code, tag
 * - Returns filtered products without duplicates, ordered by relevance
 */
export function searchProducts(products: Product[], query: string): Product[] {
  const normalizedQuery = normalizeText(query);
  if (!normalizedQuery) return products;

  const rawTokens = normalizedQuery.split(' ').filter((t) => t.length > 0);
  if (rawTokens.length === 0) return products;

  const queryTokens = rawTokens.map(standardizeTerm);

  // Score and filter each product
  const scoredProducts: { product: Product; score: number }[] = [];

  for (const product of products) {
    const normalizedName = normalizeText(product.name);
    const normalizedDesc = normalizeText(product.description);
    const normalizedCode = product.code ? product.code.toLowerCase().trim() : '';
    const normalizedCategory = categoryLabelsMap[product.category] || normalizeText(product.category);
    const normalizedTag = product.tag ? normalizeText(product.tag) : '';
    const ingredientsText = product.ingredients ? normalizeText(product.ingredients.join(' ')) : '';
    const typeKeywords = [
      product.isPizza ? 'pizza pizzas' : '',
      product.isEsfiha ? 'esfiha esfihas' : '',
      product.isSweetPizza ? 'doce sobremesa' : '',
      ['bebidas', 'cervejas'].includes(product.category) ? 'bebida refrigerante lata 2l garrafa' : '',
      product.category === 'bordas' ? 'borda recheada' : '',
    ]
      .filter(Boolean)
      .join(' ');

    const fullCorpus = `${normalizedName} ${normalizedCode} ${normalizedDesc} ${ingredientsText} ${normalizedCategory} ${normalizedTag} ${typeKeywords}`;
    const corpusWords = fullCorpus.split(' ').filter((w) => w.length > 0);

    // Every token in query must match
    let allTokensMatch = true;
    let score = 0;

    for (const token of queryTokens) {
      // Check exact code match (e.g. "01", "1", "72")
      if (normalizedCode && (normalizedCode === token || parseInt(normalizedCode, 10).toString() === token)) {
        score += 100;
        continue;
      }

      const matches = tokenMatches(token, fullCorpus, corpusWords);
      if (!matches) {
        allTokensMatch = false;
        break;
      }

      // Relevance scoring
      if (normalizedName.startsWith(token)) {
        score += 50;
      } else if (normalizedName.includes(token)) {
        score += 30;
      } else if (ingredientsText.includes(token)) {
        score += 20;
      } else if (normalizedCategory.includes(token) || typeKeywords.includes(token)) {
        score += 15;
      } else {
        score += 5;
      }
    }

    if (allTokensMatch) {
      scoredProducts.push({ product, score });
    }
  }

  // Sort descending by score, maintaining stable order
  scoredProducts.sort((a, b) => b.score - a.score);

  return scoredProducts.map((sp) => sp.product);
}
