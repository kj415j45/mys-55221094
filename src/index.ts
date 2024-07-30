import { MYS } from "./fairy/mys";
import { taggedLogger } from "./logger";
import fs from "node:fs";
import { delay } from "./utils";

/// Config
const targetTopic = "55221094";
const checkpoint = process.argv[2] || "";
const cooldown = 100;

/// Code
const log = taggedLogger("Main");

async function main() {
  const datas: Map<string, any> = new Map();
  let count = 0;
  for await (const reply of iterateReplies(targetTopic, checkpoint)) {
    const replyBody = reply.reply;
    const replyUser = reply.user;

    const data = {
      u_id: replyUser.uid,
      u_name: replyUser.nickname,
      u_region: replyUser.ip_region,
      u_exp: replyUser.user_exp,
      r_floor: replyBody.floor_id,
      r_content: replyBody.content,
      r_time: replyBody.created_at,
      r_update_time: replyBody.updated_at,
      r_deleted: replyBody.is_deleted,
    };

    datas.set(data.r_floor, data);
    log.verbose(
      `#${data.r_floor} ${data.u_name}(${data.u_id}) ${
        data.r_content.length
      } [${data.r_time}] ${data.r_deleted ? "(deleted)" : ""}`
    );
    count++;
    if (datas.size >= 1000) {
      log.info(`Saving ${datas.size} data...`);
      const floors = Array.from(datas.keys()).map(Number);
      const floor_low = Math.min(...floors);
      const floor_high = Math.max(...floors);
      const saveName = `data/data_${floor_low}-${floor_high}.json`;
      fs.writeFileSync(
        saveName,
        JSON.stringify(Array.from(datas.values()), null, 2)
      );
      log.info(`Saved to ${saveName}`);

      log.info(`Saved ${datas.size} data. Iterated ${count} data.`);
      datas.clear();
    }
  }

  log.info(`Saving ${datas.size} data...`);
  const floors = Array.from(datas.keys()).map(Number);
  const floor_low = Math.min(...floors);
  const floor_high = Math.max(...floors);
  const saveName = `data/data_${floor_low}-${floor_high}.json`;
  fs.writeFileSync(
    saveName,
    JSON.stringify(Array.from(datas.values()), null, 2)
  );

  datas.clear();
}

async function* iterateReplies(topicId: string, checkpoint = "") {
  const mys = new MYS();
  let lastId = checkpoint;
  while (true) {
    const res = await mys.getTopicReplies(topicId, lastId);
    if (!res) return;
    const replies = res.list;
    if (replies.is_last === true || replies.length === 0) return;
    for (const reply of replies) {
      yield reply;
    }
    lastId = res.last_id;
    await delay(cooldown);
  }
}

main();
