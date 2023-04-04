import axios from "axios";
// 导入常量
import BASE_URL from '@/constant' // 可以根据process.env.NODE_ENV 等环境变量去控制
// 封装axios ，主要功能有

// 这样去使用
// Request.create(config)
// 或者这样去使用
// new Request(config)

// 1. 服务端报错拦截
// 2. 配置baseUrl实现接口代理
// 3. 切换页面，cancelToken ,xhr.abort()

class Request {
    instance = null
    constructor(config){
        this.instance = axios.create({
            timeout:15000, // 这里也可以通过引入常量
            ...config
        })
        this.instance && this.setInterceptor(this.instance)
    }
    setInterceptor(instance){
        instance.interceptor.request.use((config)=>{
            // 1. 开启loading
            // 2. 设置token，优先级高于create里面的
            // 3. 拿到对应的cancelToken ，并且暴露出去，切换页面的时候可以取消token
            const CancelToken = axios.CancelToken
            config.CancelToken = new CancelToken((c)=>{
                // 可以将这些东西拿出来,执行c即可取消对应的请求
                // store.commit(xxx,c)
            })

            return config
        })
        instance.interceptor.response.use((res)=>{
            // 1.对信息作处理,判断后端返回的状态码与否
          
            if(res.data.data.returnInfo === 'success'){
                return res.data
            }else{
                return Promise.reject(result)
            }
            // 2.取消loading 
        },(err)=>{
            // 可以对错误信息作进一步处理
            return Promise.reject(err)
        })
    }
    static create(config){
        return new Request(config)
    }
    get(url,params){
        return this.instance({
            url,
            params
        })
    }
    post(url,data){
        return this.instance({

        })
    }

}

export default Request

