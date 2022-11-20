let defaultSettings = {
    rememberConnection: false,
    autoConnect: false,
    lastConnection: {
        in: "",
        out: "",
        ip: "",
        pass: ""
    },
    sett:{

    }
}

let OBSrequest = {
    getRec: {
        op: 6,
        d: {
            requestType: "GetRecordStatus",
            requestId: "Placeholder"
        }
    },
    getStr: {
        op: 6,
        d: {
            requestType: "GetStreamStatus",
            requestId: "Placeholder"
        }
    },
    getVcam: {
        op: 6,
        d: {
            requestType: "GetVirtualCamStatus",
            requestId: "Placeholder"
        }
    },
    getScenes: {
        op: 6,
        d: {
            requestType: "GetSceneList",
            requestId: "Placeholder"
        }
    },
    getTrans: {
        op: 6,
        d: {
            requestType: "GetSceneTransitionList",
            requestId: "Placeholder"
        }
    },
    getCurrScene: {
        op: 6,
        d: {
            requestType: "GetCurrentProgramScene",
            requestId: "Placeholder"
        }
    },
    toggleRec:{
        op: 6,
        d: {
            requestType: "ToggleRecord",
            requestId: "Placeholder"
        }
    },
    startRec:{
        op: 6,
        d: {
            requestType: "StartRecord",
            requestId: "Placeholder"
        }
    },
    stopRec:{
        op: 6,
        d: {
            requestType: "StopRecord",
            requestId: "Placeholder"
        }
    },
    toggleStr:{
        op: 6,
        d: {
            requestType: "ToggleStream",
            requestId: "Placeholder"
        }
    },
    startStr:{
        op: 6,
        d: {
            requestType: "StartStream",
            requestId: "Placeholder"
        }
    },
    stopStr:{
        op: 6,
        d: {
            requestType: "StopStream",
            requestId: "Placeholder"
        }
    },
    toggleVcam:{
        op: 6,
        d: {
            requestType: "ToggleVirtualCam",
            requestId: "Placeholder"
        }
    },
    startVcam:{
        op: 6,
        d: {
            requestType: "StartVirtualCam",
            requestId: "Placeholder"
        }
    },
    stopVcam:{
        op: 6,
        d: {
            requestType: "StopVirtualCam",
            requestId: "Placeholder"
        }
    },
    setScene:{
        op: 6,
        d: {
            requestType: "SetCurrentProgramScene",
            requestId: "Placeholder",
            requestData: {
                sceneName: ""
            }
        }
    },
    setTrans:{
        op: 6,
        d: {
            requestType: "SetCurrentSceneTransition",
            requestId: "Placeholder",
            requestData: {
                transitionName: ""
            }
        }
    }
}

module.exports = { defaultSettings, OBSrequest };