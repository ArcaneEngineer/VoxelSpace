export default class Io
{
    //input = undefined
    camera = undefined
    time = undefined
    
    forwardbackward= 0
    leftrightturn  = 0
    leftright      = 0
    updown         = 0
    lookup         = false
    lookdown       = false
    mouseposition  = null
    keypressed     = false
    
    controls =
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
        hFovTest: undefined,
        perspective: undefined,
    }
    
    constructor(camera, time, elementName)
    {
        this.camera = camera;
        this.time = time;
        
        this.Init(elementName);
    }
    
    Init(elementName)
    {
        let controls = this.controls;
        // set event handlers for keyboard, mouse, touchscreen and window resize
        let canvas = document.getElementById(elementName);
        window.onkeydown    = e => this.DetectKeysDown(e);
        window.onkeyup      = e => this.DetectKeysUp(e);
        canvas.onmousedown  = e => this.DetectMouseDown(e);
        canvas.onmouseup    = e => this.DetectMouseUp(e);
        canvas.onmousemove  = e => this.DetectMouseMove(e);
        canvas.ontouchstart = e => this.DetectMouseDown(e);
        canvas.ontouchend   = e => this.DetectMouseUp(e);
        canvas.ontouchmove  = e => this.DetectMouseMove(e);
        
        controls.zNear             = document.getElementById("zNear");
        controls.zFar              = document.getElementById("zFar");
        controls.horizon           = document.getElementById("horizon");
        controls.columnscale       = document.getElementById("columnscale");
        // controls.hFov              = document.getElementById("hFov");
        // controls.vFov              = document.getElementById("vFov");
        controls.heading           = document.getElementById("heading");
        controls.height            = document.getElementById("height");
        controls.nearWidth         = document.getElementById("nearWidth");
        controls.perspective      = document.getElementById("perspective");
        
        controls.zNear.oninput = e => this.onChangezNear(e);
        controls.zFar .oninput = e => this.onChangezFar(e);
        controls.height.oninput = e => this.onChangeHeight(e);
        // controls.hFov.oninput = e => this.onChangehFov(e);
        controls.nearWidth.oninput = e => this.onChangeNearWidth(e);
        controls.perspective.onchange = e => this.onChangePerspective(e);
        //controls.zFar .addEventListener("input", onzFarChanged);
        
        //let canvas = this.canvas = document.getElementById("voxels");
        //this.fovGroup            = document.getElementById("fovGroup");
        //this.fovArc              = document.getElementById("fovArc");
        //let svg = this.svg       = document.getElementById("topVectors");
    }
    
    // ---------------------------------------------
    // Keyboard and mouse event handlers

    GetMousePosition(e)
    {
        // fix for Chrome
        if (e.type.startsWith('touch'))
        {
            return [e.targetTouches[0].pageX, e.targetTouches[0].pageY];
        } else
        {
            return [e.pageX, e.pageY];
        }
    }

    DetectMouseDown(e)
    {
        this.forwardbackward = 3.;
        this.mouseposition = this.GetMousePosition(e);
        //if (!updaterunning) Draw();
        // return;
        // 
    }

    DetectMouseUp()
    {
        this.mouseposition = null;
        this.forwardbackward = 0;
        this.leftrightturn = 0;
        this.leftright = 0;
        this.updown = 0;
        return;
    }

    DetectMouseMove(e)
    {
        e.preventDefault();
        
        if (this.mouseposition == null) return;
        if (this.forwardbackward == 0) return;
        if (this.leftright == 0) return;

        var currentMousePosition = GetMousePosition(e);
        var input = this.input;
        this.leftrightturn = (currentMousePosition[0] - this.mouseposition[0]) / window.innerWidth * 2;
        //camera.horizon  = 0 + (this.mouseposition[1] - currentMousePosition[1]) / window.innerHeight * 280;
        //this.updown    = (this.mouseposition[1] - currentMousePosition[1]) / window.innerHeight * 10;
    }


    DetectKeysDown(e)
    {
        //let screenwidth = this.screendata.canvas.width|0;
        const keyTurnRate = 0.2;
        switch(e.keyCode)
        {
        case 37:    // left cursor
        case 65:    // a
            this.leftright = -3.;
            break;
        case 39:    // right cursor
        case 68:    // d
            this.leftright = 3.;
            break;
        case 38:    // cursor up
        case 87:    // w
            this.forwardbackward = 3.;
            break;
        case 40:    // cursor down
        case 83:    // s
            this.forwardbackward = -3.;
            break;
        case 82:    // r
            this.updown = +2.;
            break;
        case 70:    // f
            this.updown = -2.;
            break;
        case 81:    //q
            //this.lookdown = true;
            this.leftrightturn = -1. * keyTurnRate;// / screenwidth;
            break;
        case 69:    // e
            //this.lookup = true;
            this.leftrightturn = +1. * keyTurnRate;// / screenwidth;
            break;
         default:
            return;
            break;
        }

        // if (!updaterunning) {
            // time = new Date().getTime();
            // Draw();
        // }
        return false;
    }

    DetectKeysUp(e)
    {
        switch(e.keyCode)
        {
        case 37:    // left cursor
        case 65:    // a
            this.leftright = 0;
            break;
        case 39:    // right cursor
        case 68:    // d
            this.leftright = 0;
            break;
        case 38:    // cursor up
        case 87:    // w
            this.forwardbackward = 0;
            break;
        case 40:    // cursor down
        case 83:    // s
            this.forwardbackward = 0;
            break;
        case 82:    // r
            this.updown = 0;
            break;
        case 70:    // f
            this.updown = 0;
            break;
        case 81:    //q
            this.leftrightturn = 0;
            //this.lookdown = false;
            break;
        case 69:    // e
            this.leftrightturn = 0;
            //this.lookup = false;
            break;
        
        default:
            return;
            break;
        }
        return false;
    }
    
    onChangezNear(e)
    {
        let camera = this.camera;
        camera.zNear = e.currentTarget.valueAsNumber;
    }
    onChangezFar(e)
    {
        let camera = this.camera;
        camera.zFar = e.currentTarget.valueAsNumber;
    }
    
    onChangeHeight(e)
    {
        let camera = this.camera;
        camera.height = e.currentTarget.valueAsNumber;
    }
    
    onChangehFov(e)
    {
        let camera = this.camera;
        camera.hFov = e.currentTarget.valueAsNumber;
    }
    
    
    onChangeNearWidth(e)
    {
        let camera = this.camera;
        camera.nearWidth = e.currentTarget.valueAsNumber;
    }
    
    onChangePerspective(e)
    {
        console.log(e);
        let camera = this.camera;
        camera.perspective = e.currentTarget.checked;
    }
    
    
    // Update the camera for next frame. Dependent on keypresses
    UpdateCamera()
    {
        let time = this.time;
        //var current = new Date().getTime();

        let input = this.input;
        let camera = this.camera;
        
        this.keypressed = false;
        if (this.leftrightturn != 0)
        {
            camera.heading += this.leftrightturn*0.1*(time.delta)*0.03;
            this.keypressed = true;
        }
        if (this.leftright != 0)
        {
            camera.x += this.leftright * Math.cos(camera.heading) * (time.delta)*0.03;
            camera.y -= this.leftright * Math.sin(camera.heading) * (time.delta)*0.03;
            this.keypressed = true;
        }
        if (this.forwardbackward != 0)
        {
            camera.x += this.forwardbackward * Math.sin(camera.heading) * (time.delta)*0.03;
            camera.y += this.forwardbackward * Math.cos(camera.heading) * (time.delta)*0.03;
            this.keypressed = true;
        }
        if (this.updown != 0)
        {
            camera.height += this.updown * (time.delta)*0.03;
            this.keypressed = true;
        }
        /*
        if (this.lookup)
        {
            camera.horizon += 2 * (Time.delta)*0.03;
            this.keypressed = true;
        }
        if (this.lookdown)
        {
            camera.horizon -= 2 * (Time.delta)*0.03;
            this.keypressed = true;
        }
        */
        /*
        // Collision detection. Don't fly below the surface.
        var mapoffset = ((Math.floor(camera.y) & (map.width-1)) << map.shift) + (Math.floor(camera.x) & (map.height-1))|0;
        if ((map.altitude[mapoffset]+10) > camera.height) camera.height = map.altitude[mapoffset] + 0;
    */
        //time = current;
    }

}