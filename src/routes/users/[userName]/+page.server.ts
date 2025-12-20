import type { PageServerLoad } from './$types'

export const load: PageServerLoad = async ({ params }) => {
  return {
    userName: params.userName
  }
}
