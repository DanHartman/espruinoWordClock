const wifi = require('Wifi')
const pixelString = require('neopixel')
const ping = require('Ping')

wifi.startAP('espruinoAP', {}, err => {
  if(err) throw err
  console.log('connected')
})

const indexPage = array => {
  const hidden = ssid => ssid.isHidden === false
  const options = result => `<option value="${result.ssid}">${result.ssid}</option>`
  return `
    <html>
      <body>
        <style>
          ul {
            list-style: none;
          }
        </style>
        <form action="/connect" method="post">
          <ul>
	          <li>
	            <label for="ssid">Choose an SSID:</label>
              <select name="ssid" id="ssid">
                <option value="">--Please choose an option--</option>
                ${array.filter(hidden).map(options)}
              </select>
	          </li>
	          <li>
              <label for="password">Password:</label>
              <input type="password" id="password" name="password" />
            </li>
            <li>
	            <button type="submit">Connect</button>
	          </li>
	        </ul>
        </form>
      </body>
    </html>`
}

const handleConnect = (req, cb) => {
  var data =''
  req.on('data', reqData => data += reqData)
  req.on('end', () => {
    postData = {}
    data.split('&').forEach(el => {
      var els = el.split('=')
      postData[els[0]] = decodeURIComponent(els[1])
    })
    wifi.connect(postData.ssid, { password: postData.password }, err => {
      if(err) {
        console.log(err)
        cb(`Wifi Connect Error: ${err}`)
      } else {
        console.log('connected')
        wifi.save()
        cb(`connected, find me at ${wifi.getIP().ip} on the ${postData.ssid} network`)
      }
    })
  })
}

const pageRequest = (req, res) => {
  var a = url.parse(req.url, true)
  if (a.pathname=="/") {
    wifi.scan((data, err) => {
      if(err) {
        console.log('scan err')
      } else {
        res.writeHead(200, {'Content-Type': 'text/html'})
        res.end(indexPage(data))
      }
    })
  } else if (a.pathname=="/connect") {
    if (req.method === 'POST') {
      console.log('post received')
      handleConnect(req, connectionStatus => {
        res.writeHead(200, {'Content-Type': 'text/html'})
        res.end(connectionStatus)
      })
    }
  } else {
    res.writeHead(404, {'Content-Type': 'text/plain'})
    res.end("404: Page "+a.pathname+" not found")
  }
}
require("http").createServer(pageRequest).listen(80)
