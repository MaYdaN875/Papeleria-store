/**
 * synonyms.ts
 * Mapa de sinónimos para expandir búsquedas
 * Ejemplo: "boligrafo" también buscara "pluma"
 * Mejora de UX: el usuario puede encuentrar productos aunque use palabras diferentes o mal hechas. (tanto en español como en ingles por si hay usuarios que usen ambos idiomas)
 */

export const PRODUCT_SYNONYMS: Record<string, string[]> = {
    // Escritura
    boligrafo: ["pluma", "bolígrafo"],
    pluma: ["boligrafo", "bolígrafo"],
    bolígrafo: ["boligrafo", "pluma"],
    lapiz: ["lápiz", "grafito"],
    lápiz: ["lapiz", "grafito"],
    grafito: ["lapiz", "lápiz"],

    // Cuadernos
    cuaderno: ["libreta", "cuadernillo"],
    libreta: ["cuaderno", "cuadernillo"],
    cuadernillo: ["cuaderno", "libreta"],
    block: ["bloc", "libreta"],
    bloc: ["block", "libreta"],

    // Papel
    papel: ["hoja", "resma"],
    hoja: ["papel", "resma"],
    resma: ["papel", "hoja", "paquete"],
    paquete: ["resma", "papel"],

    // Pegamento
    pegamento: ["adhesivo", "goma", "cola", "pegante"],
    adhesivo: ["pegamento", "goma", "cola"],
    goma: ["pegamento", "adhesivo", "cola"],
    cola: ["pegamento", "goma", "pegante"],
    pegante: ["pegamento", "cola"],

    // Tijeras
    tijera: ["tijeras", "cortatapas"],
    tijeras: ["tijera", "cortatapas"],
    cortatapas: ["tijera", "tijeras"],

    // Material escolar
    escolar: ["educativo", "escuela", "estudiante"],
    educativo: ["escolar", "escuela"],
    escuela: ["escolar", "educativo"],

    // Marcadores
    marcador: ["plumón", "rotulador"],
    plumón: ["marcador", "rotulador"],
    rotulador: ["marcador", "plumón"],

    // Colores / Lápices de color
    color: ["colores", "lápiz color", "cromado"],
    colores: ["color", "cromado", "lápiz color"],
    cromado: ["color", "colores", "lápiz color"],
}

/**
 * Expande una búsqueda incluyendo sinónimos
 * Ejemplo: "boligrafo" → "boligrafo pluma"
 */
export function expandSearchWithSynonyms(query: string): string {
    const terms = query.toLowerCase().split(/\s+/).filter(Boolean)
    const expandedTerms = new Set<string>(terms)

    // Agregar sinónimos de cada término
    for (const term of terms) {
        const synonyms = PRODUCT_SYNONYMS[term] || []
        synonyms.forEach((syn) => expandedTerms.add(syn))
    }

    return Array.from(expandedTerms).join(" ")
}
