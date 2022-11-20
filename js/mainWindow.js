const electron = require('electron');
const {ipcRenderer} = electron;


let inputSelectID = document.getElementById("inputSelectID");
let outputSelectID = document.getElementById("outputSelectID");
let ipOBSID = document.getElementById("ipOBSID");
let passOBSID = document.getElementById("passOBSID");
let rememberID = document.getElementById("rememberID");
let connectButton = document.getElementById("connectButtonID");

let menuWindow = document.getElementById("menuWindow");
let connectionWindow = document.getElementById("connectionWindow");
let inputMenuInfo = document.getElementById("inputMenuInfo");
let outputMenuInfo = document.getElementById("outputMenuInfo");
let OBSMenuInfo = document.getElementById("OBSMenuInfo");

let settingsMenu = document.getElementById("settingsMenu");
let settingsButtons = document.getElementById("buttons");

let elements = document.getElementsByTagName("input");

let staticSettingOption = document.getElementById("staticRadio");

let recordWindowOption = document.getElementById("recordRadio");

let toggleRecOption = document.getElementById("toggleRecRadio");
let toggleStreamOption = document.getElementById("toggleStrRadio");
let toggleVcamOption = document.getElementById("toggleVcamRadio");

let recordWindowWindow = document.getElementById("recordSettingsMain");
let streamWindowWindow = document.getElementById("streamSettingsMain");
let vcamWindowWindow = document.getElementById("vcamSettingsMain");
let sceneWindowWindow = document.getElementById("sceneSettingsMain");

let tgSceneList = document.getElementById("tgSceneList");
let tgTransitionList = document.getElementById("tgTransitionList");

let activeWindow;

let cbON = document.getElementsByClassName("cbON");
let cbOFF = document.getElementsByClassName("cbOFF");

let colorPicker1 = document.getElementById("coloPicker1");
let colorPicker2 = document.getElementById("coloPicker2");

let cpMask = document.getElementById("mask");

let colorBox1 = document.getElementById("cb1");
let colorBox2 = document.getElementById("cb2");

let color1 = 0;
let color2 = 0;

let id;



startupSettingsPos();


//IPC

ipcRenderer.send('ipcMainWindow:ready', "");

ipcRenderer.on('mainWindowMidiIN:list', function(e, x){
    let data = inputSelectID;
    let child = document.createElement('option');
    child.value = x[0];
    child.textContent=x[0];
    data.appendChild(child);
});

ipcRenderer.on('mainWindowMidiOUT:list', function(e, x){
    let data = outputSelectID;
    let child = document.createElement('option');
    child.value = x[0];
    child.textContent=x[0];
    data.appendChild(child);
});

ipcRenderer.on('mainWindowRemember:bool', function(e, x){
    if (x) {
        rememberID.checked = true;
    }
});

ipcRenderer.on('mainWindowRemember:data', function(e, inp, outp, ip, pass){
    //inputSelectID.value = inp;
    let is = inputSelectID;
    let os = outputSelectID;

    ipOBSID.value = ip;
    passOBSID.value = pass;

    for (const child of is.children) {
        if(child.value == inp){
            child.selected = true;
        }
    }

    for (const child of os.children) {
        if(child.value == outp){
            child.selected = true;
        }
    }
});

ipcRenderer.on('identified', function(e){
    connectionWindow.classList = "hiden" //hides login box

    inputMenuInfo.innerHTML = inputSelectID.value;
    outputMenuInfo.innerHTML = outputSelectID.value;

    ipcRenderer.send('mainWindowMidiIN:select', inputSelectID.value);
    ipcRenderer.send('mainWindowMidiOUT:select', outputSelectID.value);

    OBSMenuInfo.innerHTML = "<i class=\"fa-solid fa-check\"></i>";
});

ipcRenderer.on("ws:err", function(e){
    connectButton.disabled = false;

    //
    //DODAĆ POPUP
    //
});

ipcRenderer.on("sceneList", function(e, list){
    let z = 1;
    list.forEach(element => {
        let el = document.createElement("input");
        el.type = "radio";
        el.name = "sceneListN";
        el.classList.add("scL");
        el.value = element.sceneName;
        el.id = element.sceneName;
        if (z == list.length) {
            el.checked = true;
        }
        let le = document.createElement("label");
        le.htmlFor = element.sceneName;
        le.innerHTML = element.sceneName;

        tgSceneList.appendChild(el);
        tgSceneList.appendChild(le);
        z++;
    });
});

ipcRenderer.on("transList", function(e, list){
    let z = 1;
    list.forEach(element => {
        let el = document.createElement("input");
        el.type = "radio";
        el.name = "transListN";
        el.classList.add("trL");
        el.value = element.transitionName;
        el.id = element.transitionName;
        if (z == list.length) {
            el.checked = true;
        }
        let le = document.createElement("label");
        le.htmlFor = element.transitionName;
        le.innerHTML = element.transitionName;

        tgTransitionList.appendChild(el);
        tgTransitionList.appendChild(le);
        z++;
    });
});

ipcRenderer.on("changeStatus", function(e, id_, c_){
    let lB = document.getElementsByClassName("lButton");

    for (const b of lB) {
        if(b.id == id_){
            b.style.backgroundColor = collorsJS["c"+c_];
        }
    }
});


/*****************************************************/
//Buttons

//Select device and OBS
function selectMidi(){
    ipcRenderer.send('mainWindowOBSwebsocket:select', ipOBSID.value, passOBSID.value);

    ipcRenderer.send('mainWindowSaveBoot', rememberID.checked, inputSelectID.value, outputSelectID.value, ipOBSID.value, passOBSID.value);

    connectButton.disabled = true;
}

//Show / hide menu
function SHMenu(){
    let window = menuWindow;

    if(window.classList.contains("showMenu")){
        window.classList = "";
    }else{
        window.classList.add("showMenu");
    }

    startupSettingsPos();
}

//Show button settings
function lButton(num){
    settingsMenu.classList.remove("hiden");

    let idBox = document.getElementById("settingsIDelement");

    idBox.innerHTML = num;

    id = num;
}

//Hide button settings
function hideSettings(){
    settingsMenu.classList.add("hiden");

    staticSettingOption.checked = true;
    recordWindowOption.checked = true;
    toggleRecOption.checked = true;
    toggleStreamOption.checked = true;
    toggleVcamOption.checked = true;

    updateTopMenu("record");

    let scL = document.getElementsByClassName("scL");
    let lastScl;

    for (const sc of scL) {
        sc.checked = false;
        lastScl = sc;
    }
    lastScl.checked = true;

    let trL = document.getElementsByClassName("trL");
    let lastTrl;

    for (const sc of trL) {
        sc.checked = false;
        lastTrl = sc;
    }
    lastTrl.checked = true;

    setColor(1, 0);
    setColor(2, 0);
}

function applySettings(){

    let settingsToApply = {};

    for (const element of elements) {
        if(element.type == "radio" && element.name == "tg"){
            for (const el of elements) {
                if(element.value == "record" && element.checked == true){
                    settingsToApply.type = "record";
                    if(el.type == "radio" && el.value == "toggleRec" && el.checked == true){
                        settingsToApply.mode = "toggle";
                    }
                    if(el.type == "radio" && el.value == "startRec" && el.checked == true){
                        settingsToApply.mode = "start";
                    }
                    if(el.type == "radio" && el.value == "stopRec" && el.checked == true){
                        settingsToApply.mode = "stop";
                    }
                }
                if(element.value == "stream" && element.checked == true){
                    settingsToApply.type = "stream";
                    if(el.type == "radio" && el.value == "toggleStr" && el.checked == true){
                        settingsToApply.mode = "toggle";
                    }
                    if(el.type == "radio" && el.value == "startStr" && el.checked == true){
                        settingsToApply.mode = "start";
                    }
                    if(el.type == "radio" && el.value == "stopStr" && el.checked == true){
                        settingsToApply.mode = "stop";
                    }
                }
                if(element.value == "vcam" && element.checked == true){
                    settingsToApply.type = "vcam";
                    if(el.type == "radio" && el.value == "toggleVcam" && el.checked == true){
                        settingsToApply.mode = "toggle";
                    }
                    if(el.type == "radio" && el.value == "startVcam" && el.checked == true){
                        settingsToApply.mode = "start";
                    }
                    if(el.type == "radio" && el.value == "stopVcam" && el.checked == true){
                        settingsToApply.mode = "stop";
                    }
                }
            }

            if(element.value == "scene" && element.checked == true){
                settingsToApply.type = "scene";
                for (const op of elements) {
                    if (op.name == "sceneListN" && op.checked == true) {
                        settingsToApply.sceneName = op.value;
                    }
                    if (op.name == "transListN" && op.checked == true) {
                        settingsToApply.transName = op.value;
                    }
                }
            }
        }
    
        if(element.type == "radio" && element.name == "md" && element.checked == true){
            settingsToApply.lightMode = element.value;
        }
    }
    settingsToApply.color1 = color1;
    settingsToApply.color2 = color2;
    settingsToApply.id = id;

    ipcRenderer.send('settings:apply', settingsToApply);

    hideSettings();
}

function clearSett(){
    ipcRenderer.send('settings:clear', id);
    hideSettings();
}

function openCP(x){
    if(x == 1){
        colorPicker1.classList.remove("hiden");
        cpMask.classList.remove("hiden");
    }
    if(x == 2){
        colorPicker2.classList.remove("hiden");
        cpMask.classList.remove("hiden");
    }
}

function closeCP(){
    colorPicker1.classList.add("hiden");
    colorPicker2.classList.add("hiden");
    cpMask.classList.add("hiden");
}

/*****************************************************/
//Web logic
function startupSettingsPos(){
    recordWindowOption.checked = true;
    staticSettingOption.checked = true;
    toggleRecOption.checked = true;
    toggleStreamOption.checked = true;
    toggleVcamOption.checked = true;

    let ctr = document.getElementsByClassName("settingsMainWindow");

    for (const str of ctr) {
        str.classList.add("hiden");
    }

    activeWindow = recordWindowWindow;
    activeWindow.classList.remove("hiden");
}


function updateTopMenu(screenToGo){
    activeWindow.classList.add("hiden");
    switch (screenToGo) {
        case "record":
            activeWindow = recordWindowWindow;
            activeWindow.classList.remove("hiden");
            break;
        case "stream":
            activeWindow = streamWindowWindow;
            activeWindow.classList.remove("hiden");
            break;
        case "vcam":
            activeWindow = vcamWindowWindow;
            activeWindow.classList.remove("hiden");
            break;
        case "scene":
            activeWindow = sceneWindowWindow;
            activeWindow.classList.remove("hiden");
            break;
    
        default:
            break;
    }
}

function setColor(cpNum, colorID){
    if(cpNum == 1){
        colorBox1.style = `background-color: ${collorsJS["c"+colorID]}`;
        color1 = colorID;
        colorPicker1.classList.add("hiden");
        cpMask.classList.add("hiden");

        updateColorAnim();
    }
    if(cpNum == 2){
        colorBox2.style = `background-color: ${collorsJS["c"+colorID]}`;
        color2 = colorID;
        colorPicker2.classList.add("hiden");
        cpMask.classList.add("hiden");

        updateColorAnim();
    }
}



/*****************************************************/
//Web design

function updateColorAnim(){
    for (const cbb of cbOFF) {
        cbb.style.backgroundColor = collorsJS["c"+color2];
    }

    for (const element of elements) {
        if(element.type == "radio" && element.name == "md"){
            for (const cbb of cbON) {
                if(element.checked == true && element.value == "static"){ 
                    cbb.getAnimations().forEach(anim => {
                        anim.cancel();
                    });
                    cbb.style.backgroundColor = collorsJS["c"+color1];
                }
                if(element.checked == true && element.value == "blink"){
                    cbb.getAnimations().forEach(anim => {
                        anim.cancel();
                    });

                    cbb.animate(
                        [
                            {backgroundColor: collorsJS["c"+color1]},
                            {backgroundColor: "gray"}
                        ],
                        {
                            duration: 2000,
                            iterations: Infinity
                        }
                    );
                }
                if(element.checked == true && element.value == "fade"){
                    cbb.getAnimations().forEach(anim => {
                        anim.cancel();
                    });

                    cbb.animate(
                        [
                            {backgroundColor: collorsJS["c"+color2]},
                            {backgroundColor: collorsJS["c"+color1]},
                        ],
                        {
                            duration: 500,
                            iterations: Infinity,
                            easing: "ease"
                        }
                    );
                }
            }
        }
    }
}

let v = 9;

for (let i = 0; i < 9; i++) {
    let row = document.createElement("div");
    row.classList = "col";

    for (let j = 1; j < 10; j++) {
        let but = document.createElement("div");
        but.classList = "lButton";
        but.id = 10 * v + j;
        but.onclick = function(){
            lButton(this.id);
        }

        row.appendChild(but);
    }
    v--;
    settingsButtons.appendChild(row);
}

let c = 0;

for (let i = 0; i < 8; i++) {
    let col = document.createElement("div");
    col.classList = "cpCol";
    
    for (let j = 0; j < 8; j++) {
        let cpBox = document.createElement("div");
        cpBox.classList = "colorPickerBox";
        cpBox.id = `c${c}`;
        cpBox.value = c;
        cpBox.style = `background-color: ${collorsJS["c"+c]}`;
        cpBox.onclick = function(){
            setColor(1, this.value);
        }
        c++;

        col.appendChild(cpBox);
    }
    
    document.getElementById("coloPicker1").appendChild(col);
}

c = 0;

for (let i = 0; i < 8; i++) {
    let col = document.createElement("div");
    col.classList = "cpCol";
    
    for (let j = 0; j < 8; j++) {
        let cpBox = document.createElement("div");
        cpBox.classList = "colorPickerBox";
        cpBox.id = `c${c}`;
        cpBox.value = c;
        cpBox.style = `background-color: ${collorsJS["c"+c]}`;
        cpBox.onclick = function(){
            setColor(2, this.value);
        }
        c++;

        col.appendChild(cpBox);
    }
    
    document.getElementById("coloPicker2").appendChild(col);
}

for (const element of elements) {
    if(element.type == "radio" && element.name == "tg"){
        element.onclick = function(){
            updateTopMenu(this.value);
        }
    }

    if(element.type == "radio" && element.name == "md"){
        element.onclick = function(){
            updateColorAnim();
        }
    }
}