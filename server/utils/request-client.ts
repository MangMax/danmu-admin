import useLogger from "@@/server/composables/useLogger";

/**
 * 基于 Nuxt $fetch 的请求客户端
 * 优化的 HTTP 请求工具，用于替换 danmu.js 中的 httpGet 和 httpPost
 */
interface RequestOptions {
  headers?: Record<string, string>;
  params?: Record<string, any>;
  allow_redirects?: boolean;
  timeout?: number;
  // 特殊模式选项
  base64Data?: boolean;
  zlibMode?: boolean;
}

interface HttpResponse<T = any> {
  data: T;
  status: number;
  headers: Record<string, string>;
}

/**
 * iOS模拟请求头
 */
const getIOSHeaders = () => ({
  'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1',
  'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
  'Accept-Encoding': 'gzip, deflate, br',
  'DNT': '1',
  'Connection': 'keep-alive',
  'Upgrade-Insecure-Requests': '1'
});

const logger = useLogger()

/**
 * 优化的 HTTP GET 请求
 */
export async function httpGet<T = any>(
  url: string, 
  options: RequestOptions = {}
): Promise<HttpResponse<T>> {
  const { headers = {}, params = {}, allow_redirects = true, timeout = 30000, base64Data = false, zlibMode = false } = options;
  
  try {
    // 合并iOS模拟请求头
    const finalHeaders: Record<string, string> = {
      ...getIOSHeaders(),
      ...headers
    };

    // 构建查询参数
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, String(value));
      }
    });

    const finalUrl = queryParams.toString() 
      ? `${url}${url.includes('?') ? '&' : '?'}${queryParams.toString()}`
      : url;

    let data: any;
    let response: any;

    // 根据模式选择不同的响应处理方式
    if (base64Data) {
      logger.info(`[Base64模式] 处理URL: ${url}`);
      
      // 使用 $fetch 获取 ArrayBuffer
      response = await $fetch.raw(finalUrl, {
        method: 'GET',
        headers: finalHeaders,
        redirect: allow_redirects ? 'follow' : 'manual',
        timeout,
        responseType: 'arrayBuffer'
      });

      const arrayBuffer = response._data;
      const uint8Array = new Uint8Array(arrayBuffer);

      // 转换为 Base64
      let binary = '';
      const chunkSize = 0x8000; // 分块防止大文件卡死
      for (let i = 0; i < uint8Array.length; i += chunkSize) {
        let chunk = uint8Array.subarray(i, i + chunkSize);
        binary += String.fromCharCode.apply(null, Array.from(chunk));
      }
      data = btoa(binary); // 得到 base64 字符串

    } else if (zlibMode) {
      logger.info(`[Zlib模式] 处理URL: ${url}`);
      
      // 使用 $fetch 获取 ArrayBuffer
      response = await $fetch.raw(finalUrl, {
        method: 'GET',
        headers: finalHeaders,
        redirect: allow_redirects ? 'follow' : 'manual',
        timeout,
        responseType: 'arrayBuffer'
      });

      const arrayBuffer = response._data;

      // 使用 DecompressionStream 进行解压
      // "deflate" 对应 zlib 的 inflate
      const decompressionStream = new DecompressionStream("deflate");
      const decompressedStream = new Response(
        new Blob([arrayBuffer]).stream().pipeThrough(decompressionStream)
      );

      // 读取解压后的文本
      try {
        data = await decompressedStream.text();
      } catch (decompressError) {
        logger.error(`[Zlib模式] 解压缩失败:`, decompressError);
        throw decompressError;
      }

    } else {
      // 普通模式使用 $fetch
      response = await $fetch.raw<T>(finalUrl, {
        method: 'GET',
        headers: finalHeaders,
        redirect: allow_redirects ? 'follow' : 'manual',
        timeout,
        // 禁用自动解析，保持原始响应
        parseResponse: (txt) => txt,
        onResponseError: ({ response }) => {
          // 允许非200状态码继续处理
          return response._data;
        }
      });

      data = response._data;
    }

    // 对于特殊模式，尝试解析为JSON
    if (base64Data || zlibMode) {
      try {
        data = JSON.parse(data);
      } catch (error) {
        // 如果解析失败，保留原始数据
        logger.warn(`[HTTP GET Warning] ${url}:`, error);
      }
    }

    return {
      data: data as T,
      status: response.status,
      headers: Object.fromEntries(
        Object.entries(response.headers).map(([k, v]) => [k, String(v)])
      )
    };

  } catch (error: any) {
    logger.error(`[HTTP GET Error] ${url}:`, error);
    
    // 返回错误响应格式
    return {
      data: null as T,
      status: error.status || 500,
      headers: {}
    };
  }
}

/**
 * 优化的 HTTP POST 请求
 */
export async function httpPost<T = any>(
  url: string,
  body: any,
  options: RequestOptions = {}
): Promise<HttpResponse<T>> {
  const { headers = {}, params = {}, allow_redirects = true, timeout = 30000 } = options;
  
  try {
    // 合并iOS模拟请求头
    const finalHeaders: Record<string, string> = {
      ...getIOSHeaders(),
      ...headers
    };

    // 如果没有指定Content-Type，根据body类型自动设置
    if (!finalHeaders['Content-Type'] && !finalHeaders['content-type']) {
      if (typeof body === 'object' && body !== null) {
        finalHeaders['Content-Type'] = 'application/json';
      } else {
        finalHeaders['Content-Type'] = 'application/x-www-form-urlencoded';
      }
    }

    // 构建查询参数
    const queryParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        queryParams.append(key, String(value));
      }
    });

    const finalUrl = queryParams.toString() 
      ? `${url}${url.includes('?') ? '&' : '?'}${queryParams.toString()}`
      : url;

    // 处理请求体
    let requestBody: any = body;
    if (typeof body === 'object' && body !== null && finalHeaders['Content-Type']?.includes('application/json')) {
      requestBody = JSON.stringify(body);
    }

    // 使用 $fetch 发送请求
    const response = await $fetch.raw<T>(finalUrl, {
      method: 'POST',
      headers: finalHeaders,
      body: requestBody,
      redirect: allow_redirects ? 'follow' : 'manual',
      timeout,
      // 禁用自动解析，保持原始响应
      parseResponse: (txt) => txt,
      onResponseError: ({ response }) => {
        // 允许非200状态码继续处理
        return response._data;
      }
    });

    return {
      data: response._data as T,
      status: response.status,
      headers: Object.fromEntries(
        Object.entries(response.headers).map(([k, v]) => [k, String(v)])
      )
    };

  } catch (error: any) {
    logger.error(`[HTTP POST Error] ${url}:`, error);
    
    // 返回错误响应格式
    return {
      data: null as T,
      status: error.status || 500,
      headers: {}
    };
  }
}
