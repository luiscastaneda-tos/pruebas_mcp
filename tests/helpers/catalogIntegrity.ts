import { readFileSync } from "node:fs";
import { resolve } from "node:path";
export type CatalogQuery = { id: string; sql: string };
export function readCatalogQueries(): CatalogQuery[] {
  const lines = readFileSync(resolve(process.cwd(), "QUERIES.md"), "utf8").split(/\r?\n/); const out: CatalogQuery[] = [];
  for (let i=0;i<lines.length;i++) { const id=lines[i]?.match(/^###.*?(Q-[A-Z]+-\d+)/)?.[1]; if (!id) continue; const marker=lines.slice(i+1).findIndex(l=>l.includes("**SQL")); if(marker<0) continue; const start=i+1+marker+3; const end=lines.slice(start).findIndex(l=>l.trim()==="```"); if(end<0) continue; const sql=lines.slice(start,start+end).join("\n"); out.push({id,sql}); }
  return out;
}
export function catalogQuery(id: string): CatalogQuery { const found=readCatalogQueries().find(q=>q.id===id); if(!found) throw new Error(`Query no encontrada: ${id}`); return found; }
