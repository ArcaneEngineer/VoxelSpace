import CanvasView from './CanvasView.js'
// import * as vec2 from '../utils/gl-matrix/vec2.js'
// import * as vec3 from '../utils/gl-matrix/vec3.js'
//import {IMG_WIDTH, IMG_HEIGHT, LEVEL_ACROSS, LEVEL_LENGTH, BYTES_PIXEL, RAY_COLS_MAX, RAY_SAMPLE_COMPONENTS, CONTROL_POINTS_ACROSS, CONTROL_POINTS_LENGTH, COLOR_BY_MATERIAL_INDEX, VOXEL_COMPONENTS} from '../core/Constants.js'
//import {DOMElementNSPool} from '../utils/pool/DOMElementNSPool.js'


const SAMPLE_RADIUS_MAX = 3;
//top-down view of raycasted space
export default class MapView extends CanvasView
{
    imageData
    context
    
    svg
    
    fovGroup
    fovArc
    
    rayLines = []
    sampleCirclesArrays = []
    
    // linesPool
    // circlesPool
    
    canvasSamples
    imageDataSamples
    contextSamples
    
    toggled = false
    
    map = undefined
    
    containerDiv = undefined;
    
    
    constructor(core) //TODO should be one or the other - probably core.
    {
        super(core);
        this.initUI();
    }
    
    initUI()
    {
        let core = this.core;
        let xRes = this.xRes = 1024;//CONTROL_POINTS_ACROSS;
        let yRes = this.yRes = 1024;//CONTROL_POINTS_ACROSS;
        
        let canvas = this.canvas = document.getElementById("map");
        this.canvasSamples       = document.getElementById("samples");
        this.containerDiv       = document.getElementById("top");
        /*
        this.fovGroup            = document.getElementById("fovGroup");
        this.fovArc              = document.getElementById("fovArc");
        let svg = this.svg       = document.getElementById("topVectors");
        */
        
        this.context = this.canvas.getContext("2d");
        this.imageData = this.context.getImageData(0,0,xRes,yRes);
        
        this.contextSamples = this.canvasSamples.getContext("2d");
        this.imageDataSamples = this.contextSamples.getImageData(0,0,1024,1024);
        
        let scale = 1;//0.25;
        this.changeScale(scale);
    }
    
    
    update()
    {
        //console.log("!")
        let core = this.core;
        // let canvas = this.canvas;
        // let context = canvas.getContext('2d');
        // let scale = core.toggled ? 1.00 : 0.25;
        // this.changeScale(scale);
        // this.containerDiv.style.opacity = core.opacity;
        let samples8 = core.samples8;
        this.imageDataSamples.data.set(samples8);
        this.contextSamples.putImageData(this.imageDataSamples, 0, 0);
        

        /*
        this.changeScale(core.scale);
        
        
        this.updateFieldAtLevel(core.level);
        //this.updateArc(core.rayCaster.fovDeg, core.angleRad, core.scale);
        this.updateLines();
        */
    }
    
    updateLines()
    {
        
        let core = this.core;
        let camPos = core.camera.pos;
        let colCount = core.rayCaster.colCount;
        let raysRotd = core.rayCaster.raysRotd;
        let canvas = this.canvasSamples;
        let context = canvas.getContext('2d');
        let scale = core.scale;
        context.lineWidth = 1;
        let x1 = camPos[0] * scale;
        let y1 = camPos[1] * scale;
        let x2, y2;
        
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.fillStyle = "#FFFFFF";
        context.strokeStyle = "#FFFFFF";
        for (let r = 0; r < core.rayCaster.colCount; r++)
        {
            let ray = raysRotd[r];
            
            x2 = x1 + ray.dir[0] * scale;
            y2 = y1 + ray.dir[1] * scale;
            
            context.beginPath();       // Start a new path
            context.moveTo(x1, y1);    // Move the pen to (30, 50)
            context.lineTo(x2, y2);  // Draw a line to (150, 100)
            context.stroke();          // Render the path
                       
            //for (let s = 0; s < core.rayCaster.raySamples; s++)
            for (let s = 0; s < ray.sampleCount; s++)
            {
                let xSample = ray.samples[s * RAY_SAMPLE_COMPONENTS + 0] * scale;
                let ySample = ray.samples[s * RAY_SAMPLE_COMPONENTS + 1] * scale;
                
                let opacity = (255 - ray.samples[s * RAY_SAMPLE_COMPONENTS + 2]) * SAMPLE_RADIUS_MAX / 255; //+2 gets to the opacity component
                context.beginPath();
                context.arc(xSample, ySample, opacity, 0, 2 * Math.PI);
                context.fill();  
            }
        }
        
    }
    
    updateArc(fovDeg, angleRad, scale)
    {
        let core = this.core;
        /*
        let camPos = core.camera.pos;
        let radius = core.rayRange * scale;
        
        //create left edge of circle segment / viewing arc / frustum
        let vecLeft = vec2.create(); 
        vec2.set(vecLeft, 0.0, -radius);
        
        //rotate as per half fov - NOT rotate for view dir
        let origin  = vec2.create();
        let rotated = vec2.create();
        let halfFovRad = (core.rayCaster.fovDeg / 2) * (Math.PI / 180);
        vec2.rotate(rotated, vecLeft, origin, -halfFovRad);
        
        //if (core.lensType == "fisheye") //project circularly / spherically
        this.fovArc.setAttribute("d", "M0,0L"+(-rotated[0])+","+rotated[1]+
                                            "A"+radius+" "+radius+",0,0,0,"+
                                            (+rotated[0])+" "+rotated[1]+"Z");
        //else //project to flat far plane
        //this.fovArc.setAttribute("d", "M320,320L"+fin[0]+","+fin[1]+"L"+(640-fin[0])+","+fin[1]+"Z"); //straight line
        
        //position to cam pos, rotate to camera dir
        let camPosScaled = vec2.create();
        vec2.scale(camPosScaled, camPos, scale);
        this.fovGroup.setAttribute("transform", "translate("+camPosScaled[0]+", "+camPosScaled[1]+") rotate("+(core.angleRad * 180 / Math.PI)+" 0 0) ");
        */
    }
    
    updateFieldAtLevel(l)
    {
        let imageData = this.imageData;
        let context = this.context;
        let core = this.core;
        let voxels = core.map.voxels;
        let i, j, x, y, z;
        
        for (i = 0; i < CONTROL_POINTS_LENGTH; i++)
        {
            x = i % CONTROL_POINTS_ACROSS;
            y = Math.floor(i / CONTROL_POINTS_ACROSS);
            
            let matIndex = voxels[i * VOXEL_COMPONENTS +1]; //material index
            let r = COLOR_BY_MATERIAL_INDEX[matIndex * 3 + 0];
            let g = COLOR_BY_MATERIAL_INDEX[matIndex * 3 + 1];
            let b = COLOR_BY_MATERIAL_INDEX[matIndex * 3 + 2];
            
            let opacity = voxels[i * VOXEL_COMPONENTS + 0];
            r *= opacity;
            g *= opacity;
            b *= opacity;
            this.renderPixel2(x, y, voxels, imageData, r, g, b);
            //this.renderPixel3(x, y, l, voxels, imageData);
        }
        
        
        context.imageSmoothingEnabled = false;
        context.putImageData(imageData, 0, 0);
    }
    
    
    //OPTIMISE rather just pass i than x & y
    renderPixel2(x, y, voxels, imageData, r, g, b)
    {
        let i = (y * CONTROL_POINTS_ACROSS + x);
        // imageData.data[i*BYTES_PIXEL+0] = voxels[i * VOXEL_COMPONENTS];
        // imageData.data[i*BYTES_PIXEL+1] = 0;
        // imageData.data[i*BYTES_PIXEL+2] = 0;
        
        imageData.data[i*BYTES_PIXEL+0] = r
        imageData.data[i*BYTES_PIXEL+1] = g
        imageData.data[i*BYTES_PIXEL+2] = b
        
        imageData.data[i*BYTES_PIXEL+3] = 255//voxels[i];
    }
    
    renderPixel3(x, y, z, voxels, imageData)
    {
        let i = z * CONTROL_POINTS_LENGTH + y * CONTROL_POINTS_ACROSS + x;
        imageData.data[(y*CONTROL_POINTS_ACROSS+x)*BYTES_PIXEL+0] = voxels[i];
        imageData.data[(y*CONTROL_POINTS_ACROSS+x)*BYTES_PIXEL+1] = voxels[i];
        imageData.data[(y*CONTROL_POINTS_ACROSS+x)*BYTES_PIXEL+2] = voxels[i];
        imageData.data[(y*CONTROL_POINTS_ACROSS+x)*BYTES_PIXEL+3] = voxels[i];
    }
    
    changeScale(scale)
    {
        //super.changeScale(this.canvas, 1, scale);
        //super.changeScale(this.canvasSamples, scale, scale);
        super.changeStyleDimensions(this.canvas.style, scale, this.xRes, this.yRes);
        
        //super.changeElementDimensions(this.canvasSamples, scale, this.xRes, this.yRes);
        super.changeStyleDimensions(this.canvasSamples.style, scale, this.xRes, this.yRes);
    }
}