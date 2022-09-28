import CanvasView from './CanvasView.js';

export default class RaycasterView extends CanvasView
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
    
    timeAccumulated = 0
    
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
        if (this.timeAccumulated >= 1000)
        {
            let fps = this.frames / (this.timeAccumulated * 0.001);
            
            //TODO cache instead of getElementById each time.
            document.getElementById('fps').innerText = fps.toFixed(1) + " fps";
            
            this.frames = 0;
            this.timeAccumulated = 0
        }
        this.frames++;
        this.fpsTime.updateDelta();
        this.timeAccumulated += this.fpsTime.delta;
        //console.log(this.timeAccumulated);
        //window.requestAnimationFrame(e => this.Render(e), 0);
        window.requestAnimationFrame(this.Render.bind(this), 0);
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
        let screenheight = this.canvas.height;
        //let sinang = Math.sin(camera.angle);
        //let cosang = Math.cos(camera.angle);
        let hscreenwidth = screenwidth / 2;

        let deltaz = 1.;
        let buf32 = this.buf32;
        
        // Render from front to back
        let camera = this.camera;
        //NEW plane based: zNear is assumed to always be at 0.
        let zNear = 1;//camera.zNear;
        let zFar  = camera.zFar;
        let wNear = 1.0;
        let wFar  = 2.0;
        let height = camera.height;
        let horizon = camera.horizon|0;
        let camx = camera.x;
        let camy = camera.y;
        let heading = camera.heading;
        let map = this.map;
        let mapaltitude = map.altitude;
        let mapcolor = map.color;
        let mapshift = map.shift;
        //let screenwidthinv = 1. / screenwidth;
        let yk = camera.yk;
        let columnscale = camera.columnscale;
        let perspective = camera.perspective;
        //let hFov = camera.hFov;
        //let hhFov = camera.hFov / 2;//half horizontal fov
        
        let cx = Math.sin(heading)// * zNear;
        let cy = Math.cos(heading)// * zNear;
        
        //-90 deg along near plane
        let lox = Math.sin(heading - Math.PI / 2);
        let loy = Math.cos(heading - Math.PI / 2);
        //+90 deg alone near plane
        let rox = Math.sin(heading + Math.PI / 2);
        let roy = Math.cos(heading + Math.PI / 2);
        
        let nearWidth = camera.nearWidth;
        let halfNearWidth = nearWidth / 2;
        let halfNearWidthScaled = halfNearWidth * (map.width / screenwidth);
        let lx = cx + lox * halfNearWidthScaled;
        let ly = cy + loy * halfNearWidthScaled;
        
        let rx = cx + rox * halfNearWidthScaled;
        let ry = cy + roy * halfNearWidthScaled;
        
        
        //let hFov = Math.atan(rox / zNear); //ad
        //let hhFov = camera.hFov / 2;//half horizontal fov
        //console.log(hFov);
        let ymin = this.ymin;
        
        for (let x = 0; x < screenwidth; x++)
            ymin[x] = screenheight; //TODO OPTIMISE
        
        //OLD
        //corresponds to a zNear=1.0 (unit circle)
        // let lx = Math.sin(heading-hhFov)// * zNear;
        // let ly = Math.cos(heading-hhFov)// * zNear;
        // let rx = Math.sin(heading+hhFov)// * zNear;
        // let ry = Math.cos(heading+hhFov)// * zNear;
        console.log("c=", cx, cy, "l=", lx, ly, "r=", rx, ry);

        //let ww = screenwidth; //PERSPECTIVE
        //let ww = 1; //ORTHO
        let ww = perspective ? screenwidth //PERSPECTIVE
                             : 1; //ORTHO
        
        //PERSPECTIVE - * z requires / w
        //ORTHO - neither, identity, z & w are 1
        
        for (let z = zNear; z < zFar; z += deltaz) //for each ray step
        {
            //get float world space map coords we sample at L,R edges of screen,
            //at this current depth (z). (consider camera lateral arc from top)
            //90 degree FoV, as cos and sine are offset 90 degrees from each other?
            //without *z, this describes unit circle. 
            //Stepping between the two positions representing outer edges of screen,
            //combined with increasing z, causes rays to diverge horizontally.
            
            //let zz = z; //PERSPECTIVE
            //let zz = 1//(z > zNear ? 1 : z); //ORTHO
            let zz = perspective ? z  //PERSPECTIVE 
                                 : 1;//(z > zNear ? 1 : z); //ORTHO
            
            
            //Sideways step increment (in camera's local x)
            //Q. why do we mul by z here?
            //A. it's the original algorithm's way to create lateral perspective.
            //world map x,y change as we advance along "layer" (in x); derived 
            //from non-linear z as we move farther along the ray, so in z loop.
            //
            //Q. why do we divide by screenwidth here?
            //A. because we are going to end up with multiples of screenwidth
            //   every time we step in x! (this is the 1/xth frac of screen)
            //NOTE: * screenwidthinv; is slower: eliminates a JIT optimisation?
            let mapdx = (rx - lx) * zz / ww;// / screenwidth;
            let mapdy = (ry - ly) * zz / ww;// / screenwidth;
            // let mapdx = dx * zz;
            // let mapdy = dy * zz;
            
            //what we're doing here is moving ray divergence from * z / w to
            //outside this loop - the divergence between near and far planes.
            // let mapdx = (rx - lx)// * zz / ww;// / screenwidth;
            // let mapdy = (ry - ly)// * zz / ww;// / screenwidth;
            
            //these will be smallest when z is smallest.
            
            //console.log("d=", dx, dy);
            //forward step increment (actually start/left step per increasing x)
            //world map coordinates (float)
            //NOTE l,r MUST be the (small) values at near plane z=1 (ray start).
            //Thus as we scale by increasing z, we get correct map-space pos,
            //ortho or perspective. Thus lx / rx are pre-divided by screenwidth.
            let maplx = camx + lx * z;
            let maply = camy + ly * z;
            // let maprx = camx + rx * z;
            // let mapry = camy + ry * z;
            
            
            //div-by-z causes rays to diverge vertically (no angles stored).
            let invzz = perspective ? screenheight / (z * nearWidth) //PERSPECTIVE
                                    : 1; //ORTHO
            //let invzz = screenheight / (z * nearWidth); //PERSPECTIVE
            //let invzz = 1; //ORTHO
            let invz = yk * invzz;//Math.pow(z, camera.que);
            
            let xStart = 0;
            let xEnd = screenwidth;
            //let xEnd = 100;
            for (let x = xStart; x < xEnd; x++) //for each ray (screen space col)
            {
                //if (z == 1 && x == 0) console.log(maprx, mapry);
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
                let ytop = (height - mapaltitude[mapoffset]) * invz + horizon|0;
                
                //draw the vertical line segment...
                let ybot = ymin[x];
                let flag = ytop <= ybot ? 1 : 0; // just <?
                ytop = ytop < 0 ? 0 : ytop;   
                
                // get offset on screen for the vertical line
                //let xx = (x - hscreenwidth);
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
                maplx += mapdx;
                maply += mapdy;
            }
            //orthographic z delta from camera centre. i.e. regardless of heading
            //of each ray off camera centre, its z stepping is the same,
            //as in a sliced CT-scan style view (but perspective, not ortho).
            deltaz += 0.01; //OPTIMISE increments further away to be greater.
        }
    }
}