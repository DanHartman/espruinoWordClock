const wifi = require('Wifi')
const pixelString = require("neopixel")
var aps = []

wifi.startAP('espruinoAP', {}, err => {
  if(err) throw err
  console.log('connected')
})

const scan = interval => {
  setTimeout(() => {
    wifi.scan((data, err) => {
      if(err) {
        print('scan err')
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
        <form action="/" method="post">
          <label for="ssid-select">Choose an SSID:</label>
          <select name="ssid-select" id="ssid-select">
            <option value="">--Please choose an option--</option>
            ${aps.filter(hidden).map(options)}
          </select>
          <label for="password">Password:</label>
          <input type="password" id="password" name="password" />
          <button type="submit">Connect</button>
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
  wifi.setIP(settings, err => {
    if(err) {
      print(err)
    } else {
      wifi.connect(ssid, { password: password }, () => {
        print('connected')
        wifi.save()
      })
    }
  })
}

const handlePost = (req, cb) => {
  var data =''
  req.on('data', data += data)
  req.on('end', () => {
    postData = {}
    data.split('&').forEach(function(el) {
      var els = el.split('=')
      postData[els[0]] = decodeURIComponent(els[1])
      connectToAP(postData.ip, postData.gw, postData.netmask, postData.ssid, postData.password)
      cb()
    })
  })
}

const pageRequest = (req, res) => {
  var a = url.parse(req.url, true)
  if (a.pathname=="/") {
    res.writeHead(200, {'Content-Type': 'text/html'})
    res.end(indexPage(aps))
  } else if (a.pathname=="/connect") {
    if (req.method === 'POST') {
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