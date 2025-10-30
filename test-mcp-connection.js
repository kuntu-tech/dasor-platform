const https = require('https');

// 您提供的凭据
const PROJECT_ID = 'yzcdbefleociqdpxsqjt';
const ACCESS_TOKEN = 'sbp_82dc8d631fde6e235ec5b7d4792b8d6fb66ad5cf';

console.log('MCP Supabase 凭据测试');
console.log('='.repeat(50));
console.log(`项目 ID: ${PROJECT_ID}`);
console.log(`Token 前缀: ${ACCESS_TOKEN.substring(0, 20)}...`);
console.log('='.repeat(50));

function testMCPConnection() {
    return new Promise((resolve, reject) => {
        const url = `https://mcp.supabase.com/mcp?project_ref=${PROJECT_ID}`;
        
        console.log(`\n测试 MCP 连接...`);
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
            
            console.log(`\n响应状态: ${res.statusCode} ${res.statusMessage}`);
            console.log('响应头:');
            Object.entries(res.headers).forEach(([key, value]) => {
                console.log(`  ${key}: ${value}`);
            });
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                console.log(`\n响应体: ${data}`);
                
                if (res.statusCode === 200) {
                    console.log('\n✅ MCP 连接成功！凭据有效。');
                    resolve({
                        success: true,
                        statusCode: res.statusCode,
                        data: data
                    });
                } else if (res.statusCode === 401) {
                    console.log('\n❌ 认证失败！凭据无效。');
                    resolve({
                        success: false,
                        statusCode: res.statusCode,
                        error: 'Unauthorized - 凭据无效'
                    });
                } else if (res.statusCode === 404) {
                    console.log('\n❌ 项目不存在！项目 ID 可能错误。');
                    resolve({
                        success: false,
                        statusCode: res.statusCode,
                        error: 'Not Found - 项目不存在'
                    });
                } else {
                    console.log(`\n⚠️  未知状态码: ${res.statusCode}`);
                    resolve({
                        success: false,
                        statusCode: res.statusCode,
                        error: `HTTP ${res.statusCode}`
                    });
                }
            });
        });
        
        req.on('error', (error) => {
            console.log(`\n❌ 请求失败: ${error.message}`);
            reject(error);
        });
        
        req.on('timeout', () => {
            console.log('\n⏰ 请求超时');
            req.destroy();
            reject(new Error('Request timeout'));
        });
        
        // 发送 POST 请求体
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
        console.log('测试结果总结');
        console.log('='.repeat(50));
        
        if (result.success) {
            console.log('🎉 凭据验证成功！');
            console.log('✅ 项目 ID 正确');
            console.log('✅ 访问令牌有效');
            console.log('✅ 可以连接到 Supabase MCP 服务');
        } else {
            console.log('❌ 凭据验证失败！');
            console.log(`   状态码: ${result.statusCode}`);
            console.log(`   错误: ${result.error}`);
            
            if (result.statusCode === 401) {
                console.log('\n💡 建议：');
                console.log('   1. 检查访问令牌是否正确');
                console.log('   2. 确认令牌是否已过期');
                console.log('   3. 验证令牌格式是否正确');
            } else if (result.statusCode === 404) {
                console.log('\n💡 建议：');
                console.log('   1. 检查项目 ID 是否正确');
                console.log('   2. 确认项目是否存在');
                console.log('   3. 验证项目是否已激活');
            }
        }
        
        console.log('='.repeat(50));
        
    } catch (error) {
        console.log('\n❌ 测试过程中发生错误:');
        console.log(`   错误信息: ${error.message}`);
        console.log('\n💡 可能的原因：');
        console.log('   1. 网络连接问题');
        console.log('   2. 防火墙阻止了请求');
        console.log('   3. DNS 解析问题');
    }
}

runTest();

