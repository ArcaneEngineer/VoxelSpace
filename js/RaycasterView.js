//import CanvasView from './CanvasView.js';
//import Time from './Time.js';

class RaycasterView// extends CanvasView
{
    bufarray  = undefined // color data
    buf8      = undefined // the same array but with bytes
    buf32     = undefined // the same array but with 32-Bit words
    
    fpsTime = undefined
    
    timeAccumulated = 0
    frames = 0
    ymin = undefined// = new Int32Array(screenwidth);
    updaterunning = false
    backgroundcolor = 0xFF00A0F0 //BGR
    
    camera = undefined
    map = undefined
    mapView = undefined
   
    renderNovalogic = false
    
    constructor(fpsTime, mapView)
    {
        this.fpsTime = fpsTime;
        this.mapView = mapView;
        //this.fpsTime = new Time();
        
        console.log("RAycasterView ctor");
    }
    
    OnResizeWindow(raycasteroffscreencanvas, mapoffscreencanvas, samplesoffscreencanvas, screenwidth, screenheight, map)
    {
        console.log("RaycasterView.OnResizeWindow");

        let xRes = this.xRes = screenwidth //raycasteroffscreencanvas.width;//core.rayCaster.colCount;
        let yRes = this.yRes = screenheight//raycasteroffscreencanvas.height;//core.rayCaster.rowCount;
        
        this.context   = raycasteroffscreencanvas.getContext("2d");
        this.imagedata = this.context.createImageData(screenwidth, screenheight);

        this.bufarray = new ArrayBuffer(screenwidth * screenheight * 4);
        this.buf8     = new Uint8Array (this.bufarray);
        this.buf32    = new Uint32Array(this.bufarray);
        
        this.ymin = new Int32Array(screenwidth);
        
        this.mapView.core = map;
        this.mapView.setMapAndSamplesCanvas(mapoffscreencanvas, samplesoffscreencanvas);
        this.mapView.updatebackground();
    }
    
    update()
    {
        this.updaterunning = true;
        
        this.RenderBackground();
        
        let core = this.core;
        let camera = this.camera;
        let map = this.map;
        let screenwidth = camera.screenwidth;
        let screenheight = camera.screenheight;
        
        if (this.renderNovalogic)
            this.RenderTerrainNovalogic(camera, map, screenwidth, screenheight, this.canvas);
        else
            this.RenderTerrainSilverman(camera, map, screenwidth, screenheight, this.canvas);
        
        this.Flip();
        
        this.mapView.update(screenwidth, 20); //TODO fix hacked in 20! (precalc steps on change?)
        /*
        //TODO put into a UI view class
        if (this.timeAccumulated >= 1000)
        {
            let fps = this.frames / (this.timeAccumulated * 0.001);
            
            //TODO cache instead of getElementById each time.
            //document.getElementById('fps').innerText = fps.toFixed(1) + " fps";
            
            this.frames = 0;
            this.timeAccumulated = 0
        }
        this.frames++;
        this.fpsTime.updateDelta();
        this.timeAccumulated += this.fpsTime.delta;
        //console.log(this.timeAccumulated);
        */
    }
    
    // Show the back buffer on screen
    Flip()
    {
        this.imagedata.data.set(this.buf8);
        this.context.putImageData(this.imagedata, 0, 0);
        
        //requestAnimationFrame(this.update.bind(this), 0);
        requestAnimationFrame(() => this.update(), 0);
    }
    
    RenderBackground()
    {
        let buf32 = this.buf32;
        let backgroundcolor = this.backgroundcolor|0;
        for (let i = 0; i < buf32.length; i++) buf32[i] = backgroundcolor|0;
    }
    
    RenderTerrainNovalogic(camera, map, screenwidth, screenheight)
    {
        let backgroundcolor = this.backgroundcolor;
        let deltaz = 1.;
        let buf32 = this.buf32;
                
        let mapwidthperiod  = map.width - 1;
        let mapheightperiod = map.height - 1;
        let mapaltitude = map.altitude;
        let mapcolor = map.color;
        let mapshift = map.shift;
        let mapStoreSamples = this.mapView.storeSamples;
        let mapSamples = this.mapView.samples;
        
        //let screenwidth  = this.canvas.width|0;
        //let screenheight = this.canvas.height;
        
        let ymin = this.ymin;
        for (let x = 0; x < screenwidth; x++)
            ymin[x] = screenheight; //TODO OPTIMISE
        
        if (mapStoreSamples)
        {
            for (let i = 0; i < 1024 * 1024; i++)
                mapSamples[i] = 0;
        }
        
        // Render from front to back
        let height = camera.height;
        let camx = camera.x;
        let camy = camera.y;
        let heading = camera.heading;
        let yk = camera.yk;
        let columnscale = camera.columnscale;
        let perspective = camera.perspective;
        let rayStepAccl = camera.rayStepAccl;
        let zNearClip = camera.zNear; //there may be another zNear for projection
        let zFarClip  = camera.zFar;
        let nearWidth = camera.nearWidth;
        let halfNearWidth = nearWidth / 2;
        let halfNearWidthScaled = halfNearWidth * (map.width / screenwidth);

        let horizon = screenheight / 2;//camera.horizon|0;
        //let ww = screenwidth; //PERSPECTIVE
        //let ww = 1; //ORTHO
        //let ww = perspective ? screenwidth //PERSPECTIVE
        //                     : 1; //ORTHO
        //let wwinv = 1. / ww;
        let wwinv = 1. / screenwidth;
        
        //NOTE! implicit or explicit *1 projection plane distance!
        const zNearProj = 1.;
        let cx = Math.sin(heading) * zNearProj;
        let cy = Math.cos(heading) * zNearProj;
        
        const HALFPI = Math.PI / 2;
        
        //l(eft), r(ight) edges of near plane.
        //-90 deg along near plane
        let lx = cx + Math.sin(heading - HALFPI) * halfNearWidthScaled;
        let ly = cy + Math.cos(heading - HALFPI) * halfNearWidthScaled;
        
        //+90 deg alone near plane
        let rx = cx + Math.sin(heading + HALFPI) * halfNearWidthScaled;
        let ry = cy + Math.cos(heading + HALFPI) * halfNearWidthScaled;
        
        let dx = rx - lx;
        let dy = ry - ly;
        //console.log("d=", dx, dy);
        //console.log("c=", cx, cy, "l=", lx, ly, "r=", rx, ry);
        
        //let fov = Math.atan(halfNearWidth / zNear); //DEBUG ONLY
        //console.log("halfNearWidth=", halfNearWidth, "fov=", fov * 180. / Math.PI);
        
        //PERSPECTIVE - * z requires / w
        //ORTHO - neither, identity, z & w are 1
        
        for (let z = zNearClip; z < zFarClip; z += deltaz) //for each ray step / slice
        {
            //get float world space map coords we sample at L,R edges of screen,
            //at this current depth (z). (consider camera lateral arc from top)
            //90 degree FoV, as cos and sine are offset 90 degrees from each other?
            //without *z, this describes unit circle. 
            //Stepping between the two positions representing outer edges of screen,
            //combined with increasing z, causes rays to diverge horizontally.
            
            //let zz = z; //PERSPECTIVE
            //let zz = 1//(z > zNear ? 1 : z); //ORTHO
            //let zz = perspective ? z : 1;//(z > zNear ? 1 : z); //ORTHO
            
            //Sideways step increment (in camera's local x): scale d on its own
            //(i.e. because then we're scaling it around its origin w/o campos)
            //Q. why do we mul by z here?
            //A. it's the original algorithm's way to create lateral perspective.
            //world map x,y change as we advance along "layer" (in x); derived 
            //from non-linear z as we move farther along the ray, so in z loop.
            //
            //Q. why do we divide by screenwidth here?
            //A. because we need fractions of screenwidth each time we step in x
            //   for the current ray depth. (1/screenwidth frac of screen)
            //NOTE: * screenwidthinv; is slower: eliminates a JIT optimisation?
            let mapdx = dx * z * wwinv// / ww;// / screenwidth;
            let mapdy = dy * z * wwinv// / ww;// / screenwidth;
            
            //forward step increment (actually start/left step per increasing x)
            //world map coordinates (float)
            //NOTE l,r MUST be the (small) values at near plane z=1 (ray start).
            //Thus as we scale by increasing z, we get correct map-space pos,
            //ortho or perspective. Thus lx / rx are pre-divided by screenwidth.
            let maplx = camx + lx * z;
            let maply = camy + ly * z;
            
            //div-by-z causes rays to diverge vertically (no angles stored).
            //let invzz = perspective ? screenheight / (z * nearWidth) : 1; //ORTHO
            let invzz = screenheight / (z * nearWidth); //PERSPECTIVE
            //let invzz = 1; //ORTHO
            let invz = yk * invzz;
            
            let xStart = 0;
            let xEnd = screenwidth;
            
            for (let x = xStart; x < xEnd; x++) //for each ray across slice
            {
                //map 1D coords: cheap modulo wrap on x & y + upshift y.
                let mapoffset = ((Math.floor(maply) & mapwidthperiod) << mapshift) + (Math.floor(maplx) & mapheightperiod);
                
                mapSamples[mapoffset] = mapStoreSamples ? 0xFFFFFFFF : 0;
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
                let ytop = (height - mapaltitude[mapoffset] * columnscale) * invz + horizon|0;
                
                //draw the vertical line segment...
                let ybot = ymin[x];
                let flag = ytop <= ybot ? 1 : 0; // just <?
                ytop = ytop < 0 ? 0 : ytop;   
                
                // get offset on screen for the vertical line
                let offset = ytop * screenwidth + x; //init.
                for (let k = ytop; k < ybot; k++)
                {
                    buf32[offset]  = ybot == screenheight ? backgroundcolor : flag * mapcolor[mapoffset];
                    offset        += flag * screenwidth; //increase for line above.
                    
                    
                }
                //...draw the vertical line segment.
                
                //...This variable loop length is where the problem is for GPU.
                //Need to restrict it to warp or wavefront size, or multiple thereof
                //(32 or 64 "threads" / "runs of pixels" at a time.)
                //It just needs to do *nothing* after the loop would have completed.
                //e.g. by adding zero, or mul / div by 1.0.
                
                ymin[x] = ytop < ymin[x] ? ytop : ymin[x];
                
                //interpolate (gradually "rasterise") between start and end map tile
                maplx += mapdx;
                maply += mapdy;
            }
            //orthographic z delta from camera centre. i.e. regardless of heading
            //of each ray off camera centre, its z stepping is the same,
            //as in a sliced CT-scan style view (but perspective, not ortho).
            deltaz += rayStepAccl; //OPTIMISE increments further away to be greater.
        }
    }
    
//TODO

// -Render working thread + OffscreenCanvas
// --row major to col major for better locality during ray walk
// --SIMD inclusions? Requires C. https://v8.dev/features/simd
// -RLE cubes
// -silverman DDA-based casting
// -adjustible multiplier for ray stepping
// -render to tex via fragment shader, sending minimal data (1B per?)
// -work on only +-1MiB color index array in the Render* functions, which are
//  later converted to full 4MiB RGBA arrays.(reduce cache misses L2<->L3.)
//    https://web.dev/drawing-to-canvas-in-emscripten/
// -silverman planes radial
//--https://www.scratchapixel.com/lessons/3d-basic-rendering/perspective-and-orthographic-projection-matrix/building-basic-perspective-projection-matrix
    
    RenderTerrainSilverman(camera, map, screenwidth, screenheight)
    {
        let backgroundcolor = this.backgroundcolor;
        let deltaz = 1.;
        let buf32 = this.buf32;
                
        let mapwidthperiod  = map.width - 1;
        let mapheightperiod = map.height - 1;
        let mapaltitude = map.altitude;
        let mapcolor = map.color;
        let mapshift = map.shift;
        let mapStoreSamples = this.mapView.storeSamples;
        let mapSamples = this.mapView.samples;
        
        //let screenwidth  = this.canvas.width|0;
        //let screenheight = this.canvas.height;
        
        let ymin = this.ymin;
        for (let x = 0; x < screenwidth; x++)
            ymin[x] = screenheight; //TODO OPTIMISE
        
        if (mapStoreSamples)
        {
            for (let i = 0; i < 1024 * 1024; i++)
                mapSamples[i] = 0;
        }
        
        // Render from front to back
        let camheight = camera.height;
        let camx = camera.x;
        let camy = camera.y;
        let heading = camera.heading;
        let yk = camera.yk;
        let columnscale = camera.columnscale;
        let perspective = camera.perspective;
        let rayStepAccl = camera.rayStepAccl;
        let zNearClip = camera.zNear; //there may be another zNear for projection
        let zFarClip  = camera.zFar;
        let nearWidth = camera.nearWidth;
        let aspectRatio = camera.screenwidth / camera.screenheight;
        let aspectRatioScaledToNear = (screenwidth / nearWidth) * aspectRatio;

        let halfNearWidth = nearWidth / 2;
        let halfNearWidthScaled = halfNearWidth * (map.width / screenwidth);

        let horizon = screenheight * camera.horizonFrac;//camera.horizon|0;
        
        //NOTE! implicit or explicit *1 projection plane distance!
        const zNearProj = 1.;
        let cx = Math.sin(heading) * zNearProj;
        let cy = Math.cos(heading) * zNearProj;
        
        
        let pitch = camera.pitch;
        let sinpitch = Math.sin(-pitch);
        let cospitch = Math.cos(-pitch);
        console.log("pitch=", pitch, "sin=", sinpitch, "cos=", cospitch);
        
        const HALFPI = Math.PI / 2;
        
        //l(eft), r(ight) edges of near plane.
        //-90 deg along near plane
        let lx = cx + Math.sin(heading - HALFPI) * halfNearWidthScaled;
        let ly = cy + Math.cos(heading - HALFPI) * halfNearWidthScaled;
        
        //+90 deg alone near plane
        let rx = cx + Math.sin(heading + HALFPI) * halfNearWidthScaled;
        let ry = cy + Math.cos(heading + HALFPI) * halfNearWidthScaled;
        
        let dx = rx - lx;
        let dy = ry - ly;
        
        let xRes = screenwidth;
        let yRes = screenheight;
        
        //fractional step
        let sx = dx / xRes;
        let sy = dy / xRes;
        
        //what is the position on the near plane? (changes)
        let raynearx = lx;
        let rayneary = ly;
        
        let rayStepJolt = 0.1;
        
        for (let x = 0; x < xRes; x++) //for each screen column
        {
            // deltaz = 1.0;
            // rayStepAccl = 0.1;
            let a = 0.5;
            for (let z = zNearClip; z < zFarClip; z *= 1.008) //for each ray step / slice
            {
                let zz = z// * z; 
                zz = zz > zFarClip ? zFarClip : zz;
                
                //let mapoffset = this.getmapoffset(zz, zFarClip, mapSamples, mapStoreSamples, camx, camy, mapwidthperiod, mapheightperiod, mapshift,raynearx, rayneary)
                                
                //forward step increment
                let mapdx = raynearx * zz;
                let mapdy = rayneary * zz;
                
                //2D map / world coords
                let maplx = camx + mapdx;
                let maply = camy + mapdy;
                
                //1D map coords: cheap modulo wrap on x & y + upshift y.
                let mapoffset = ((Math.floor(maply) & mapwidthperiod) << mapshift) + (Math.floor(maplx) & mapheightperiod);
                //for overhead minimap
                mapSamples[mapoffset] = mapStoreSamples ? 0xFFFFFFFF : 0;
                
                //this.drawvertical(x, zz, mapoffset, aspectRatioScaledToNear, mapaltitude, mapcolor, columnscale, horizon, ymin, height, screenheight, screenwidth, xRes, yRes, buf32, backgroundcolor)
                
                let zReal = zz //* cospitch; //z + shift
                
                let mapheight = mapaltitude[mapoffset];
                let hReal = (camheight - mapheight) //* sinpitch;
                
                //draw vertical....
                let invz = aspectRatioScaledToNear / zReal;//zz;//(yk / zz) * (screenheight / nearWidth);
                let ytop = (hReal * columnscale) * invz + horizon|0;
                let ybot = ymin[x];
                let flag = ytop <= ybot ? 1 : 0; //Optimisation to avoid if. just <?
                ytop = ytop < 0 ? 0 : ytop;   
                
                let bufoffset = ytop * xRes + x; //1D index into screen buffer
                //let bufoffset = x * yRes + ytop; //1D index into screen buffer
                
                let color = mapcolor[mapoffset];
                
                for (let k = ytop; k < ybot; k++)
                {
                    buf32[bufoffset]  = ybot == screenheight ? backgroundcolor : flag * color;
                    
                    //TODO fix this horrific offsetting by whole screenwidth to +1;
                    //     done by flipping to column major image format and render
                    //     to a rotated OpenGL texture. (also change offset init)
                    bufoffset        += flag * xRes; //increase for line above.
                    //bufoffset        += flag// * xRes; //increase for line above.
                }
                ymin[x] = ytop < ymin[x] ? ytop : ymin[x];
                //...draw the vertical line segment.
                
                //rayStepAccl += rayStepJolt;
                //deltaz += rayStepAccl; //OPTIMISE increments further away to be greater.
            }
            
            //TODO adjust ray angle by interpolation between left and right edges, ON the near plane.
            raynearx += sx;
            rayneary += sy;
        }
        
        
        
        //this.lineNoDiag(100, 100, 550, 300, camx, camy, mapwidthperiod, mapheightperiod, mapSamples, mapshift);
        
    }
    
    getmapoffset(zz, zFarClip, mapSamples, mapStoreSamples, camx, camy, mapwidthperiod, mapheightperiod, mapshift, raynearx, rayneary)
    {
        //return mapoffset;
    }
    
    drawvertical(x, zz, mapoffset, aspectRatioScaledToNear, mapaltitude, mapcolor, columnscale, horizon, ymin, height, screenheight, screenwidth, xRes, yRes, buf32, backgroundcolor)
    {

                
    }
    
    //https://stackoverflow.com/questions/8936183/bresenham-lines-w-o-diagonal-movement
    //https://stackoverflow.com/questions/35422997/understanding-bresenhams-error-accumulation-part-of-the-algorithm
    lineNoDiag(x0, y0, x1, y1, camx, camy, mapwidthperiod, mapheightperiod, mapSamples, mapshift)
    {
        //what about a fractional start pos? we will need to test moving camera
        //in tiny increments.
        //it won't support that by default as this is an all-integer implementation.
        //we'll need to floatify it (no) or use fixed point integer values.
        
        let xDist =  Math.abs(x1 - x0);
        let yDist = -Math.abs(y1 - y0);
        let xStep = (x0 < x1 ? +1 : -1);
        let yStep = (y0 < y1 ? +1 : -1);
        let error = xDist + yDist;

        this.plot(x0, y0, camx, camy, mapwidthperiod, mapheightperiod, mapSamples, mapshift);

        while (x0 != x1 || y0 != y1)
        {
            if (2*error - yDist > xDist - 2*error)
            {
                // horizontal step
                error += yDist;
                x0 += xStep;
            }
            else
            {
                // vertical step
                error += xDist;
                y0 += yStep;
            }

            this.plot(x0, y0, camx, camy, mapwidthperiod, mapheightperiod, mapSamples, mapshift);
        }
    }


    plot(mapdx, mapdy, camx, camy, mapwidthperiod, mapheightperiod, mapSamples, mapshift)
    {
        //DEV
            
        let maplx = camx + mapdx;
        let maply = camy + mapdy;
        
        //1D map coords: cheap modulo wrap on x & y + upshift y.
        let mapoffset = ((Math.floor(maply) & mapwidthperiod) << mapshift) + (Math.floor(maplx) & mapheightperiod);
        
        mapSamples[mapoffset] = 0xFFFFFFFF;
    }
    
}