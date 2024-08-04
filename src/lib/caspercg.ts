// This File handles all CasparCG Talk.

interface queueItem {
    id: number, media: string, type: string, duration: number
}

interface queue extends Array<queueItem> { }

interface recentlyplayedItem {
    media: string, timestamp: number
}

interface recentlyplayed extends Array<recentlyplayedItem> { }

import { getQueue, removeMedia, queueMedia, addToRecentlyPlayed, getRecentlyPlayed, getSettings } from "./database";
import { CasparCG } from "casparcg-connection"
import { TransitionType } from "casparcg-connection/dist/enums";
let connection = new CasparCG()
export let currentlyPlaying = undefined
let lastTimeCode = 0
let waitingForQueue = 0
const intervalId = setInterval(async () => {
    // Your code to be executed every 0.1 seconds
    const { error, request } = await connection.infoChannel({ channel: 1 })
    let specifiedLayer = (await request)?.data?.channel.layers.find((element) => element.layer == 10);
    if (specifiedLayer?.foreground) {

        currentlyPlaying = specifiedLayer.foreground.file[0]
        if (currentlyPlaying?.time) {
            if (currentlyPlaying?.time[0] == lastTimeCode) {
                if (waitingForQueue == 0) {
                    console.log("Switching to next Video, Time has Elapsed")
                }
                waitingForQueue = 1
                nextInQueue()
            }
            lastTimeCode = currentlyPlaying.time[0]
        } else {
            if (waitingForQueue == 0) {
                console.log("Switching to next Video, Video Likely is not a Video")
            }
            waitingForQueue = 1
            nextInQueue()
        }
    } else {
        if (waitingForQueue == 0) {
            console.log("Trying to Play something in the queue, either CasparCG just Started or someone cleared everything out.")
        }
        waitingForQueue = 1
        nextInQueue()
    }
    let queue: queue = await getQueue()
    /* if the queue happens to be less then the length the user wants it to be, add new content. */
    let settings = await getSettings()
    if (queue.length < settings.find((item) => item.setting == "queuelength").data) {
        let media = await getMediaList();
        let recentlyplayed: recentlyplayed = await getRecentlyPlayed();
        let mediaList = media.filter((clip) => {
            return clip.type !== "STILL" &&
                !queue.some((element) => element.media == clip.clip) &&
                !recentlyplayed.some((element) => {
                    return element.media == clip.clip
                });
        });
        if (mediaList.length > 0) {
            let clip = mediaList[Math.floor(Math.random() * (mediaList.length - 1))]
            let adjustedFramerate = clip?.framerate > 1000 ? clip?.framerate / 1000 : clip?.framerate
            let seconds = Math.floor(clip?.frames / adjustedFramerate)
            queueMedia(clip.clip, clip.type, seconds)
        }
    }
}, 500);

// To stop the interval later:
//clearInterval(intervalId);
let oneTimeRun = setInterval(async () => {
    //playChannelBug(1,20)
    clearInterval(oneTimeRun);
}, 500);


export async function nextInQueue() {
    let queue: queue = await getQueue()
    if (queue.length > 0) {
        sendFileToServer(1, 10, queue[0].media, "", 1)
        addToRecentlyPlayed(queue[0].media)
        removeMedia(queue[0].id)
        console.log(`Now Playing: ${queue[0].media}`)
        waitingForQueue = 0
    }
}


export async function getMediaList(sub_directory?: string) {
    const { error, request } = await connection.cls()
    if (error) {
        throw error;
    }
    return (await request).data;
}

export async function getTemplateList(sub_directory?: string) {
    const { error, request } = await connection.tls()
    if (error) {
        throw error;
    }
    return (await request).data;
}

export async function getTemplateInformation(template: string) {
    const { error, request } = await connection.infoTemplate({ template })
    if (error) {
        throw error;
    }
    return (await request).data;
}

export async function getFontList(sub_directory?: string) {
    const { error, request } = await connection.fls()
    if (error) {
        throw error;
    }
    return (await request).data;
}


export async function sendFileToServer(channel: number, layer?: any, clip?: string, additionalArgs?: any, playNow?: number) {
    const { error, request } = await connection.load({ channel, clip, layer })
    if (error) {
        throw error;
    }
    if (playNow == 1) {
        resumePlayback(channel, layer)
    }
    return;
}

export async function sendTemplateToServer(channel: number, layer: number, template: string, playOnLoad: boolean, stopAfterPlay: boolean, duration: number, additionalArgs: any) {
    const { error, request } = await connection.cgAdd({
        channel, layer, template, playOnLoad,
        cgLayer: 0,
        data: additionalArgs
    })
    if (error) {
        throw error;
    }
    if (stopAfterPlay) {
        stopTemplate(channel, layer, duration)
    }
    return;
}

export async function stopTemplate(channel: number, layer: number, duration: number) {
    setTimeout(async function () {
        const { error, request } = await connection.cgStop({
            channel, layer,
            cgLayer: 0
        })
        if (error) {
            throw error;
        }
        return;
    }, duration);
}

export async function affixChannelBugtoServer(channel: number, layer: number, clip: string) {
    try {
        const { error } = await connection.play({
            channel: channel,
            layer: layer,
            clip,
            transition: {
                transitionType: TransitionType.Mix,
                duration: 10,

            },
            seek: 0,
        });

        if (error) {
            throw error;
        }

        console.log(`Successfully placed CHANNELBUG on channel ${channel}-${layer}`);
    } catch (err) {
        console.error('Error placing CHANNELBUG:', err);
    }
}

// Playback Controls
export async function resumePlayback(channel: number, layer?: any) {
    const { error, request } = await connection.resume({ channel, layer })
    if (error) {
        throw error;
    }

    return (await request).data;
}
export async function clearChannel(channel: number, layer?: any) {
    const { error, request } = await connection.clear({ channel, layer })
    if (error) {
        throw error;
    }

    return (await request).data;
}