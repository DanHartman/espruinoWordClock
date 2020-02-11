const wifi = require('Wifi')
const pixelString = require('neopixel')
const ping = require('Ping')
var aps = []

wifi.startAP('espruinoAP', {}, err => {
  if(err) throw err
  console.log('connected')
})

const scan = interval => {
  setTimeout(() => {
    wifi.scan((data, err) => {
      if(err) {
        console.log('scan err')
      } else {
        aps = data
      }
      scan(interval)
    })
  }, interval)
}
scan(1000)

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
                ${aps.filter(hidden).map(options)}
              </select>
	          </li>
	          <li>
              <label for="password">Password:</label>
              <input type="password" id="password" name="password" />
            </li>
	          <li>
	            <label for="ip">IP:</label>
	            <input type="text" id="ip" name="ip" />
	          </li>
	          <li>
	            <label for="gw">Gateway:</label>
	            <input type="text" id="gw" name="gw" />
	          </li>
	          <li>
	            <label for="netmask">Netmask:</label>
	            <input type="text" id="netmask" name="netmask" />
	          </li>
            <li>
	            <button type="submit">Connect</button>
	          </li>
	        </ul>
        </form>
      </body>
    </html>`
}

const connectToAP = (ip, gw, netmask, ssid, password='') => {
  const settings = {
    ip: ip,
    gw: gw,
    netmask: netmask
  }
  console.log(ip, gw, netmask, ssid, password)
  wifi.setIP(settings, err => {
    if(err) {
      console.log(err)
    } else {
      wifi.connect(ssid, { password: password }, () => {
        console.log('connected')
        wifi.save()
      })
    }
  })
}

const handlePost = (req, cb) => {
  var data =''
  req.on('data', reqData => data += reqData)
  req.on('end', () => {
    postData = {}
    data.split('&').forEach(function(el) {
      var els = el.split('=')
      postData[els[0]] = decodeURIComponent(els[1])
    })
    console.log(postData)
    connectToAP(postData.ip, postData.gw, postData.netmask, postData.ssid, postData.password)
    cb()
  })
}

const pageRequest = (req, res) => {
  var a = url.parse(req.url, true)
  if (a.pathname=="/") {
    res.writeHead(200, {'Content-Type': 'text/html'})
    res.end(indexPage(aps))
  } else if (a.pathname=="/connect") {
    if (req.method === 'POST') {
      console.log('post received')
      res.writeHead(200, {'Content-Type': 'text/html'})
      handlePost(req, () => {
        res.end(`connecting with given parameters`)
      })
    }
  } else {
    res.writeHead(404, {'Content-Type': 'text/plain'})
    res.end("404: Page "+a.pathname+" not found")
  }
}
require("http").createServer(pageRequest).listen(80)
