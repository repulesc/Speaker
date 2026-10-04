/** Phone-sized viewport (matches the CSS breakpoint at 640 px). */
const query = window.matchMedia('(max-width: 639px)');
let compact = $state(query.matches);
query.addEventListener('change', (event) => (compact = event.matches));

export const viewport = {
  get compact() {
    return compact;
  },
};
