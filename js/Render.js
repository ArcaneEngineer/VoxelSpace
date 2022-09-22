import CanvasView from './CanvasView.js';

export default class Render extends CanvasView
{
    camera    = undefined
    map       = undefined
    io        = undefined //maybe move up and out, only used once for updating camera
    
    bufarray  = undefined // color data
    buf8      = undefined // the same array but with bytes
    buf32     = undefined // the same array but with 32-Bit words
    
    time = undefined
    fpsTime = undefined
    
    frames = 0
    ymin = undefined// = new Int32Array(screenwidth);
    updaterunning = false
    backgroundcolor = 0xFF00A0F0 //BGR
    
    constructor(camera, map, io, time, fpsTime, elementName)
    {
        super(undefined);
        
        this.camera = camera;
        this.map = map;
        this.io = io;
        this.time = time;
        this.fpsTime = fpsTime;
        
        this.elementName = elementName;
    }
    
    changeScale(scale)
    {
        //super.changeScale(this.canvas, 1, scale); 
        //...cannot change the canvas size, only the style size, or it clears!
        super.changeElementDimensions(this.canvas, 1, this.xRes, this.yRes);
        super.changeStyleDimensions(this.canvas.style, scale, this.xRes, this.yRes);
    }
    
    initUI()
    {
        //OLD
        let aspect = window.innerWidth / window.innerHeight;
        let canvas = this.canvas = document.getElementById(this.elementName);
        
        this.canvas.width = window.innerWidth;
        this.canvas.height = this.canvas.width / aspect;
        let xRes = this.xRes = this.canvas.width;//core.rayCaster.colCount;
        let yRes = this.yRes = this.canvas.height;//core.rayCaster.rowCount;
        console.log(xRes, yRes);
        //let core = this.core;
        this.changeScale(1);//core.scale);
        
        //OLD
        //if (this.canvas.getContext)
        //{
        this.context   = this.canvas.getContext("2d");
        this.imagedata = this.context.createImageData(this.canvas.width, this.canvas.height);
        //this.imageData = this.context.getImageData(0,0,xRes,yRes);
        //}

        this.bufarray = new ArrayBuffer(this.imagedata.width * this.imagedata.height * 4);
        this.buf8     = new Uint8Array (this.bufarray);
        this.buf32    = new Uint32Array(this.bufarray);
        
        this.ymin = new Int32Array(this.canvas.width);
    }

    OnResizeWindow()
    {        
        this.initUI(this.elementName);
        
        this.Render();
    }
    
    Render()
    {
        this.updaterunning = true;
        //console.log(this);
        this.time.updateDelta();
        this.io.UpdateCamera();
        
        this.RenderBackground();
        this.RenderTerrain();
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
        
        window.requestAnimationFrame(e => this.Render(e), 0);
    }
    
    // Show the back buffer on screen
    Flip()
    {
        this.imagedata.data.set(this.buf8);
        this.context.putImageData(this.imagedata, 0, 0);
    }
    
    RenderBackground()
    {
        let buf32 = this.buf32;
        let color = this.backgroundcolor|0;
        for (let i = 0; i < buf32.length; i++) buf32[i] = color|0;
    }
    
    RenderTerrain()
    {
        //let result = 2 * Math.atan(camera.yk * 2) * 180. /  Math.PI;
        // console.log(camera.yk, Math.asin(camera.yk) * 180 / Math.PI);
        
        let mapwidthperiod = this.map.width - 1;
        let mapheightperiod = this.map.height - 1;

        let screenwidth = this.canvas.width|0;
        //let sinang = Math.sin(camera.angle);
        //let cosang = Math.cos(camera.angle);
        
        //TODO what if screen width changes?
        for (let x = 0; x < screenwidth; x++)
            this.ymin[x] = this.canvas.height; //TODO OPTIMISE

        let deltaz = 1.;
        let buf32 = this.buf32;
        
        // Render from front to back
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
}