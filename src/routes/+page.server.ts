import { getMediaList, getTemplateList, getTemplateInformation } from '$lib/caspercg.js'

export async function load({ cookies, url }) {
    let mediaList = await getMediaList()
    let templateList = await getTemplateList()
    for(let i = 0; i < templateList.length - 1; i++) {
        let templateInfo = await getTemplateInformation(templateList[i])
    }
    return { mediaList, templateList }
}