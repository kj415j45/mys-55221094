import { MYS } from "./fairy/mys";
import { taggedLogger } from "./logger";
import fs from "node:fs";
import { delay } from "./utils";

/// Config
const targetTopic = "55221094";
const checkpoint = process.argv[2] || "";
const cooldown = 100;
const maxRuntime = parseInt(process.env.MAX_RUNTIME || "3600"); // Default 1 hour in seconds
const maxIterations = parseInt(process.env.MAX_ITERATIONS || "10000"); // Default 10k iterations

/// Code
const log = taggedLogger("Main");

async function main() {
  const startTime = Date.now();
  const datas: Map<string, any> = new Map();
  let count = 0;
  let iterationCount = 0;
  
  // Ensure data directories exist
  if (!fs.existsSync('data')) {
    fs.mkdirSync('data');
  }
  if (!fs.existsSync('data/replies')) {
    fs.mkdirSync('data/replies');
  }
  
  log.info(`Starting data collection with limits: ${maxRuntime}s runtime, ${maxIterations} iterations`);
  
  for await (const reply of iterateReplies(targetTopic, checkpoint)) {
    // Check runtime limit
    const elapsedTime = (Date.now() - startTime) / 1000;
    if (elapsedTime > maxRuntime) {
      log.warn(`Runtime limit (${maxRuntime}s) reached. Stopping execution.`);
      break;
    }
    
    // Check iteration limit
    if (iterationCount >= maxIterations) {
      log.warn(`Iteration limit (${maxIterations}) reached. Stopping execution.`);
      break;
    }
    
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
    iterationCount++;
    
    if (datas.size >= 1000) {
      log.info(`Saving ${datas.size} data...`);
      const floors = Array.from(datas.keys()).map(Number);
      const floor_low = Math.min(...floors);
      const floor_high = Math.max(...floors);
      const saveName = `data/replies/data_${floor_low}-${floor_high}.json`;
      fs.writeFileSync(
        saveName,
        JSON.stringify(Array.from(datas.values()), null, 2)
      );
      log.info(`Saved to ${saveName}`);

      log.info(`Saved ${datas.size} data. Iterated ${count} data. Runtime: ${Math.round((Date.now() - startTime) / 1000)}s`);
      datas.clear();
    }
  }

  if (datas.size > 0) {
    log.info(`Saving final ${datas.size} data...`);
    const floors = Array.from(datas.keys()).map(Number);
    const floor_low = Math.min(...floors);
    const floor_high = Math.max(...floors);
    const saveName = `data/replies/data_${floor_low}-${floor_high}.json`;
    fs.writeFileSync(
      saveName,
      JSON.stringify(Array.from(datas.values()), null, 2)
    );
    log.info(`Saved to ${saveName}`);
    datas.clear();
  }
  
  const totalRuntime = Math.round((Date.now() - startTime) / 1000);
  log.info(`Data collection completed. Total runtime: ${totalRuntime}s, Iterations: ${iterationCount}, Records: ${count}`);
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
