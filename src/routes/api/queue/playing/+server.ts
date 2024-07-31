import { currentlyPlaying } from '$lib/caspercg'
import { getQueue } from '$lib/database'

import { produce } from 'sveltekit-sse'

/**
 * @param {number} milliseconds
 * @returns
 */
function delay(milliseconds:number) {
  return new Promise(function run(resolve) {
    setTimeout(resolve, milliseconds)
  })
}

export function POST() {
  return produce(async function start({ emit }) {
      while (true) {
        if(currentlyPlaying) {
          const {error} = emit('status', JSON.stringify(currentlyPlaying))
          const {error2} = emit('queue', JSON.stringify(await getQueue()))

          if(error || error2) {
            return
          }
        } else {
          
          const {error} = emit('status', JSON.stringify({
            name: ['Please Wait... - Either Nothing is Playing, or CG-AP is still gathering data.'],
            time: ['0', '0']
          }))
          const {error2} = emit('queue', JSON.stringify(await getQueue()))
          if(error || error2) {
            return
          }
        }
        await delay(500)
      }
  })
}