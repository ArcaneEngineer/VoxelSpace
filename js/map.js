// Util class for downloading the png
export default class Map
{
    map = undefined
    
    constructor(map)
    {
        this.map = map;
        
        this.Init();
    }
    
    Init()
    {
        let map = this.map;
        for (let i = 0; i < map.width * map.height; i++)
        {
            map.color[i] = 0xFF007050;
            map.altitude[i] = 0;
        }
    }
    
    DownloadImagesAsync(urls)
    {
        let map = this.map;
        return new Promise(function(resolve, reject)
        {
            var pending = urls.length;
            var result = [];
            if (pending === 0) {
                resolve([]);
                return;
            }
            urls.forEach(function(url, i) {
                var image = new Image();
                //image.addEventListener("load", function() {
                image.onload = function() {
                    var tempcanvas = document.createElement("canvas");
                    var tempcontext = tempcanvas.getContext("2d");
                    tempcanvas.width = map.width;
                    tempcanvas.height = map.height;
                    tempcontext.drawImage(image, 0, 0, map.width, map.height);
                    result[i] = tempcontext.getImageData(0, 0, map.width, map.height).data;
                    pending--;
                    if (pending === 0) {
                        resolve(result);
                    }
                };
                image.src = url;
            });
        });
    }

    Load(filenames)
    {
        var files = filenames.split(";");
        this.DownloadImagesAsync(["maps/"+files[0]+".png", "maps/"+files[1]+".png"]).then(result => this.OnLoadedImages(result) );
    }

    OnLoadedImages(result)
    {
        // console.log(this);
        // console.log(result);
        var map = this.map;
        var datac = result[0];
        var datah = result[1];
        for(var i=0; i<this.map.width*this.map.height; i++)
        {
            map.color[i] = 0xFF000000 | (datac[(i<<2) + 2] << 16) | (datac[(i<<2) + 1] << 8) | datac[(i<<2) + 0];
            map.altitude[i] = datah[i<<2];
        }
        //Draw();
    }
}