



// function parseAndTraverse(){}  // 构造出依赖图
// function bundle(){}  // 用require包裹的路径，里面并且写明执行require的字符串
// function require(path){ // 这样使用 require(./src/main.js)
//     const code = depsGraph[path]
//     eval(code)
// } // 实现加载函数

// 最后当然是 fs.writeFileSync('./dist/bundle.js',)

// 

const depsGraph = {
    './src/index.js':{
        deps:{},
        code:''
    }

} // 依赖图

// 解析，词法分析-->语法分析 --> traverse循环 -->修改代码 -->generate 生成代码
const path = require('path')
const fs = require('fs')
const parser = require('@babel/parser')
// babel的traverse插件能遍历parser解析出来的抽象语法树
const traverse = require('@babel/traverse').default
const babel = require('@babel/core')
function parseAndTraverse(filePath){
    // 1. 取文件
    const file = fs.readFileSync(filePath)
    // 2. 解析成ast parser.parse(file,{
        // sourceType: 'module'
    // })
    const ast = parser.parse(file,{
        sourceType:'module' //用esmodule方式去解析
    })
    // 3. traverse(ast) 。构建deps
    const deps ={}
    traverse(ast,{
        // 4. 找到import 别且找到路径
        // node 就是 ‘./tools.js’ 
        ImportDeclaration({node}){
            // 拿到当前文件的前缀
            const dirname = path.dirname(filePath)
            // 形成绝对路径
            const abspath = "./" + path.join(dirname, node.source.value)
            // 绝对路径
            // 将'./tools.js' --> './src/tools.js'
            deps[node.source.value] = abspath
        }
    })
    // 5. generate 生成es5 的code 
    const {code} = babel.transformFromAst(ast,null,{
        presets:['@bebel/preset-env'] // 转成es5
    })
    // 6. 将deps和code 注入到依赖图当中
    depsGraph[filePath] = {deps,code}

    // 7. 继续循环依赖当中的，递归使用
    for(let i in dps){
        // 取出 绝对路径的其他依赖 ，继续构建这个depsGraph
        // 先判断是否有这个属性
        if(Object.prototype.hasOwnProperty.call(deps,i)){
            // 用绝对路径去
            const depsPath = deps[i]
            // 递归去构建依赖数
            parseAndTraverse(depsPath)
        }
    }

}

// 之后就设计一下require函数,目的是执行code 以及返回export
// (path:string) => export
function require(path){
    // 从入口里取到对应的deps和code
    const { code ,deps} = depsGraph[path]
    // 1. 最终返回的exports ，code里面会去使用
    const exports = {}
    // 2. 拿到依赖的绝对路径
    const absRequire = (depsPath)=>{
        return require(depsGraph[path].deps[depsPath])
    }
    // 从外面将require函数传入 ,eavl字符串的时候，里面会用到的变量
    ;(function(require,code,exports){
        // code里面就有require ，已经变成字符串了
        eval(code)
    })(absRequire,code,exports)
    return exports
}

// 打包函数 ，
// 使用：bulde('./src/index.js)
// (string)=> string
const bundle = (entryPath)=>{
    // 生成 depsGraph
    parseAndTraverse(entryPath)
    // 返回包装好的字符串
    return `(function(depsGraph){
        function require(entryPath){
            var exports = {}
            function absRequire(depsPath){
                return require(depsGraph[entryPath].deps[depsPath])
            }
            // 立即执行
            ;(function(require,code,exports){
                eval(code)
            })(absRequire,code,exports)
            return exports
        }
        require(${entryPath})
    })(${JSON.stringify(depsGraph)})`
}
const bundleStringCode = bundle('./src/index.js')
fs.writeFileSync('./dist/bundle.js',bundleStringCode)

//  总结： 
//  对代码的一个编译 ，首先从入口函数开始 ， 构建一个依赖图（map 结构 ，src:{deps,code}）
//  1.构建依赖图，从入口的路径开始，
//  用babel/parser 去parse 的到ast  --> @babel/traverse traverse ast 拿到import 后面的相对路径，变成deps的 相对：绝对 映射关系，后续执行的时候要用
//  最后用 babel.transfromAst 转成 code , 完成code和deps收集后，放到依赖图，继续遍历deps，重复如此
//  2.构建require函数  ，作用是传入 eval(code)，并且传入require函数、code、exports对象 但需要注意处理绝对路径，返回exports，
//  3.构建bulde函数 ，返回写入到budle的字符串 。
//    1. 构建依赖图 2. 返回字符串形式的立即执行函数 ，传入依赖图
//    3. 里面包括一个require函数，和require(入口路径)