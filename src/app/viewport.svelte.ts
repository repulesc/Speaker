/** Phone-sized viewport (matches the CSS breakpoint at 640 px). */
const query = window.matchMedia('(max-width: 639px)');
let compact = $state(query.matches);
query.addEventListener('change', (event) => (compact = event.matches));

/** Room for both drawings at once (matches the CSS breakpoint at 1024 px). */
const wideQuery = window.matchMedia('(min-width: 1024px)');
let wide = $state(wideQuery.matches);
wideQuery.addEventListener('change', (event) => (wide = event.matches));

export const viewport = {
  get compact() {
    return compact;
  },
  get wide() {
    return wide;
  },
};
