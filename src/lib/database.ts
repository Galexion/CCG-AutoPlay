import sqlite3 from "sqlite3";
import { getMediaList } from "./caspercg";
let db = new sqlite3.Database('db.sqlite');

interface queueItem {
    media: string, type: string, duration:number
}

interface queue extends Array<queueItem>{}

interface settingsItem {
    setting: string, data: string, type:string
}

interface settings extends Array<settingsItem>{}

interface recentlyplayedItem {
    media: string, timestamp:number, id: number
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

export async function queueMedia(media: string, type: string, duration: number) {
    return new Promise((resolve, reject) => {
        db.run('INSERT INTO queue (media,type,duration) VALUES (?,?,?)', [media, type, duration], (err) => {
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
    let recentlyplayed:recentlyplayed = await getRecentlyPlayed();
    let media = await getMediaList();
    let queue:queue = await getQueue()
    let MediaList = media.filter((clip) => {
        return clip.type !== "STILL"
      });
      if(recentlyplayed.length > 0) {
        let banExpiry = new Date(recentlyplayed[0].timestamp)
        if(new Date().getTime() >= banExpiry.getTime() || (MediaList.length - 5) >= (MediaList.length - recentlyplayed.length) ) {
            removeFromRecentlyPlayed(recentlyplayed[0].id)
            return
        }
      }
    return true
}

export async function addToRecentlyPlayed(media: string) {
    let recentlyplayed:recentlyplayed = await getRecentlyPlayed()
    if (recentlyplayed.find((item) => item.media == media)) return
    return new Promise((resolve, reject) => {
        db.run('INSERT INTO recentlyplayed (media,timestamp) VALUES (?,?)', [media, new Date(new Date().setHours(new Date().getHours() + 5))], (err) => {
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

export async function updateSetting(setting: string, data: any) {
    return new Promise((resolve, reject) => {
        db.run('UPDATE settings SET data = ? WHERE setting = ?; ', [data, setting]);
        resolve(undefined)
    });
}