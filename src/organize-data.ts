import fs from "node:fs";
import path from "node:path";
import { taggedLogger } from "./logger";

/// Config
const log = taggedLogger("OrganizeData");

interface DataRecord {
  u_id: string;
  u_name: string;
  u_region: string;
  u_exp: number;
  r_floor: number;
  r_content: string;
  r_time: number;
  r_update_time: number;
  r_deleted: number;
}

interface FileRange {
  filename: string;
  floorLow: number;
  floorHigh: number;
  data: DataRecord[];
}

/**
 * Parse filename to extract floor range
 * Expected format: data_${floor_low}-${floor_high}.json
 */
function parseFilename(filename: string): { floorLow: number; floorHigh: number } | null {
  const match = filename.match(/^data_(\d+)-(\d+)\.json$/);
  if (!match) {
    return null;
  }
  return {
    floorLow: parseInt(match[1], 10),
    floorHigh: parseInt(match[2], 10)
  };
}

/**
 * Load all data files from directory
 */
function loadDataFiles(dataDir: string): FileRange[] {
  const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.json'));
  const fileRanges: FileRange[] = [];

  for (const filename of files) {
    const range = parseFilename(filename);
    if (!range) {
      log.warn(`Skipping file with invalid format: ${filename}`);
      continue;
    }

    try {
      const filePath = path.join(dataDir, filename);
      const content = fs.readFileSync(filePath, 'utf-8');
      const data: DataRecord[] = JSON.parse(content);
      
      fileRanges.push({
        filename,
        floorLow: range.floorLow,
        floorHigh: range.floorHigh,
        data
      });
      
      log.info(`Loaded ${data.length} records from ${filename} (range: ${range.floorLow}-${range.floorHigh})`);
    } catch (error) {
      log.error(`Failed to load ${filename}: ${error}`);
    }
  }

  return fileRanges;
}

/**
 * Merge overlapping data and sort by floor
 */
function mergeAndSort(fileRanges: FileRange[]): DataRecord[] {
  // Collect all records and remove duplicates based on r_floor
  const recordMap = new Map<number, DataRecord>();
  
  for (const fileRange of fileRanges) {
    for (const record of fileRange.data) {
      // Keep the record with the latest update time if duplicate floor found
      const existing = recordMap.get(record.r_floor);
      if (!existing || record.r_update_time > existing.r_update_time) {
        recordMap.set(record.r_floor, record);
      }
    }
  }

  // Sort by floor ID
  const sortedRecords = Array.from(recordMap.values()).sort((a, b) => a.r_floor - b.r_floor);
  
  log.info(`Merged and sorted ${sortedRecords.length} unique records`);
  return sortedRecords;
}

/**
 * Split data into chunks of maximum 1000 records each
 */
function splitIntoChunks(records: DataRecord[], maxChunkSize: number = 1000): DataRecord[][] {
  const chunks: DataRecord[][] = [];
  
  for (let i = 0; i < records.length; i += maxChunkSize) {
    chunks.push(records.slice(i, i + maxChunkSize));
  }
  
  log.info(`Split ${records.length} records into ${chunks.length} chunks`);
  return chunks;
}

/**
 * Save chunks to files with proper naming
 */
function saveChunks(chunks: DataRecord[][], outputDir: string): void {
  // Create backup directory
  const backupDir = path.join(outputDir, 'backup');
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  // Move existing files to backup
  const existingFiles = fs.readdirSync(outputDir).filter(f => f.endsWith('.json'));
  for (const file of existingFiles) {
    const sourcePath = path.join(outputDir, file);
    const backupPath = path.join(backupDir, file);
    fs.renameSync(sourcePath, backupPath);
  }
  log.info(`Backed up ${existingFiles.length} existing files to ${backupDir}`);

  // Save new chunks
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    if (chunk.length === 0) continue;

    const floors = chunk.map(r => r.r_floor);
    const floorLow = Math.min(...floors);
    const floorHigh = Math.max(...floors);
    const filename = `data_${floorLow}-${floorHigh}.json`;
    const filePath = path.join(outputDir, filename);
    // higher floor is first
    chunk.sort((a, b) => b.r_floor - a.r_floor);

    fs.writeFileSync(filePath, JSON.stringify(chunk, null, 2));
    log.info(`Saved ${chunk.length} records to ${filename} (range: ${floorLow}-${floorHigh})`);
  }
}

/**
 * Main organize function
 */
export function organizeData(dataDir: string = 'data/replies'): void {
  log.info(`Starting data organization in directory: ${dataDir}`);
  
  if (!fs.existsSync(dataDir)) {
    log.error(`Data directory does not exist: ${dataDir}`);
    return;
  }

  try {
    // Load all data files
    const fileRanges = loadDataFiles(dataDir);
    if (fileRanges.length === 0) {
      log.warn('No valid data files found');
      return;
    }

    // Merge overlapping data and sort
    const mergedRecords = mergeAndSort(fileRanges);
    if (mergedRecords.length === 0) {
      log.warn('No records found after merging');
      return;
    }

    // Split into chunks
    const chunks = splitIntoChunks(mergedRecords, 1000);

    // Save reorganized data
    saveChunks(chunks, dataDir);

    log.info(`Data organization completed successfully. Processed ${mergedRecords.length} records into ${chunks.length} files.`);
  } catch (error) {
    log.error(`Data organization failed: ${error}`);
    throw error;
  }
}

// CLI usage
if (require.main === module) {
  const dataDir = process.argv[2] || 'data/replies';
  organizeData(dataDir);
}