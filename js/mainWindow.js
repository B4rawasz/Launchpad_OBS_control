const electron = require('electron');
const {ipcRenderer} = electron;

//IPC

ipcRenderer.send('ipcMainWindow:ready', "");

ipcRenderer.on('mainWindowMidiIN:list', function(e, x){
    let data = document.getElementById("inputSelectID");
    let child = document.createElement('option');
    child.value = x[0];
    child.textContent=x[0];
    data.appendChild(child);
});

ipcRenderer.on('mainWindowMidiOUT:list', function(e, x){
    let data = document.getElementById("outputSelectID");
    let child = document.createElement('option');
    child.value = x[0];
    child.textContent=x[0];
    data.appendChild(child);
});

/*****************************************************/
//Buttons

//Select device and OBS
function selectMidi(){
    ipcRenderer.send('mainWindowMidiIN:select', document.getElementById("inputSelectID").value);
    ipcRenderer.send('mainWindowMidiOUT:select', document.getElementById("outputSelectID").value);
    ipcRenderer.send('mainWindowOBSwebsocket:select', document.getElementById("ipOBSID").value, document.getElementById("passOBSID").value);

    document.getElementById("inputMenuInfo").innerHTML = document.getElementById("inputSelectID").value;
    document.getElementById("outputMenuInfo").innerHTML = document.getElementById("outputSelectID").value;

    document.getElementById("connectionWindow").classList = "hiden" //hides login box
}

//Show / hide menu
function SHMenu(){
    let window = document.getElementById("menuWindow");

    if(window.classList.contains("showMenu")){
        window.classList = "";
    }else{
        window.classList.add("showMenu");
    }
}

//Show button settings
function lButton(num){
    document.getElementById("settingsMenu").classList.remove("hiden");

    document.getElementById("settingsMenu").innerHTML = num;
}