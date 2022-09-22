export default class Io
{
    input = undefined
    camera = undefined
    screendata = undefined
    time = new Date().getTime();
    
    constructor(input, camera, screendata)
    {
        this.input = input;
        this.camera = camera;
        this.screendata = screendata;
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
        var input = this.input;
        input.forwardbackward = 3.;
        input.mouseposition = this.GetMousePosition(e);
        time = new Date().getTime();

        if (!updaterunning) Draw();
        return;
    }

    DetectMouseUp()
    {
        var input = this.input;
        input.mouseposition = null;
        input.forwardbackward = 0;
        input.leftrightturn = 0;
        input.leftright = 0;
        input.updown = 0;
        return;
    }

    DetectMouseMove(e)
    {
        e.preventDefault();
        
        var input = this.input;
        if (input.mouseposition == null) return;
        if (input.forwardbackward == 0) return;
        if (input.leftright == 0) return;

        var currentMousePosition = GetMousePosition(e);
        var input = this.input;
        input.leftrightturn = (currentMousePosition[0] - input.mouseposition[0]) / window.innerWidth * 2;
        //camera.horizon  = 0 + (input.mouseposition[1] - currentMousePosition[1]) / window.innerHeight * 280;
        //input.updown    = (input.mouseposition[1] - currentMousePosition[1]) / window.innerHeight * 10;
    }


    DetectKeysDown(e)
    {
        var input = this.input;
        
        let screenwidth = this.screendata.canvas.width|0;
        let keyTurnRate = 100.;
        switch(e.keyCode)
        {
        case 37:    // left cursor
        case 65:    // a
            input.leftright = -3.;
            break;
        case 39:    // right cursor
        case 68:    // d
            input.leftright = 3.;
            break;
        case 38:    // cursor up
        case 87:    // w
            input.forwardbackward = 3.;
            break;
        case 40:    // cursor down
        case 83:    // s
            input.forwardbackward = -3.;
            break;
        case 82:    // r
            input.updown = +2.;
            break;
        case 70:    // f
            input.updown = -2.;
            break;
        case 81:    //q
            //input.lookdown = true;
            input.leftrightturn = -1. * keyTurnRate / screenwidth;
            break;
        case 69:    // e
            //input.lookup = true;
            input.leftrightturn = +1. * keyTurnRate / screenwidth;
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
        var input = this.input;
        switch(e.keyCode)
        {
        case 37:    // left cursor
        case 65:    // a
            input.leftright = 0;
            break;
        case 39:    // right cursor
        case 68:    // d
            input.leftright = 0;
            break;
        case 38:    // cursor up
        case 87:    // w
            input.forwardbackward = 0;
            break;
        case 40:    // cursor down
        case 83:    // s
            input.forwardbackward = 0;
            break;
        case 82:    // r
            input.updown = 0;
            break;
        case 70:    // f
            input.updown = 0;
            break;
        case 81:    //q
            input.leftrightturn = 0;
            //input.lookdown = false;
            break;
        case 69:    // e
            input.leftrightturn = 0;
            //input.lookup = false;
            break;
        
        default:
            return;
            break;
        }
        return false;
    }
    
    onzNearChanged(e)
    {
        let camera = this.camera;
        camera.zNear = e.currentTarget.valueAsNumber;
    }
    onzFarChanged(e)
    {
        let camera = this.camera;
        camera.zFar = e.currentTarget.valueAsNumber;
    }
}