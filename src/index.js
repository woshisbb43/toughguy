export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    if (request.method === 'GET' && path === '/api/config') {
      // 读取配置
      const config = await env.LOTTERY_CONFIG.get('lottery_config');
      const parsedConfig = config ? JSON.parse(config) : { people: [], prizes: [] };
      
      return new Response(JSON.stringify(parsedConfig), {
        headers: { 'Content-Type': 'application/json' }
      });
    } 
    else if (request.method === 'POST' && path === '/api/config') {
      // 更新配置
      const body = await request.json();
      await env.LOTTERY_CONFIG.put('lottery_config', JSON.stringify(body));
      
      return new Response(JSON.stringify({ success: true }), {
        headers: { 'Content-Type': 'application/json' }
      });
    } 
    else {
      // 返回静态文件
      const { pathname } = new URL(request.url);
      
      // 阻止访问 wrangler.toml
      if (pathname === '/wrangler.toml') {
        return new Response('Not Found', { status: 404 });
      }
      
      // 尝试从 _worker.js 目录结构提供静态文件
      try {
        const filePath = pathname.substring(1) || 'index.html';
        const fileExtension = filePath.split('.').pop();
        
        // 根据文件扩展名设置适当的 MIME 类型
        let mimeType = 'text/plain';
        switch (fileExtension) {
          case 'html':
            mimeType = 'text/html';
            break;
          case 'js':
            mimeType = 'application/javascript';
            break;
          case 'css':
            mimeType = 'text/css';
            break;
          case 'json':
            mimeType = 'application/json';
            break;
          case 'png':
            mimeType = 'image/png';
            break;
          case 'jpg':
          case 'jpeg':
            mimeType = 'image/jpeg';
            break;
          case 'gif':
            mimeType = 'image/gif';
            break;
          case 'svg':
            mimeType = 'image/svg+xml';
            break;
        }
        
        const fileResponse = await fetch(`https://toughguy.pages.dev/${filePath}`);
        if (fileResponse.ok) {
          return new Response(fileResponse.body, {
            headers: {
              'Content-Type': mimeType,
              'Cache-Control': 'public, max-age=3600'
            }
          });
        } else {
          return new Response('File not found', { status: 404 });
        }
      } catch (e) {
        return new Response('Internal Server Error', { status: 500 });
      }
    }
  },
};