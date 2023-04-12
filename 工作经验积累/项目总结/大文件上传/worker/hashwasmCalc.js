self.importScripts('https://cdn.jsdelivr.net/npm/hash-wasm@4/dist/md5.umd.min.js')
let hasher = null
const fileReader = new FileReader()

async function calcMd5ByHashWASMSlice(sliceedFileList,callback){
    const length = sliceedFileList.length
    let count = 0 
    if(hasher){
        hasher.init()
    }else{
        hasher = await hashwasm.createMD5()
    }
    const onload = e =>{
        count ++
        const bytes = new Uint8Array(e.target.result)
        hasher.update(bytes)
        if(count == length){
            const md5Hash = hasher.digest()
            callback(md5Hash)
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
    calcMd5ByHashWASMSlice(sliceedFileList,(hash)=>{
        self.postMessage({
            hash
        })
    })
}