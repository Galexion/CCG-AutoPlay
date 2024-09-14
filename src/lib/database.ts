import sqlite3 from "sqlite3";
import { getMediaList } from "./caspercg";
let db = new sqlite3.Database('db.sqlite');

interface queueItem {
    media: String, type: String, duration:number
}

interface queue extends Array<queueItem>{}

interface settingsItem {
    setting: String, data: String, type:String
}

interface settings extends Array<settingsItem>{}

interface recentlyplayedItem {
    media: String, timestamp:number, id: number
}

interface recentlyplayed extends Array<recentlyplayedItem>{}

let expectedSettings:settings = [
    { "setting": "queuelength", "data": "5", "type": "1" },
    { "setting": "clipch", "data": "1", "type": "1" },
    { "setting": "clipLayer", "data": "10", "type": "1" },
    { "setting": "templatech", "data": "1", "type": "1" },
    { "setting": "templateLayer", "data": "20", "type": "1" },
    { "setting": "bugch", "data": "1", "type": "1" },
    { "setting": "bugLayer", "data": "20", "type": "1" },
    { "setting": "arrayNameArea", "data": "1", "type": "1" },
    { "setting": "categoryNameArea", "data": "-1", "type": "1" },
    { "setting": "categories", "data": "[]", "type": "2" },
    { "setting": "ratios", "data": "[]", "type": "2" },
    { "setting": "programRoll", "data": "[]", "type": "2" },
]

/* Single Time Functions */
db.serialize(() => {
    db.run('CREATE TABLE IF NOT EXISTS `media` (`id` INTEGER NOT NULL,`name` TEXT(100) NOT NULL,`type` INT(1) NOT NULL,`author` TEXT(20),`commercial` INT(1) NOT NULL DEFAULT \'0\',PRIMARY KEY (`id`));');
    db.run('CREATE TABLE IF NOT EXISTS queue (id INTEGER PRIMARY KEY, media TEXT UNIQUE, type TEXT, duration INTEGER)');
    db.run('CREATE TABLE IF NOT EXISTS recentlyplayed (id INTEGER PRIMARY KEY, media TEXT UNIQUE, timestamp TIMESTAMP)');
    db.run('CREATE TABLE IF NOT EXISTS settings (id INTEGER PRIMARY KEY, setting TEXT, data TEXT, type TEXT)');
    db.all('SELECT * FROM settings ORDER BY id', (err: any, row: settings) => {
        if (err) {
        } else {
            /* Check if there happens to be missing settings. if there is, add them. this is a new file and nothing is there, at all, just throw em all in.
            The Database will need to be deleted everytime a new breaking change rolls around through, might add a export option in the near future. */
            if (row.length > 0) {
                const missingSettings = expectedSettings.filter((setting) => !row.some(obj => obj.setting === setting.setting));
                for (let setting of missingSettings) {
                    db.run('INSERT INTO settings (setting, data, type) VALUES(?,?,?);', [setting.setting, setting.data, setting.type]);
                }
            } else {
                for (let setting of expectedSettings) {
                    db.run('INSERT INTO settings (setting, data, type) VALUES(?,?,?);', [setting.setting, setting.data, setting.type]);
                }

            }
        }
    });
});

/* Queue Functions */

export async function queueMedia(media: String, type: String, duration: number) {
    let queue:queue = await getQueue();
    if (queue.find((item) => item.media == media)) {
        return
    }
    return new Promise((resolve, reject) => {
        db.run('INSERT INTO queue (media, type, duration) VALUES (?, ?, ?) ON CONFLICT DO NOTHING', [media, type, duration], (err) => {
            /* We don't *really* care if something happens to be in the queue already, since in the next half-second it will just make another request to add something,
            so to prevent crashing, we use `ON CONFLICT DO NOTHING`. */
            if (err) {
                reject(err);
            } else {
                resolve(undefined);
            }
        });
    });
}


export async function removeMedia(id: number) {
    return new Promise((resolve, reject) => {
        db.run('DELETE FROM queue WHERE id = ?', [id], (err) => {
            if (err) {
                reject(err);
            } else {
                db.run(`
            UPDATE queue
            SET id = (
              SELECT new_id
              FROM (
                SELECT id, ROW_NUMBER() OVER (ORDER BY id) AS new_id
                FROM queue
              ) AS subquery
              WHERE subquery.id = queue.id
            )
          `, (err) => {
                    if (err) {
                        console.error(err.message);
                    }
                    resolve(undefined);
                });
            }
        });

    });
}

export async function getQueue() {
    return new Promise((resolve, reject) => {
        db.all('SELECT * FROM queue ORDER BY id', (err: any, row: queue) => {
            if (err) {
                reject(err);
            } else {
                resolve(row)
            }
        });
    });
}
/* Recently Played */

const intervalId = setInterval(async () => {
    refreshRecentlyPlayed()
}, 300);
export async function refreshRecentlyPlayed() {
    let recentlyplayed: recentlyplayed = await getRecentlyPlayed();
    let media = await getMediaList();
    let settings = await getSettings()
    let queue: queue = await getQueue()
    let MediaList = media?.filter((clip) => {
        return clip.type !== "STILL"
      });
      if(recentlyplayed.length > 0) {
        let banExpiry = new Date(recentlyplayed[0].timestamp)
        if(new Date().getTime() >= banExpiry.getTime() || (MediaList.length - settings.find((item) => item.setting == "queuelength").data) >= (MediaList.length - recentlyplayed.length) ) {
            removeFromRecentlyPlayed(recentlyplayed[0].id)
            return
        }
      }
    return true
}

export async function addToRecentlyPlayed(media: String) {
    let recentlyplayed:recentlyplayed = await getRecentlyPlayed()
    if (recentlyplayed.find((item) => item.media == media)) return
    return new Promise((resolve, reject) => {
        db.run('INSERT INTO recentlyplayed (media, timestamp) VALUES (?,?) ON CONFLICT DO NOTHING', [media, new Date(new Date().setHours(new Date().getHours() + 5))], (err) => {
            /* Like before, We don't *really* care if something happens to be in the recentlyPlayed already, since it already happens to be in the recentlyPlayed timeout zone,
            so to prevent crashing, we use `ON CONFLICT DO NOTHING`. Behaviour may change in the future to actually update the timestamp to reflect the recent showing,
            but honestly who the fuck cares. */
            if (err) {
                reject(err);
            } else {
                resolve(undefined);
            }
        });
    });
}

export async function removeFromRecentlyPlayed(id: number) {
    return new Promise((resolve, reject) => {
        db.run('DELETE FROM recentlyplayed WHERE id = ?', [id], (err) => {
            if (err) {
                reject(err);
            } else {
                db.run(`
            UPDATE recentlyplayed
            SET id = (
              SELECT new_id
              FROM (
                SELECT id, ROW_NUMBER() OVER (ORDER BY id) AS new_id
                FROM recentlyplayed
              ) AS subquery
              WHERE subquery.id = recentlyplayed.id
            )
          `, (err) => {
                    if (err) {
                        console.error(err.message);
                    }
                    resolve(undefined);
                });
            }
        });

    });
}

export async function getRecentlyPlayed() {
    return new Promise((resolve, reject) => {
        db.all('SELECT * FROM recentlyplayed ORDER BY id', (err: any, row: recentlyplayed) => {
            if (err) {
                reject(err);
            } else {
                resolve(row)
            }
        });
    });
}

/* Settings Table */

export async function getSettings() {
    return new Promise((resolve, reject) => {
        db.all('SELECT * FROM settings ORDER BY id', (err: any, row: any) => {
            if (err) {
                reject(err);
            } else {
                resolve(row)
            }
        });
    });
}

export async function updateSettings(settings:settings) {
    let previousSettings:settings = await getSettings()
    let changedSettings = settings.filter((setting) => previousSettings.find((setting2) => setting.setting == setting2.setting && setting.data != setting2.data))
    for(let setting of changedSettings) {
        updateSetting(setting.setting, setting.data)
    }
}

export async function updateSetting(setting: String, data: any) {
    return new Promise((resolve, reject) => {
        db.run('UPDATE settings SET data = ? WHERE setting = ?; ', [data, setting]);
        resolve(undefined)
    });
}