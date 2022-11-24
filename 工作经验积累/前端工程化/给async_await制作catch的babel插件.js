// 面试题 ： 给所有的async 和await 添加 错误捕抓 即 try catch 
// 解答来源: https://juejin.cn/post/7155434131831128094#heading-1
//  如果不添加try catch 会怎么样呢 
//  例如下面的function 
const obj = {
    
    async  ifNoCatch (){
        const res = new Promise((resolve,reject)=>{
            reject('Error happened!')
        })
        console.log('then , doSomething ')
    }    
}

obj.ifNoCatch()
// Uncaught (in promise) Error happened!
//  为了增加健壮性，需要去全局统一捕获这样的promise错误

// 方法1  监听 unhandledrejection 事件
// window.addEventListener(‘unhandledrejection’) 事件去全局捕获错误

// 代码 
window.addEventListener('unhandledrejection',(event)=>{
    // 首先阻止默认事件的触发
    // 效果： 不会出现Uncaught 
    event.preventDefault()
    // 错误的原因
    console.log(event.reason)
    // 如果是 reject(new Error ()) 抛出来的
    // 1. 错误的堆栈信息
    console.log(event.reason.stack)
    // 2. 错误信息
    console.log(event.reason.message)

})

//  方法2 使用babel 插件， 通过对应的结构体在AST语法树当中的特征去定位到替换上包含了try catch 的语法内容 

// 首先介绍这个插件的用法 
// 在babel.config.js 当中 配置如下
module.exports = {
    plugins:[
        [
            require('babel-plugin-await-add-trycatch'),
            // options 参数
            {
                exclude: ['build','node_modules'], // 排除范围
                include: ['main.js'], //  默认是空 
                customLog: '自定义的catch捕获信息 '
            }
        ]
    ]
}

//  作用效果 
// before 
async function fn() {
    await new Promise((resolve, reject) => reject('报错'));
    await new Promise((resolve) => resolve(1));
    console.log('do something...');
}

// after
async function fn() {
    try {
      await new Promise((resolve, reject) => reject('报错'));
      await new Promise(resolve => resolve(1));
      console.log('do something...');
    } catch (e) {
      console.log("\nfilePath: E:\\myapp\\src\\main.js\nfuncName: fn\nError:", e);
    }
}
// 可以知道报错的函数名，定位的文件路径


//  前置知识：  
//  生成AST语法树

let a = 1 

// 它的AST语法树为： 
// {
//     VariableDeclaration {
//         type:...a.toExponential.
//     }

// }

// 函数
function demo(n) {
    return n * n;
}
// 结构体为
// {
//     "type": "Program", // 整段代码的主体
//     "body": [
//       {
//         "type": "FunctionDeclaration", // function 的类型叫函数声明；
//         "id": { // id 为函数声明的 id
//           "type": "Identifier", // 标识符 类型
//           "name": "demo" // 标识符 具有名字 
//         },
//         "expression": false,
//         "generator": false,
//         "async": false, // 代表是否 是 async function
//         "params": [ // 同级 函数的参数 
//           {
//             "type": "Identifier",// 参数类型也是 Identifier
//             "name": "n"
//           }
//         ],
//         "body": { // 函数体内容 整个格式呈现一种树的格式
//           "type": "BlockStatement", // 整个函数体内容 为一个块状代码块类型
//           "body": [
//             {
//               "type": "ReturnStatement", // return 类型
//               "argument": {
//                 "type": "BinaryExpression",// BinaryExpression 二进制表达式类型
//                 "start": 30,
//                 "end": 35,
//                 "left": { // 分左 右 中 结构
//                   "type": "Identifier", 
//                   "name": "n"
//                 },
//                 "operator": "*", // 属于操作符
//                 "right": {
//                   "type": "Identifier",
//                   "name": "n"
//                 }
//               }
//             }
//           ]
//         }
//       }
//     ],
//     "sourceType": "module"
// }


// 具体转换的tool https://astexplorer.net 

//  特征 ： 
// async ： true 的时候 是说明带有 async 
// AwaitExpression ， 代表 let value  = await foo()
// 函数的类型 有 ：  
//  1. 函数 声明  p.isFunctionDeclaration
//  2. 函数表达式  p.isFunctionExpression
//  3. 箭头函数表达式 p.isArrowFunctionExpression
//  4. 对象内方法 p.isObjectMethod

// 1️⃣：函数声明
async function fn() {
    await f()
}
  
// 2️⃣：函数表达式
const fn = async function () {
    await f()
};

// 3️⃣：箭头函数
const fn = async () => {
    await f()
};

// 4️⃣：async函数定义在对象中
const objs = {
    async fn() {
        await f()
    }
}


// babel的插件制作

// 引入babel-template
const template = require('babel-template');

// 定义try/catch语句模板
let tryTemplate = `
try {
} catch (e) {
console.log(CatchError：e)
}`;

// 创建模板
const temp = template(tryTemplate);

// 给模版增加key，添加console.log打印信息
let tempArgumentObj = {
   // 通过types.stringLiteral创建字符串字面量
   CatchError: types.stringLiteral('Error')
};
module.exports = function (babel) {
    let t = babel.type
    return { 
        // 通过访问这模式找到
        visitor: {
        // 拿到 await 的节点
        // 设置AwaitExpression
        AwaitExpression(path) {

            // 通过this.opts 获取用户的配置
            if (this.opts && !typeof this.opts === 'object') {
            return console.error('[babel-plugin-await-add-trycatch]: options need to be an object.');
            }
            const options = this.opts

            
             // 判断父路径中是否已存在try语句，若存在直接返回
            if (path.findParent((p) => p.isTryStatement())) {
            return false;
            }
            let node = path.node;
            const asyncPath = path.findParent((p) => p.node.async && (p.isFunctionDeclaration() || p.isArrowFunctionExpression() || p.isFunctionExpression() || p.isObjectMethod()));
            


            let tryNode = temp(tempArgumentObj);
            
            // 获取父节点的函数体body
            let info = asyncPath.node.body;

            // 将函数体放到try语句的body中
            tryNode.block.body.push(...info.body);

            // 将父节点的body替换成新创建的try语句
            info.body = [tryNode];
        }
        }
    }
}

// 额外做的事，拿到funcName 和filePath 


// 获取编译目标文件的路径，如：E:\myapp\src\App.vue
const filePath = this.filename || this.file.opts.filename || 'unknown';

// 定义方法名
let asyncName = '';

// 获取async节点的type类型
let type = asyncPath.node.type;

switch (type) {
// 1️⃣函数表达式
// 情况1：普通函数，如const func = async function () {}
// 情况2：箭头函数，如const func = async () => {}
case 'FunctionExpression':
case 'ArrowFunctionExpression':
  // 使用path.getSibling(index)来获得同级的id路径
  let identifier = asyncPath.getSibling('id');
  // 获取func方法名
  asyncName = identifier && identifier.node ? identifier.node.name : '';
  break;

// 2️⃣函数声明，如async function fn2() {}
case 'FunctionDeclaration':
  asyncName = (asyncPath.node.id && asyncPath.node.id.name) || '';
  break;

// 3️⃣async函数作为对象的方法，如vue项目中，在methods中定义的方法: methods: { async func() {} }
case 'ObjectMethod':
  asyncName = asyncPath.node.key.name || '';
  break;
}

// 若asyncName不存在，通过argument.callee获取当前执行函数的name
let funcName = asyncName || (node.argument.callee && node.argument.callee.name) || '';
 



//  callee 的作用，用于解耦
(function(n){
    if(n ==1){return 1}
    return n*arguments.callee(n-1)
})(10)