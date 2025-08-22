const { createDevice, TimeNow, MessageEvent }  = RNBO; 

//p5.js
let accelerationVector;
let rotationVector;
let rectWidthPercent = 1;
let rectWidthStart = 0.1;
let rectColor = 0;
let img;
let promedioLuzSinAlpha = 0;
let promedioLuzConAlpha = 0;
let sumaPixelesSinAlpha = 0;
let sumaPixelesConAlpha = 0;
let backgroundColor = 200;

//RNBO specifics
let device;
let context;
let parameters = [];
let setBoolsToFalse = true;
let audioTrack = null;

//microphone
let micLevel;
let noteStatus;
let lightFrequency = 2;
let noteOnOff = 0;

//camera
let videoWidth = 640;
let videoHeight = 320;
let capture;
//let pixelCount = 0;

//OSC
const IPaddress = '192.168.100.13';
let udpPort;            

//
let value = 0;
let initThreshold = 1;
let threshold = initThreshold;
let cameraSection;
let xStart = 0;
let yStart = 0;
let timer = 0;
let shakenTimer = 0;
let shaken = 0;
async function loadRNBOdevice(){
    let WAContext = window.AudioContext || window.webkitAudioContext;
    context = new WAContext();
    //fetch patcher
    let rawPatcher = await fetch("export/silbato.export.json");
    let patcher = await rawPatcher.json();
    //call the library
    device = await RNBO.createDevice({context, patcher});
    device.messageEvent.subscribe((event) => {
      if (event.tag === "out1"){
          noteOnOff = event.payload;
          console.log(`note ${noteOnOff}`);

          // var noteOnOffMsg = new OSC.Message('/note', noteOnOff);
          // udpPort.send(noteOnOffMsg);
      }

      if (event.tag === "out3"){
        lightFrequency = event.payload;
      }

      if (event.tag === "out2"){
        micLevel = event.payload;
        //console.log(`micdB: ${micdB}`);
        // var micLevelMsg = new OSC.Message('/micLevel', micLevel);
        // udpPort.send(micLevelMsg);
      } 
    });
    connectMicrophone(device);
    //device.node.connect(outputNode);
    // Print the names of all the top-level parameters in the device.
    device.parameters.forEach(parameter => {
      console.log(parameter.id);
      console.log(parameter.name);
    });

    setParameterValue(device,'micGain', 6);
    setParameterValue(device,'cutoffFreq', 2);

    document.body.onclick = () => {
        context.resume(); 
        loop();
    }
    //makeSliders(device);
    console.log("RNBO device loaded.");
}

loadRNBOdevice();

let pointsOfInterestArray = [];
function setGetArray(xStart,yStart,xEnd,yEnd){
  for (let i = xStart; i < xEnd; i++){
    for (let j = yStart; j < yEnd; j++){
      point = { x:i, y:j };
      pointsOfInterestArray.push(point);
    }
  }
}



function setup() {
  //GALAXY A15 1080 x 2340, aspect ratio 6 : 13
  noLoop();
  createCanvas(360, 780);
  udpPort = new OSC();
  // Open the socket.
  udpPort.open({host: IPaddress, secure: true});
  // Create the video capture and hide the element. mirar https://p5js.org/reference/p5/createCapture/
  setGetArray(100,100,videoWidth,videoHeight);
  let options = {
    video: {
      ideal: {
        maxWidth: videoWidth,
        maxHeight: videoHeight,
        exposureMode: "manual",
        whiteBalanceMode: "manual",
        facingMode: "user",
        
      },
      // mandatory: {
      //   pointsOfInterest: pointsOfInterestArray
      // }
    },
    audio: false
  };
  capture = createCapture(options);
  capture.hide();

  accelerationVector = createVector(0, 0, 0);
  rotationVector = createVector(0, 0, 0);

  // Set threshold for movement detection
  // setMoveThreshold(0.1);
  setShakeThreshold(threshold);
  
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  background(backgroundColor);
}

function draw() {
  
  if (shaken){
    background(backgroundColor);
    calculateRectColor(5);
    noStroke();
    fill(lightFrequency);
    rect(0,rectWidthStart*height,width*rectWidthPercent,(1-rectWidthStart)*height);

    //image(capture, 0, 0, width, height);
    
    cameraSection = capture.get(111,143,285-111,347-143);
    cameraSection.loadPixels();
    image(cameraSection, 0, height/2, width, height/2);
    //filter(GRAY);
    //img = capture.get(0,0,capture.width, capture.height);
    //img.loadPixels();
    //img.filter(GRAY);
    //image(img, width*rectWidthPercent, 0, width, width * capture.height / capture.width);
    cameraAverage();
    if (millis() - timer > 100.0 && device){
      timer = millis();
      sendOscMessages();
    }
    //sendOscMessages();

  }
  //reset shaken status
  if (millis() - shakenTimer > 30000 && shaken){
    shaken = 0;
    console.log("shaken reset");
    background(200);
  }

}

function sendOscMessages(){
  var cameraValueMsg = new OSC.Message('/camera', promedioLuzSinAlpha);
  udpPort.send(cameraValueMsg);
  //console.log(`camera value ${promedioLuzSinAlpha} sent at  ${millis()}`);

  var noteOnOffMsg = new OSC.Message('/note', noteOnOff);
  udpPort.send(noteOnOffMsg);

  // var micLevelMsg = new OSC.Message('/micLevel', micLevel);
  // udpPort.send(micLevelMsg);

  // rotationVector.x = rotationX;
  // rotationVector.y = rotationY;
  // rotationVector.z = rotationZ;
  // var gyroMsg = new OSC.Message('/gyro', rotationVector.x, rotationVector.y, rotationVector.z);
  // udpPort.send(gyroMsg);

}

function mousePressed() {
  console.log(`pixel tocado: ${mouseX},${mouseY}`);
}

function mouseDragged() {
  xStart = mouseX;
  yStart = mouseY;
  console.log(xStart, yStart);
}

function deviceShaken() {
  shaken = 1;
  shakenTimer = millis();
  var shakeMsg = new OSC.Message('/shake', 1);
  udpPort.send(shakeMsg);
}

function deviceMoved() {
  
  rotationVector.x = rotationX;
  rotationVector.y = rotationY;
  rotationVector.z = rotationZ;
  var gyroMsg = new OSC.Message('/gyro', rotationVector.x, rotationVector.y, rotationVector.z);
  udpPort.send(gyroMsg);
  var movedMsg = new OSC.Message('/moved', 1);
  udpPort.send(movedMsg);
}

function calculateRectColor(frequency) {
  let x = sin(frameCount * frequency / 100);
  rectColor = map(x, -1, 1, 0, 255);
}

function micLevelToFreq(micdB){
  return map(micdB, -100, -30, 0, 1);
}
// functions for camera detection
function cameraAverage() {
  sumaPixelesSinAlpha = 0;
  sumaTodosLosPixeles = 0;
  let pixelCount = 0;
  let pixelesIndividualesCount = 0;
  let summedPixels = 0;
  let promedioPixel;
  let pixelIndividual = 0;

    for (let pixel of cameraSection.pixels) {
    if (pixelCount % 4 != 3) {
      summedPixels++;
      sumaPixelesSinAlpha += pixel;
      //pixelIndividual += pixel;
    } //else {
      //promedioPixel = pixelIndividual / 3;
      //pixelIndividual = 0;
      //sumaTodosLosPixeles += promedioPixel;
      //pixelesIndividualesCount++;
    //}
    pixelCount = pixelCount + 1;
    //console.log(pixel);
  }

  //promedioPixelesIndividuales = sumaTodosLosPixeles / pixelesIndividualesCount;
  promedioLuzSinAlpha = sumaPixelesSinAlpha / summedPixels;
  // fill(0);
  // text("Promedio luz s/ alpha: " + promedioLuzSinAlpha.toFixed(2), windowWidth/2, windowHeight/1.5);
  // text("Promedio luz c/ alpha: " + promedioLuzConAlpha.toFixed(2), windowWidth/2, windowHeight/1.5+32);
  // console.log(promedioLuzSinAlpha);
  // var cameraValueMsg = new OSC.Message('/camera', promedioLuzSinAlpha);
  // udpPort.send(cameraValueMsg);
}

// handle fullscreen
function doubleClicked() {
  let fs = fullscreen();
  fullscreen(!fs);
  context.resume();
  // if (device){
  //   audioTrack.applyConstraints({echoCancellation: false, noiseSuppression: false, autoGainControl: false});
  // } 
}

//touch functions
// let notaBajaStatus = 0;
// function touchEnded() {
//   if (notaBajaStatus){
//     notaBajaStatus = 0;
//   } else {
//     notaBajaStatus = 1;
//   }
//   //sendMessageToInport(notaBajaStatus,"lowHighNote");
// }

// RNBO
function storeParameters(device){
  device.parameters.forEach(parameter => {
    let param = {paramId : parameter.id, 
                paramName : parameter.name};
    parameters.push(param);
  });
}

//change value of a parameter
function setParameterValue(device, paramName, value){
  const param = device.parametersById.get(paramName);
  param.value = value;
}

//RNBO Functions
async function loadSamples(device,samples){
  for (let id in samples){
      const url = samples[id];
      await loadSample(url,id,device);
  }
  //enableButtons();
  loadSustainLoopPoints(device);
  sendMessageToInport(0.5,"normalizeSampleBuffer");
}

async function loadSample(url,id,device){
  //load audio to buffer
 const fileResponse = await fetch(url);
 const arrayBuf = await fileResponse.arrayBuffer();

 //decode audio
 const audioBuf = await context.decodeAudioData(arrayBuf);
 await device.setDataBuffer(id,audioBuf);
}

function connectMicrophone(device){
  // Assuming you have a RNBO device already, and an audio context as well
  const handleSuccess = (stream) => {
      const source = context.createMediaStreamSource(stream);
      source.connect(device.node);
      const tracks = stream.getTracks();
      tracks.map((t) => console.log(t.getSettings()));
      
      tracks.map((t) => console.log(t.getCapabilities()));
      
  }
  if (setBoolsToFalse){
  navigator.mediaDevices.getUserMedia({ audio:  {
      echoCancellation: false,
      noiseSuppression: false,
      autoGainControl: false
  }, video: false })
      .then(handleSuccess);
  } else {
    navigator.mediaDevices.getUserMedia({ audio: true, video: false })
        .then(handleSuccess);
  }
  const supports = navigator.mediaDevices.getSupportedConstraints();
  console.log(supports);
}

function sendMessageToInport(message,inportTag){
  const event = new MessageEvent(TimeNow, inportTag, [message]);
  device.scheduleEvent(event);
}

function loadSustainLoopPoints(device){
  const lowStart = device.parametersById.get("initSustainGrave");
  lowStart.value = sustainLoopPoints["grave"][0];
  console.log(lowStart.value);

  const lowEnd = device.parametersById.get("endSustainGrave");
  lowEnd.value = sustainLoopPoints["grave"][1];

  const highStart = device.parametersById.get("initSustainAgudo");
  highStart.value = sustainLoopPoints["agudo"][0];

  const highEnd = device.parametersById.get("endSustainAgudo");
  highEnd.value = sustainLoopPoints["agudo"][1];

}

//extraída de template de RNBO
function makeSliders(device) {
  let pdiv = document.getElementById("rnbo-parameter-sliders");
  let noParamLabel = document.getElementById("no-param-label");
  if (noParamLabel && device.numParameters > 0) pdiv.removeChild(noParamLabel);

  // This will allow us to ignore parameter update events while dragging the slider.
  let isDraggingSlider = false;
  let uiElements = {};

  device.parameters.forEach(param => {
      // Subpatchers also have params. If we want to expose top-level
      // params only, the best way to determine if a parameter is top level
      // or not is to exclude parameters with a '/' in them.
      // You can uncomment the following line if you don't want to include subpatcher params
      
      //if (param.id.includes("/")) return;

      // Create a label, an input slider and a value display
      let label = document.createElement("label");
      let slider = document.createElement("input");
      let text = document.createElement("input");
      let sliderContainer = document.createElement("div");
      sliderContainer.appendChild(label);
      sliderContainer.appendChild(slider);
      sliderContainer.appendChild(text);

      // Add a name for the label
      label.setAttribute("name", param.name);
      label.setAttribute("for", param.name);
      label.setAttribute("class", "param-label");
      label.textContent = `${param.name}: `;

      // Make each slider reflect its parameter
      slider.setAttribute("type", "range");
      slider.setAttribute("class", "param-slider");
      slider.setAttribute("id", param.id);
      slider.setAttribute("name", param.name);
      slider.setAttribute("min", param.min);
      slider.setAttribute("max", param.max);
      if (param.steps > 1) {
          slider.setAttribute("step", (param.max - param.min) / (param.steps - 1));
      } else {
          slider.setAttribute("step", (param.max - param.min) / 1000.0);
      }
      slider.setAttribute("value", param.value);

      // Make a settable text input display for the value
      text.setAttribute("value", param.value.toFixed(1));
      text.setAttribute("type", "text");

      // Make each slider control its parameter
      slider.addEventListener("pointerdown", () => {
          isDraggingSlider = true;
      });
      slider.addEventListener("pointerup", () => {
          isDraggingSlider = false;
          slider.value = param.value;
          text.value = param.value.toFixed(1);
      });
      slider.addEventListener("input", () => {
          let value = Number.parseFloat(slider.value);
          param.value = value;
      });

      // Make the text box input control the parameter value as well
      text.addEventListener("keydown", (ev) => {
          if (ev.key === "Enter") {
              let newValue = Number.parseFloat(text.value);
              if (isNaN(newValue)) {
                  text.value = param.value;
              } else {
                  newValue = Math.min(newValue, param.max);
                  newValue = Math.max(newValue, param.min);
                  text.value = newValue;
                  param.value = newValue;
              }
          }
      });

      // Store the slider and text by name so we can access them later
      uiElements[param.id] = { slider, text };

      // Add the slider element
      pdiv.appendChild(sliderContainer);
  });

  // Listen to parameter changes from the device
  device.parameterChangeEvent.subscribe(param => {
      if (!isDraggingSlider)
          uiElements[param.id].slider.value = param.value;
      uiElements[param.id].text.value = param.value.toFixed(1);
  });
}
