export default class Render
{
    camera = undefined
    map = undefined
    io = undefined //maybe move up and out, only used once for updating camera
    screendata =
    {
        canvas:    null,
        context:   null,
        imagedata: null,

        bufarray:  null, // color data
        buf8:      null, // the same array but with bytes
        buf32:     null, // the same array but with 32-Bit words

        backgroundcolor: 0xFF00A0F0 //BGR
    }
    time = undefined
    fpsTime = undefined
    
    frames = 0
    ymin = undefined// = new Int32Array(screenwidth);
    updaterunning = false
    
    constructor(camera, map, io, time, fpsTime)
    {
        this.camera = camera;
        this.map = map;
        this.io = io;
        this.time = time;
        this.fpsTime = fpsTime;
    }
    
    Render()
    {
        //let result = 2 * Math.atan(camera.yk * 2) * 180. /  Math.PI;
        // console.log(camera.yk, Math.asin(camera.yk) * 180 / Math.PI);
        let screendata = this.screendata;
        let mapwidthperiod = this.map.width - 1;
        let mapheightperiod = this.map.height - 1;

        let screenwidth = screendata.canvas.width|0;
        //let sinang = Math.sin(camera.angle);
        //let cosang = Math.cos(camera.angle);
        
        //TODO what if screen width changes?
        for (let x = 0; x < screenwidth; x++)
            this.ymin[x] = screendata.canvas.height; //TODO OPTIMISE

        let deltaz = 1.;
        let buf32 = screendata.buf32;
        
        // Draw from front to back
        let camera = this.camera;
        let zNear = camera.zNear;
        let zFar  = camera.zFar;
        let height = camera.height;
        let horizon = camera.horizon|0;
        let camx = camera.x;
        let camy = camera.y;
        let heading = camera.heading;
        let mapaltitude = this.map.altitude;
        let mapcolor = this.map.color;
        let mapshift = this.map.shift;
        //let screenwidthinv = 1. / screenwidth;
        let yk = camera.yk;
        let columnscale = camera.columnscale;
        let hFov = camera.hFov;
        let hhFov = camera.hFov / 2;//half horizontal fov
        
        let ymin = this.ymin;
        
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

    Draw()
    {
        this.updaterunning = true;
        //console.log(this);
        this.time.updateDelta();
        this.io.UpdateCamera();
        
        this.DrawBackground();
        this.Render();
        this.Flip();
        
        //TODO put into a UI view class
        if (this.frames >= 120) //every 2 seconds or so in the ideal case
        {
            //TODO cache instead of getElementById each time.
            document.getElementById('fps').innerText = (this.frames / this.fpsTime.delta * 1000).toFixed(1) + " fps";
            
            this.fpsTime.updateDelta();
            
            this.frames = 0;
        }
        this.frames++;
        
        window.requestAnimationFrame(e => this.Draw(e), 0);
    }

    // ---------------------------------------------
    // Init routines

    OnResizeWindow()
    {
        let screendata = this.screendata;
        let aspect = window.innerWidth / window.innerHeight;
        
        screendata.canvas = document.getElementById('fullscreenCanvas');
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
        
        this.ymin = new Int32Array(screendata.canvas.width);
        
        this.Draw();
    }

    // ---------------------------------------------
    // Basic screen handling

    DrawBackground()
    {
        let buf32 = this.screendata.buf32;
        let color = this.screendata.backgroundcolor|0;
        for (let i = 0; i < buf32.length; i++) buf32[i] = color|0;
    }

    // Show the back buffer on screen
    Flip()
    {
        let screendata = this.screendata;
        screendata.imagedata.data.set(screendata.buf8);
        screendata.context.putImageData(screendata.imagedata, 0, 0);
    }
}