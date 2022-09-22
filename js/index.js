//"use strict";

import Map from './Map.js';
import Io from './Io.js';
import Time from './Time.js';
import Render from './Render.js';

// ---------------------------------------------
// Viewer information
var input =
{
    forwardbackward: 0,
    leftrightturn:   0,
    leftright:       0,
    updown:          0,
    lookup:          false,
    lookdown:        false,
    mouseposition:   null,
    keypressed:      false
}

var camera =
{
    x:        457,//512., // x position on the map
    y:        134,//800., // y position on the map
    height:   70., // height of the camera
    heading:    0,//-1.570796327, // direction of the camera
    horizon:  400, //280., // horizon position (look up and down)
    zNear: 1.,   // near plane distance
    zFar: 10000.,   // far plane distance
    yk: 0.866,//0.7071, //45deg
    hFov: 1.57079633,
    
    setvFov: function(value) {
        this.yk = value;
        console.log(value, Math.asin(camera.yk) * 180 / Math.PI);
    },
    columnscale: 1.,
    que: 1.,
    
    //input: input
};

var screendata =
{
    canvas:    null,
    context:   null,
    imagedata: null,

    bufarray:  null, // color data
    buf8:      null, // the same array but with bytes
    buf32:     null, // the same array but with 32-Bit words

    backgroundcolor: 0xFF00A0F0 //BGR
}

var time = undefined; //new Date().getTime();
var fpsTime = undefined; //new Date().getTime();
var map = undefined;
var io = undefined;
var render = undefined;

function Init()
{
    time = new Time();
    fpsTime = new Time();
    map = new Map(); map.Load("C1W;D1");
    io = new Io(input, camera, screendata, time);
    render = new Render(camera, map, io, screendata, time, fpsTime);
    window.onresize = e => render.OnResizeWindow(e); render.OnResizeWindow(); //kicks off rendering.
}

Init();