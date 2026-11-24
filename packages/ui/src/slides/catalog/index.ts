// Public API of @lanfermann/ui/slides/catalog: the slide parts described as data (what each is
// for, its props, one example), for whoever writes a deck without reading the source. Plain
// data, no React: a server can serve it as it is.
export { slidesCatalog } from "./catalog.generated";
export type { SlideCatalogEntry, SlideCatalogProp } from "./entry";
export { slideGroups } from "./groups";
