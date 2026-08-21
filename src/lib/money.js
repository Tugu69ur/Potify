export function formatMnt(value) {
  return `₮${Number(value || 0).toLocaleString("mn-MN")}`;
}
