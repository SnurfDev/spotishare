let ytdl = require("ytdl-core");
let {default:axios} = require("axios")
let ytsr = require("node-youtube-music");
let express = require("express");
let credentials = require("./credentials.json")


const spotifyCredentials = Buffer.from(`${credentials.spotify.client_id}:${credentials.spotify.client_secret}`).toString("base64")
const ip = credentials.server.address;
let spotifyTokens = {};

let stb =str=>new Promise(res=>{let b = [];str.on("data",d=>b.push(d));str.on("end",()=>res(Buffer.concat(b)))})

async function getMusicLink(title) {
    let a = await ytsr.searchMusics(title);
    let stream = (await ytdl(a[0].youtubeId,{filter:"audio"}))
    return (await stb(stream));
}
let artistImgCache = {};

let app = express();
app.get("/playlink",async (req,res)=>{
    if(!req.query.title) return res.status(400).json({error:"no title specified",code:400});
    try {
        return res.send(await getMusicLink(req.query.title));
    }catch{
        res.redirect(req.url);
    }
});
app.get("/:id/playinfo",async (req,res)=>{
    if(!spotifyTokens[req.params.id]) return res.status(401).json({error:"no account logged in",code:401});
    try {
        let r = await axios.get("https://api.spotify.com/v1/me/player",{
            headers:{
                "Authorization": "Bearer "+spotifyTokens[req.params.id],
            }
        })
        let name = r.data.item.name+" "+r.data.item.artists.map(({name})=>name).join(" ");
        res.json({name,pos_ms:r.data.progress_ms,data:{title:r.data.item.name,artists:r.data.item.artists,duration:{totalSeconds:Math.floor(r.data.item.duration_ms/1000)},thumbnailUrl:r.data.item.album.images[0].url,artistImg:r.data.item.album.images[0].url},playing:r.data.is_playing});
    }catch(e){
        if(e.response.data=='Too many requests') {
            return res.json({error:"rate limited by spotify api",code:400})
        }
        res.redirect(req.url);
    }
})
app.get("/:id/setup",async(req,res)=>{
    if(spotifyTokens[req.params.id]) return res.redirect("/"+req.params.id);
    //if(!req.headers.authorization || req.headers.authorization != "Basic "+setupCredentials) return res.setHeader("WWW-Authenticate", "Basic realm=\"Restricted\"").status(401).json({error:"unauthorized",code:401});
    res.redirect(`https://accounts.spotify.com/authorize?show_dialog=false&response_type=code&scope=${encodeURIComponent("user-read-playback-position user-read-currently-playing user-read-playback-state")}&redirect_uri=${encodeURIComponent(`http://${ip}/setupcallback`)}&state=${req.params.id}&client_id=${credentials.spotify.client_id}`);
})
app.get("/setupcallback",async(req,res)=>{
    if(!req.query.code) res.status(400).json({error:"no code specified",code:400});
    try {
    let r = await axios.post("https://accounts.spotify.com/api/token",`code=${req.query.code}&redirect_uri=${encodeURIComponent(`http://${ip}/setupcallback`)}&grant_type=authorization_code`,{
        headers: {
            'Authorization': 'Basic ' + spotifyCredentials,
            "Content-Type": "application/x-www-form-urlencoded"
        }
    });
    if(r.data.access_token) {
        spotifyTokens[req.query.state] = r.data.access_token;
        console.log(`Application set up with access token for listening session http://${ip}/${req.query.state}/`);
        res.redirect("/"+req.query.state);
        return;
    }
    }catch{}
    res.status(400).json({error:"something went wrong",code:400});
});
app.get("/",(req,res)=>{
    res.sendFile(__dirname+"/index.html");
})
app.get("/:id",(req,res)=>{
    res.sendFile(__dirname+"/listening.html");
})

app.listen(process.env.PORT||credentials.server.port,()=>{
    console.log("Server up and running on http://"+ip)
});