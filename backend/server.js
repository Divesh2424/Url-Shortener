import http from "http";
import chalk from "chalk";
import { readFile, writeFile } from "fs/promises";
import crypto from "crypto";

const filePath = "./backend/links.json";

//serving files to server
const serveFileToServer = async (filename, res, content_type) => {
  try {
    const data = await readFile(filename);
    res.writeHead(200, { "Content-Type": content_type });
    res.end(data);
  } catch (error) {
    res.writeHead(500, { "Content-Type": "text/plain" });
    res.end("Error reading file");
    console.log(`Error during reading files : ${error.message}`);
  }
};

//loading links
const loadLinks = async () => {
  try {
    const data = await readFile(filePath, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    if (error.code === "ENOENT") {
      await writeFile(filePath, JSON.stringify({}));
      return {};
    }
    throw error;
  }
};



//creating server
const server = http.createServer(async (req, res) => {
  
  if (req.method === "GET") {
    if (req.url === "/") {
      return serveFileToServer("frontend/index.html", res, "text/html");
    }
    
    else if (req.url === "/css/style.css") {
      return serveFileToServer("frontend/css/style.css", res, "text/css");
    }
    
    else if (req.url === "/js/script.js") {
      return serveFileToServer("frontend/js/script.js", res, "text/javascript");
    }
    
    else if (req.url === "/links") {
      const links = await loadLinks();
      res.writeHead(200, {"Content-Type" : "application/json"})
      return res.end(JSON.stringify(links));
    }

    else {
      const links = await loadLinks();
      const shortCode = req.url.slice(1);
      if(links[shortCode]) {
        res.writeHead(302, {location : links[shortCode]})
        res.end();
      }
    }
  }
  
  if (req.method === "POST" && req.url === "/shorten") {

    const links = await loadLinks();

    let data = ""; //data string ki form me mila
    req.on("data", (chunk) => {
      data += chunk;
    });

    req.on("end", async () => {
      const { url, shortUrl } = JSON.parse(data); //data ko js object me convert kr dia

      if (!url) {
        res.writeHead(400, { "Content-Type": "text/plain" });
        return res.end("URL not found");
      }

      const finalShortUrl = shortUrl || crypto.randomBytes(5).toString("hex");
      
      //to check duplicates
      if (links[finalShortUrl]) {
        res.writeHead(409, { "Content-Type": "text/plain" });
        return res.end("Short code already exists.....Please try something else");
      }

      links[finalShortUrl] = url;

      await writeFile(filePath, JSON.stringify(links, null, 2), "utf-8");

      res.writeHead(201, { "Content-Type": "text/plain" });
      res.end();
    });
  }
});
const PORT = process.env.PORT || 3002;

server.listen(PORT, "0.0.0.0", () => {
  console.log("🔥 Listening on port :", PORT);
});
