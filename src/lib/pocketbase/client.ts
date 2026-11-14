import PocketBase from 'pocketbase'

// Native PocketBase client connecting to Skip Cloud backend
const pb = new PocketBase(import.meta.env.VITE_POCKETBASE_URL)

export default pb
export { pb }
