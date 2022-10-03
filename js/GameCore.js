export default class GameCore
{    
    camera = undefined
    map = undefined
    
    renderNovalogic = true
    
    screenwidth = 0
    screenheight = 0
    
    constructor(camera, map)
    {
        this.camera = camera
        this.map = map
    }
}