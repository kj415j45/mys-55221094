import fs from "node:fs";
import { taggedLogger } from "./logger";
import { Client } from "@elastic/elasticsearch";
import { delay } from "./utils";

const dataDir = './data';
const INDEX_NAME = 'mys_comments';
const forceWriteIndex = true;

const log = taggedLogger('es-upload');
const es = new Client({
    node: 'http://localhost:9200',
    auth: {
        username: 'elastic',
        password: 'changeme',
    },
});
const files = fs.readdirSync(dataDir);

type Data = {
    u_id: string,
    u_name: string,
    u_region: string,
    r_floor: number,
    r_content: string,
    r_time: number,
    r_update_time: number
};

function transform(data: Data) {
    return {
        u_id: data.u_id,
        u_name: data.u_name,
        u_region: data.u_region,
        r_floor: data.r_floor,
        r_content: data.r_content,
        r_time: new Date(data.r_time * 1000),
        r_update_time: new Date(data.r_update_time * 1000),
    };
}

async function upload() {
    const exist = await es.indices.exists({index: INDEX_NAME});
    if(exist) {
        log.error(`Index ${INDEX_NAME} already exists`);
        if(!forceWriteIndex){
        process.exit(1);
        }
    } else {
        await es.indices.create({index: INDEX_NAME});
        await es.indices.putMapping({
            index: INDEX_NAME,
            body: {
                properties: {
                    u_id: {type: 'keyword'},
                    u_name: {type: 'text'},
                    u_region: {type: 'keyword'},
                    r_floor: {type: 'integer'},
                    r_content: {type: 'text'},
                    r_time: {type: 'date'},
                    r_update_time: {type: 'date'},
                }
            }
        });
        log.info(`Index ${INDEX_NAME} created`);
    }

    let count = 0;
    for(const file of files) {
        if(file.endsWith('.json')) {
            const datas = JSON.parse(fs.readFileSync(`${dataDir}/${file}`, 'utf-8')) as Data[];
            log.info(`Uploading ${datas.length} datas from ${file}`);
            const body = datas.flatMap(data => [{index: {_index: INDEX_NAME}, _id: data.r_floor.toString()}, transform(data)]);
            await es.bulk({body});
            await delay(1000);
            count+= datas.length;
            log.info(`Uploaded ${datas.length} datas from ${file} -> ${count} datas`);
        }
    }
}

upload();
