// Official, unmodified Google Material Symbols; rendered locally as CSS masks.
export const iconNames = ["eco", "arrow_outward", "arrow_forward", "north", "open_in_full", "close", "menu", "search", "content_copy", "expand_more", "chevron_right", "science", "spa", "forest", "groups", "menu_book", "location_on", "local_florist"];
export const icon = (name) => {
  if (!iconNames.includes(name)) throw new Error(`Unknown Google icon: ${name}`);
  return `<span class="google-icon icon-${name}" aria-hidden="true"></span>`;
};
