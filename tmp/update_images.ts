import fs from "fs";
import path from "path";
import { MENU_PRODUCTS } from "./src/data/menuData";

const imageFiles = fs.readdirSync("public/images").filter(f => !fs.statSync(path.join("public/images", f)).isDirectory());
const bebidaFiles = fs.existsSync("public/images/bebidas") ? fs.readdirSync("public/images/bebidas") : [];

const updates: Record<string, string> = {};

MENU_PRODUCTS.forEach(p => {
  let matched = "";
  const rawCode = p.code ? String(p.code) : null;
  const pCode = p.code ? String(p.code).padStart(2, "0") : null;
  const cleanFlavor = p.name.replace(/^\d+\s*-\s*/, "").trim();

  if (p.category === "bebidas") {
    if (p.id === "bebida-sprite-2l" || p.id === "bebida-soda-2l") {
      matched = "/images/bebidas/Sprite%202%20litros.png?v=5";
    } else if (p.id === "bebida-coca-2l") {
      matched = "/images/bebidas/Coca-Cola%20ou%20Coca-Cola%20Zero%202%20litros.png?v=5";
    } else if (p.id === "bebida-fanta-2l") {
      matched = "/images/bebidas/Fanta%20Uva%20ou%20Fanta%20Laranja%202%20litros.png?v=5";
    } else if (p.id === "bebida-guarana-2l") {
      matched = "/images/bebidas/Guaran%C3%A1%20Antarctica%202%20litros.png?v=5";
    } else if (p.id === "bebida-dolly-2l") {
      matched = "/images/bebidas/Dolly%202%20litros%20ou%20Conven%C3%A7%C3%A3o%202%20litros.jpg?v=5";
    } else if (p.id === "bebida-suco-caixa") {
      matched = "/images/bebidas/Suco%20caixa.jpg?v=5";
    } else if (p.id === "bebida-suco-lata") {
      matched = "/images/bebidas/Suco%20lata.jpg?v=5";
    } else if (p.id === "bebida-agua") {
      matched = "/images/bebidas/%C3%81gua.jpg?v=5";
    } else if (p.id === "bebida-h2oh-500ml") {
      matched = "/images/bebidas/H2OH!%20500%20ml.jpg?v=5";
    } else if (p.id === "bebida-refri-600ml") {
      matched = "/images/bebidas/Refrigerante%20600%20ml%20(sabores).jpg?v=5";
    } else if (p.id === "bebida-coca-1l") {
      matched = "/images/bebidas/Coca-Cola%201%20litro.jpg?v=5";
    } else if (p.id === "bebida-tonica") {
      matched = "/images/bebidas/T%C3%B4nica%20ou%20Schweppes.jpg?v=5";
    }
  } else if (p.isPizza) {
    if (p.id === "pizza-esp-54") {
      matched = "";
    } else {
      const numbered = imageFiles.find(f => (rawCode && f.startsWith(rawCode + " -")) || (pCode && f.startsWith(pCode + " -")));
      if (numbered) {
        matched = `/images/${encodeURI(numbered)}?v=5`;
      } else {
        const exact = imageFiles.find(f => f.replace(/\.[^.]+$/, "").toLowerCase() === cleanFlavor.toLowerCase());
        if (exact) {
          matched = `/images/${encodeURI(exact)}?v=5`;
        }
      }
    }
  }

  updates[p.id] = matched;
});

let content = fs.readFileSync("src/data/menuData.ts", "utf8");

for (const [id, newImage] of Object.entries(updates)) {
  const regex = new RegExp(`(id:\\s*['"]${id}['"][\\s\\S]*?image:\\s*)['"][^'"]*['"]`);
  if (regex.test(content)) {
    content = content.replace(regex, `$1'${newImage}'`);
  } else {
    console.warn("Could not find regex match for id:", id);
  }
}

fs.writeFileSync("src/data/menuData.ts", content, "utf8");
console.log("Successfully updated menuData.ts with verified physical image URLs!");
