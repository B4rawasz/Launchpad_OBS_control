const { app, BrowserWindow, ipcMain } = require('electron');

const {WebMidi} = require('WebMidi');

const {WebSocket} = require('ws');

const sha256 = require('js-sha256').sha256;
const {Base64} = require('js-base64');

const fs = require('fs');

const {defaultSettings, OBSrequest} = require("./js/class.js");

let appData = new URL(process.env.APPDATA);
let appFolder = "\\LaunchpadOBS";

let programSettings;

let mainWindow;

let midiIN;
let midiOUT;

let obsPass;
let obsIP;
let OBSws;



//Settings

function loadSettings() {
  try {
    if (fs.existsSync(appData + appFolder)) {
      try {
        if (!fs.existsSync(appData + appFolder + "\\settings.json")) {
          try {
            fs.appendFileSync(appData + appFolder + "\\settings.json", genDefSett());
            loadSettings();
          } catch (err) {
            console.log(err);
          }
        }else{
          try {
            let ss = fs.readFileSync(appData + appFolder + "\\settings.json");

            programSettings = JSON.parse(ss);

            applySettings();
          } catch (err) {
            console.log(err);
          }
        }
      } catch (err) {
        console.log(err);
      }
    }else{
      try {
        fs.mkdirSync(appData + appFolder);
        loadSettings();
      } catch (err) {
        console.log(err);
      }
    }
  } catch (err) {
    console.log(err);
  }
}

function genDefSett(){
  let sett = defaultSettings;

  for (let i = 1; i < 10; i++) {
    for (let j = 1; j < 10; j++) {
      sett.sett["p" + (10 * i + j)] = {};
    }
  }

  return JSON.stringify(sett);
}

function applySettings(){
  mainWindow.webContents.send('mainWindowRemember:bool', programSettings.rememberConnection);

  if(programSettings.rememberConnection == true){
    mainWindow.webContents.send('mainWindowRemember:data', programSettings.lastConnection.in, programSettings.lastConnection.out, programSettings.lastConnection.ip, programSettings.lastConnection.pass);
  }

  if(programSettings.autoConnect == true){

  }
}

function updateSettings(){
  try {
    fs.writeFileSync(appData + appFolder + "\\settings.json", JSON.stringify(programSettings), { flag: "w+" });
  } catch (err) {
    console.log(err);
  }
}

function saveBootSett(s_, inp_, outp_, ip_, pass_){
  if(!s_){
    programSettings.rememberConnection = false;
    updateSettings();
    return;
  }

  programSettings.rememberConnection = true;
  programSettings.lastConnection.in = inp_;
  programSettings.lastConnection.out = outp_;

  programSettings.lastConnection.ip = ip_;
  programSettings.lastConnection.pass = pass_;


  updateSettings();
}







//Window

const createWindow = () => {
    // Create the browser window.
    mainWindow = new BrowserWindow({
      width: 900,
      height: 650,
      center: true,
      minWidth: 900,
      minHeight: 650,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
      }
    })

    //mainWindow.removeMenu();
  
    // and load the index.html of the app.
    mainWindow.loadFile('./html/index.html');
  
    // Open the DevTools.
    //mainWindow.webContents.openDevTools()
}

app.whenReady().then(() => {
    createWindow();
    app.on('activate', () => {
      // On macOS it's common to re-create a window in the app when the
      // dock icon is clicked and there are no other windows open.
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    })
})

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit()
})








//IPC

ipcMain.on('ipcMainWindow:ready', function(e, x){ //Main Screen ready
  WebMidi.enable({sysex: true}).then(midiOnEnabled).catch(err => console.log(err)).then(loadSettings); //Enable WebMidi !!!WITH SYSEX!!! important becouse we will use it to switch launchpad mode and do other stuf
});

ipcMain.on('mainWindowMidiIN:select', function(e, x){ //Input selected
  midiIN = WebMidi.getInputByName(x);

  midiIN.addListener("noteon", e => {
    console.log(e.message.dataBytes);
    //midiOUT.send([144, e.message.dataBytes[0], 5]);
    handleMidiButton(e.message.dataBytes[0]);
  })

  midiIN.addListener("noteoff", e => {
    console.log(e.message.dataBytes);
  })

  midiIN.addListener("controlchange", e => {
    console.log(e.message.dataBytes);
    handleMidiButton(e.message.dataBytes[0]);
    //midiOUT.send([144, e.message.dataBytes[0], 5]);
  })
});

ipcMain.on('mainWindowMidiOUT:select', function(e, x){ //Output selected
  midiOUT = WebMidi.getOutputByName(x);

  midiOUT.sendSysex([0, 32, 41, 2, 13, 14, 1]);

  for (let i = 11; i <= 99; i++) {
    midiOUT.sendSysex([0, 32, 41, 2, 13, 3, 0, i, 0]);
  }

  getStatus();
});

ipcMain.on('mainWindowOBSwebsocket:select', function(e, _obsIP, _obsPass){
  obsPass = _obsPass;
  obsIP = _obsIP;

  OBSws = new WebSocket(_obsIP);

  OBSws.on('open', function open() {
    console.log("WS OPEN!!!");
  });
  
  OBSws.on('message', function message(data) {
    //console.log('received:');
    //console.log(JSON.parse(data));
    deserializeJSON(data);
  });

  OBSws.on('close', function message(data) {
    console.log('Close received: %s', data);
  });

  OBSws.on('error', function message(data) {
    console.log('Error received: %s', data);
    mainWindow.webContents.send("ws:err");
  });

  OBSws.on('unexpected-response', function message(data) {
    console.log('unexpected-response received: %s', data);
  });
});

ipcMain.on('mainWindowSaveBoot', function(e, s_, inp_, outp_, ip_, pass_){
  saveBootSett(s_, inp_, outp_, ip_, pass_);
});

ipcMain.on('settings:apply', function(e, obj){

  programSettings.sett["p"+obj.id] = {};

  if (obj.type == "record") {
    if(obj.mode == "toggle"){
      programSettings.sett["p" + obj.id].action = "ToggleRecord";
    }
    if(obj.mode == "start"){
      programSettings.sett["p" + obj.id].action = "StartRecord";
    }
    if(obj.mode == "stop"){
      programSettings.sett["p" + obj.id].action = "StopRecord";
    }
  }
  if (obj.type == "stream") {
    if(obj.mode == "toggle"){
      programSettings.sett["p" + obj.id].action = "ToggleStream";
    }
    if(obj.mode == "start"){
      programSettings.sett["p" + obj.id].action = "StartStream";
    }
    if(obj.mode == "stop"){
      programSettings.sett["p" + obj.id].action = "StopStream";
    }
  }
  if (obj.type == "vcam") {
    if(obj.mode == "toggle"){
      programSettings.sett["p" + obj.id].action = "ToggleVirtualCam";
    }
    if(obj.mode == "start"){
      programSettings.sett["p" + obj.id].action = "StartVirtualCam";
    }
    if(obj.mode == "stop"){
      programSettings.sett["p" + obj.id].action = "StopVirtualCam";
    }
  }
  if (obj.type == "scene") {
    programSettings.sett["p" + obj.id].action = "SetSceneSceneTransitionOverride";
    programSettings.sett["p" + obj.id].sceneName = obj.sceneName;
    programSettings.sett["p" + obj.id].transName = obj.transName;
  }

  if (obj.lightMode == "static") {
    programSettings.sett["p"+obj.id].lightMode = 0;
  }
  if (obj.lightMode == "fade") {
    programSettings.sett["p"+obj.id].lightMode = 1;
  }
  if (obj.lightMode == "blink") {
    programSettings.sett["p"+obj.id].lightMode = 2;
  }

  programSettings.sett["p"+obj.id].color1 = obj.color1;
  programSettings.sett["p"+obj.id].color2 = obj.color2;
  programSettings.sett["p"+obj.id].id = parseInt(obj.id);

  updateSettings();
});

function sendSceneList(list){
  mainWindow.webContents.send("sceneList", list);
}

function sendTransList(list){
  mainWindow.webContents.send("transList", list);
}

ipcMain.on('settings:clear', function(e, idC){
  programSettings.sett["p"+idC] = {};
  updateSettings();
})






//Midi

function midiOnEnabled() {
  // Inputs
  WebMidi.inputs.forEach(input => {
    let inp = [input.name, input.manufacturer];
    mainWindow.webContents.send('mainWindowMidiIN:list', inp);
  });

  // Outputs
  WebMidi.outputs.forEach(output => {
    let outp = [output.name, output.manufacturer];
    mainWindow.webContents.send('mainWindowMidiOUT:list', outp);
  });
}

function handleMidiButton(bID){
  let action = programSettings.sett["p" + bID].action;

  switch (action) {
    case "ToggleRecord":
      OBSws.send(JSON.stringify(OBSrequest.toggleRec));
      break;
    case "StartRecord":
      OBSws.send(JSON.stringify(OBSrequest.startRec));
      break;
    case "StopRecord":
      OBSws.send(JSON.stringify(OBSrequest.stopRec));
      break;
    case "ToggleStream":
      OBSws.send(JSON.stringify(OBSrequest.toggleStr));
      break;
    case "StartStream":
      OBSws.send(JSON.stringify(OBSrequest.startStr));
      break;
    case "StopStream":
      OBSws.send(JSON.stringify(OBSrequest.stopStr));
      break;
    case "ToggleVirtualCam":
      OBSws.send(JSON.stringify(OBSrequest.toggleVcam));
      break;
    case "StartVirtualCam":
      OBSws.send(JSON.stringify(OBSrequest.startVcam));
      break;
    case "StopVirtualCam":
      OBSws.send(JSON.stringify(OBSrequest.stopVcam));
      break;
    case "SetSceneSceneTransitionOverride":
      let data = OBSrequest.setTrans;
      data.d.requestData.transitionName = programSettings.sett["p"+bID].transName;
      OBSws.send(JSON.stringify(data));
      data = OBSrequest.setScene;
      data.d.requestData.sceneName = programSettings.sett["p"+bID].sceneName;
      OBSws.send(JSON.stringify(data));
      break;
    default:
      break;
  }
}

function RecStatus(isActive){
  for (const pad of Object.values(programSettings.sett)) {
    if(pad.action == "ToggleRecord" || pad.action == "StartRecord" || pad.action == "StopRecord"){
      if (!isActive) {
        midiOUT.sendSysex([0, 32, 41, 2, 13, 3, 0, pad.id, pad.color2]);
        mainWindow.webContents.send("changeStatus", pad.id, pad.color2);
      }else{
        if(pad.lightMode == 1){
          midiOUT.sendSysex([0, 32, 41, 2, 13, 3, 1, pad.id, pad.color2, pad.color1]);
        }else{
          midiOUT.sendSysex([0, 32, 41, 2, 13, 3, pad.lightMode, pad.id, pad.color1]);
        }
        mainWindow.webContents.send("changeStatus", pad.id, pad.color1);
      }
    }
  }
}

function StreamStatus(isActive){
  for (const pad of Object.values(programSettings.sett)) {
    if(pad.action == "ToggleStream" || pad.action == "StartStream" || pad.action == "StopStream"){
      if (!isActive) {
        midiOUT.sendSysex([0, 32, 41, 2, 13, 3, 0, pad.id, pad.color2]);
        mainWindow.webContents.send("changeStatus", pad.id, pad.color2);
      }else{
        if(pad.lightMode == 1){
          midiOUT.sendSysex([0, 32, 41, 2, 13, 3, 1, pad.id, pad.color2, pad.color1]);
        }else{
          midiOUT.sendSysex([0, 32, 41, 2, 13, 3, pad.lightMode, pad.id, pad.color1]);
        }
        mainWindow.webContents.send("changeStatus", pad.id, pad.color1);
      }
    }
  }
}

function VcamStatus(isActive){
  for (const pad of Object.values(programSettings.sett)) {
    if(pad.action == "ToggleVirtualCam" || pad.action == "StartVirtualCam" || pad.action == "StopVirtualCam"){
      if (!isActive) {
        midiOUT.sendSysex([0, 32, 41, 2, 13, 3, 0, pad.id, pad.color2]);
        mainWindow.webContents.send("changeStatus", pad.id, pad.color2);
      }else{
        if(pad.lightMode == 1){
          midiOUT.sendSysex([0, 32, 41, 2, 13, 3, 1, pad.id, pad.color2, pad.color1]);
        }else{
          midiOUT.sendSysex([0, 32, 41, 2, 13, 3, pad.lightMode, pad.id, pad.color1]);
        }
        mainWindow.webContents.send("changeStatus", pad.id, pad.color1);
      }
    }
  }
}

function sceneChanged(sceneN){
  for (const pad of Object.values(programSettings.sett)) {
    if (pad.action == "SetSceneSceneTransitionOverride") {
      if(pad.sceneName == sceneN){
        if(pad.lightMode == 1){
          midiOUT.sendSysex([0, 32, 41, 2, 13, 3, 1, pad.id, pad.color2, pad.color1]);
        }else{
          midiOUT.sendSysex([0, 32, 41, 2, 13, 3, pad.lightMode, pad.id, pad.color1]);
        }
        mainWindow.webContents.send("changeStatus", pad.id, pad.color1);
      }
      else{
        midiOUT.sendSysex([0, 32, 41, 2, 13, 3, 0, pad.id, pad.color2]);
        mainWindow.webContents.send("changeStatus", pad.id, pad.color2);
      }
    }
  }
}





//WebSocket

function deserializeJSON(json){
  let message = JSON.parse(json);

  switch (message.op) {
    case 0:
      handleHello(message.d);
      break;
    case 2:
      handleIdentified(message.d);
      break;
    case 5:
      handleEvent(message.d);
      break;
    case 7:
      handleRequestResponse(message.d);
  
    default:
      break;
  }
}

function handleHello(data){
  if(data.authentication == undefined){
    let response = {
      op: 1,
      d: {
        rpcVersion: 1
      }
    };

    let r = JSON.stringify(response);

    OBSws.send(r);
  }else{
    let hash = sha256.digest(obsPass + data.authentication.salt);
    let hashToBase64 = Base64.encode(hash);
    let key = sha256.digest(hashToBase64 + data.authentication.challenge);
    let keyToBase64 = Base64.encode(key);

    let response = {
      op: 1,
      d: {
        rpcVersion: 1,
        authentication: keyToBase64
      }
    };

    let r = JSON.stringify(response);

    OBSws.send(r);
  }
}

function handleIdentified(data){
  mainWindow.webContents.send('identified');
}

function getStatus(){
  OBSws.send(JSON.stringify(OBSrequest.getRec));
  OBSws.send(JSON.stringify(OBSrequest.getStr));
  OBSws.send(JSON.stringify(OBSrequest.getVcam));
  OBSws.send(JSON.stringify(OBSrequest.getScenes));
  OBSws.send(JSON.stringify(OBSrequest.getTrans));
}

function handleEvent(data){
  //console.log(data);
  switch (data.eventType) {
    case "RecordStateChanged":
      RecStatus(data.eventData.outputActive);
      break;
    case "StreamStateChanged":
      StreamStatus(data.eventData.outputActive);
      break;
    case "VirtualcamStateChanged":
      VcamStatus(data.eventData.outputActive);
      break;
    case "CurrentProgramSceneChanged":
      sceneChanged(data.eventData.sceneName);
      break;
  
    default:
      break;
  }
}

function handleRequestResponse(data){
  switch (data.requestType) {
    case "GetRecordStatus":
      RecStatus(data.responseData.outputActive);
      break;
    case "GetStreamStatus":
      StreamStatus(data.responseData.outputActive);
      break;
    case "GetVirtualCamStatus":
      VcamStatus(data.responseData.outputActive);
      break;
    case "GetSceneList":
      sendSceneList(data.responseData.scenes);
      OBSws.send(JSON.stringify(OBSrequest.getCurrScene));
      break;
    case "GetSceneTransitionList":
      sendTransList(data.responseData.transitions);
      break;
    case "GetCurrentProgramScene":
      sceneChanged(data.responseData.currentProgramSceneName);
      break;
    default:
      break;
  }
}