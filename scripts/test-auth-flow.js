// 测试认证流程
// 这个脚本用于验证用户认证和支付流程

console.log("=== 认证流程测试 ===");

// 1. 检查环境变量
console.log("环境变量检查:");
console.log("- CREEM_API_KEY:", process.env.CREEM_API_KEY ? "已设置" : "未设置");
console.log("- CREEM_PRODUCT_ID:", process.env.CREEM_PRODUCT_ID ? "已设置" : "未设置");
console.log("- NEXT_PUBLIC_BASE_URL:", process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000");

// 2. 测试API端点
async function testAPIEndpoints() {
  console.log("\n=== API端点测试 ===");
  
  try {
    // 测试未认证的请求
    console.log("1. 测试未认证的请求...");
    const unauthenticatedResponse = await fetch("http://localhost:3000/api/create-creem-session", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      }
    });
    
    console.log("未认证响应状态:", unauthenticatedResponse.status);
    const unauthenticatedData = await unauthenticatedResponse.json();
    console.log("未认证响应数据:", unauthenticatedData);
    
    // 测试认证的请求（需要用户登录）
    console.log("\n2. 测试认证的请求...");
    console.log("注意：这需要用户先登录，然后手动测试");
    
  } catch (error) {
    console.error("API测试失败:", error);
  }
}

// 3. 测试webhook端点
async function testWebhookEndpoint() {
  console.log("\n=== Webhook端点测试 ===");
  
  try {
    const webhookResponse = await fetch("http://localhost:3000/api/creem/webhook", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        event: "checkout.completed",
        data: {
          id: "test_checkout_id",
          status: "completed",
          metadata: {
            user_id: "test_user_id",
            user_email: "test@example.com"
          }
        }
      })
    });
    
    console.log("Webhook测试响应状态:", webhookResponse.status);
    const webhookData = await webhookResponse.json();
    console.log("Webhook测试响应数据:", webhookData);
    
  } catch (error) {
    console.error("Webhook测试失败:", error);
  }
}

// 4. 检查数据库表结构
async function checkDatabaseStructure() {
  console.log("\n=== 数据库结构检查 ===");
  console.log("请运行以下SQL查询来检查表结构:");
  console.log(`
    -- 检查user_subscriptions表
    SELECT column_name, data_type, is_nullable 
    FROM information_schema.columns 
    WHERE table_name = 'user_subscriptions'
    ORDER BY ordinal_position;
    
    -- 检查现有订阅记录
    SELECT * FROM user_subscriptions LIMIT 5;
  `);
}

// 5. 测试支付成功页面
async function testPaymentSuccessPage() {
  console.log("\n=== 支付成功页面测试 ===");
  console.log("支付成功页面URL: http://localhost:3000/payment/creem-success");
  console.log("测试参数: ?status=completed&checkout_id=test_checkout_id");
}

// 执行测试
async function runTests() {
  await testAPIEndpoints();
  await testWebhookEndpoint();
  checkDatabaseStructure();
  testPaymentSuccessPage();
  
  console.log("\n=== 测试完成 ===");
  console.log("请检查上述结果，确保所有组件都正常工作");
}

// 如果在浏览器环境中运行
if (typeof window !== 'undefined') {
  runTests();
} else {
  console.log("请在浏览器控制台中运行此脚本");
} 