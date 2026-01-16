export default {
  async fetch(request, env, ctx) {
    try {
      const url = new URL(request.url);
      const pathname = url.pathname;

      // 简化版本，仅处理 API 请求
      if (pathname === '/api/config') {
        if (request.method === 'GET') {
          // 读取配置
          const config = await env.LOTTERY_CONFIG.get('lottery_config');
          let parsedConfig = { people: [], prizes: [] };

          if (config) {
            try {
              parsedConfig = JSON.parse(config);
            } catch (parseError) {
              console.error('解析配置失败:', parseError);
              // 返回默认值而不是抛出错误
            }
          }

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
          try {
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
          } catch (e) {
            return new Response(JSON.stringify({ error: 'Invalid JSON' }), {
              status: 400,
              headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
              }
            });
          }
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

      // 对于其他请求，返回 404
      return new Response('Not Found', { status: 404 });
    } catch (error) {
      console.error('Worker 错误:', error);
      return new Response('Internal Server Error', { status: 500 });
    }
  },
};