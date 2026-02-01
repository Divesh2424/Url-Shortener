const list = document.getElementById("shortened-urls");

const fetchedLinks = async () => {
  const res = await fetch("/links")
  const links = await res.json();
  list.innerHTML = "";
  for(const [shortUrl, url] of Object.entries(links)) {
    const li = document.createElement('li');
    const slicedUrl = url.length >= 25 ? `${url.slice(0,25)}...` : url;
    li.innerHTML = 
    `
    <a href ="/${shortUrl}" target = "_blank">${window.location.origin}/${shortUrl} </a>  -> ${slicedUrl}
    `
    list.appendChild(li);
  }
}

document.getElementById("form-data").addEventListener("submit", async (event) => {
  event.preventDefault();

  const form_data = new FormData(event.target);
  const url = form_data.get("enterurl");
  const shortUrl = form_data.get("shorturl");

  event.target.reset();
  try {
    const res = await fetch("/shorten", {
      method : "POST",
      headers : {"Content-Type" : "application/json"},
      body : JSON.stringify({url, shortUrl})
    })

    if(res.ok) {
      fetchedLinks()
      alert("Form Submitted Successfully!")
    } else if (res.status === 409) {
      alert("URL already exists.....Please try something else")
    }
  } catch (error) {
    console.log(`Error handled : ${error.message}`)
  }
});
fetchedLinks()



