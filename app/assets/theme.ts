// Shared design tokens for Secret Ink.
// Lives under app/assets so both the server-rendered UI and the hydrated
// client component can import it (the asset server only serves app/assets/**).
export const COLORS = {
  blue: '#3985ED',
  cyan: '#39E3ED',
  yellow: '#EDD439',
  orange: '#EDB039',
  slate: '#577298',
  // Off-black for the text the user writes, off-white for the text boxes.
  ink: '#1B1F24',
  paper: '#F7F5EF',
}

export const FONT_STACK =
  "'Inter', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif"
