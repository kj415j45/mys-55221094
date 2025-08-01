import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'node:fs';
import path from 'node:path';

const execAsync = promisify(exec);

async function testOrganizeData() {
    console.log('Testing data organization script...');
    
    const testDir = '/tmp/organize-test-unit';
    
    try {
        // Clean up and create test directory
        if (fs.existsSync(testDir)) {
            fs.rmSync(testDir, { recursive: true });
        }
        fs.mkdirSync(testDir, { recursive: true });
        
        // Create test data with overlapping ranges
        const testData1 = [
            {
                "u_id": "100001",
                "u_name": "测试用户1",
                "u_region": "测试区域",
                "u_exp": 100,
                "r_floor": 100,
                "r_content": "测试内容1",
                "r_time": 1721177561,
                "r_update_time": 1721178051,
                "r_deleted": 0
            },
            {
                "u_id": "100002",
                "u_name": "测试用户2",
                "u_region": "测试区域",
                "u_exp": 200,
                "r_floor": 150,
                "r_content": "测试内容2",
                "r_time": 1721177562,
                "r_update_time": 1721178052,
                "r_deleted": 0
            }
        ];
        
        const testData2 = [
            {
                "u_id": "100003",
                "u_name": "测试用户3",
                "u_region": "测试区域2",
                "u_exp": 300,
                "r_floor": 140,
                "r_content": "测试内容3 - 重叠数据",
                "r_time": 1721177563,
                "r_update_time": 1721178053,
                "r_deleted": 0
            },
            {
                "u_id": "100004",
                "u_name": "测试用户4",
                "u_region": "测试区域2",
                "u_exp": 400,
                "r_floor": 200,
                "r_content": "测试内容4",
                "r_time": 1721177564,
                "r_update_time": 1721178054,
                "r_deleted": 0
            }
        ];
        
        // Write test files
        fs.writeFileSync(path.join(testDir, 'data_100-150.json'), JSON.stringify(testData1, null, 2));
        fs.writeFileSync(path.join(testDir, 'data_140-200.json'), JSON.stringify(testData2, null, 2));
        
        console.log('✅ Test data created');
        
        // Compile TypeScript first
        console.log('Compiling TypeScript...');
        await execAsync('npx tsc');
        console.log('✅ TypeScript compilation successful');
        
        // Run organize script
        console.log('Running organize script...');
        const { stdout, stderr } = await execAsync(`node dist/organize-data.js ${testDir}`);
        
        if (stdout) console.log(stdout);
        if (stderr) console.error(stderr);
        
        // Verify results
        const files = fs.readdirSync(testDir).filter(f => f.endsWith('.json'));
        console.log(`Results: ${files.length} file(s) created`);
        
        if (files.length !== 1) {
            throw new Error(`Expected 1 output file, got ${files.length}`);
        }
        
        const outputFile = files[0];
        const outputData = JSON.parse(fs.readFileSync(path.join(testDir, outputFile), 'utf-8'));
        
        if (outputData.length !== 4) {
            throw new Error(`Expected 4 records, got ${outputData.length}`);
        }
        
        // Verify data is sorted by floor
        for (let i = 1; i < outputData.length; i++) {
            if (outputData[i].r_floor <= outputData[i-1].r_floor) {
                throw new Error('Data is not properly sorted by floor');
            }
        }
        
        // Verify backup directory exists
        if (!fs.existsSync(path.join(testDir, 'backup'))) {
            throw new Error('Backup directory not created');
        }
        
        console.log('✅ Data organization test completed successfully');
        console.log(`✅ Output file: ${outputFile} with ${outputData.length} records`);
        console.log('✅ All organization tests passed!');
        
        // Clean up
        fs.rmSync(testDir, { recursive: true });
        
    } catch (error) {
        console.error('❌ Organize data test failed:', error);
        
        // Clean up on failure
        if (fs.existsSync(testDir)) {
            fs.rmSync(testDir, { recursive: true });
        }
        
        process.exit(1);
    }
}

if (require.main === module) {
    testOrganizeData();
}

export { testOrganizeData };