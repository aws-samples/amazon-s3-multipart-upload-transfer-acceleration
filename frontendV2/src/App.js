import "./App.css"
import { Uploader } from "./utils/upload"
import { useEffect, useState } from "react"

function App() {
  const [file, setFile] = useState(undefined)
  const [pgvalue, setPgvalue] = useState(undefined)
  const [perf,setPerf] = useState(undefined)
  const [baseUrl,setBaseUrl] = useState(undefined)
  const [partsize,setPartsize] = useState(undefined)
  const [numuploads,setNumuploads] = useState(undefined)
  const [ta,setTa] = useState(undefined)

  useEffect(() => {
    if (file) {
      const uploaderOptions = {
        file: file,
        baseURL: baseUrl,
        chunkSize: partsize,
        threadsQuantity: numuploads,
        useTransferAcceleration: ta 
      }

      let percentage = undefined
      setPgvalue(0)
      setPerf("-")
      const uploader = new Uploader(uploaderOptions)
      const tBegin=performance.now()
      uploader
        .onProgress(({ percentage: newPercentage }) => {
          // to avoid the same percentage to be logged twice
          if(percentage === 100){
             setPerf((performance.now() - tBegin)/1000)
          }
          if (newPercentage !== percentage) {
            percentage = newPercentage
            setPgvalue(percentage)
          }
        })
        .onError((error) => {
          setFile(undefined)
          console.error(error)
        })

      uploader.start()      
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file])

  return (
    <div >
      <div style={{ backgroundColor: "#e2e2e2", padding: "20px", margin: "10px"}}>    
        <strong style={{display: "block"}}>Step 1 - Enter API URL</strong><br/>
        <input type="text" id="urlinput" style={{width: "50%"}} placeholder="https://example.execute-api.example.amazonaws.com/example/" 
               onChange={(e) => {
                setBaseUrl(e.target?.value)
               }}
        />
      </div>  
      <div style={{ backgroundColor: "#e2e2e2", padding: "20px", margin: "10px"}}>
        <strong style={{display: "block"}}>Step 2 - Choose part size (MB)</strong><br/>
        <input type="number" id="pu" min="5" max="500"
               onChange={(e) => {
                setPartsize(e.target?.value)
               }}
        />
      </div>      
      <div style={{ backgroundColor: "#e2e2e2", padding: "20px", margin: "10px"}}>
        <strong style={{display: "block"}}>Step 3 - Choose number of parallel uploads</strong><br/>
        <input type="number" id="pu" min="5" max="10"
               onChange={(e) => {
                setNumuploads(e.target?.value)
               }}
        />
      </div> 
      <div style={{ backgroundColor: "#e2e2e2", padding: "20px", margin: "10px"}}>
        <strong style={{display: "block"}}>Step 4 - Use Transfer Acceleration</strong><br/>
        <input type="checkbox" id="ta"
               onChange={(e) => {
                setTa(e.target?.checked)
               }}
        />
      </div>                 
      <div style={{ backgroundColor: "#e2e2e2", padding: "20px", margin: "10px"}}>
        <strong style={{display: "block"}}>Step 5 - Choose a file</strong><br/>
        <input type="file" id="fileinput" 
               onChange={(e) => {
                setFile(e.target?.files?.[0])
               }}
        />
      </div>
      <div style={{ backgroundColor: "#e2e2e2", padding: "20px", margin: "10px"}}>
        <strong style={{display: "block"}}>Step 6 - Monitor</strong><br/>
        <span id="output">{pgvalue}% ({perf} sec)</span>
      </div>
    </div>
  )
}

export default App
