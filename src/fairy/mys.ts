import axios from "axios";
import { taggedLogger } from "../logger";
import { Endpoints } from "./mys.config";

const log = taggedLogger('MYS');

function toURLSearchParams(obj: {[key: string]: any}) {
    const param = new URLSearchParams();
    for(const key in obj) {
        param.append(key, obj[key].toString());
    }
    return param;
}

export class MYS {

    public async getTopicReplies(topicId: string, last_id = '', config = {
        gids: 2,
        is_hot: false,
        order_type: 2,
        size: 20,
    }) {
        const endpoint = Endpoints.TopicReplies;
        const param = toURLSearchParams(config);
        param.append('post_id', topicId);
        param.append('last_id', last_id);

        return this.request(`${endpoint}?${param.toString()}`);
    }

    public async getUserReplies(userId: string, config: {

    }) {
        const endpoint = Endpoints.UserReplies;


    }

    protected async request(url: string, method = 'GET') {
        try {
            log.debug(`${method.toUpperCase()} ${url}`);
            const res = await axios.request({
                url,
                method,
            });
            const response = res.data;
            if(response.retcode !== 0) {
                log.error(`Request failed (API): ${response.retcode}(${response.message})`);
                log.error(`Raw response: ${JSON.stringify(response)}`);
                return null;
            } else {
                log.debug(`Response: ${JSON.stringify(response)}`);
                return response.data;
            }
        } catch (e) {
            if(e instanceof Error) {
                log.error(`Request failed(Known): ${e.name}(${e.message})`);
                if(e.stack) log.error(e.stack);
                return null;
            } else {
                log.error(`Request failed(Unknown): ${JSON.stringify(e)}`);
                return null;
            }
        }
    }
}