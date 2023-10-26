// 在这里，会实现一个webpack的打包 

// foo.js
const name  = "JetTsang"
exports.name = name
exports.getName = () => name


// bar.js
const foo = require('./foo')
console.log(foo.getName())

function add(a, b) {
    return a + b;
}
  
module.exports = {
    add: add,
};


// index.js
const bar = require('./bar');
const foo = require('./foo');
console.log(bar.add(1,1))
console.log(foo.name)



// 一个最简单的webpack配置webpack.config.js 

// webpack.config.js 

const path = require('path');

module.exports = {
  entry: './src/index.js', // 入口文件
  output: {
    filename: 'bundle.js', // 输出文件名
    path: path.resolve(__dirname, 'dist') // 输出目录
  },
  module: {
    rules: [
      {
        test: /\.js$/, // 匹配所有.js文件
        exclude: /node_modules/, // 排除node_modules目录
        use: {
          loader: 'babel-loader' // 使用babel-loader进行转译
        }
      }
    ]
  }
};
