/* global preloadImagesTmr fxpreview fxhash fxrand Image palettes */
//
//
//  Genuary 2023 - 18
//
//
//  HELLO!! Code is copyright revdancatt (that's me), so no sneaky using it for your
//  NFT projects.
//  But please feel free to unpick it, and ask me questions. A quick note, this is written
//  as an artist, which is a slightly different (and more storytelling way) of writing
//  code, than if this was an engineering project. I've tried to keep it somewhat readable
//  rather than doing clever shortcuts, that are cool, but harder for people to understand.
//
//  You can find me at...
//  https://twitter.com/revdancatt
//  https://instagram.com/revdancatt
//  https://youtube.com/revdancatt
//
// Prompts:
//
// Inside
// 1960s cinematic futuristic interior architecture photo taken by ARRI canon fuji kodak, incredibly detailed,
// sharpen, details, vaporwave, professional lighting, film lighting 35mm anamorphic lightroom cinematography,
// depth of field, bokeh
//
// Outside
// 1960s cinematic american landscape photo taken by ARRI canon fuji kodak, incredibly detailed, sharpen,
// details, bright, sunny, colourful, professional lighting, film lighting 35mm anamorphic lightroom
// cinematography, depth of field, bokeh
//
// Face
// 1980s cinematic american portrait photo taken by ARRI canon fuji kodak, incredibly detailed, sharpen,
// details, colourful, professional lighting, film lighting 35mm anamorphic lightroom cinematography
//

const ratio = 1
// const startTime = new Date().getTime() // so we can figure out how long since the scene started
let drawn = false
let highRes = false // display high or low res
const features = {}
const nextFrame = null
let resizeTmr = null
let imageLoadingSetup = false
let triggered = false
/* eslint-disable */
let sourceImagesLoaded = []
/* eslint-enable */
const textures = []

window.$fxhashFeatures = {}

//  Work out what all our features are
const makeFeatures = () => {
  // Now we pick a number of rows, something between 6 and 18
  features.rows = Math.floor(fxrand() * 4)
  if (fxrand() < 0.25) {
    features.rows = 18 - features.rows
  } else {
    features.rows = 6 + features.rows
  }

  features.rowHeight = 1 / features.rows
  //  If we know the row height, that's the height we'll use for an equalateral triangle, so we need to work out the width
  features.triangleWidth = features.rowHeight / (Math.sqrt(3) / 2)
  //  Now we need to work out how many triangles we can fit in a row
  features.trianglesPerRow = Math.ceil(1 / features.triangleWidth) * 2

  features.indsideIndex = Math.floor(fxrand() * 24).toString().padStart(2, '0')
  features.outsideIndex = Math.floor(fxrand() * 24).toString().padStart(2, '0')
  features.face1Index = Math.floor(fxrand() * 24).toString().padStart(2, '0')
  features.face2Index = Math.floor(fxrand() * 24).toString().padStart(2, '0')

  let swapInsideOutside = false
  let swapFace = false
  // Sometimes we'll swap things
  if (fxrand() < 0.20) swapInsideOutside = true
  if (fxrand() < 0.14) swapFace = true

  // This holds the images we are going to load
  features.sourceArray = []

  // This is the inside image
  let pushThis = {
    type: 'inside',
    index: features.indsideIndex,
    swaps: []
  }
  // Now we need to work out where we are going to swap the images from and to
  let swapChance = 0.2
  if (swapFace) swapChance = 0.3
  for (let i = 0; i < features.rows; i++) {
    for (let j = 0; j < features.trianglesPerRow; j++) {
      // There is a chance we care going to swap into this spot
      if (fxrand() < swapChance) {
        const toIndex = `${i}-${j}`
        // Now grab somewhere to swap from
        const fromIndex = `${Math.floor(fxrand() * features.rows)}-${Math.floor(fxrand() * (features.trianglesPerRow - 4) + 2)}`
        pushThis.swaps.push({
          from: fromIndex,
          to: toIndex
        })
      }
    }
  }
  features.sourceArray.push(pushThis)

  // This is the outside image
  pushThis = {
    type: 'outside',
    index: features.outsideIndex,
    swaps: []
  }
  // Now we need to work out where we are going to swap the images from and to
  swapChance = 0.1
  if (swapFace) swapChance = 0.2
  for (let i = 0; i < features.rows; i++) {
    for (let j = 0; j < features.trianglesPerRow; j++) {
      // There is a chance we care going to swap into this spot
      if (fxrand() < swapChance) {
        const toIndex = `${i}-${j}`
        // Now grab somewhere to swap from
        const fromIndex = `${Math.floor(fxrand() * features.rows)}-${Math.floor(fxrand() * (features.trianglesPerRow - 4) + 2)}`
        pushThis.swaps.push({
          from: fromIndex,
          to: toIndex
        })
      }
    }
  }
  features.sourceArray.push(pushThis)

  // Now add the two faces
  pushThis = {
    type: 'face',
    index: features.face1Index,
    swaps: []
  }
  // For this we are going to do things slightly differently, we want to shuffle x% of the triangles around
  const subset1 = features.rows * features.trianglesPerRow * 0.1
  for (let i = 0; i < subset1; i++) {
    // We are going to pick a random place to take something from, but bias towards the middle
    const fromIndex = `${Math.floor((fxrand() * features.rows + fxrand() * features.rows) / 2)}-${Math.min(Math.max(2, Math.floor(((fxrand() * (features.trianglesPerRow - 4) + 2) + (fxrand() * (features.trianglesPerRow - 4) + 2)) / 2)), features.trianglesPerRow - 4)}`
    // Meanwhile to two is just randomly picked
    const toIndex = `${Math.floor(fxrand() * features.rows)}-${Math.floor(fxrand() * features.trianglesPerRow)}`
    pushThis.swaps.push({
      from: fromIndex,
      to: toIndex
    })
  }
  features.sourceArray.push(pushThis)

  pushThis = {
    type: 'face',
    index: features.face2Index,
    swaps: []
  }
  // For this we are going to do things slightly differently, we want to shuffle x% of the triangles around
  const subset2 = features.rows * features.trianglesPerRow * 0.4
  for (let i = 0; i < subset2; i++) {
    // We are going to pick a random place to take something from, but bias towards the middle
    const fromIndex = `${Math.floor((fxrand() * features.rows + fxrand() * features.rows) / 2)}-${Math.min(Math.max(2, Math.floor(((fxrand() * (features.trianglesPerRow - 4) + 2) + (fxrand() * (features.trianglesPerRow - 4) + 2)) / 2)), features.trianglesPerRow - 4)}`
    // And we're going to put it somewhere else in the middle
    const toIndex = `${Math.floor((fxrand() * features.rows + fxrand() * features.rows) / 2)}-${Math.floor((fxrand() * features.trianglesPerRow + fxrand() * features.trianglesPerRow) / 2)}`
    pushThis.swaps.push({
      from: fromIndex,
      to: toIndex
    })
  }
  features.sourceArray.push(pushThis)

  // Sometimes we'll swap the inside and outside
  if (swapInsideOutside) {
    features.sourceArray[0].type = 'outside'
    features.sourceArray[1].type = 'inside'
  }

  // Sometimes we'll set the first entry to be a face too
  if (swapFace) {
    features.sourceArray[0].type = 'face'
  }

  // Now pick a random palette
  features.palette = palettes[Math.floor(fxrand() * palettes.length)]
  // Now we want to pick 20% of the triangles to colourise
  features.colourise = []
  const indexesPicked = []
  features.colourful = fxrand() < 0.15
  let subset3Mod = 0.2
  if (features.colourful) subset3Mod = 1
  features.tintVsFill = fxrand() * 0.33 + 0.33
  const subset3 = features.rows * features.trianglesPerRow * subset3Mod
  while (indexesPicked.length < subset3) {
    const index = `${Math.floor(fxrand() * features.rows)}-${Math.floor(fxrand() * features.trianglesPerRow)}`
    if (indexesPicked.includes(index)) continue
    features.colourise.push({
      index,
      colour: features.palette.colors[Math.floor(fxrand() * features.palette.colors.length)].value,
      mode: fxrand() < features.tintVsFill ? 'fill' : 'transparent'
    })
    indexesPicked.push(index)
  }

  window.$fxhashFeatures.density = features.rows * features.trianglesPerRow
  window.$fxhashFeatures.inside = features.indsideIndex
  window.$fxhashFeatures.outside = features.outsideIndex
  window.$fxhashFeatures.face1 = features.face1Index
  window.$fxhashFeatures.face2 = features.face2Index
  window.$fxhashFeatures.palette = features.palette.name
  window.$fxhashFeatures.Background = 'Inside'
  if (swapInsideOutside) window.$fxhashFeatures.Background = 'Outside'
  if (swapFace) window.$fxhashFeatures.Background = 'Face'
  window.$fxhashFeatures.colourful = features.colourful
  window.$fxhashFeatures.tintVsFill = features.tintVsFill < 0.5 ? 'More tint' : 'More fill'
}

//  Call the above make features, so we'll have the window.$fxhashFeatures available
//  for fxhash
makeFeatures()
console.log(features)
console.table(window.$fxhashFeatures)

const init = async () => {
  //  I should add a timer to this, but really how often to people who aren't
  //  the developer resize stuff all the time. Stick it in a digital frame and
  //  have done with it!
  window.addEventListener('resize', async () => {
    clearTimeout(resizeTmr)
    resizeTmr = setTimeout(layoutCanvas, 100)
  })

  //  Now layout the canvas
  await layoutCanvas()
}

const layoutCanvas = async () => {
  //  Kill the next animation frame
  window.cancelAnimationFrame(nextFrame)

  const wWidth = window.innerWidth
  const wHeight = window.innerHeight
  let cWidth = wWidth
  let cHeight = cWidth * ratio
  if (cHeight > wHeight) {
    cHeight = wHeight
    cWidth = wHeight / ratio
  }
  const canvas = document.getElementById('target')
  if (highRes) {
    canvas.height = 8192
    canvas.width = 8192 / ratio
  } else {
    canvas.width = Math.min((8192 / 2), cWidth * 2)
    canvas.height = Math.min((8192 / ratio / 2), cHeight * 2)
    //  Minimum size to be half of the high rez cersion
    if (Math.min(canvas.width, canvas.height) < 8192 / 2) {
      if (canvas.width < canvas.height) {
        canvas.height = 8192 / 2
        canvas.width = 8192 / 2 / ratio
      } else {
        canvas.width = 8192 / 2
        canvas.height = 8192 / 2 / ratio
      }
    }
  }

  // Adjust it to fit the rows better
  if (!highRes) {
    const newHeight = Math.floor(canvas.height / features.rows) * features.rows
    canvas.height = newHeight
    canvas.width = newHeight / ratio
  }

  canvas.style.position = 'absolute'
  canvas.style.width = `${cWidth}px`
  canvas.style.height = `${cHeight}px`
  canvas.style.left = `${(wWidth - cWidth) / 2}px`
  canvas.style.top = `${(wHeight - cHeight) / 2}px`

  //  And draw it!!
  drawCanvas()
}

const drawCanvas = async () => {
  //  Let the preloader know that we've hit this function at least once
  drawn = true
  //  Make sure there's only one nextFrame to be called
  window.cancelAnimationFrame(nextFrame)

  // Grab all the canvas stuff
  const canvas = document.getElementById('target')
  const ctx = canvas.getContext('2d')
  const w = canvas.width
  const h = canvas.height

  //  Draw the outline, DEBUG
  /*
  ctx.strokeStyle = '#cccccc'
  ctx.lineWidth = 1
  ctx.beginPath()
  ctx.rect(0, 0, w, h)
  ctx.stroke()
  */

  // Copy the first image from the texture array to the canvas filling it
  ctx.drawImage(textures[0], 0, 0, w, h)

  // More debug
  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = w / 400

  // Build a map of all the triangles we need to draw, recording all the positions
  // so we can run through it later
  const triangleMap = {}

  const xOffset = (w - (features.triangleWidth * w * features.trianglesPerRow / 2)) / 2
  for (let i = 0; i < features.rows; i++) {
    //  Work out the y position of the row
    const y = i * features.rowHeight * h
    // we need to work out an x offset for the row so the triangles are centered in the middle

    for (let j = 0; j < features.trianglesPerRow; j++) {
      const index = `${i}-${j}`

      //  Work out the x position of the triangle
      const x = j * features.triangleWidth * w / 2

      let flipped = false
      // if j is odd, flip the triangle
      if (j % 2 === 1) {
        flipped = true
      }
      // If i is odd, flip the triangle
      if (i % 2 === 1) {
        flipped = !flipped
      }

      // Work out the bounding box of the triangle
      const bbox = {
        x: x + xOffset,
        y,
        width: features.triangleWidth * w,
        height: features.rowHeight * h
      }

      const points = []
      // Work out the positions of the points of the triangle
      if (flipped) {
        points.push({ x: x + xOffset, y: y + features.rowHeight * h })
        points.push({ x: x + features.triangleWidth * w / 2 + xOffset, y })
        points.push({ x: x + features.triangleWidth * w + xOffset, y: y + features.rowHeight * h })
      } else {
        points.push({ x: x + xOffset, y })
        points.push({ x: x + features.triangleWidth * w / 2 + xOffset, y: y + features.rowHeight * h })
        points.push({ x: x + features.triangleWidth * w + xOffset, y })
      }
      triangleMap[index] = {
        bbox,
        points,
        flipped
      }
    }
  }

  let demoCounter = 0
  for (let sourceId = 0; sourceId < features.sourceArray.length; sourceId++) {
    demoCounter++
    if (demoCounter > 4) continue
    if (features.sourceArray[sourceId].swaps) {
      features.sourceArray[sourceId].swaps.forEach((item, index) => {
        const fromTriangle = triangleMap[item.from]
        const toTriangle = triangleMap[item.to]
        // Mask the area we are going to draw into
        ctx.save()
        ctx.beginPath()
        ctx.moveTo(toTriangle.points[0].x, toTriangle.points[0].y)
        ctx.lineTo(toTriangle.points[1].x, toTriangle.points[1].y)
        ctx.lineTo(toTriangle.points[2].x, toTriangle.points[2].y)
        ctx.closePath()
        ctx.clip()
        // Now draw the image from the texture[0] image to the canvas
        if (!toTriangle.flipped) {
          ctx.drawImage(textures[sourceId], fromTriangle.bbox.x / w * textures[sourceId].width, fromTriangle.bbox.y / h * textures[sourceId].height, fromTriangle.bbox.width / w * textures[sourceId].width, fromTriangle.bbox.height / h * textures[sourceId].height, toTriangle.bbox.x, toTriangle.bbox.y, toTriangle.bbox.width, toTriangle.bbox.height)
        } else {
          ctx.save()
          ctx.scale(1, -1)
          ctx.drawImage(textures[sourceId], fromTriangle.bbox.x / w * textures[sourceId].width, fromTriangle.bbox.y / h * textures[sourceId].height, fromTriangle.bbox.width / w * textures[sourceId].width, fromTriangle.bbox.height / h * textures[sourceId].height, toTriangle.bbox.x, -toTriangle.bbox.y, toTriangle.bbox.width, -toTriangle.bbox.height)
          ctx.restore()
        }
        ctx.restore()
      })
    }
  }

  // Now we colourise the triangles
  features.colourise.forEach((item, index) => {
    const triangle = triangleMap[item.index]
    // Mask the area we are going to draw into
    ctx.save()
    ctx.beginPath()
    ctx.moveTo(triangle.points[0].x, triangle.points[0].y)
    ctx.lineTo(triangle.points[1].x, triangle.points[1].y)
    ctx.lineTo(triangle.points[2].x, triangle.points[2].y)
    ctx.closePath()
    ctx.clip()
    // set the fill colour
    ctx.fillStyle = item.colour
    if (item.mode === 'transparent') ctx.globalCompositeOperation = 'color'
    // Fill in the bounding box of the triangle
    ctx.fillRect(triangle.bbox.x, triangle.bbox.y, triangle.bbox.width, triangle.bbox.height)
    ctx.restore()
    ctx.globalCompositeOperation = 'source-over'
  })

  if (!triggered) {
    fxpreview()
  }
  triggered = true
}

const autoDownloadCanvas = async (showHash = false) => {
  const element = document.createElement('a')
  element.setAttribute('download', `Genuary-18-Definitely-Not-A-Grid_${fxhash}`)
  element.style.display = 'none'
  document.body.appendChild(element)
  let imageBlob = null
  imageBlob = await new Promise(resolve => document.getElementById('target').toBlob(resolve, 'image/png'))
  element.setAttribute('href', window.URL.createObjectURL(imageBlob, {
    type: 'image/png'
  }))
  element.click()
  document.body.removeChild(element)
}

//  KEY PRESSED OF DOOM
document.addEventListener('keypress', async (e) => {
  e = e || window.event
  // Save
  if (e.key === 's') autoDownloadCanvas()

  //   Toggle highres mode
  if (e.key === 'h') {
    highRes = !highRes
    console.log(`Highres mode is now ${highRes}`)
    await layoutCanvas()
  }
})

//  This preloads the images so we can get access to them
// eslint-disable-next-line no-unused-vars
const preloadImages = () => {
  // We need to load in four images based on the features.textureArray, we need to
  // have a load event for each of them, and then we need to check if all four have
  // loaded before we kick off the init function by setting the textureXLoaded to true
  // for each one
  if (!imageLoadingSetup) {
    features.sourceArray.forEach((texture, index) => {
      sourceImagesLoaded[index] = false
      textures[index] = new Image()
      textures[index].onload = () => {
        // eslint-disable-next-line no-eval
        eval(`sourceImagesLoaded[${index}] = true`)
      }
      textures[index].src = `./source/${texture.type}/image${texture.index}.jpg`
    })
  }
  imageLoadingSetup = true

  let allSourceImagesLoaded = true
  // Check to see if all the images have loaded
  sourceImagesLoaded.forEach((loaded) => {
    if (!loaded) allSourceImagesLoaded = false
  })

  //  If paper1 has loaded and we haven't draw anything yet, then kick it all off
  if (allSourceImagesLoaded && !drawn) {
    clearInterval(preloadImagesTmr)
    init()
  }
}
