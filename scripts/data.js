export const list = (value) => Array.isArray(value) ? value : value ? [value] : [];

// Research content and visual metadata meet only at the UI boundary.
export function normalizeData(source, editorial, photoCredits = []) {
  const regions = editorial.regions;
  const tribes = source.suku.map((tribe) => {
    const region = regions.find((item) => item.tribes.includes(tribe.id));
    return { ...tribe, name: tribe.nama, regionId: region.id, province: region.name,
      ...editorial.tribeAssets[tribe.id],
      remedies: tribe.ramuan.map((remedy) => ({ ...remedy, name: remedy.nama,
        tribeId: tribe.id, tribeName: tribe.nama, regionId: region.id,
        ...editorial.remedyAssets[remedy.id] })) };
  });
  const references = [...source.referensi, ...editorial.references].map((reference) => {
    const owners = tribes.filter((tribe) => list(tribe.referensi).some((item) => item.id === reference.id) || tribe.remedies.some((remedy) => list(remedy.sumber).includes(reference.id)));
    return { ...reference, tribes: owners.map((tribe) => tribe.id),
      ...editorial.referenceAssets[reference.id],
      citation: `${reference.author}. (${reference.year}). ${reference.title}. ${reference.publisher}. ${reference.url}` };
  });
  return { regions, tribes, remedies: tribes.flatMap((tribe) => tribe.remedies), references,
    myths: editorial.myths, sdgs: editorial.sdgs, photoCredits };
}

export function escapeHTML(value = "") {
  return String(value).replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[character]));
}

export function safeURL(value) {
  try { const url = new URL(value); return ["https:", "http:"].includes(url.protocol) ? url.href : ""; }
  catch { return ""; }
}
