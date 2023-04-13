self.importScripts('../static/wasm_exec.js')
const go = new Go();

const fileReader = new FileReader()

async function calcMd5ByHashWASMSlice(sliceedFileList,callback){
    
    const length = sliceedFileList.length
        let count = 0 
    
        const onload = e =>{
            count ++
            const bytes = new Uint8Array(e.target.result)
            wasmMd5Update(bytes)
            if(count == length){
                const md5Hash = wasmMd5Digest()
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
    if(self.wasmMd5Update&&self.wasmMd5Digest){
        console.log('wu');
        calcMd5ByHashWASMSlice(sliceedFileList,(hash)=>{
            self.postMessage({
                hash
            })
        })
    }else{
        WebAssembly.instantiateStreaming(fetch('../static/GoMd5.wasm'), go.importObject)
        .then(res => {
            go.run(res.instance);
            calcMd5ByHashWASMSlice(sliceedFileList,(hash)=>{
                self.postMessage({
                    hash
                })
            })
        })
    }
   
}