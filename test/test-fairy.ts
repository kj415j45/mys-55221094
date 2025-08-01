import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

async function testFairy() {
    console.log('Testing MYS API with updated headers...');

    try {
        // Compile the project
        console.log('Compiling TypeScript...');
        await execAsync('npx tsc');
        console.log('✅ TypeScript compilation successful');

        // Test with very short limits to verify it works
        console.log('Running API test with short limits...');
        const { stdout, stderr } = await execAsync('MAX_RUNTIME=10 MAX_ITERATIONS=5 LOG_LEVEL=info node dist/index.js', {
            env: { ...process.env, MAX_RUNTIME: '10', MAX_ITERATIONS: '5', LOG_LEVEL: 'info' }
        });

        if (stdout) console.log(stdout);
        if (stderr) console.error(stderr);

        console.log('✅ API test completed successfully');
        console.log('✅ All tests passed!');
    } catch (error) {
        console.error('❌ Test failed:', error);
        process.exit(1);
    }
}

if (require.main === module) {
    testFairy();
}

export { testFairy };