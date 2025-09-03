import * as Papa from 'papaparse';
import { KeywordRow, BusinessRow, ProductRow } from '../types/analysis';

export class CSVParser {
  static parseKeywordAnalysis(csvContent: string): Promise<KeywordRow[]> {
    return new Promise((resolve, reject) => {
      Papa.parse(csvContent, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          try {
            const keywords: KeywordRow[] = results.data.map((row: any) => {
              const rankings: Record<string, number> = {};
              
              // Extract all columns starting with "B0" (ASINs)
              Object.keys(row).forEach(key => {
                if (key.startsWith('B0') && row[key] && !isNaN(parseInt(row[key]))) {
                  rankings[key] = parseInt(row[key]);
                }
              });

              // Debug logging for parsing (first 3 rows only)
              if (results.data.indexOf(row) < 3) {
                console.log('Parsing row sample:', {
                  keywordPhrase: row['Keyword Phrase'],
                  searchVolume: row['Search Volume'],
                  relevance: row['Rilevanza'],
                  relevanceAlt1: row['Relevance'],
                  relevanceAlt2: row['relevance'],
                  relevanceParsed: parseFloat(row['Rilevanza']),
                  isBrand: row['Is_Brand'],
                  brandWord: row['Brand_Word'],
                  allColumns: Object.keys(row).filter(key => key.toLowerCase().includes('rile') || key.toLowerCase().includes('relev'))
                });
              }

              // Try different column names for relevance
              let relevance = 0;
              if (row['Rilevanza'] !== undefined && row['Rilevanza'] !== '') {
                relevance = parseFloat(row['Rilevanza']) || 0;
              } else if (row['Relevance'] !== undefined && row['Relevance'] !== '') {
                relevance = parseFloat(row['Relevance']) || 0;
              } else if (row['relevance'] !== undefined && row['relevance'] !== '') {
                relevance = parseFloat(row['relevance']) || 0;
              }

              return {
                keywordPhrase: row['Keyword Phrase'] || '',
                searchVolume: parseInt(row['Search Volume']) || 0,
                relevance: relevance,
                isBrand: row['Is_Brand']?.toString().toLowerCase() === 'true' || 
                         row['Is_Brand']?.toString() === '1' ||
                         (row['Brand_Word'] && row['Brand_Word'].trim() !== ''),
                brandWord: row['Brand_Word']?.trim() || null,
                rankings
              };
            }).filter(kw => kw.keywordPhrase && kw.searchVolume > 0);

            resolve(keywords);
          } catch (error) {
            reject(new Error(`Error parsing keyword analysis: ${error}`));
          }
        },
        error: (error: any) => {
          reject(new Error(`CSV parsing error: ${error.message}`));
        }
      });
    });
  }

  // Helper function to parse European number format
  private static parseEuropeanNumber(value: string): number {
    if (!value || typeof value !== 'string') return 0;
    
    // Remove spaces and handle European format
    // "1.487" (thousands) -> 1487
    // "24.779,36" (thousands with decimals) -> 24779.36
    const cleaned = value.trim();
    
    if (cleaned.includes(',')) {
      // Format: "24.779,36" -> "24779.36" 
      const parts = cleaned.split(',');
      const integerPart = parts[0].replace(/\./g, ''); // Remove all dots
      const decimalPart = parts[1] || '';
      return parseFloat(integerPart + '.' + decimalPart) || 0;
    } else {
      // Format: "1.487" (could be 1487 or 1.487)
      // If more than 3 digits after dot, it's thousands separator
      const parts = cleaned.split('.');
      if (parts.length === 2 && parts[1].length > 2) {
        // This is likely "1.487" = 1487
        return parseInt(cleaned.replace(/\./g, '')) || 0;
      } else if (parts.length > 2) {
        // Multiple dots: "1.234.567" = 1234567
        return parseInt(cleaned.replace(/\./g, '')) || 0;
      } else {
        // Simple number or decimal: "1.5" = 1.5
        return parseFloat(cleaned) || 0;
      }
    }
  }

  static parseBusinessData(csvContent: string): Promise<BusinessRow[]> {
    return new Promise((resolve, reject) => {
      Papa.parse(csvContent, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          try {
            const businessData: BusinessRow[] = results.data.map((row: any, index: number) => {
              const sales = CSVParser.parseEuropeanNumber(row['ASIN Sales']);
              const rating = CSVParser.parseEuropeanNumber(row['Ratings']);
              
              // Debug log for first few rows
              if (index < 3) {
                console.log('Business Data Parse Sample:', {
                  asin: row['ASIN'],
                  brand: row['Brand'],
                  salesRaw: row['ASIN Sales'],
                  salesParsed: sales,
                  revenueRaw: row['ASIN Revenue'],
                  ratingRaw: row['Ratings'],
                  ratingParsed: rating,
                  fulfillment: row['Fulfillment']
                });
              }
              
              return {
                asin: row['ASIN'] || '',
                brand: row['Brand'] || '',
                imageUrl: row['Image URL'] || '',
                sellerCountry: row['Seller Country/Region'] || '',
                rating: rating,
                creationDate: new Date(row['Creation Date']) || new Date(),
                price: row['Price €'] || '',
                sales: sales,
                revenue: row['ASIN Revenue'] || '',
                category: row['Category'] || '',
                fulfillment: row['Fulfillment'] || ''
              };
            }).filter(item => item.asin);

            resolve(businessData);
          } catch (error) {
            reject(new Error(`Error parsing business data: ${error}`));
          }
        },
        error: (error: any) => {
          reject(new Error(`CSV parsing error: ${error.message}`));
        }
      });
    });
  }

  static parseProductData(csvContent: string): Promise<ProductRow[]> {
    return new Promise((resolve, reject) => {
      Papa.parse(csvContent, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          try {
            // Debug: log the first row to see available columns
            if (results.data.length > 0) {
              console.log('Keepa CSV columns:', Object.keys(results.data[0] as any));
            }

            const productData: ProductRow[] = results.data.map((row: any) => {
              const variationString = row['ASIN di variazione'] || '';
              const variationAsins = variationString
                ? variationString.split(',').map((asin: string) => asin.trim())
                : [];

              return {
                asin: row['ASIN'] || '',
                brand: row['Marca'] || '',
                imageUrl: row['Immagine'] || '',
                imageUrlSample: row['Immagine campione'] || '',
                imageCount: parseInt(row['Conteggio delle immagini']) || 0,
                title: row['Titolo'] || '',
                feature1: row['Descrizione & Funzionalità: Funzione 1'] || '',
                feature2: row['Descrizione & Funzionalità: Funzione 2'] || '',
                feature3: row['Descrizione & Funzionalità: Funzione 3'] || '',
                feature4: row['Descrizione & Funzionalità: Funzione 4'] || '',
                feature5: row['Descrizione & Funzionalità: Funzione 5'] || '',
                variationAsins
              };
            }).filter(item => item.asin);

            console.log(`Parsed ${productData.length} products from Keepa CSV`);
            
            // Debug first product
            if (productData.length > 0) {
              console.log('First product sample:', {
                asin: productData[0].asin,
                title: productData[0].title.substring(0, 50) + '...',
                feature1: productData[0].feature1.substring(0, 50) + '...',
                feature2: productData[0].feature2.substring(0, 50) + '...'
              });
            }

            resolve(productData);
          } catch (error) {
            reject(new Error(`Error parsing product data: ${error}`));
          }
        },
        error: (error: any) => {
          reject(new Error(`CSV parsing error: ${error.message}`));
        }
      });
    });
  }
}