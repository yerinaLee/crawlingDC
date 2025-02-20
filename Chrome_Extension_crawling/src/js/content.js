setInterval(() => {
    const posts = document.querySelectorAll('.gall_list .ub-content');
    chrome.storage.local.get(['keywords'], function(result){
        const keywords = result.keywords || [];
        posts.forEach(post => {
            const title = post.querySelector('.title').indderText;
            keywords.forEach(({ email, keyword }) => {
                chrome.runtime.sendMessage({
                    type: 'new_post',
                    email,
                    keyword,
                    title
                })
            })
        })
    })
}, 30000)