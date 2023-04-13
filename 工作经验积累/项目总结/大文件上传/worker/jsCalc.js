self.importScripts('../static/spark-md5.min.js')
const spark = new SparkMD5.ArrayBuffer()
const fileReader = new FileReader()

function calcMd5ByJsSlice(sliceedFileList,callback){
    const length = sliceedFileList.length
    let count = 0 
    const onload = e =>{
        count ++
        spark.append(e.target.result) // 添加到spark算法中计算
        if(count == length){
            const hash = spark.end() // 计算完成得到hash结果
            callback(hash)
        }else{
            readFile(sliceedFileList[count],onload)
        }
    }
    readFile(sliceedFileList[0],onload)
}

function readFile(file,onload){
    // fileReader.onprogress = e => {
    //     console.log(`${Math.floor((e.loaded / e.total) * 100)}%`)
    // }
    fileReader.readAsArrayBuffer(file);
    fileReader.onload = onload
}


self.onmessage = (e)=>{
    const {sliceedFileList} = e.data
    calcMd5ByJsSlice(sliceedFileList,(hash)=>{
        self.postMessage({
            hash
        })
    })
}

