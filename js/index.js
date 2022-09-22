//"use strict";

import Map from './Map.js';
import Io from './Io.js';

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

// ---------------------------------------------
// Landscape data

var map =
{
    width:    1024,
    height:   1024,
    shift:    10,  // power of two: 2^10 = 1024
    altitude: new Uint8Array(1024*1024), // 1024 * 1024 byte array with height information
    color:    new Uint32Array(1024*1024) // 1024 * 1024 int array with RGB colors
};

// ---------------------------------------------
// Screen data

var screendata =
{
    canvas:    null,
    context:   null,
    imagedata: null,

    bufarray:  null, // color data
    buf8:      null, // the same array but with bytes
    buf32:     null, // the same array but with 32-Bit words

    backgroundcolor: 0xFF00A0F0 //BGR
};

// ---------------------------------------------
// Keyboard and mouse interaction


var updaterunning = false;

var time = new Date().getTime();


// for fps display
var timelastframe = new Date().getTime();
var frames = 0;

var ymin;// = new Int32Array(screenwidth);

// ---------------------------------------------
// The main render routine

function Render()
{
    //let result = 2 * Math.atan(camera.yk * 2) * 180. /  Math.PI;
   // console.log(camera.yk, Math.asin(camera.yk) * 180 / Math.PI);

    let mapwidthperiod = map.width - 1;
    let mapheightperiod = map.height - 1;

    let screenwidth = screendata.canvas.width|0;
    //let sinang = Math.sin(camera.angle);
    //let cosang = Math.cos(camera.angle);
    
    //TODO what if screen width changes?
    for (let x = 0; x < screenwidth; x++)
        ymin[x] = screendata.canvas.height; //TODO OPTIMISE

    let deltaz = 1.;
    let buf32 = screendata.buf32;
    
    // Draw from front to back
    let zNear = camera.zNear;
    let zFar  = camera.zFar;
    let height = camera.height;
    let horizon = camera.horizon|0;
    let camx = camera.x;
    let camy = camera.y;
    let heading = camera.heading;
    let mapaltitude = map.altitude;
    let mapcolor = map.color;
    let mapshift = map.shift;
    //let screenwidthinv = 1. / screenwidth;
    let yk = camera.yk;
    let columnscale = camera.columnscale;
    let hFov = camera.hFov;
    let hhFov = camera.hFov / 2;//half horizontal fov
    
    let lx = Math.sin(heading-hhFov);
    let ly = Math.cos(heading-hhFov);
    
    let rx = Math.sin(heading+hhFov);
    let ry = Math.cos(heading+hhFov);
    
    for (let z = zNear; z < zFar; z += deltaz) //for each ray step
    {
        //get float world space map coords we sample at L,R edges of screen,
        //at this current depth (z). (consider camera lateral arc from top)
        //90 degree FoV, as cos and sine are offset 90 degrees from each other?
        //without *z, this describes unit circle. 
        //Stepping between the two positions representing outer edges of screen,
        //combined with increasing z, causes rays to diverge horizontally.
        
        let maplxo =  lx * z; //-cosang * z - sinang * z;
        let maplyo =  ly * z; // sinang * z - cosang * z;
        let maprxo =  rx * z; // cosang * z - sinang * z;
        let mapryo =  ry * z; //-sinang * z - cosang * z;
        
        //let maplxo =  -cosang * z - sinang * z;
        //let maplyo =   sinang * z - cosang * z;
        //let maprxo =   cosang * z - sinang * z;
        //let mapryo =  -sinang * z - cosang * z;
        //TODO get our custom points' calc above to have same signs / rotation etc.
                
        //world map x,y change as we advance along this ray; derived from 
        //accelerating z as we move farther along the ray, hence in z loop.
        //NOTE: * screenwidthinv; is slower: eliminates a JIT optimisation?
        let dx = (maprxo - maplxo) / screenwidth;
        let dy = (mapryo - maplyo) / screenwidth;
        //console.log("d=", dx, dy);
        
        //world map coordinates (float)
        let maplx = maplxo + camx;
        let maply = maplyo + camy;
        let maprx = maprxo + camx;
        let mapry = mapryo + camy;
        /*
        if (z > 900 && z < 1004) 
        {
            //console.log(maplx, maply, " | ", maprx, mapry); 
            let lmx = Math.floor(maplx) & mapwidthperiod;
            let lmy = Math.floor(maply) & mapwidthperiod;
            let rmx = Math.floor(maprx) & mapwidthperiod;
            let rmy = Math.floor(mapry) & mapwidthperiod;
            console.log(lmx, lmy, rmx, rmy);
        }
        */

        //div-by-z causes rays to diverge vertically (no angles stored).
        let invz = yk * 800. / z;//Math.pow(z, camera.que);
        
        let xStart = 0;
        let xEnd = screenwidth;
        for (let x = xStart; x < xEnd; x++) //for each ray
        {
            //map 1D coords: cheap modulo wrap on x & y + upshift y.
            let mapoffset = ((Math.floor(maply) & mapwidthperiod) << mapshift) + (Math.floor(maplx) & mapheightperiod);
            //https://web.archive.org/web/20050206144506/http://www.flipcode.com/articles/voxelland_part02.shtml
            //the wave-surfing perspective projection formula:
            //Ys = ( Yv - Ye ) * Yk / Z + Yc
            //...where:
            //Ys: coordinate projected onto the screen
            //Yv: altitude of the voxel column
            //Ye: coordinate of the eye
            //Z: distance from the eye to the considered point
            //Yk: constant to scale the projection, possibly negative
            //Yc: constant to centre the projection, usually half the screen resolution
            let ytop = (height - columnscale * mapaltitude[mapoffset]) * invz + horizon|0;
            
            //draw the vertical line segment...
            let ybot = ymin[x];
            let flag = ytop <= ybot ? 1 : 0; // just <?
            ytop = ytop < 0 ? 0 : ytop;   
            
            // get offset on screen for the vertical line
            let offset = ((ytop * screenwidth) + x); //init.
            for (let k = ytop; k < ybot; k++)
            {
                buf32[offset]  = flag * mapcolor[mapoffset];
                offset        += flag * screenwidth; //increase for line above.
            }
            //...draw the vertical line segment.
            
            //...This variable loop length is where the problem is for GPU.
            //Need to restrict it to warp or wavefront size, or multiple thereof
            //(32 or 64 "threads" / "runs of pixels" at a time.)
            
            ymin[x] = ytop < ymin[x] ? ytop : ymin[x];
            
            //interpolate (gradually "rasterise") between start and end map tile
            maplx += dx;
            maply += dy;
        }
        //orthographic z delta from camera centre. i.e. regardless of heading
        //of each ray off camera centre, its z stepping is the same,
        //as in a sliced CT-scan style view (but perspective, not ortho).
        deltaz += 0.01; //OPTIMISE increments further away to be greater.
    }
}


// ---------------------------------------------
// Draw the next frame

function Draw()
{
    updaterunning = true;
    UpdateCamera();
    DrawBackground();
    Render();
    Flip();
    frames++;
/*
    if ((!input.keypressed))
    {
        updaterunning = false;
        console.log("nada");
    } else
    */
    {
        window.requestAnimationFrame(Draw, 0);
    }
}

// ---------------------------------------------
// Init routines


function OnResizeWindow()
{
    screendata.canvas = document.getElementById('fullscreenCanvas');

    var aspect = window.innerWidth / window.innerHeight;

    screendata.canvas.width = window.innerWidth<800?window.innerWidth:800;
    screendata.canvas.height = screendata.canvas.width / aspect;

    if (screendata.canvas.getContext)
    {
        screendata.context = screendata.canvas.getContext('2d');
        screendata.imagedata = screendata.context.createImageData(screendata.canvas.width, screendata.canvas.height);
    }

    screendata.bufarray = new ArrayBuffer(screendata.imagedata.width * screendata.imagedata.height * 4);
    screendata.buf8     = new Uint8Array(screendata.bufarray);
    screendata.buf32    = new Uint32Array(screendata.bufarray);
    
    ymin = new Int32Array(screendata.canvas.width);
    
    Draw();
}


// Update the camera for next frame. Dependent on keypresses
function UpdateCamera()
{
    var current = new Date().getTime();

    input.keypressed = false;
    if (input.leftrightturn != 0)
    {
        camera.heading += input.leftrightturn*0.1*(current-time)*0.03;
        input.keypressed = true;
    }
    if (input.leftright != 0)
    {
        camera.x += input.leftright * Math.cos(camera.heading) * (current-time)*0.03;
        camera.y -= input.leftright * Math.sin(camera.heading) * (current-time)*0.03;
        input.keypressed = true;
    }
    if (input.forwardbackward != 0)
    {
        camera.x += input.forwardbackward * Math.sin(camera.heading) * (current-time)*0.03;
        camera.y += input.forwardbackward * Math.cos(camera.heading) * (current-time)*0.03;
        input.keypressed = true;
    }
    if (input.updown != 0)
    {
        camera.height += input.updown * (current-time)*0.03;
        input.keypressed = true;
    }
    /*
    if (input.lookup)
    {
        camera.horizon += 2 * (current-time)*0.03;
        input.keypressed = true;
    }
    if (input.lookdown)
    {
        camera.horizon -= 2 * (current-time)*0.03;
        input.keypressed = true;
    }
    */
    /*
    // Collision detection. Don't fly below the surface.
    var mapoffset = ((Math.floor(camera.y) & (map.width-1)) << map.shift) + (Math.floor(camera.x) & (map.height-1))|0;
    if ((map.altitude[mapoffset]+10) > camera.height) camera.height = map.altitude[mapoffset] + 0;
*/
    time = current;
}

// ---------------------------------------------
// Basic screen handling

function DrawBackground()
{
    var buf32 = screendata.buf32;
    var color = screendata.backgroundcolor|0;
    for (var i = 0; i < buf32.length; i++) buf32[i] = color|0;
}

// Show the back buffer on screen
function Flip()
{
    screendata.imagedata.data.set(screendata.buf8);
    screendata.context.putImageData(screendata.imagedata, 0, 0);
}

var tiltData =
{
    pitchAngle: 0
};

function Init()
{
/*
    //tilt
    for (let i = 0; i < 360; i++)
    {
    tiltData.pitchAngle = i * Math.PI / 180.;
    
    let rad = 1.0;
    let tz = rad * Math.cos(tiltData.pitchAngle);
    let ty = rad * Math.sin(tiltData.pitchAngle);
    console.log();
    let ey = 2.0;
    let yk = 1.0;
    let yc = 280.;
    let ys = (ty - ey) * yk / tz + yc; 
    console.log('pitch='+tiltData.pitchAngle+' tz='+tz+' ty='+ty+' ys='+ys);
    }
    */


    /*
    let steps = 0;
    let deltaz = 1.;
    let deltaincr = 0.01;
    for (let z = 1; z < camera.zFar; z += deltaz) //for each ray step
    {
        deltaz += deltaincr;
        steps++
    }
    console.log("total steps zNear="," to zFar=", camera.zFar, "with delta incr", deltaincr, "is", steps, "with final deltaz", deltaz);
    */
    console.log(map);
    var map_ = new Map(map);
    for(var i=0; i<map.width*map.height; i++)
    {
        map.color[i] = 0xFF007050;
        map.altitude[i] = 0;
    }
    map_.LoadMap("C1W;D1");
    
    OnResizeWindow();


    
    InitControls();
    
    window.onresize       = OnResizeWindow;

    window.setInterval(function(){
        var current = new Date().getTime();
        document.getElementById('fps').innerText = (frames / (current-timelastframe) * 1000).toFixed(1) + " fps";
        frames = 0;
        timelastframe = current;
    }, 2000);
 console.log("INIT2");
}

var controls =
{
    zNear: undefined,
    zFar: undefined,
    horizon: undefined,
    columnscale: undefined,
    hFov: undefined,
    vFov: undefined,
    que: undefined,
    heading: undefined,
    height: undefined,
}


function InitControls()
{
    
    var io = new Io(input, camera, screendata);
    
    // set event handlers for keyboard, mouse, touchscreen and window resize
    let canvas = document.getElementById("fullscreenCanvas");
    window.onkeydown    = e => io.DetectKeysDown(e);
    window.onkeyup      = e => io.DetectKeysUp(e);
    canvas.onmousedown  = e => io.DetectMouseDown(e);
    canvas.onmouseup    = e => io.DetectMouseUp(e);
    canvas.onmousemove  = e => io.DetectMouseMove(e);
    canvas.ontouchstart = e => io.DetectMouseDown(e);
    canvas.ontouchend   = e => io.DetectMouseUp(e);
    canvas.ontouchmove  = e => io.DetectMouseMove(e);
    
    controls.zNear             = document.getElementById("zNear");
    controls.zFar              = document.getElementById("zFar");
    controls.horizon           = document.getElementById("horizon");
    controls.columnscale       = document.getElementById("columnscale");
    controls.hFov              = document.getElementById("hFov");
    controls.vFov              = document.getElementById("vFov");
    controls.heading           = document.getElementById("heading");
    controls.height            = document.getElementById("height");
    
    controls.zNear.oninput = e => io.onzNearChanged(e);
    controls.zFar .oninput = e => io.onzFarChanged(e);
    //controls.zFar .addEventListener("input", onzFarChanged);
    
    //let canvas = this.canvas = document.getElementById("voxels");
    //this.fovGroup            = document.getElementById("fovGroup");
    //this.fovArc              = document.getElementById("fovArc");
    //let svg = this.svg       = document.getElementById("topVectors");
}



Init();