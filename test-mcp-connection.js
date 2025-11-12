const https = require('https');

// Supplied credentials for testing
const PROJECT_ID = 'yzcdbefleociqdpxsqjt';
const ACCESS_TOKEN = 'sbp_82dc8d631fde6e235ec5b7d4792b8d6fb66ad5cf';

console.log('MCP Supabase Credential Test');
console.log('='.repeat(50));
console.log(`Project ID: ${PROJECT_ID}`);
console.log(`Token prefix: ${ACCESS_TOKEN.substring(0, 20)}...`);
console.log('='.repeat(50));

function testMCPConnection() {
    return new Promise((resolve, reject) => {
        const url = `https://mcp.supabase.com/mcp?project_ref=${PROJECT_ID}`;
        
        console.log(`\nTesting MCP connection...`);
        console.log(`URL: ${url}`);
        
        const options = {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${ACCESS_TOKEN}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json, text/event-stream',
                'User-Agent': 'MCP-Test/1.0'
            },
            timeout: 10000
        };
        
        const req = https.request(url, options, (res) => {
            let data = '';
            
            console.log(`\nResponse status: ${res.statusCode} ${res.statusMessage}`);
            console.log('Response headers:');
            Object.entries(res.headers).forEach(([key, value]) => {
                console.log(`  ${key}: ${value}`);
            });
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                console.log(`\nResponse body: ${data}`);
                
                if (res.statusCode === 200) {
                    console.log('\n✅ MCP connection successful. Credentials are valid.');
                    resolve({
                        success: true,
                        statusCode: res.statusCode,
                        data: data
                    });
                } else if (res.statusCode === 401) {
                    console.log('\n❌ Authentication failed. Credentials are invalid.');
                    resolve({
                        success: false,
                        statusCode: res.statusCode,
                        error: 'Unauthorized - invalid credentials'
                    });
                } else if (res.statusCode === 404) {
                    console.log('\n❌ Project not found. Project ID may be incorrect.');
                    resolve({
                        success: false,
                        statusCode: res.statusCode,
                        error: 'Not Found - project does not exist'
                    });
                } else {
                    console.log(`\n⚠️  Unexpected status code: ${res.statusCode}`);
                    resolve({
                        success: false,
                        statusCode: res.statusCode,
                        error: `HTTP ${res.statusCode}`
                    });
                }
            });
        });
        
        req.on('error', (error) => {
            console.log(`\n❌ Request failed: ${error.message}`);
            reject(error);
        });
        
        req.on('timeout', () => {
            console.log('\n⏰ Request timed out');
            req.destroy();
            reject(new Error('Request timeout'));
        });
        
        // Send POST request body
        const postData = JSON.stringify({
            jsonrpc: "2.0",
            id: 1,
            method: "tools/list"
        });
        
        req.write(postData);
        req.end();
    });
}

async function runTest() {
    try {
        const result = await testMCPConnection();
        
        console.log('\n' + '='.repeat(50));
        console.log('Test Summary');
        console.log('='.repeat(50));
        
        if (result.success) {
            console.log('🎉 Credentials validated successfully!');
            console.log('✅ Project ID is correct');
            console.log('✅ Access token is valid');
            console.log('✅ Supabase MCP service is reachable');
        } else {
            console.log('❌ Credential validation failed.');
            console.log(`   Status code: ${result.statusCode}`);
            console.log(`   Error: ${result.error}`);
            
            if (result.statusCode === 401) {
                console.log('\n💡 Suggestions:');
                console.log('   1. Verify the access token value');
                console.log('   2. Confirm the token has not expired');
                console.log('   3. Ensure the token format is correct');
            } else if (result.statusCode === 404) {
                console.log('\n💡 Suggestions:');
                console.log('   1. Double-check the project ID');
                console.log('   2. Confirm the project exists');
                console.log('   3. Ensure the project is active');
            }
        }
        
        console.log('='.repeat(50));
        
    } catch (error) {
        console.log('\n❌ An error occurred during the test:');
        console.log(`   Message: ${error.message}`);
        console.log('\n💡 Possible causes:');
        console.log('   1. Network connectivity issues');
        console.log('   2. Firewall blocking the request');
        console.log('   3. DNS resolution problems');
    }
}

runTest();

