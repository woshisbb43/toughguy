export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // API 路由处理
    if (pathname === '/api/config') {
      if (request.method === 'GET') {
        // 读取配置
        const config = await env.LOTTERY_CONFIG.get('lottery_config');
        const parsedConfig = config ? JSON.parse(config) : { people: [], prizes: [] };

        return new Response(JSON.stringify(parsedConfig), {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
          }
        });
      }
      else if (request.method === 'POST') {
        // 更新配置
        const body = await request.json();
        await env.LOTTERY_CONFIG.put('lottery_config', JSON.stringify(body));

        return new Response(JSON.stringify({ success: true }), {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
          }
        });
      }
      else if (request.method === 'OPTIONS') {
        // 处理预检请求
        return new Response(null, {
          headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
          }
        });
      }
    }

    // 对于其他请求，返回 404，因为我们只处理 API 请求
    // 静态文件将通过 Pages 提供
    return new Response('Not Found', { status: 404 });
  },
};