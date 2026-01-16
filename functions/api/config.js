// Cloudflare Pages Function - KV 配置管理 API

export async function onRequestGet(context) {
  try {
    const config = await context.env.LOTTERY_CONFIG.get('lottery_config');
    
    if (!config) {
      // 返回默认配置
      return new Response(JSON.stringify({
        people: [
          "张三", "李四", "王五", "赵六", "钱七",
          "孙八", "周九", "吴十", "郑一", "刘二"
        ],
        prizes: [
          "一等奖：iPhone 15",
          "二等奖：iPad Air",
          "三等奖：AirPods",
          "四等奖：智能手表",
          "五等奖：蓝牙耳机",
          "纪念奖：保温杯",
          "纪念奖：数据线",
          "纪念奖：鼠标垫"
        ]
      }), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
    
    return new Response(config, {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}

export async function onRequestPost(context) {
  try {
    const body = await context.request.json();
    
    // 验证数据格式
    if (!Array.isArray(body.people) || !Array.isArray(body.prizes)) {
      return new Response(JSON.stringify({ 
        error: '配置格式错误，需要包含 people 和 prizes 数组' 
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
    
    // 保存到 KV
    await context.env.LOTTERY_CONFIG.put('lottery_config', JSON.stringify(body));
    
    return new Response(JSON.stringify({ 
      success: true,
      message: '配置已保存到 KV'
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}

export async function onRequestOptions(context) {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  });
}
