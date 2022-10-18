export default class GameCore
{    
    camera = undefined
    map = undefined
    
    renderNovalogic = true
    

    
    constructor(camera, map)
    {
        this.camera = camera
        this.map = map
    }
}