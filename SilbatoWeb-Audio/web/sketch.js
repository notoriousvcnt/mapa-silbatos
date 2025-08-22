let margin;
let buttonSize;
let separation;
let buttons = [];
let toggle;

//RNBO specifics
const { createDevice, TimeNow, MessageEvent }  = RNBO; 
let device;
let context;
let micdB;
let micdBSpan;
let gainMicSlider;
let noteStatus;
let micGainParam;
let micGainSpan;
let mouseClickedX;
let mouseClickedY;

const SAMPLES_2961 = {"sampleSilbatoGrave": "media/audio/2961/2961_largo_suave_grave.wav","sampleSilbatoAgudo": "media/audio/2961/2961_largo_suave_agudo.wav"};
const sustainLoopPoints = {"grave": [269.5,4930], "agudo": [298.1, 2889]};


async function loadRNBOdevice(){
    let WAContext = window.AudioContext || window.webkitAudioContext;
    context = new WAContext();
    // Create gain node and connect it to audio output
    const outputNode = context.createGain();
    outputNode.connect(context.destination);
    
    //fetch patcher
    let rawPatcher = await fetch("export/silbatoSampler_v3.export.json");
    //let rawPatcher = await fetch("export/samplerMAPA_v2.export.json");
    let patcher = await rawPatcher.json();

    //call the library
    device = await RNBO.createDevice({context, patcher});

    await loadSamples(device,SAMPLES_2961);

    device.messageEvent.subscribe((event) => {
        if (event.tag === "out3"){
            micdB = event.payload;
            micdBSpan.html(micdB.toFixed(2));
        }

        if (event.tag === "out4"){
            noteStatus = event.payload;
            console.log('note ', noteStatus);
            
        }
    });

    
   

    connectMicrophone(device);
    // device.node.connect(outputNode);
    device.node.connect(context.destination);
    
   micGainParam = device.parametersById.get("micGain");

    document.body.onclick = () => {
        context.resume(); 
        loop();
    }

    
    console.log("RNBO device loaded.");
}

loadRNBOdevice();

function setup() {
    createCanvas(windowWidth, windowHeight);
    margin = windowHeight*0.2;
    buttonSize = windowHeight*0.2;
    separation = windowHeight*0.1;
    //toggle = new Toggle(windowWidth/4, 0.5*margin+buttonSize/2,'test');
    buttons[0] = new Button(windowWidth/2, 0.5*margin+buttonSize/2,'lowHighNote');
    buttons[1] = new Button(windowWidth/2, 1.5*margin+buttonSize,'notaBaja');
    buttons[2] = new Button(windowWidth/2, 3.2*margin+buttonSize,'notaAlta');
    //createP("gainMicSlider");
    micGainSlider = createSlider(-60,12,0.5,0);
    micGainSpan = createSpan("Mic Gain");
    micGainSpan.position(windowWidth-200, windowHeight-70);
    micdBSpan = createSpan("Mic dB Level");
    micdBSpan.position(windowWidth-300, windowHeight-70);
    micGainSlider.position(windowWidth-200, windowHeight-50);
    micGainSlider.id("micGainSlider");
    micGainSlider.input(displayValue);

    slider = createSlider(0, 1.5,0.3,0.05);
    slider.id("size change");
    slider.input(displayValue);
    slider.position(10, windowHeight);
    slider.size(80);

    speedSlider = createSlider(0, 1,0.05,0.05);
    speedSlider.id("speed change");
    speedSlider.input(displayValue);
    speedSlider.position(100, windowHeight);
    speedSlider.size(80);
   
    textSize(60);
    noLoop();
}

function displayValue(){
    console.log(this.id(),this.value());

    if (this.id() == "micGainSlider"){
        micGainParam.value = this.value();
        micGainSpan.html(this.value().toFixed(2) + ' dB');
    }
}

function windowResized(){
    resizeCanvas(windowWidth, windowHeight);
}



function draw() {
    background(220);
    fill(0);
    let micdBMapped;
    if (device){	
        //text(micdB, windowWidth/2-margin, margin*3);
        micdBMapped = map(micdB,-60,0,1,1.5,true);
        //micdBSpan.html(micdB);
    }
    
    for (let button of buttons){
        button.show();
        button.isPressed();
        button.sendBang();
    }
    if (toggle){
      toggle.show();
      toggle.sendBang();
    }
    
}

function  mouseClicked(){
    toggle.isPressed(mouseX,mouseY);
}


class Button{
    constructor(x,y,inportTag){
        this.x = x;
        this.y = y;
        this.size = buttonSize;
        this.colour = color(255,0,0);
        this.state = 0;
        this.lastState = 0;
        this.inportTag = inportTag;
    }

    show(){
        noStroke();
        fill(this.colour);
        ellipse(this.x,this.y,this.size);
        fill(0);
        textSize(20);
        text(this.inportTag, this.x*0.91,this.y+this.size*0.55);        
    }

    isPressed(){
        let mouseRadius = dist(this.x,this.y,mouseX,mouseY);
        this.lastState = this.state;
        if (mouseRadius <= buttonSize/2 && mouseIsPressed){
            this.colour = color(255,0,0);
            this.state = 1;
        } else {
            this.colour = color(255,255,255);
            this.state = 0;
        }
        
    }

    sendBang(){
        if (this.state != this.lastState){
            //console.log('bang');
            sendMessageToInport(this.state,this.inportTag);
            //print actual message sended to inportTag
            console.log(`${this.inportTag}: ${this.state}`);

        }
    }
}

class Toggle{
    constructor(x,y,inportTag){
        this.x = x;
        this.y = y;
        this.size = buttonSize;
        this.colour = color(255,0,0);
        this.state = 0;
        this.lastState = 0;
        this.inportTag = inportTag;
    }

    show(){
        noStroke();
        
        fill(this.colour);
        ellipse(this.x,this.y,this.size);
        
        fill(0);
        textSize(20);
        text(this.inportTag, this.x*0.91,this.y+this.size*0.55); 
    }

    isPressed(xMouse,yMouse){
        let mouseRadius = dist(xMouse,yMouse,this.x,this.y);
        this.lastState = this.state;
        if (mouseRadius <= buttonSize/2){
            this.state = !this.state;
        }
        console.log(`toggle state: ${this.state}`);

        if (this.state){
            this.colour = color(255,0,0);
        } else {
            this.colour = color(255,255,255);
        }
        
    }

    sendBang(){
        if (this.state != this.lastState){
            
            sendMessageToInport(this.state,this.inportTag);
            //print actual message sended to inportTag
            //console.log(`${this.inportTag}: ${this.state}`);

        }
    }
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
    }
     navigator.mediaDevices.getUserMedia({ audio:  { //para eliminar configuraciones indeseadas
        echoCancellation: false,
        noiseSuppression: false,
        autoGainControl: false
    }, video: false })
        .then(handleSuccess);
}

function sendMessageToInport(message,inportTag){
    const event = new MessageEvent(TimeNow, inportTag, [message]);
    device.scheduleEvent(event);
}

function loadSustainLoopPoints(device){
    const lowStart = device.parametersById.get("initSustainGrave");
    lowStart.value = sustainLoopPoints["grave"][0];
    //console.log(lowStart.value);

    const lowEnd = device.parametersById.get("endSustainGrave");
    lowEnd.value = sustainLoopPoints["grave"][1];

    const highStart = device.parametersById.get("initSustainAgudo");
    highStart.value = sustainLoopPoints["agudo"][0];

    const highEnd = device.parametersById.get("endSustainAgudo");
    highEnd.value = sustainLoopPoints["agudo"][1];

}