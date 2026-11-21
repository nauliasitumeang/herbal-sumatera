import { list } from "./data.js";

const searchable = (values) => values.join(" ").normalize("NFC").toLocaleLowerCase("id");
const herbTerms = (remedy) => [remedy.name, remedy.namaIlmiah || "", ...list(remedy.namaLain), remedy.tribeName, remedy.scopeLabel || ""];

export function findCollection(data, keyword = "", category = "all") {
  const query = searchable([keyword.trim()]);
  return {
    remedies: data.remedies.filter((remedy) => (category === "all" || remedy.type === category) && searchable([...herbTerms(remedy), data.regions.find((region) => region.id === remedy.regionId)?.name || ""]).includes(query)),
    tribes: data.tribes.filter((tribe) => searchable([tribe.name, tribe.province, tribe.summary, ...tribe.remedies.flatMap(herbTerms)]).includes(query))
  };
}

export const referencePageSize = 9;
export function findReferences(data, category = "all", keyword = "") {
  const query = searchable([keyword.trim()]);
  return data.references.filter((ref) => (category === "all" || ref.category === category) && searchable([ref.title, ref.author, ref.year, ref.publisher, ref.summary]).includes(query));
}
