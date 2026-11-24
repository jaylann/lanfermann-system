import { writeFileSync } from "node:fs";

import { slideGroups } from "../src/slides/catalog/groups.ts";
import { readSlidesCatalog, renderSlidesCatalog } from "./render-slides-catalog.ts";
import { readSlideSource } from "./slides-catalog-source.ts";

const target = new URL("../src/slides/catalog/catalog.generated.ts", import.meta.url);
const entries = readSlidesCatalog(slideGroups, readSlideSource);
writeFileSync(target, renderSlidesCatalog(entries));
console.log(`wrote ${target.pathname} (${entries.length} parts)`);
