const config = {
  inputStream: {
    target: document.querySelector('#interactive'),
    type: 'LiveStream',
    constraints: {
      aspectRatio: 1,
      width: 400,
      height: 400
    }
  },
  decoder: {
    readers: ['ean_reader']
  },
  locator: {
    halfSample: true,
    patchSize: "x-large",
  },
  locate: true,
  frequency: 10,
  numOfWorkers: navigator.hardwareConcurrency
}

Quagga.init(config, err => {
  if (err) {
    console.log(err)
    return
  }
  Quagga.start()
})

Quagga.onProcessed(result => {
  const drawingCtx = Quagga.canvas.ctx.overlay
  const drawingCanvas = Quagga.canvas.dom.overlay

  if (result) {
    if (result.boxes) {
      drawingCtx.clearRect(0, 0, parseInt(drawingCanvas.getAttribute('width')), parseInt(drawingCanvas.getAttribute('height')))
      result.boxes.filter(function (box) {
        return box !== result.box
      }).forEach(function (box) {
        Quagga.ImageDebug.drawPath(box, { x: 0, y: 1 }, drawingCtx, { color: 'green', lineWidth: 2 })
      })
    }

    if (result.box) {
      Quagga.ImageDebug.drawPath(result.box, { x: 0, y: 1 }, drawingCtx, { color: '#00F', lineWidth: 2 })
    }

    if (result.codeResult && result.codeResult.code) {
      Quagga.ImageDebug.drawPath(result.line, { x: 'x', y: 'y' }, drawingCtx, { color: 'red', lineWidth: 3 })
    }
  }
})

let queried = false
Quagga.onDetected(async r => {
  if (queried) {
    return
  }
  try {
    queried = true
    const res = await fetch(`/api/mercadona?id=${parseInt(r.codeResult.code.substring(7, 12))}`)
    const data = await res.json()
    addItem(data.display_name, data.price_instructions.unit_price)
    setTimeout(() => {
      queried = false
    }, 3000)
  } catch (e) {
    console.log(e)
    queried = false
  }
})

let totalPrice = 0
function addItem(name, price) {
  const item = document.createElement('div')
  item.class = 'item'
  item.innerHTML = `<span class="name">${name}</span><span class="price">${price}</span>`
  document.querySelector('#list').appendChild(item)
  totalPrice = parseFloat(totalPrice) + parseFloat(price)
  document.querySelector('#total').innerHTML = totalPrice
}