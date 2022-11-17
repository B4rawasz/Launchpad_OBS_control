const { app, BrowserWindow, ipcMain } = require('electron');

const {WebMidi} = require('WebMidi');

const {WebSocket} = require('ws');

const sha256 = require('js-sha256').sha256;
const {Base64} = require('js-base64');

let mainWindow;

let midiIN;
let midiOUT;

let obsPass;
let obsIP;
let OBSws;



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
  WebMidi.enable({sysex: true}).then(midiOnEnabled).catch(err => console.log(err)); //Enable WebMidi !!!WITH SYSEX!!! important becouse we will use it to switch launchpad mode and do other stuf
});

ipcMain.on('mainWindowMidiIN:select', function(e, x){ //Input selected
  midiIN = WebMidi.getInputByName(x);

  midiIN.addListener("noteon", e => {
    console.log(e.message.dataBytes);
    midiOUT.send([144, e.message.dataBytes[0], 5]);
  })

  midiIN.addListener("noteoff", e => {
    console.log(e.message.dataBytes);
  })

  midiIN.addListener("controlchange", e => {
    console.log(e.message.dataBytes);
    midiOUT.send([144, e.message.dataBytes[0], 5]);
  })
});

ipcMain.on('mainWindowMidiOUT:select', function(e, x){ //Output selected
  midiOUT = WebMidi.getOutputByName(x);

  midiOUT.sendSysex([0, 32, 41, 2, 13, 14, 1]);

  for (let i = 11; i <= 99; i++) {
    midiOUT.sendSysex([0, 32, 41, 2, 13, 3, 0, i, 0]);
  }
});

ipcMain.on('mainWindowOBSwebsocket:select', function(e, _obsIP, _obsPass){
  obsPass = _obsPass;
  obsIP = _obsIP;

  OBSws = new WebSocket(_obsIP);

  OBSws.on('open', function open() {
    console.log("WS OPEN!!!");
  });
  
  OBSws.on('message', function message(data) {
    console.log('received: %s', data);
    deserializeJSON(data);
  });

  OBSws.on('close', function message(data) {
    console.log('Close received: %s', data);
  });

  OBSws.on('error', function message(data) {
    console.log('Error received: %s', data);
  });

  OBSws.on('unexpected-response', function message(data) {
    console.log('unexpected-response received: %s', data);
  });
});

//Midi Stuf

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

}

function handleEvent(data){
  console.log(data);
}