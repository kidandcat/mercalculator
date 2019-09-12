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
  if (queried) return
  queried = true
  try {
    const res = await fetch(`/api/mercadona?id=${parseInt(r.codeResult.code.substring(7, 12))}`)
    const data = await res.json()
    addItem(data.id, data.display_name, data.price_instructions.unit_price, true)
    setTimeout(() => {
      queried = false
    }, 3000)
  } catch (e) {
    console.log(e)
    queried = false
  }
})

let totalPrice = 0
function addItem(id, name, price, save) {
  const item = document.createElement('div')
  item.classList.add('item')
  item.innerHTML = `
  <button onClick="deleteItem(${id})" class="delete">X</button>
  <span class="name">${name}</span>
  <span class="price">${price}€</span>`
  document.querySelector('#list').appendChild(item)
  totalPrice = parseFloat(totalPrice) + parseFloat(price)
  document.querySelector('#total').innerHTML = totalPrice
  if (save) saveItem({ id, name, price })
}

function saveItem(item) {
  let items = localStorage.getItem('list')
  if (items){
    items = JSON.parse(items)
  }else{
    items = []
  } 
  items.push(item)
  localStorage.setItem('list', JSON.stringify(items))
}

function deleteItem(id) {
  let items = localStorage.getItem('list')
  if (items) {
    items = JSON.parse(items)
    items = items.filter(i => i.id != id)
    localStorage.setItem('list', JSON.stringify(items))
    document.querySelector('#list').innerHTML = ''
    loadItems()
  }
}

function removeItems() {
  localStorage.clear()
  document.querySelector('#total').innerHTML = 0
  document.querySelector('#list').innerHTML = ''
}

function loadItems() {
  let items = localStorage.getItem('list')
  if (items) {
    items = JSON.parse(items)
    for (let i of items) {
      addItem(i.id, i.name, i.price, false)
    }
  }
}

loadItems()