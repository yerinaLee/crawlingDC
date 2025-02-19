document.getElementById('save').addEventListener('click', () => {
    const keyword = document.getElementById('keyword').value;
    const email = document.getElementById('email').value;

    if (keyword && email) {
        chrome.storage.local.set({ keyword, email }, () => { 
            /* {
            "keyword": "hello",
            "email": "user@example.com"
            }
           */
            alert('save success! now monitoring start.');
            console.log(keyword + "to " + email + " crawling start");
        });
        
    } else {
        alert('plz enter the info');
    }
});
